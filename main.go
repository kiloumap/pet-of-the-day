package main

import (
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"log"
	"net/http"
	"os"
	"pet-of-the-day/database"
)

func main() {
	err := os.Setenv("DB_USER", "postgres") // Exemple de valeur par défaut
	if err != nil {
		log.Println("Error while loading env variables")
	}

	err = database.InitDB()
	if err != nil {
		log.Fatalf("Error db connection : %v", err)
	}
	defer database.DB.Close()

	srv := handler.New(nil)

	http.Handle("/", playground.Handler("GraphQL Playground", "/query"))
	http.Handle("/query", srv)

	log.Println("Starting server on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
