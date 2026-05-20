FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source and build
COPY . .
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/farm.db

EXPOSE 3000

# The built SvelteKit app with adapter-node
CMD ["node", "build"]
