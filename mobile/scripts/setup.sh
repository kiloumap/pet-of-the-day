#!/bin/bash
echo "🚀 Setting up Expo React Native project..."

# Install dependencies
yarn install

# Install Expo CLI globally if not present
if ! command -v expo &> /dev/null; then
    echo "Installing Expo CLI..."
    npm install -g @expo/cli
fi

# Create env file
cp .env.example .env

# Check Expo doctor
expo doctor

echo "✅ Setup complete! Run 'yarn start' to begin."
echo "📱 Download Expo Go app on your phone for easy testing"