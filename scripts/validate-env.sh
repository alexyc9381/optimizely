#!/bin/bash

# Environment Validation Script
# Checks if all required environment variables are properly configured

set -e

echo "🔍 Validating environment configuration..."

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "❌ .env file not found. Run: ./scripts/setup-env.sh development"
    exit 1
fi

errors=0

# Check required variables
check_required() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo "❌ Missing required variable: $var_name"
        ((errors++))
    else
        echo "✅ $var_name is set"
    fi
}

check_optional() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo "⚠️  Optional variable not set: $var_name"
    else
        echo "✅ $var_name is set"
    fi
}

echo ""
echo "📋 Checking required variables..."
check_required "NODE_ENV"
check_required "API_PORT"
check_required "WEB_PORT"
check_required "REDIS_URL"

echo ""
echo "📋 Checking optional variables..."
check_optional "DATABASE_URL"
check_optional "ANTHROPIC_API_KEY"
check_optional "OPENAI_API_KEY"

echo ""
if [ $errors -eq 0 ]; then
    echo "✅ Environment validation passed!"
    echo "🚀 Ready to start development"
else
    echo "❌ Environment validation failed with $errors errors"
    echo "💡 Run: ./scripts/setup-env.sh development"
    exit 1
fi
