package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

type Group struct {
	ent.Schema
}

func (Group) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.String("name").
			NotEmpty(),
		field.String("description").
			Optional(),
		field.Enum("privacy").
			Values("private", "public").
			Default("private"),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now),
	}
}

func (Group) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("creator", User.Type).
			Ref("created_groups").
			Unique().
			Required(),
		edge.To("memberships", Membership.Type),
		edge.To("invitations", Invitation.Type),
		edge.To("behaviors", Behavior.Type),
		edge.To("members", Pet.Type),
		edge.To("score_events", ScoreEvent.Type),
	}
}
