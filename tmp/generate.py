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

def gnuplotXY(title, XY, UV, topline):
    script = """
set terminal png tiny size 500,150
set xrange [0:]
set yrange [0:]
set y2tics
set key off
set title "{title}"
plot '-' using 1:2 w lines, '-' using 1:2 w imp axes x1y2, {topline}
{xy}
EOF
{uv}
EOF
    """.format(
            title=title,
            topline=topline,
            xy='\n'.join(['{}, {}'.format(x,y) for x,y in XY]),
            uv='\n'.join(['{}, {}'.format(x,y) for x,y in UV]))
    gp = subprocess.Popen(['gnuplot'],
            stdout=subprocess.PIPE,
            stdin=subprocess.PIPE,
            stderr=subprocess.STDOUT)
    output = gp.communicate(input=script)
    return 'data:image/png;base64,' + base64.b64encode(output[0])

def formatSummary(results, jobs):
    print '<html>'
    print '<head></head>'
    print '<h1>Summary</h1>'
    print """
<table border="2">
    <tr>
        <td>total:</td>
        <td>{total[0][count]}</td>
    </tr>
    <tr>
        <td>tests run:</td>
        <td>{testsRun[0][count]}</td>
    </tr>
    <tr>
        <td>tests not run:</td>
        <td>{testNotRun[0][count]}</td>
    </tr>
</table>
    """.format(**results.__dict__)

    print '<h1>Jobs</h1>'
    print '<table border="2">'

    # sort by failureScore
    orderedJobs = sorted(
            jobs.values(), lambda x, y: cmp(x.failureScore(), y.failureScore()))

    for st in orderedJobs:
        print '<tr>'

        print '  <td>{}</td>'.format(st.name)
        print '  <td>{}</td>'.format(round(st.failureScore(), 4))

        for key in sorted(st.counts):
            print '  <td>{} = {}</td>'.format(key, st.counts[key])

        print '  <td>'
        cdf = st.failureHistCDF()
        hist = st.failureHist
        if len(hist) > 1: hist = hist[1:]

        if cdf:
            print '  <img src="{}" />'.format(
                    gnuplotXY('{} failure CDF'.format(st.name),
                        cdf, hist, st.counts['f']))
        else:
            print 'n/a'
        print '  </td>'

        print '  <td>'
        cdf = st.failureRatioHistCDF()
        hist = st.failureRatioHist
        if len(hist) > 1: hist = hist[1:]

        if cdf:
            print '  <img src="{}" />'.format(
                    gnuplotXY('{} failure ratio CDF'.format(st.name),
                        cdf, hist, st.counts['fr']))
        else:
            print 'n/a'
        print '  </td>'

        print '</tr>'
    print '</table>'

class JobStats(object):
    def __init__(self, name):
        self.name = name
        self.counts = {'f':0, 'fr':0}
        self.failureHist = []
        self.failureRatioHist = []

    def failureHistCDF(self):
        if not self.failureHist:
            return None
        if len(self.failureHist) == 1 and self.failureHist[0][0] == 0:
            return None
        return self._toCDF(self.failureHist)

    def failureRatioHistCDF(self):
        if not self.failureRatioHist:
            return None
        if len(self.failureRatioHist) == 1 and int(self.failureHist[0][0]) == 0:
            return None
        return self._toCDF(self.failureRatioHist)

    def failureScore(self):
        return sum([x * y/self.counts['fr'] for x,y in self.failureRatioHist if y > 0])

    @staticmethod
    def _toCDF(points):
        ret = []
        cur = 0.0
        for x, y in points:
            cur += y
            ret.append((x, cur))
        return ret

def accumulateByJob(results):
    jobs = {}
    for job in results.jobs:
        jobs[job['job']] = JobStats(job['job'])
    for row in results.failed:
        st = jobs[row['job']]
        st.counts['f'] += int(row['count'])
        st.failureHist.append(
                (float(row['failed']), float(row['count'])))
    for row in results.failedRatio:
        st = jobs[row['job']]
        st.counts['fr'] += int(row['count'])
        st.failureRatioHist.append(
                (float(row['fail_ratio']), float(row['count'])))
    return jobs

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
