package infrastructure

import (
	"context"
	"sync"

	"github.com/google/uuid"

	"pet-of-the-day/internal/notebook/domain"
)

// MockRepositories provides mock implementations for testing
type MockRepositories struct {
	notebooks      map[uuid.UUID]*domain.PetNotebook
	entries        map[uuid.UUID]*domain.NotebookEntry
	medicalEntries map[uuid.UUID]*domain.MedicalEntry
	dietEntries    map[uuid.UUID]*domain.DietEntry
	habitEntries   map[uuid.UUID]*domain.HabitEntry
	commandEntries map[uuid.UUID]*domain.CommandEntry
	shares         map[uuid.UUID]*domain.NotebookShare
	mu             sync.RWMutex
}

// NewMockRepositories creates new mock repositories
func NewMockRepositories() *MockRepositories {
	return &MockRepositories{
		notebooks:      make(map[uuid.UUID]*domain.PetNotebook),
		entries:        make(map[uuid.UUID]*domain.NotebookEntry),
		medicalEntries: make(map[uuid.UUID]*domain.MedicalEntry),
		dietEntries:    make(map[uuid.UUID]*domain.DietEntry),
		habitEntries:   make(map[uuid.UUID]*domain.HabitEntry),
		commandEntries: make(map[uuid.UUID]*domain.CommandEntry),
		shares:         make(map[uuid.UUID]*domain.NotebookShare),
	}
}

// NotebookRepository returns a mock notebook repository
func (m *MockRepositories) NotebookRepository() domain.NotebookRepository {
	return &mockNotebookRepository{mock: m}
}

// NotebookEntryRepository returns a mock notebook entry repository
func (m *MockRepositories) NotebookEntryRepository() domain.NotebookEntryRepository {
	return &mockNotebookEntryRepository{mock: m}
}

// MedicalEntryRepository returns a mock medical entry repository
func (m *MockRepositories) MedicalEntryRepository() domain.MedicalEntryRepository {
	return &mockMedicalEntryRepository{mock: m}
}

// DietEntryRepository returns a mock diet entry repository
func (m *MockRepositories) DietEntryRepository() domain.DietEntryRepository {
	return &mockDietEntryRepository{mock: m}
}

// HabitEntryRepository returns a mock habit entry repository
func (m *MockRepositories) HabitEntryRepository() domain.HabitEntryRepository {
	return &mockHabitEntryRepository{mock: m}
}

// CommandEntryRepository returns a mock command entry repository
func (m *MockRepositories) CommandEntryRepository() domain.CommandEntryRepository {
	return &mockCommandEntryRepository{mock: m}
}

// NotebookShareRepository returns a mock notebook share repository
func (m *MockRepositories) NotebookShareRepository() domain.NotebookShareRepository {
	return &mockNotebookShareRepository{mock: m}
}

// Reset clears all stored data
func (m *MockRepositories) Reset() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.notebooks = make(map[uuid.UUID]*domain.PetNotebook)
	m.entries = make(map[uuid.UUID]*domain.NotebookEntry)
	m.medicalEntries = make(map[uuid.UUID]*domain.MedicalEntry)
	m.dietEntries = make(map[uuid.UUID]*domain.DietEntry)
	m.habitEntries = make(map[uuid.UUID]*domain.HabitEntry)
	m.commandEntries = make(map[uuid.UUID]*domain.CommandEntry)
	m.shares = make(map[uuid.UUID]*domain.NotebookShare)
}

// Mock implementations for each repository interface...

type mockNotebookRepository struct {
	mock *MockRepositories
}

func (r *mockNotebookRepository) Save(ctx context.Context, notebook *domain.PetNotebook) error {
	r.mock.mu.Lock()
	defer r.mock.mu.Unlock()
	r.mock.notebooks[notebook.ID()] = notebook
	return nil
}

func (r *mockNotebookRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.PetNotebook, error) {
	r.mock.mu.RLock()
	defer r.mock.mu.RUnlock()

	notebook, exists := r.mock.notebooks[id]
	if !exists {
		return nil, domain.ErrNotebookNotFound
	}
	return notebook, nil
}

func (r *mockNotebookRepository) FindByPetID(ctx context.Context, petID uuid.UUID) (*domain.PetNotebook, error) {
	r.mock.mu.RLock()
	defer r.mock.mu.RUnlock()

	for _, notebook := range r.mock.notebooks {
		if notebook.PetID() == petID {
			return notebook, nil
		}
	}
	return nil, domain.ErrNotebookNotFound
}

func (r *mockNotebookRepository) CreateForPet(ctx context.Context, petID uuid.UUID) (*domain.PetNotebook, error) {
	notebook := domain.NewPetNotebook(petID)
	return notebook, r.Save(ctx, notebook)
}

