#!/bin/bash

set -e

echo "🔧 Setting up Ent..."

# Clean and add all required dependencies
echo "Installing all Ent dependencies..."
go clean -modcache
go get entgo.io/ent@v0.14.4
go get ariga.io/atlas@latest
go get golang.org/x/tools@latest
go get github.com/go-openapi/inflect@latest
go get github.com/olekukonko/tablewriter@latest
go get github.com/spf13/cobra@latest
go get golang.org/x/sync@latest
go mod tidy

# Generate the code
echo "Generating Ent code..."
go run entgo.io/ent/cmd/ent@v0.14.4 generate ./ent/schema

echo "✅ Ent setup completed!"