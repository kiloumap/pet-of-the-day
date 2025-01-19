package main

import (
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"log"
	"net/http"
	"os"
	"pet-of-the-day/database"
	"pet-of-the-day/graph"
	"pet-of-the-day/graph/resolver"
	"pet-of-the-day/internal/users"
)

func main() {
	err := os.Setenv("DB_USER", "postgres")
	if err != nil {
		log.Println("Error while loading env variables")
	}

	err = database.InitDB()
	if err != nil {
		log.Fatalf("Error db connection : %v", err)
	}
	defer database.DB.Close()

	resolver := &resolver.Resolver{
		UserRepository: &users.UserRepository{
			DB: database.DB,
		},
	}

	server := handler.New(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	http.Handle("/", playground.Handler("GraphQL Playground", "/query"))
	http.Handle("/query", server)

	log.Println("Starting server on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