func (r *mockNotebookRepository) Delete(ctx context.Context, id uuid.UUID) error {
	r.mock.mu.Lock()
	defer r.mock.mu.Unlock()

	if _, exists := r.mock.notebooks[id]; !exists {
		return domain.ErrNotebookNotFound
	}
	delete(r.mock.notebooks, id)
	return nil
}

// Similar mock implementations for other repositories...
// (Abbreviated for brevity - they would follow the same pattern)

type mockNotebookEntryRepository struct {
	mock *MockRepositories
}

func (r *mockNotebookEntryRepository) Save(ctx context.Context, entry *domain.NotebookEntry) error {
	r.mock.mu.Lock()
	defer r.mock.mu.Unlock()
	r.mock.entries[entry.ID()] = entry
	return nil
}

func (r *mockNotebookEntryRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.NotebookEntry, error) {
	r.mock.mu.RLock()
	defer r.mock.mu.RUnlock()

	entry, exists := r.mock.entries[id]
	if !exists {
		return nil, domain.ErrEntryNotFound
	}
	return entry, nil
}

func (r *mockNotebookEntryRepository) FindByNotebookID(ctx context.Context, notebookID uuid.UUID, limit, offset int) ([]*domain.NotebookEntry, error) {
	r.mock.mu.RLock()
	defer r.mock.mu.RUnlock()

	var result []*domain.NotebookEntry
	for _, entry := range r.mock.entries {
		if entry.NotebookID() == notebookID {
			result = append(result, entry)
		}
	}

	// Simple pagination
	start := offset
	end := offset + limit
	if start >= len(result) {
		return []*domain.NotebookEntry{}, nil
	}
	if end > len(result) {
		end = len(result)
	}

	return result[start:end], nil
}

func (r *mockNotebookEntryRepository) FindByNotebookIDAndType(ctx context.Context, notebookID uuid.UUID, entryType domain.EntryType, limit, offset int) ([]*domain.NotebookEntry, error) {
	r.mock.mu.RLock()
	defer r.mock.mu.RUnlock()

	var result []*domain.NotebookEntry
	for _, entry := range r.mock.entries {
		if entry.NotebookID() == notebookID && entry.EntryType() == entryType {
			result = append(result, entry)
		}
	}

	// Simple pagination
	start := offset
	end := offset + limit
	if start >= len(result) {
		return []*domain.NotebookEntry{}, nil
	}
	if end > len(result) {
		end = len(result)
	}

	return result[start:end], nil
}

func (r *mockNotebookEntryRepository) CountByNotebookID(ctx context.Context, notebookID uuid.UUID) (int, error) {
	r.mock.mu.RLock()
	defer r.mock.mu.RUnlock()

	count := 0
	for _, entry := range r.mock.entries {
		if entry.NotebookID() == notebookID {
			count++
		}
	}
	return count, nil
}

func (r *mockNotebookEntryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	r.mock.mu.Lock()
	defer r.mock.mu.Unlock()

	if _, exists := r.mock.entries[id]; !exists {
		return domain.ErrEntryNotFound
	}
	delete(r.mock.entries, id)
	return nil
}

// Placeholder mock implementations for specialized entry repositories
// These would be expanded in real usage but are kept minimal for brevity

type mockMedicalEntryRepository struct {
	mock *MockRepositories
}

func (r *mockMedicalEntryRepository) Save(ctx context.Context, entry *domain.MedicalEntry) error {
	r.mock.mu.Lock()
	defer r.mock.mu.Unlock()
	r.mock.medicalEntries[entry.EntryID()] = entry
	return nil
}

func (r *mockMedicalEntryRepository) FindByEntryID(ctx context.Context, entryID uuid.UUID) (*domain.MedicalEntry, error) {
	r.mock.mu.RLock()
	defer r.mock.mu.RUnlock()

	entry, exists := r.mock.medicalEntries[entryID]
	if !exists {
		return nil, domain.ErrEntryNotFound
	}
	return entry, nil
}

func (r *mockMedicalEntryRepository) Delete(ctx context.Context, entryID uuid.UUID) error {
	r.mock.mu.Lock()
	defer r.mock.mu.Unlock()
	delete(r.mock.medicalEntries, entryID)
	return nil
}

type mockDietEntryRepository struct {
	mock *MockRepositories
}

func (r *mockDietEntryRepository) Save(ctx context.Context, entry *domain.DietEntry) error {
	r.mock.mu.Lock()
	defer r.mock.mu.Unlock()
	r.mock.dietEntries[entry.EntryID()] = entry
	return nil
}

func (r *mockDietEntryRepository) FindByEntryID(ctx context.Context, entryID uuid.UUID) (*domain.DietEntry, error) {
	r.mock.mu.RLock()
	defer r.mock.mu.RUnlock()

	entry, exists := r.mock.dietEntries[entryID]
	if !exists {
		return nil, domain.ErrEntryNotFound
	}
	return entry, nil
}

