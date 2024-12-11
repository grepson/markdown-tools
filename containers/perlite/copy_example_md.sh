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

echo "Copying initial md files...."
mkdir -p $PERLITE_DIR
cd $PERLITE_DIR
curl -L https://github.com/secure-77/Perlite/tarball/main | tar -xz --strip-components=3 'secure-77-Perlite-*/perlite/Demo/*'
echo "Copied demo content from git repo onto $PERLITE_DIR !"
