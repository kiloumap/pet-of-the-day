package main

import (
	"context"
	"log"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/behavior"

	_ "github.com/lib/pq"
)

func main() {
	// Connect to database
	client, err := ent.Open("postgres", "postgres://postgres:secret@localhost:5432/pet_of_the_day?sslmode=disable")
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer client.Close()

	ctx := context.Background()

	// Predefined behaviors based on our discussion
	behaviors := []struct {
		Name        string
		Description string
		Category    string
		Species     string
		Points      int
		Icon        string
	}{
		// Hygiene behaviors
		{"Needs outside", "Did their business outside", "hygiene", "dog", 5, "🌳"},
		{"Needs inside", "Had an accident inside", "hygiene", "dog", -3, "🏠"},
		{"Used litter box", "Used the litter box properly", "hygiene", "cat", 5, "📦"},
		{"Litter accident", "Had an accident outside litter box", "hygiene", "cat", -3, "💧"},

		// Play behaviors
		{"Active play", "Engaged in active play session", "play", "both", 3, "🎾"},
		{"Mental stimulation", "Completed puzzle or mental exercise", "play", "both", 4, "🧩"},
		{"Toy interaction", "Played with toys independently", "play", "both", 2, "🧸"},
		{"Fetch session", "Played fetch", "play", "dog", 3, "🎾"},
		{"Hunting play", "Engaged in hunting/stalking play", "play", "cat", 3, "🐭"},

		// Training behaviors
		{"Basic command", "Successfully followed basic command", "training", "both", 4, "✋"},
		{"New trick", "Learned or performed a new trick", "training", "both", 6, "⭐"},
		{"Leash training", "Good behavior during leash training", "training", "dog", 3, "🦮"},
		{"Recall success", "Came when called", "training", "both", 5, "📢"},
		{"Stay command", "Successfully stayed in place", "training", "both", 4, "🛑"},

		// Socialization behaviors
		{"Good with people", "Positive interaction with new people", "socialization", "both", 4, "👥"},
		{"Good with pets", "Positive interaction with other pets", "socialization", "both", 4, "🐕"},
		{"Calm in public", "Remained calm in public spaces", "socialization", "both", 5, "🏙️"},
		{"Vet visit", "Good behavior at vet visit", "socialization", "both", 6, "🏥"},

		// Care behaviors
		{"Grooming session", "Allowed grooming without fuss", "care", "both", 4, "✂️"},
		{"Nail trimming", "Cooperated during nail trimming", "care", "both", 5, "💅"},
		{"Teeth brushing", "Allowed teeth brushing", "care", "both", 4, "🦷"},
		{"Medicine taking", "Took medicine without resistance", "care", "both", 5, "💊"},

		// General behavior
		{"Calm behavior", "Showed exceptionally calm behavior", "behavior", "both", 3, "😌"},
		{"Good listening", "Listened well throughout the day", "behavior", "both", 3, "👂"},
		{"Destructive behavior", "Engaged in destructive behavior", "behavior", "both", -4, "💥"},
		{"Excessive barking", "Barked excessively", "behavior", "dog", -3, "🔊"},
		{"Scratching furniture", "Scratched furniture inappropriately", "behavior", "cat", -3, "🪑"},
	}

	log.Println("🌱 Starting database seeding...")

	// Check if behaviors already exist
	count, err := client.Behavior.Query().Where(behavior.IsGlobal(true)).Count(ctx)
	if err != nil {
		log.Fatalf("Failed to check existing behaviors: %v", err)
	}

	if count > 0 {
		log.Printf("ℹ️  Found %d existing global behaviors. Skipping seed to avoid duplicates.", count)
		log.Println("💡 If you want to re-seed, delete existing behaviors first or run with --force flag")
		return
	}

	// Create behaviors
	log.Printf("📝 Creating %d predefined behaviors...", len(behaviors))

	for _, b := range behaviors {
		_, err := client.Behavior.Create().
			SetName(b.Name).
			SetDescription(b.Description).
			SetCategory(behavior.Category(b.Category)).
			SetSpecies(behavior.Species(b.Species)).
			SetPoints(b.Points).
			SetIcon(b.Icon).
			SetIsGlobal(true).
			Save(ctx)

		if err != nil {
			log.Printf("❌ Failed to create behavior '%s': %v", b.Name, err)
		} else {
			log.Printf("✅ Created behavior: %s (%s, %s) - %d points", b.Name, b.Category, b.Species, b.Points)
		}
	}

	log.Println("🎉 Database seeding completed!")
}