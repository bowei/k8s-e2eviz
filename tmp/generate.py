#!/usr/bin/env python
import base64
import json
import subprocess
import sys


LIMIT = 100000
TABLE = 'build.week'
QUERIES = {
    'total': """
        select count(*) as count
        from {table}
        where true
            and job like 'ci-%'
        """,
    'testNotRun': """
        select count(*) as count
        from {table}
        where true
            and tests_run = 0
            and job like 'ci-%'
        """,
    'testsRun': """
        select count(*) as count
        from {table}
        where true
            and tests_run > 0
            and job like 'ci-%'
        """,
    'jobs': """
        select job
        from {table}
        where true
            and job like 'ci-%'
        group by job
        order by job asc
        """,
#        }
# XXX
#{
    'failed': """
        select job, first(tests_failed) as failed, count(*) as count 
        from {table}
        where true
            and job like 'ci-%'
        group by job, tests_failed 
        order by job asc, failed
        """,
    'failedRatio': """
        select 
            job, 
            cast(tests_failed / tests_run * 10000 as integer)/10000 as fail_ratio, 
            count(*) as count 
        from {table}
        where true
            and tests_run > 0 
            and job like 'ci-%'
        group by job, fail_ratio 
        order by job, fail_ratio
        """,
}

def cleanupQuery(q):
    q = q.strip()
    return ' '.join([x.strip() for x in q.split('\n')])

def runQuery(table, query):
    query = query.format(**{'table': table})
    output = subprocess.check_output([
        'bq', '--project', 'k8s-gubernator', '--format', 'json',
        'query', '--max_rows', str(LIMIT),
        cleanupQuery(query)])
    return json.loads(output)

def gnuplotXY(title, XY):
    script = """
set terminal png small size 350,200
set key off
set title "{}"
plot '-' using 1:2 w lines
    {}
EOF
    """.format(
            title,
            '\n'.join(['{}, {}'.format(x,y) for x,y in XY]))
    gp = subprocess.Popen(['gnuplot'], 
            stdout=subprocess.PIPE, 
            stdin=subprocess.PIPE, 
            stderr=subprocess.STDOUT)
    output = gp.communicate(input=script)
    return base64.b64encode(output[0])

def formatSummary(results, jobs):
    print '<html>'
    print '<head></head>'
    print '<h1>Summary</h1>'
    print """
<table border="2">
    <tr>
        <td>total:</td><td>{total[0][count]}</td>
    </tr>
    <tr>
        <td>tests run:</td><td>{testsRun[0][count]}</td>
    </tr>
    <tr>
        <td>tests not run:</td><td>{testNotRun[0][count]}</td>
    </tr>
</table>
    """.format(**results.__dict__)

    print '<h1>Jobs</h1>'
    print '<table border="2">'
    for job in results.jobs:
        print '<tr><td>{job}</td></tr>'.format(**job)
    print '</table>'

    print '<h1>Failures by job</h1>'
    print '<table border="2">'
    for job in results.jobs:
        job = job['job']

        print '<tr>'
        print '<td><img src="{}" /></td>'.format(
                'data:image/png;base64,' + gnuplotXY(jobs[job].failureHistCDF))
        print '<td><img src="{}" /></td>'.format(
                'data:image/png;base64,' + gnuplotXY(jobs[job].failureRatioHistCDF))
        print '</tr>'
    print '</table>'

class JobStats(object):
    def __init__(self, name):
        self.name = name
        self.failureHist = []
        self.failureRatioHist = []

    def failureHistCDF(self):
        return self._toCDF(self.failureHist)

    def failureRatioHistCDF(self):
        return self._toCDF(self.failureRatioHist)

    @staticmethod
    def _toCDF(points):
        ret = []
        cur = 0
        for x, y in points:
            cur += y
            ret.append((x, cur))
        return ret

def accumulateByJob(results):
    jobs = {}
    for job in results.jobs:
        jobs[job['job']] = JobStats(job['job'])
    for row in results.failed:
        jobs[row['job']].failureHist.append((row['failed'], row['count']))
    for row in results.failedRatio:
        jobs[row['job']].failureRatioHist.append((row['fail_ratio'], row['count']))

# for each job
#   histogram of failures | failure ratios
#
# heatmap for flaky
# grouping by longest prefix

class Results(object):
    def __init__(self):
        for k, query in QUERIES.items():
            setattr(self, k, runQuery(TABLE, query))

results = Results()
jobs = accumulateByJob(results)
formatSummary(results, jobs)

