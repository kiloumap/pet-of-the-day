package events

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Event interface {
	EventID() uuid.UUID
	EventType() string
	AggregateID() uuid.UUID
	OccurredAt() time.Time
}

type BaseEvent struct {
	ID            uuid.UUID `json:"id"`
	Type          string    `json:"type"`
	AggregateUUID uuid.UUID `json:"aggregate_id"`
	Timestamp     time.Time `json:"timestamp"`
}

func NewBaseEvent(eventType string, aggregateID uuid.UUID) BaseEvent {
	return BaseEvent{
		ID:            uuid.New(),
		Type:          eventType,
		AggregateUUID: aggregateID,
		Timestamp:     time.Now(),
	}
}

func (e BaseEvent) EventID() uuid.UUID     { return e.ID }
func (e BaseEvent) EventType() string      { return e.Type }
func (e BaseEvent) AggregateID() uuid.UUID { return e.AggregateUUID }
func (e BaseEvent) OccurredAt() time.Time  { return e.Timestamp }

type Handler interface {
	Handle(ctx context.Context, event Event) error
}

type HandlerFunc func(ctx context.Context, event Event) error

func (f HandlerFunc) Handle(ctx context.Context, event Event) error {
	return f(ctx, event)
}
