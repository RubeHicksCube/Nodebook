FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json ./

# Copy source code
COPY . .

# Install dependencies
RUN pnpm install

EXPOSE 5173

# Run Vite dev server with host flag to allow external access
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]
