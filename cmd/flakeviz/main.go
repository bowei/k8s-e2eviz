package main

import (
	"fmt"
	"log"

	"google.golang.org/api/iterator"

	"cloud.google.com/go/bigquery"
	"golang.org/x/net/context"
)

func main() {
	fmt.Println("vim-go")

	ctx := context.Background()
	projectID := "k8s-gubernator"
	q := `SELECT result, version, path, job, test.name, number
		FROM build.day
		WHERE test.name LIKE '[k8s.io] Services should%' and test.failed
		LIMIT 100`

	// Creates a client.
	client, err := bigquery.NewClient(ctx, projectID)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	query := client.Query(q)
	iter, err := query.Read(ctx)
	if err != nil {
		panic(err)
	}

	var rows [][]bigquery.Value

	for {
		var row []bigquery.Value
		err := iter.Next(&row)
		if err == iterator.Done {
			for _, row := range rows {
				fmt.Println(row)
			}
		}
		if err != nil {
			break
		}
		rows = append(rows, row)
	}

	fmt.Printf("Dataset created\n")
}
