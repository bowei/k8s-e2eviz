'use strict';

// TestGroup is a collection of one or more related tests.
//
// Build status for across a series of environments.
class TestGroup {

}

// TestResult is the result of a single test run for a single atomic test.
// status is one of 'pass', 'fail', 'other'
class TestResult {
    constructor(testName, job, commit, startTs, endTs, status) {
        this.testName = testName;
        this.job = job;
        this.commit = commit;
        this.startTs = startTs;
        this.endTs = endTs;
        this.status = status;
    }
}

class TestReport {
    constructor(runId, startTs, endTs, commit, passed, failed, other) {
        this.runId = runId;
        this.startTs = startTs;
        this.endTs = endTs;
        this.commit = commit;
        this.passed = passed;
        this.failed = failed;
        this.other = other;
    }

    status() {
        return Math.round(
            this.passed / (this.failed + this.passed + this.other)*9) | 0;
    }
}

// Aggregates several tests from the same run, job and commit hash together.
class AggregateTestResult {
    constructor(key, run, tests, job) {
        this.key = key;

        this.tests = tests;
        this.job = job;

        this.reports = [];
    }

    addReport(report) {
        this.reports.push(report);
        return this;
    }

    asHTMLRow() {
        var tr = $('<tr>');
        tr.append($('<td>').html(this.key));
        tr.append($('<td>').html(this.job));
        tr.append($('<td>').html('<img src="http://placehold.it/200x40"/>').addClass('timeline-graph'));

        var groupFn = (r) => {
            return r.commit;
        }

        var addGroup = (td, group, rg) => {
            var groupDiv = $('<div>').addClass('timeline-cell-group');
            td.append(groupDiv);

            var div = $('<div>');
            groupDiv.append(div);

            for (var i=0; i<rg.length; ++i) {
                div.append(
                    $('<div>')
                        .html('&block;')
                        .addClass('timeline-cell-block')
                        .addClass('timeline-cell-block-'+rg[i].status()));
            }

            var div = $('<div>').html(group).addClass('timeline-cell-label');
            groupDiv.append(div);
        }

        // XXX/bowei -- sort reverse
        var group = groupFn(this.reports[0]);
        var reportGroup = [this.reports[0]];

        var td = $('<td>').addClass('timeline-td');
        tr.append(td);

        for (var i=1; i<this.reports.length; ++i) {
            var report = this.reports[i];
            if (groupFn(report) !== group) {
                addGroup(td, group, reportGroup);
                reportGroup = [];
                group = groupFn(report);
            }
            reportGroup.push(report);
        }

        if (reportGroup.length > 0) {
            addGroup(td, group, reportGroup);
        }

        return tr;
    }
}

class BuildReport {
    constructor(testGroup, start, end) {
        this.testGroup = testGroup;
        this.start = start;
        this.end = end;
        this.testResults = []
    }

    addTestResult(result) {
        this.testResults.push(result);
    }

    asHTMLTable() {
        var table = $('<table>').addClass('results');
        table.attr('id', 'results');

        var headerTR = $('<tr>');
        ['key', 'job', 'graph', 'result'].forEach((v) => {
            headerTR.append($('<th>').html(v));
        });
        table.append(headerTR);

        this.testResults.forEach((tr) => {
            table.append(tr.asHTMLRow());
        });

        return table;
    }
}

var br = new BuildReport('testGroup', 0, 0);

for (var i=0; i<10; ++i) {
    var ar = new AggregateTestResult('agg'+i, 'run'+i, [], 'job'+i);
    var idx = 0;

    var resultCount = 40+Math.random()*10;
    for (var j=0; j<resultCount; ++j) {
        if (Math.random() > 0.9) {
            idx += 1;
        }

        var report = new TestReport(j, 0, 0, 'commit'+idx,
            Math.random()*30 | 0,
            Math.random()*5 | 0,
            Math.random()*5 | 0);
        ar.addReport(report);
    }

    br.addTestResult(ar);
}

$('#contentRegion').append(br.asHTMLTable());
