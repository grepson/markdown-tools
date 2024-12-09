#!/bin/sh

# Ensure the script fails if any command fails
set -e

npm install -g pnpm

# Create Slidev project
pnpm create slidev slidev --no

# Change to the project directory
cd slidev

# Create a directory to store initial files
mkdir -p /app/initial-files

# Copy all files from the Slidev project to the initial files directory
cp -R ./* /app/initial-files/

# Optional: You can add any additional setup steps here
echo "Slidev project created successfully."
