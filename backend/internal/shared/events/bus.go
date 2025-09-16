package events

import (
	"context"
	"log"
	"sync"
	"time"
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

	if len(handlers) == 0 {
		log.Printf("No handlers registered for event type: %s", event.EventType())
		return nil
	}

	// Create context with timeout to prevent hanging goroutines
	handlerCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var wg sync.WaitGroup
	errorChan := make(chan error, len(handlers))

	for _, handler := range handlers {
		wg.Add(1)
		go func(h Handler) {
			defer wg.Done()
			if err := h.Handle(handlerCtx, event); err != nil {
				log.Printf("Error handling event %s: %v", event.EventType(), err)
				errorChan <- err
			}
		}(handler)
	}

	// Wait for all handlers to complete or context to expire
	go func() {
		wg.Wait()
		close(errorChan)
	}()

	// Collect errors for logging but don't block
	select {
	case <-handlerCtx.Done():
		log.Printf("Event handling timed out for event type: %s", event.EventType())
	case <-time.After(100 * time.Millisecond):
		// Non-blocking, continue
	}

	return nil
}
