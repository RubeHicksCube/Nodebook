FROM node:20-alpine AS builder
WORKDIR /app

# copy package.json + package-lock.json if you’re using npm
COPY package.json package-lock.json* ./

# install dependencies
RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
