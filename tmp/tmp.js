
var pt = new PrefixTree();

/*
for (var i=0; i<50; ++i) {
    var pathLen = Math.random() * 5 | 0 + 5;
    var path = []
    for (var k=0; k<pathLen; ++k) {
        path.push(['a', 'b', 'c', 'd'][Math.random() * 4 | 0]);
    }
    pt.add(path, 'xxx'+i);
}
*/

TESTS.forEach((v) => {
    if (v.test_name && v.test_name.startsWith('[k8s.io]')) {
        pt.add(splitTestDescription(v.test_name), v.test_name);
    }
});

pt.optimize();
$('#browserRegion').append(pt.asHTMLUL());


var br = new TestReport('testGroup', 0, 0);

for (var i=0; i<30; ++i) {
    var ar = new AggregateTestResult('agg'+i, [], 'job'+i);
    var idx = 0;

    var resultCount = 40+Math.random()*10;
    for (var j=0; j<resultCount; ++j) {
        if (Math.random() > 0.9) {
            idx += 1;
        }

        var report = new TestResult(j, 0, 0, 'commit'+idx,
            Math.random()*30 | 0,
            Math.random()*5 | 0,
            Math.random()*5 | 0);
        ar.addReport(report);
    }

    br.addTestResult(ar);
}

$('#contentRegion').append(br.asHTMLTable());