func (r *mockDietEntryRepository) Delete(ctx context.Context, entryID uuid.UUID) error {
	r.mock.mu.Lock()
	defer r.mock.mu.Unlock()
	delete(r.mock.dietEntries, entryID)
	return nil
}

type mockHabitEntryRepository struct {
	mock *MockRepositories
}

func (r *mockHabitEntryRepository) Save(ctx context.Context, entry *domain.HabitEntry) error {
	r.mock.mu.Lock()
	defer r.mock.mu.Unlock()
	r.mock.habitEntries[entry.EntryID()] = entry
	return nil
}

func (r *mockHabitEntryRepository) FindByEntryID(ctx context.Context, entryID uuid.UUID) (*domain.HabitEntry, error) {
	r.mock.mu.RLock()
	defer r.mock.mu.RUnlock()

	entry, exists := r.mock.habitEntries[entryID]
	if !exists {
		return nil, domain.ErrEntryNotFound
	}
	return entry, nil
}

func (r *mockHabitEntryRepository) Delete(ctx context.Context, entryID uuid.UUID) error {
	r.mock.mu.Lock()
	defer r.mock.mu.Unlock()
	delete(r.mock.habitEntries, entryID)
	return nil
}

type mockCommandEntryRepository struct {
	mock *MockRepositories
}

func (r *mockCommandEntryRepository) Save(ctx context.Context, entry *domain.CommandEntry) error {
	r.mock.mu.Lock()
	defer r.mock.mu.Unlock()
	r.mock.commandEntries[entry.EntryID()] = entry
	return nil
}

func (r *mockCommandEntryRepository) FindByEntryID(ctx context.Context, entryID uuid.UUID) (*domain.CommandEntry, error) {
	r.mock.mu.RLock()
	defer r.mock.mu.RUnlock()

	entry, exists := r.mock.commandEntries[entryID]
	if !exists {
		return nil, domain.ErrEntryNotFound
	}
	return entry, nil
}

func (r *mockCommandEntryRepository) Delete(ctx context.Context, entryID uuid.UUID) error {
	r.mock.mu.Lock()
	defer r.mock.mu.Unlock()
	delete(r.mock.commandEntries, entryID)
	return nil
}

type mockNotebookShareRepository struct {
	mock *MockRepositories
}

func (r *mockNotebookShareRepository) Save(ctx context.Context, share *domain.NotebookShare) error {
	r.mock.mu.Lock()
	defer r.mock.mu.Unlock()
	r.mock.shares[share.ID()] = share
	return nil
}

func (r *mockNotebookShareRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.NotebookShare, error) {
	r.mock.mu.RLock()
	defer r.mock.mu.RUnlock()

	share, exists := r.mock.shares[id]
	if !exists {
		return nil, domain.ErrSharingNotFound
	}
	return share, nil
}

func (r *mockNotebookShareRepository) FindByNotebookID(ctx context.Context, notebookID uuid.UUID) ([]*domain.NotebookShare, error) {
	r.mock.mu.RLock()
	defer r.mock.mu.RUnlock()

	var result []*domain.NotebookShare
	for _, share := range r.mock.shares {
		if share.NotebookID() == notebookID {
			result = append(result, share)
		}
	}
	return result, nil
}

func (r *mockNotebookShareRepository) FindActiveByNotebookIDAndEmail(ctx context.Context, notebookID uuid.UUID, email string) (*domain.NotebookShare, error) {
	r.mock.mu.RLock()
	defer r.mock.mu.RUnlock()

	for _, share := range r.mock.shares {
		if share.NotebookID() == notebookID && share.SharedWith() == email && share.RevokedAt() == nil {
			return share, nil
		}
	}
	return nil, nil // No active share found
}

func (r *mockNotebookShareRepository) FindSharedWithUser(ctx context.Context, email string, limit, offset int) ([]*domain.NotebookShare, error) {
	r.mock.mu.RLock()
	defer r.mock.mu.RUnlock()

	var result []*domain.NotebookShare
	for _, share := range r.mock.shares {
		if share.SharedWith() == email && share.RevokedAt() == nil {
			result = append(result, share)
		}
	}

	// Simple pagination
	start := offset
	end := offset + limit
	if start >= len(result) {
		return []*domain.NotebookShare{}, nil
	}
	if end > len(result) {
		end = len(result)
	}

	return result[start:end], nil
}

func (r *mockNotebookShareRepository) Delete(ctx context.Context, id uuid.UUID) error {
	r.mock.mu.Lock()
	defer r.mock.mu.Unlock()

	if _, exists := r.mock.shares[id]; !exists {
		return domain.ErrSharingNotFound
	}
	delete(r.mock.shares, id)
	return nil
}