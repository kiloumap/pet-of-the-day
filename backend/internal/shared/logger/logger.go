package logger

import (
	"encoding/json"
	"log"
)

const (
	DEBUG = true
)

func DebugLog(msg string, args ...interface{}) {
	if DEBUG {
		log.Printf("🐛 DEBUG: "+msg, args...)
	}
}

func InfoLog(msg string, args ...interface{}) {
	log.Printf("ℹ️  INFO: "+msg, args...)
}

func ErrorLog(msg string, args ...interface{}) {
	log.Printf("❌ ERROR: "+msg, args...)
}

func DebugJSON(label string, obj interface{}) {
	if DEBUG {
		jsonData, err := json.MarshalIndent(obj, "", "  ")
		if err != nil {
			log.Printf("🐛 DEBUG JSON ERROR [%s]: Failed to marshal object: %v", label, err)
			return
		}
		log.Printf("🐛 DEBUG JSON [%s]:\n%s", label, string(jsonData))
	}
}

func InfoJSON(label string, obj interface{}) {
	jsonData, err := json.MarshalIndent(obj, "", "  ")
	if err != nil {
		log.Printf("ℹ️  INFO JSON ERROR [%s]: Failed to marshal object: %v", label, err)
		return
	}
	log.Printf("ℹ️  INFO JSON [%s]:\n%s", label, string(jsonData))
}
