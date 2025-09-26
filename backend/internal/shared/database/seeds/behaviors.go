package seeds

import (
	"context"
	"fmt"
	"log"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/behavior"
)

// BehaviorSeed represents a behavior to be seeded
type BehaviorSeed struct {
	Name               string
	Description        string
	Category           string
	PointValue         int
	MinIntervalMinutes int
	Species            string
	Icon               string
}

// SeedBehaviors seeds the predefined behavior catalog
func SeedBehaviors(ctx context.Context, client *ent.Client) error {
	behaviors := []BehaviorSeed{
		// Potty Training Behaviors
		{
			Name:               "Went potty outside",
			Description:        "Pet successfully used designated outdoor bathroom area",
			Category:           "potty_training",
			PointValue:         5,
			MinIntervalMinutes: 30,
			Species:            "both",
			Icon:               "🌳",
		},
		{
			Name:               "Indoor accident",
			Description:        "Pet had an accident inside the house",
			Category:           "potty_training",
			PointValue:         -3,
			MinIntervalMinutes: 60,
			Species:            "both",
			Icon:               "💧",
		},
		{
			Name:               "Used training pad",
			Description:        "Pet correctly used designated training pad",
			Category:           "potty_training",
			PointValue:         3,
			MinIntervalMinutes: 30,
			Species:            "both",
			Icon:               "📄",
		},
		{
			Name:               "Signaled for potty",
			Description:        "Pet gave clear signal when needing to go outside",
			Category:           "potty_training",
			PointValue:         4,
			MinIntervalMinutes: 45,
			Species:            "both",
			Icon:               "🔔",
		},

		// Feeding Behaviors
		{
			Name:               "Ate all food",
			Description:        "Pet finished their entire meal",
			Category:           "feeding",
			PointValue:         2,
			MinIntervalMinutes: 120,
			Species:            "both",
			Icon:               "🍽️",
		},
		{
			Name:               "Left food uneaten",
			Description:        "Pet left significant amount of food in bowl",
			Category:           "feeding",
			PointValue:         -1,
			MinIntervalMinutes: 240,
			Species:            "both",
			Icon:               "🥣",
		},
		{
			Name:               "Stole human food",
			Description:        "Pet took food that wasn't meant for them",
			Category:           "feeding",
			PointValue:         -2,
			MinIntervalMinutes: 60,
			Species:            "both",
			Icon:               "🍖",
		},
		{
			Name:               "Waited politely for food",
			Description:        "Pet sat and waited patiently during meal preparation",
			Category:           "feeding",
			PointValue:         3,
			MinIntervalMinutes: 240,
			Species:            "both",
			Icon:               "😇",
		},

		// Social Behaviors
		{
			Name:               "Good with people",
			Description:        "Pet was friendly and well-behaved with humans",
			Category:           "social",
			PointValue:         3,
			MinIntervalMinutes: 60,
			Species:            "both",
			Icon:               "👥",
		},
		{
			Name:               "Good with other pets",
			Description:        "Pet played nicely with other animals",
			Category:           "social",
			PointValue:         2,
			MinIntervalMinutes: 60,
			Species:            "both",
			Icon:               "🐕",
		},
		{
			Name:               "Aggressive behavior",
			Description:        "Pet showed aggression towards people or animals",
			Category:           "social",
			PointValue:         -5,
			MinIntervalMinutes: 30,
			Species:            "both",
			Icon:               "😡",
		},
		{
			Name:               "Greeted guests nicely",
			Description:        "Pet welcomed visitors in a calm, friendly manner",
			Category:           "social",
			PointValue:         4,
			MinIntervalMinutes: 120,
			Species:            "both",
			Icon:               "👋",
		},

		// Training Behaviors
		{
			Name:               "Followed basic command",
			Description:        "Pet successfully obeyed sit, stay, come, or similar command",
			Category:           "training",
			PointValue:         4,
			MinIntervalMinutes: 15,
			Species:            "both",
			Icon:               "✨",
		},
		{
			Name:               "Ignored command",
			Description:        "Pet didn't respond to clear commands",
			Category:           "training",
			PointValue:         -2,
			MinIntervalMinutes: 30,
			Species:            "both",
			Icon:               "🙄",
		},
		{
			Name:               "Learned new trick",
			Description:        "Pet successfully learned and performed a new trick",
			Category:           "training",
			PointValue:         6,
			MinIntervalMinutes: 60,
			Species:            "both",
			Icon:               "🎪",
		},
		{
			Name:               "Walked nicely on leash",
			Description:        "Pet walked calmly without pulling during walk",
			Category:           "training",
			PointValue:         3,
			MinIntervalMinutes: 180,
			Species:            "dog",
			Icon:               "🦮",
		},
		{
			Name:               "Pulled on leash",
			Description:        "Pet pulled excessively during walk",
			Category:           "training",
			PointValue:         -1,
			MinIntervalMinutes: 180,
			Species:            "dog",
			Icon:               "➡️",
		},

		// Play Behaviors
		{
			Name:               "Active playtime",
			Description:        "Pet engaged in healthy, active play",
			Category:           "play",
			PointValue:         2,
			MinIntervalMinutes: 60,
			Species:            "both",
			Icon:               "🎾",
		},
		{
			Name:               "Destructive chewing",
			Description:        "Pet chewed inappropriate items (furniture, shoes, etc.)",
			Category:           "play",
			PointValue:         -4,
			MinIntervalMinutes: 30,
			Species:            "both",
			Icon:               "🦷",
		},
		{
			Name:               "Played with toys appropriately",
			Description:        "Pet used toys as intended without destroying them",
			Category:           "play",
			PointValue:         2,
			MinIntervalMinutes: 120,
			Species:            "both",
			Icon:               "🧸",
		},
		{
			Name:               "Calm relaxation time",
			Description:        "Pet rested peacefully without demanding attention",
			Category:           "play",
			PointValue:         1,
			MinIntervalMinutes: 240,
			Species:            "both",
			Icon:               "😴",
		},
		{
			Name:               "Excessive barking/meowing",
			Description:        "Pet made excessive noise without clear reason",
			Category:           "play",
			PointValue:         -3,
			MinIntervalMinutes: 60,
			Species:            "both",
			Icon:               "🔊",
		},
	}

	log.Printf("Seeding %d behaviors...", len(behaviors))

	for _, behaviorSeed := range behaviors {
		// Check if behavior already exists
		exists, err := client.Behavior.
			Query().
			Where(behavior.NameEQ(behaviorSeed.Name)).
			Exist(ctx)

		if err != nil {
			return fmt.Errorf("error checking if behavior exists: %w", err)
		}

		if exists {
			log.Printf("Behavior '%s' already exists, skipping...", behaviorSeed.Name)
			continue
		}

		// Create the behavior
		_, err = client.Behavior.
			Create().
			SetName(behaviorSeed.Name).
			SetDescription(behaviorSeed.Description).
			SetCategory(behaviorSeed.Category).
			SetPointValue(behaviorSeed.PointValue).
			SetMinIntervalMinutes(behaviorSeed.MinIntervalMinutes).
			SetSpecies(behaviorSeed.Species).
			SetIcon(behaviorSeed.Icon).
			SetIsActive(true).
			Save(ctx)

		if err != nil {
			return fmt.Errorf("error creating behavior '%s': %w", behaviorSeed.Name, err)
		}

		log.Printf("Created behavior: %s (%+d points)", behaviorSeed.Name, behaviorSeed.PointValue)
	}

	log.Printf("Successfully seeded %d behaviors", len(behaviors))
	return nil
}