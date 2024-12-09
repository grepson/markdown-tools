#!/usr/bin/env sh

# Use the CONTENT_PATH environment variable
: "${WORKDIR_PATH:=/app/quartz}"

if [ ! "$(ls -A /app/quartz/content)" ]; then
    echo "Container initial run. Copying initial files to empty quartz directory...."
    cp -R ${WORKDIR_PATH}/docs/* ${WORKDIR_PATH}/content/*
fi

# Initial build
npx quartz build

# Start HTTP server in the background
cd "${WORKDIR_PATH}/public"
http-server -p 80 &

# Continuous watch and rebuild
while true; do
    inotifywait -r -e modify,create,delete "$WORKDIR_PATH/content"

    cd "${WORKDIR_PATH}/public"

    # Restart the HTTP server
    pkill http-server

    cd "${WORKDIR_PATH}"
    npx quartz build

    cd "${WORKDIR_PATH}/public"
    http-server -p 80 &
done
