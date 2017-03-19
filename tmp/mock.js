'use strict';

class TreeNode {
    constructor(id, desc, parent) {
        this.id = id;
        this.desc = desc;
        this.children = {};
        this.prop = {};
        this.parent = parent;
    }

    addChild(label, child) {
        this.children[label] = child;
    }

    setProp(key, value) {
        this.prop[key] = value;
    }
}

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
    constructor(runId, startTs, endTs, commit, failed, passed, other) {
        this.runId = runId;
        this.startTs = startTs;
        this.endTs = endTs;
        this.commit = commit;
        this.failed = failed;
        this.passed = passed;
        this.other = other;
    }
}

// Aggregates several tests from the same run, job and commit hash together.
class AggregateTestResult {
    constructor(key, run, tests, job) {
        this.key = key;

        this.run = run;
        this.tests = tests;
        this.job = job;

        this.reports = [];
    }

    addReport(report) {
        this.reports.push(report);
        return this;
    }

    toRow() {
        var tr = $('<tr>');
        tr.append($('<td>').html(this.key));
        tr.append($('<td>').html(this.run));
        tr.append($('<td>').html(this.job));
        tr.append($('<td>').html('<img src="http://placehold.it/200x40"/>').addClass('timeline-graph'));

        var groupFn = (r) => {
            return r.commit;
        }

        var addGroup = (group, rg) => {
            var td = $('<td>').addClass('timeline-cell-group');
            var div = $('<div>');
            td.append(div);
            for (var i=0; i<rg.length; ++i) {
                div.append(
                    $('<div>')
                        .html('&block;')
                        .addClass('timeline-cell-block'));
            }
            var div = $('<div>').html(group).addClass('timeline-cell-label');
            td.append(div);

            tr.append(td);
        }

        // XXX/bowei -- sort reverse
        var group = groupFn(this.reports[0]);
        var reportGroup = [this.reports[0]];

        for (var i=1; i<this.reports.length; ++i) {
            var report = this.reports[i];
            if (groupFn(report) !== group) {
                addGroup(group, reportGroup);
                reportGroup = [];
                group = groupFn(report);          
            }
            reportGroup.push(report);
        }

        if (reportGroup.length > 0) {
            addGroup(group, reportGroup);
        }

        return tr;
    }
}

// BuildStatus is the pass/failure for a given TestGroup for an interval of time
// across a 
class BuildStatus {
    //
    // start timestamp
    // end timestamp
    constructor(testGroup, start, end) {
        this.testGroup = testGroup;
        this.start = start;
        this.end = end;
    }

    addTestResult() {

    }
}

var ar = new AggregateTestResult('agg1', 'run1', [], 'job1');
ar.addReport(new TestReport(1, 0, 0, 'commit1', 5, 7, 3));
ar.addReport(new TestReport(2, 0, 0, 'commit1', 5, 7, 3));
ar.addReport(new TestReport(2, 0, 0, 'commit1', 5, 7, 3));
ar.addReport(new TestReport(3, 0, 0, 'commit2', 5, 7, 3));
ar.addReport(new TestReport(3, 0, 0, 'commit2', 5, 7, 3));
ar.addReport(new TestReport(3, 0, 0, 'commit2', 5, 7, 3));
ar.addReport(new TestReport(3, 0, 0, 'commit2', 5, 7, 3));
ar.addReport(new TestReport(3, 0, 0, 'commit2', 5, 7, 3));
ar.addReport(new TestReport(3, 0, 0, 'commit2', 5, 7, 3));
ar.addReport(new TestReport(3, 0, 0, 'commit2', 5, 7, 3));
ar.addReport(new TestReport(3, 0, 0, 'commit2', 5, 7, 3));
ar.addReport(new TestReport(4, 0, 0, 'commit3', 5, 7, 3));
ar.addReport(new TestReport(4, 0, 0, 'commit3', 5, 7, 3));
ar.addReport(new TestReport(4, 0, 0, 'commit3', 5, 7, 3));

$('#testTable').append(ar.toRow());

var ar = new AggregateTestResult('agg2', 'run1', [], 'job1');
ar.addReport(new TestReport(1, 0, 0, 'commit1', 5, 7, 3));
ar.addReport(new TestReport(2, 0, 0, 'commit1', 5, 7, 3));
ar.addReport(new TestReport(2, 0, 0, 'commit1', 5, 7, 3));
ar.addReport(new TestReport(3, 0, 0, 'commit2', 5, 7, 3));
ar.addReport(new TestReport(3, 0, 0, 'commit2', 5, 7, 3));
ar.addReport(new TestReport(3, 0, 0, 'commit2', 5, 7, 3));
ar.addReport(new TestReport(3, 0, 0, 'commit2', 5, 7, 3));

$('#testTable').append(ar.toRow());

var tn = new TreeNode(10, 'root', null);
console.log(tn);
