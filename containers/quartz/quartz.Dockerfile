# Use an official Node runtime as a parent image
FROM node:20-alpine

# Install necessary tools
RUN apk add --no-cache \
    inotify-tools \
    bash \
    git

# Set default content path as an environment variable
ENV WORKDIR_PATH=/app/quartz
ENV CONTENT_PATH=/app/quartz/content
# Set the working directory
WORKDIR ${WORKDIR_PATH}

# Clone quartz repo to container
RUN git clone https://github.com/jackyzha0/quartz.git .

RUN npm install && npx quartz build && npm install -g http-server

# Copy entrypoint script
COPY quartz.entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set up volume for content
VOLUME ["${CONTENT_PATH}"]

# Expose port
EXPOSE 80

# Use the entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
