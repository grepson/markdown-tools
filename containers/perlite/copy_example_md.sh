#!/usr/bin/env sh
#
# Extract PERLITE_DIR with multiple safeguards
PERLITE_DIR=$(eval echo $(grep PERLITE_DIR ${PWD}/.env | cut -d '=' -f2 | tr -d '"'))

# Debug: Show extracted directory
echo "Extracted PERLITE_DIR: $PERLITE_DIR"

# Verify directory exists
if [ ! -d "$PERLITE_DIR" ]; then
    echo "Error: Destination directory $PERLITE_DIR does not exist!"
    mkdir -p "$PERLITE_DIR"
fi

echo "Copying initial md file...."
mkdir -p ./tmp
wget https://raw.githubusercontent.com/secure-77/Perlite/refs/heads/main/README.md -P ./tmp
cp ./tmp/README.md "$PERLITE_DIR"
rm -rf ./tmp
