#!/usr/bin/env sh

# In your entrypoint or startup script, you can then use:
if [ ! "$(ls -A /app/slidev)" ]; then
    echo "Container initial run. Copying initial files to empty Slidev directory...."
    cp -R /app/initial-files/* /app/slidev/
    echo "Installing npm dependencies"
    pnpm install
    echo "Removing temp files"
    rm -rf /app/initial-files
fi

npx slidev --port ${SLIDEV_PORT} --bind ${SLIDEV_HOST} --remote ${SLIDEV_ENTRY}
