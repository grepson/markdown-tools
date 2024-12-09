# Use an official Node runtime as a parent image
FROM node:20-alpine

# Install necessary tools
RUN apk add --no-cache \
    inotify-tools \
    bash \
    git

# Set default content path as an environment variable
ENV WORKDIR_PATH=/app/slidev

# Slidev environment vars
ENV SLIDEV_PORT=3030
ENV SLIDEV_HOST="0.0.0.0"
ENV SLIDEV_ENTRY="slides.md"

WORKDIR /app

COPY slidev.sh slidev.sh

RUN chmod +x slidev.sh && ./slidev.sh

WORKDIR ${WORKDIR_PATH}

# Expose port
EXPOSE 3030

# Create a volume for persistent storage
VOLUME ["/app/slidev"]

COPY ./slidev.entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
