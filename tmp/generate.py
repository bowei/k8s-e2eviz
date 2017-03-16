#!/usr/bin/env python
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
        }
{
    'failedByJob': """
        select job, first(tests_failed) as failed, count(*) as count 
        from {table}
        where true
            and job like 'ci-%'
        group by job, tests_failed 
        order by job asc, failed
        """,
    'failedByPercent': """
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

def formatSummary(results):
    print '<html>'
    print '<head></head>'
    print '<h1>Summary</h1>'
    print """
<table>
    <tr>
        <td>total:</td><td>{total[0][count]}</td>
        <td>tests run:</td><td>{testsRun[0][count]}</td>
        <td>tests not run:</td><td>{testNotRun[0][count]}</td>
    </tr>
</table>
    """.format(**results.__dict__)

    print '<table>'
    for job in results.jobs:
        print '<tr><td>{job}</td></tr>'.format(**job)
    print '</table>'

    print '<h1>Failures by job</h1>'

class Results(object):
    def __init__(self):
        for k, query in QUERIES.items():
            setattr(self, k, runQuery(TABLE, query))

formatSummary(Results())
