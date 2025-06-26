package events

import (
	"context"
	"log"
	"sync"
)

type Bus interface {
	Subscribe(eventType string, handler Handler)
	Publish(ctx context.Context, event Event) error
}

type InMemoryBus struct {
	mu       sync.RWMutex
	handlers map[string][]Handler
}

func NewInMemoryBus() *InMemoryBus {
	return &InMemoryBus{
		handlers: make(map[string][]Handler),
	}
}

func (b *InMemoryBus) Subscribe(eventType string, handler Handler) {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.handlers[eventType] = append(b.handlers[eventType], handler)
}

func (b *InMemoryBus) Publish(ctx context.Context, event Event) error {
	b.mu.RLock()
	handlers := b.handlers[event.EventType()]
	b.mu.RUnlock()

	for _, handler := range handlers {
		go func(h Handler) {
			if err := h.Handle(ctx, event); err != nil {
				log.Printf("Error handling event %s: %v", event.EventType(), err)
			}
		}(handler)
	}

	return nil
}
