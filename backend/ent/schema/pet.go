package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

type Pet struct {
	ent.Schema
}

func (Pet) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.String("name").
			NotEmpty(),
		field.String("species").
			NotEmpty(),
		field.String("breed").
			Optional(),
		field.Time("birth_date").
			Optional(),
		field.String("photo_url").
			Optional(),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now),
	}
}

func (Pet) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("owner", User.Type).
			Ref("owned_pets").
			Unique().
			Required(),
		edge.From("co_owners", User.Type).
			Ref("co_owned_pets"),
		edge.From("groups", Group.Type).
			Ref("members"),
		edge.To("score_events", ScoreEvent.Type),
	}
}
