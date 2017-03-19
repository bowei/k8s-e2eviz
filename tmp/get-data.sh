#!/bin/bash


bq \
	--project 'k8s-gubernator' \
	--format json \
	query --max_rows 100000 "
	SELECT 
		number AS runId, 
		job AS job, 
		INTEGER(started) AS startTs, 
		INTEGER(finished) AS endTs, 
		version AS commit, 
		test.name AS test, 
		(test.failed IS NULL OR NOT test.failed) AS passed
	FROM [k8s-gubernator:build.day]
	WHERE TRUE 
		AND test.name LIKE '[k8s.io]%' 
		AND job LIKE 'ci-%' 
	ORDER BY startTs
	LIMIT 100000" > data.json
