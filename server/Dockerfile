FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files first
COPY package.json ./

# Copy source code
COPY . .

# Install dependencies (including dev for build)
RUN pnpm install

# Build TypeScript
RUN pnpm run build

FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package.json ./

# Install production dependencies only
RUN pnpm install --prod

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 4000

# Run migrations and start server
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/index.js"]
