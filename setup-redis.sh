#!/bin/bash

# Download and setup Redis 7.4.2 locally
REDIS_VERSION="7.4.2"
REDIS_DIR="$HOME/.local/redis"
REDIS_PORT="6379"

echo "Setting up Redis ${REDIS_VERSION}..."

# Create directory
mkdir -p $REDIS_DIR
cd $REDIS_DIR

# Download Redis if not already downloaded
if [ ! -d "redis-${REDIS_VERSION}" ]; then
    echo "Downloading Redis ${REDIS_VERSION}..."
    curl -L "https://download.redis.io/releases/redis-${REDIS_VERSION}.tar.gz" -o redis-${REDIS_VERSION}.tar.gz
    tar -xzf redis-${REDIS_VERSION}.tar.gz
    rm redis-${REDIS_VERSION}.tar.gz
fi

# Build Redis if not already built
if [ ! -f "redis-${REDIS_VERSION}/src/redis-server" ]; then
    echo "Building Redis..."
    cd redis-${REDIS_VERSION}
    make
    cd ..
fi

# Create Redis configuration
cat > redis.conf << EOF
port ${REDIS_PORT}
bind 127.0.0.1
daemonize yes
save 900 1
save 300 10
save 60 10000
dir ${REDIS_DIR}
pidfile ${REDIS_DIR}/redis.pid
logfile ${REDIS_DIR}/redis.log
EOF

# Start Redis
echo "Starting Redis server..."
./redis-${REDIS_VERSION}/src/redis-server redis.conf

# Test Redis connection
echo "Testing Redis connection..."
sleep 2
./redis-${REDIS_VERSION}/src/redis-cli ping

echo "Redis setup complete!"
echo "Redis is running on port ${REDIS_PORT}"
echo "To stop Redis: ./redis-${REDIS_VERSION}/src/redis-cli shutdown"
