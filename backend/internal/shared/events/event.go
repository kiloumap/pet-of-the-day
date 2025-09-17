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

// EventBus interface for publishing events
type EventBus interface {
	Publish(ctx context.Context, event Event) error
	Subscribe(eventType string, handler Handler)
}

// InMemoryEventBus is a simple in-memory implementation
type InMemoryEventBus struct {
	handlers map[string][]Handler
}

func NewInMemoryEventBus() *InMemoryEventBus {
	return &InMemoryEventBus{
		handlers: make(map[string][]Handler),
	}
}

func (b *InMemoryEventBus) Publish(ctx context.Context, event Event) error {
	handlers, exists := b.handlers[event.EventType()]
	if !exists {
		return nil // No handlers for this event type
	}

	for _, handler := range handlers {
		if err := handler.Handle(ctx, event); err != nil {
			// Log error but don't stop processing other handlers
			// In production, you might want to use a proper logger
			continue
		}
	}

	return nil
}

func (b *InMemoryEventBus) Subscribe(eventType string, handler Handler) {
	b.handlers[eventType] = append(b.handlers[eventType], handler)
}
