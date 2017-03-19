
var pt = new PrefixTree();

var allTests = new Set();

DATA.forEach((v) => {
	if (allTests.has(v.test)) { return; }
	allTests.add(v.test);
});

allTests.forEach((v) => {
    if (v && v.startsWith('[k8s.io]')) {
        pt.add(splitTestDescription(v), v);
    }
});

pt.optimize();
$('#browserRegion').append(pt.asHTMLUL());

function makeTestReport(prefix) {
	var br = new TestReport('testGroup', 0, 0);
	
	// job -> [tests]
	var results = new Map();

	// filter by test prefix, group by job
	DATA.forEach((row) => {
		testName = row.test.split(/\s+/).join(' ');

		if (! testName.startsWith(prefix)) { return; }
		if (! results.has(row.job)) {
			results.set(row.job, new AggregateTestResult(row.job, [], row.job));
		}

		var agg = results.get(row.job);
		var tr;
		if (agg.reports.length == 0 || agg.reports[agg.reports.length-1].runId != row.runId) {
			tr = new TestResult(row.runId, row.startTs, row.endTs, row.commit, 0, 0, 0);
			agg.addReport(tr);
		} else {
			tr = agg.reports[agg.reports.length-1];
		}

		if (row.passed === 'true') {
			tr.passed += 1;
		} else if (row.passed === 'false') {
			tr.failed += 1;
		} else {
			tr.other += 1;
		}
	});

	results.forEach((v, k) => {
		br.addTestResult(v);
	});

	return br;
}

function showReport(prefix) {
	console.log('showReport', prefix);
	$('#contentRegion').html('');

	if (prefix !== '') {
		$('#contentRegion').append($('<h3>').html('Report for /'+prefix+'/'));
	}

	$('#contentRegion').append(makeTestReport(prefix).asHTMLTable());
}

showReport('');
