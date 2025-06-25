# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY apps/api/ ./apps/api/
COPY tsconfig.json ./
COPY turbo.json ./

# Build the application
RUN npm run build --workspace=api

# Production stage
FROM node:20-alpine AS production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Set working directory
WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy built application from builder stage
COPY --from=builder --chown=nodeuser:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodejs /app/apps/api/package*.json ./

# Copy Prisma schema and client
COPY --from=builder --chown=nodeuser:nodejs /app/apps/api/prisma ./prisma
COPY --from=builder --chown=nodeuser:nodejs /app/apps/api/src/generated ./src/generated

# Create necessary directories
RUN mkdir -p /app/logs && chown nodeuser:nodejs /app/logs

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
