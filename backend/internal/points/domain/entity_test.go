package domain

import (
	"testing"
)

func TestIsValidSpecies(t *testing.T) {
	tests := []struct {
		name     string
		species  string
		expected bool
	}{
		{"Valid dog species", "dog", true},
		{"Valid cat species", "cat", true},
		{"Valid both species", "both", true},
		{"Invalid species", "bird", false},
		{"Empty species", "", false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := IsValidSpecies(test.species); got != test.expected {
				t.Errorf("IsValidSpecies(%s) = %v, want %v", test.species, got, test.expected)
			}
		})
	}
}

func TestIsValidPeriod(t *testing.T) {
	tests := []struct {
		name     string
		period   string
		expected bool
	}{
		{"Valid daily period", "daily", true},
		{"Valid weekly period", "weekly", true},
		{"Invalid period", "monthly", false},
		{"Empty period", "", false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := IsValidPeriod(test.period); got != test.expected {
				t.Errorf("IsValidPeriod(%s) = %v, want %v", test.period, got, test.expected)
			}
		})
	}
}
