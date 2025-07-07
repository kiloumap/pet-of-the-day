package tools

import (
	_ "ariga.io/atlas/sql/migrate"
	_ "ariga.io/atlas/sql/mysql"
	_ "ariga.io/atlas/sql/postgres"
	_ "ariga.io/atlas/sql/schema"
	_ "ariga.io/atlas/sql/sqlite"
	_ "ariga.io/atlas/sql/sqltool"
	_ "entgo.io/ent/dialect/sql/schema"
)
