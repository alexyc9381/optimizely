#!/bin/bash

# Environment Setup Script for Optimizely AI
# This script helps set up the correct environment configuration

set -e

ENV=${1:-development}

echo "🔧 Setting up environment: $ENV"

case $ENV in
  "development"|"dev")
    echo "📋 Copying development environment configuration..."
    cp .env.development .env
    echo "✅ Development environment ready"
    echo "🔗 Frontend: http://localhost:3001"
    echo "🔗 Backend: http://localhost:4000" 
    echo "🔗 Health Check: http://localhost:4000/health"
    ;;
  "staging")
    echo "📋 Copying staging environment configuration..."
    cp .env.staging .env
    echo "✅ Staging environment ready"
    echo "⚠️  Remember to set actual secrets in production deployment"
    ;;
  "production"|"prod")
    echo "📋 Copying production environment configuration..."
    cp .env.production .env
    echo "⚠️  CRITICAL: Replace all REPLACE_WITH_ACTUAL values with real secrets"
    echo "✅ Production environment template ready"
    ;;
  *)
    echo "❌ Invalid environment: $ENV"
    echo "Usage: $0 [development|staging|production]"
    exit 1
    ;;
esac

echo ""
echo "🔍 Environment variables loaded:"
echo "NODE_ENV=$(grep NODE_ENV .env | cut -d '=' -f2)"
echo "API_PORT=$(grep API_PORT .env | cut -d '=' -f2)"
echo "WEB_PORT=$(grep WEB_PORT .env | cut -d '=' -f2)"
echo ""
echo "🚀 Ready to start development with: npm run dev"
