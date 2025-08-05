# Stage 1: Base image with heavy system dependencies
# This layer will be heavily cached and will only rebuild if you change the package list.
FROM node:lts-bullseye-slim AS base

# Add --no-install-recommends to avoid installing unnecessary packages
# Note: texlive-lang-all is extremely large. If you only need specific languages,
# replacing it would be a huge optimization. e.g., texlive-lang-german, texlive-lang-french
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        pandoc \
        texlive-latex-extra \
        texlive-fonts-recommended \
        texlive-lang-all \
        texlive-xetex \
        lmodern \
        fonts-noto-color-emoji \
        fontconfig \
        make \
        curl \
        unzip \
        git && \
    # Clean up APT caches to reduce image size
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


# Stage 2: Build the Node.js application
# This stage uses the base image but focuses on the application code.
FROM base AS builder

WORKDIR /app

# Copy package manifests and install ALL dependencies (including devDependencies for building)
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
# A .dockerignore file is crucial here to avoid invalidating the cache unnecessarily
COPY . .

# Build the TypeScript code
RUN npm run build

# Remove development dependencies to lighten the final node_modules folder
RUN npm prune --production


# Stage 3: Final production image
# This creates the final, lean image for running the application.
FROM base AS final

WORKDIR /app

# Rebuild font cache
RUN fc-cache -f -v

# Copy the built application and production node_modules from the 'builder' stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create necessary directories (and ensure correct permissions)
RUN mkdir -p watch output templates

# Set environment variables
ENV WATCH_DIR=/app/watch
ENV OUTPUT_DIR=/app/output
ENV TEMPLATES_DIR=/app/templates
ENV CONFIG_FILE=/app/config.json
ENV MAX_WORKERS=3

# Expose port if your app is a server (optional, good practice)
# EXPOSE 3000

# Run the application
CMD ["node", "dist/orchestrator.js"]
