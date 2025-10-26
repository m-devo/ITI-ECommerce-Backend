# Use Node.js 18 Alpine as the base image for the build stage
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage
FROM node:18-alpine AS production

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set the working directory
WORKDIR /app

# Copy the node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy the application code
COPY . .

# Create uploads directory and set ownership
RUN mkdir -p uploads/audios && chown -R nodejs:nodejs /app
USER nodejs

# Expose the port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/ || exit 1

# Start the application
CMD ["npm", "start"]