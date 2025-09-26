package timezone

import (
	"fmt"
	"time"
)

// DailyBoundary represents the start and end of a user's day
type DailyBoundary struct {
	Start time.Time
	End   time.Time
}

// UserTimeConfig holds timezone configuration for a user
type UserTimeConfig struct {
	DailyResetTime string // Time in HH:MM format (e.g., "21:00")
	Timezone       string // IANA timezone identifier (e.g., "America/New_York")
}

// GetUserLocation loads a user's timezone location
func GetUserLocation(timezone string) (*time.Location, error) {
	if timezone == "" {
		timezone = "UTC"
	}

	location, err := time.LoadLocation(timezone)
	if err != nil {
		return nil, fmt.Errorf("invalid timezone '%s': %w", timezone, err)
	}

	return location, nil
}

// ParseResetTime parses a time string in HH:MM format
func ParseResetTime(resetTime string) (hour, minute int, err error) {
	if resetTime == "" {
		resetTime = "21:00" // Default to 9 PM
	}

	parsedTime, err := time.Parse("15:04", resetTime)
	if err != nil {
		return 0, 0, fmt.Errorf("invalid reset time format '%s': %w", resetTime, err)
	}

	return parsedTime.Hour(), parsedTime.Minute(), nil
}

// GetDailyBoundaryForDate calculates the daily boundary for a specific date
func GetDailyBoundaryForDate(date time.Time, config UserTimeConfig) (DailyBoundary, error) {
	location, err := GetUserLocation(config.Timezone)
	if err != nil {
		return DailyBoundary{}, err
	}

	hour, minute, err := ParseResetTime(config.DailyResetTime)
	if err != nil {
		return DailyBoundary{}, err
	}

	// Get the date in user's timezone
	dateInUserTZ := date.In(location)

	// Calculate the start of the user's day (previous day's reset time)
	startDate := dateInUserTZ.AddDate(0, 0, -1)
	start := time.Date(startDate.Year(), startDate.Month(), startDate.Day(), hour, minute, 0, 0, location)

	// Calculate the end of the user's day (current day's reset time)
	end := time.Date(dateInUserTZ.Year(), dateInUserTZ.Month(), dateInUserTZ.Day(), hour, minute, 0, 0, location)

	return DailyBoundary{
		Start: start,
		End:   end,
	}, nil
}

// GetCurrentDailyBoundary calculates the current daily boundary for a user
func GetCurrentDailyBoundary(config UserTimeConfig) (DailyBoundary, error) {
	location, err := GetUserLocation(config.Timezone)
	if err != nil {
		return DailyBoundary{}, err
	}

	now := time.Now().In(location)
	return GetDailyBoundaryForDate(now, config)
}

// IsWithinSameDay checks if two times are within the same user day
func IsWithinSameDay(t1, t2 time.Time, config UserTimeConfig) (bool, error) {
	boundary1, err := GetDailyBoundaryForDate(t1, config)
	if err != nil {
		return false, err
	}

	boundary2, err := GetDailyBoundaryForDate(t2, config)
	if err != nil {
		return false, err
	}

	// Times are in the same day if they have the same boundary
	return boundary1.Start.Equal(boundary2.Start) && boundary1.End.Equal(boundary2.End), nil
}

// GetNextResetTime calculates when the next daily reset will occur
func GetNextResetTime(config UserTimeConfig) (time.Time, error) {
	location, err := GetUserLocation(config.Timezone)
	if err != nil {
		return time.Time{}, err
	}

	hour, minute, err := ParseResetTime(config.DailyResetTime)
	if err != nil {
		return time.Time{}, err
	}

	now := time.Now().In(location)

	// Calculate next reset time
	today := time.Date(now.Year(), now.Month(), now.Day(), hour, minute, 0, 0, location)

	if now.Before(today) {
		// Reset time hasn't passed today
		return today, nil
	} else {
		// Reset time has passed, next reset is tomorrow
		return today.AddDate(0, 0, 1), nil
	}
}

// ConvertToUserTime converts a UTC time to user's local time
func ConvertToUserTime(utcTime time.Time, config UserTimeConfig) (time.Time, error) {
	location, err := GetUserLocation(config.Timezone)
	if err != nil {
		return time.Time{}, err
	}

	return utcTime.In(location), nil
}

// ConvertToUTC converts a user's local time to UTC
func ConvertToUTC(localTime time.Time) time.Time {
	return localTime.UTC()
}

// GetDaysAgo returns a time that is the specified number of days ago in user's timezone
func GetDaysAgo(days int, config UserTimeConfig) (time.Time, error) {
	location, err := GetUserLocation(config.Timezone)
	if err != nil {
		return time.Time{}, err
	}

	now := time.Now().In(location)
	return now.AddDate(0, 0, -days), nil
}

// IsValidTimezone validates if a timezone string is valid
func IsValidTimezone(timezone string) bool {
	_, err := time.LoadLocation(timezone)
	return err == nil
}

// IsValidResetTime validates if a reset time string is in valid HH:MM format
func IsValidResetTime(resetTime string) bool {
	_, err := time.Parse("15:04", resetTime)
	return err == nil
}

// GetTimezoneOffset returns the timezone offset for a given timezone at a specific time
func GetTimezoneOffset(timezone string, t time.Time) (int, error) {
	location, err := GetUserLocation(timezone)
	if err != nil {
		return 0, err
	}

	_, offset := t.In(location).Zone()
	return offset, nil
}