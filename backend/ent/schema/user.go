package schema

import (
	"fmt"
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

type User struct {
	ent.Schema
}

func (User) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.String("email").
			Unique().
			NotEmpty().
			Validate(func(s string) error {
				// Basic email validation - can be enhanced
				if len(s) > 0 && len(s) < 255 {
					return nil
				}
				return fmt.Errorf("email must be between 1 and 255 characters")
			}),
		field.String("password_hash").
			Sensitive(),
		field.String("first_name").
			NotEmpty().
			Validate(func(s string) error {
				if len(s) > 0 && len(s) < 100 {
					return nil
				}
				return fmt.Errorf("first_name must be between 1 and 100 characters")
			}),
		field.String("last_name").
			NotEmpty().
			Validate(func(s string) error {
				if len(s) > 0 && len(s) < 100 {
					return nil
				}
				return fmt.Errorf("last_name must be between 1 and 100 characters")
			}),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now),
	}
}

func (User) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("owned_pets", Pet.Type),
		edge.To("co_owned_pets", Pet.Type),
		edge.To("created_groups", Group.Type),
		edge.To("memberships", Membership.Type),
		edge.To("sent_invitations", Invitation.Type),
		edge.To("recorded_events", ScoreEvent.Type),
	}
}
