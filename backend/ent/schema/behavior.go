package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

type Behavior struct {
	ent.Schema
}

func (Behavior) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.String("name").
			NotEmpty(),
		field.String("description").
			Optional(),
		field.Int("points"),
		field.Enum("category").
			Values("positive", "negative"),
		field.Bool("is_global").
			Default(true),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
	}
}

func (Behavior) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("group", Group.Type).
			Ref("behaviors").
			Unique(),
		edge.To("score_events", ScoreEvent.Type),
	}
}

type ScoreEvent struct {
	ent.Schema
}

func (ScoreEvent) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.Int("points"),
		field.String("comment").
			Optional(),
		field.Time("recorded_at").
			Default(time.Now).
			Immutable(),
	}
}

func (ScoreEvent) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("pet", Pet.Type).
			Ref("score_events").
			Unique().
			Required(),
		edge.From("behavior", Behavior.Type).
			Ref("score_events").
			Unique().
			Required(),
		edge.From("recorded_by", User.Type).
			Ref("recorded_events").
			Unique().
			Required(),
	}
}
