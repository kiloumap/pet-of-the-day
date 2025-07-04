package domain

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestSpecies_IsValid(t *testing.T) {
	dog := SpeciesDog
	cat := SpeciesCat
	bird := SpeciesBird

	assert.True(t, dog.IsValid())
	assert.True(t, cat.IsValid())
	assert.True(t, bird.IsValid())
}

func TestSpecies_IsInvalid(t *testing.T) {
	dragon := Species("dragon")

	assert.Falsef(t, dragon.IsValid(), "Expected invalid dragon, got %v", dragon.IsValid())
}
