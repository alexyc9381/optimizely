#!/bin/bash

# Docker Startup Script for Optimizely Universal AI Platform
# This script sets up and starts the complete Docker environment

set -e

echo "🐳 Starting Optimizely Universal AI Platform with Docker"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo "💡 Install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

echo "✅ Docker is running"

# Stop any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true

# Pull latest images and build
echo "🔨 Building Docker images..."
docker-compose build --no-cache

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
echo "   - Postgres..."
docker-compose exec postgres pg_isready -U postgres || true
echo "   - Redis..."
docker-compose exec redis redis-cli ping || true

# Show service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Access URLs:"
echo "   • Frontend: http://localhost:3001"
echo "   • Backend API: http://localhost:4000"
echo "   • Health Check: http://localhost:4000/health"
echo "   • PostgreSQL: localhost:5432 (user: postgres, pass: postgres)"
echo "   • Redis: localhost:6379"
echo ""
echo "📋 Useful Commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop services: docker-compose down"
echo "   • Restart services: docker-compose restart"
echo "   • Shell into API: docker-compose exec api sh"
echo "   • Shell into Web: docker-compose exec web sh"
echo ""
echo "✅ Optimizely Universal AI Platform is ready!"
