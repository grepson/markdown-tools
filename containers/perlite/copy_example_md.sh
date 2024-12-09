#!/usr/bin/env sh

echo "Container initial run. Copying initial md file...."
wget https://raw.githubusercontent.com/secure-77/Perlite/refs/heads/main/README.md -P ${PWD}/notes/perlite
