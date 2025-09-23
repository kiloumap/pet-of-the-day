package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"pet-of-the-day/ent/behavior"
	"pet-of-the-day/internal/shared/database"

	_ "github.com/lib/pq"
)

type BehaviorData struct {
	Name        string
	Description string
	Points      int
	Category    string
	Species     string
	Icon        string
}

func main() {
	// Get database connection
	repoFactory, err := database.NewRepositoryFactory()
	if err != nil {
		log.Fatalf("Failed to create repository factory: %v", err)
	}
	defer repoFactory.Close()

	client := repoFactory.GetEntClient()
	ctx := context.Background()

	// Check if behaviors already exist
	count, err := client.Behavior.Query().Count(ctx)
	if err != nil {
		log.Fatalf("Failed to count behaviors: %v", err)
	}

	if count > 0 {
		fmt.Printf("Behaviors already exist (%d found). Use --force to recreate.\n", count)
		if len(os.Args) < 2 || os.Args[1] != "--force" {
			return
		}

		// Delete existing behaviors if --force is used
		_, err = client.Behavior.Delete().Exec(ctx)
		if err != nil {
			log.Fatalf("Failed to delete existing behaviors: %v", err)
		}
		fmt.Println("Deleted existing behaviors")
	}

	// Define predefined behaviors
	behaviors := []BehaviorData{
		// Hygiene - Dogs
		{
			Name:        "Needs outside",
			Description: "Did their business outside",
			Points:      3,
			Category:    "hygiene",
			Species:     "dog",
			Icon:        "🌳",
		},
		{
			Name:        "Needs inside",
			Description: "Had an accident inside",
			Points:      -2,
			Category:    "hygiene",
			Species:     "dog",
			Icon:        "🏠",
		},

		// Hygiene - Cats
		{
			Name:        "Used litter box",
			Description: "Used the litter box properly",
			Points:      2,
			Category:    "hygiene",
			Species:     "cat",
			Icon:        "📦",
		},

		// Play & Activity
		{
			Name:        "Play session (15+ min)",
			Description: "Had an active play session",
			Points:      4,
			Category:    "play",
			Species:     "both",
			Icon:        "🎾",
		},
		{
			Name:        "Short walk (<30min)",
			Description: "Went on a short walk",
			Points:      3,
			Category:    "play",
			Species:     "dog",
			Icon:        "🚶",
		},
		{
			Name:        "Long walk (30+ min)",
			Description: "Went on a long walk",
			Points:      5,
			Category:    "play",
			Species:     "dog",
			Icon:        "🏃",
		},
		{
			Name:        "Running/exercise",
			Description: "Had intensive exercise",
			Points:      6,
			Category:    "play",
			Species:     "both",
			Icon:        "🏃‍♂️",
		},
		{
			Name:        "Played with other pets",
			Description: "Socialized and played with other pets",
			Points:      4,
			Category:    "play",
			Species:     "both",
			Icon:        "🐕",
		},

		// Training
		{
			Name:        "Obeyed 'sit' command",
			Description: "Successfully followed the sit command",
			Points:      2,
			Category:    "training",
			Species:     "both",
			Icon:        "✅",
		},
		{
			Name:        "Obeyed 'down' command",
			Description: "Successfully followed the down command",
			Points:      2,
			Category:    "training",
			Species:     "both",
			Icon:        "⬇️",
		},
		{
			Name:        "Came when called",
			Description: "Responded to recall command",
			Points:      3,
			Category:    "training",
			Species:     "both",
			Icon:        "📞",
		},
		{
			Name:        "Learned new trick",
			Description: "Successfully learned a new trick",
			Points:      5,
			Category:    "training",
			Species:     "both",
			Icon:        "🎩",
		},
		{
			Name:        "Walked nicely on leash",
			Description: "Good leash manners during walk",
			Points:      3,
			Category:    "training",
			Species:     "dog",
			Icon:        "🦮",
		},
		{
			Name:        "Didn't obey commands",
			Description: "Ignored or refused commands",
			Points:      -2,
			Category:    "training",
			Species:     "both",
			Icon:        "❌",
		},

		// Socialization
		{
			Name:        "Met new dog/cat",
			Description: "Positive interaction with a new pet",
			Points:      4,
			Category:    "socialization",
			Species:     "both",
			Icon:        "🤝",
		},
		{
			Name:        "Good behavior at vet",
			Description: "Calm and cooperative at veterinary visit",
			Points:      5,
			Category:    "socialization",
			Species:     "both",
			Icon:        "🏥",
		},
		{
			Name:        "Good with visitors",
			Description: "Friendly and well-behaved with guests",
			Points:      3,
			Category:    "socialization",
			Species:     "both",
			Icon:        "👥",
		},
		{
			Name:        "Aggressive/fearful behavior",
			Description: "Showed aggression or fear towards others",
			Points:      -3,
			Category:    "socialization",
			Species:     "both",
			Icon:        "😰",
		},
		{
			Name:        "Exemplary in public",
			Description: "Perfect behavior in public spaces",
			Points:      5,
			Category:    "socialization",
			Species:     "both",
			Icon:        "⭐",
		},

		// Care
		{
			Name:        "Accepted brushing",
			Description: "Cooperative during grooming",
			Points:      3,
			Category:    "care",
			Species:     "both",
			Icon:        "🪒",
		},
		{
			Name:        "Calm during bath",
			Description: "Stayed calm during bathing",
			Points:      4,
			Category:    "care",
			Species:     "both",
			Icon:        "🛁",
		},
		{
			Name:        "Nail trimming",
			Description: "Allowed nail trimming without struggle",
			Points:      3,
			Category:    "care",
			Species:     "both",
			Icon:        "✂️",
		},
		{
			Name:        "Took medicine",
			Description: "Took medication without difficulty",
			Points:      3,
			Category:    "care",
			Species:     "both",
			Icon:        "💊",
		},
		{
			Name:        "Refused care",
			Description: "Resisted grooming or medical care",
			Points:      -2,
			Category:    "care",
			Species:     "both",
			Icon:        "🚫",
		},

		// Behavior
		{
			Name:        "Very calm/well-behaved",
			Description: "Exceptionally good behavior",
			Points:      4,
			Category:    "behavior",
			Species:     "both",
			Icon:        "😇",
		},
		{
			Name:        "Destroyed objects",
			Description: "Damaged furniture or belongings",
			Points:      -4,
			Category:    "behavior",
			Species:     "both",
			Icon:        "💥",
		},
		{
			Name:        "Excessive barking",
			Description: "Barked excessively or inappropriately",
			Points:      -2,
			Category:    "behavior",
			Species:     "dog",
			Icon:        "📢",
		},
		{
			Name:        "Stole food",
			Description: "Took food without permission",
			Points:      -2,
			Category:    "behavior",
			Species:     "both",
			Icon:        "🍖",
		},
		{
			Name:        "Protected the house",
			Description: "Good guard behavior when appropriate",
			Points:      3,
			Category:    "behavior",
			Species:     "both",
			Icon:        "🏠",
		},
	}

	// Create behaviors
	fmt.Printf("Creating %d predefined behaviors...\n", len(behaviors))

	for _, behaviorData := range behaviors {
		_, err := client.Behavior.Create().
			SetName(behaviorData.Name).
			SetDescription(behaviorData.Description).
			SetPoints(behaviorData.Points).
			SetCategory(behavior.Category(behaviorData.Category)).
			SetSpecies(behavior.Species(behaviorData.Species)).
			SetIcon(behaviorData.Icon).
			SetIsGlobal(true).
			Save(ctx)

		if err != nil {
			log.Printf("Failed to create behavior '%s': %v", behaviorData.Name, err)
		} else {
			fmt.Printf("✓ Created behavior: %s (%+d points)\n", behaviorData.Name, behaviorData.Points)
		}
	}

	fmt.Println("\n🎉 Behavior seeding completed!")
}
