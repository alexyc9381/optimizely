#!/bin/bash

# Optimizely AI Deployment Script
# Supports blue-green deployment strategy with health checks

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="/tmp/optimizely-deploy-$(date +%Y%m%d-%H%M%S).log"

# Default values
ENVIRONMENT=""
BLUE_GREEN=${BLUE_GREEN:-true}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-300}
ROLLBACK_ON_FAILURE=${ROLLBACK_ON_FAILURE:-true}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] ENVIRONMENT

Deploy Optimizely AI to specified environment

ENVIRONMENT:
    development     Deploy to development environment
    staging         Deploy to staging environment
    production      Deploy to production environment

OPTIONS:
    -h, --help                  Show this help message
    -v, --version VERSION       Specific version/tag to deploy
    -bg, --blue-green           Enable blue-green deployment (default: true)
    -nb, --no-blue-green        Disable blue-green deployment
    -t, --timeout SECONDS       Health check timeout (default: 300)
    -nr, --no-rollback          Disable automatic rollback on failure
    -f, --force                 Force deployment without confirmations
    -d, --dry-run              Simulate deployment without actual changes

Examples:
    $0 staging
    $0 production --version v1.2.3 --timeout 600
    $0 development --no-blue-green --force
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -v|--version)
                VERSION="$2"
                shift 2
                ;;
            -bg|--blue-green)
                BLUE_GREEN=true
                shift
                ;;
            -nb|--no-blue-green)
                BLUE_GREEN=false
                shift
                ;;
            -t|--timeout)
                HEALTH_CHECK_TIMEOUT="$2"
                shift 2
                ;;
            -nr|--no-rollback)
                ROLLBACK_ON_FAILURE=false
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            development|staging|production)
                ENVIRONMENT="$1"
                shift
                ;;
            *)
                error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done

    if [[ -z "$ENVIRONMENT" ]]; then
        error "Environment is required"
        usage
        exit 1
    fi
}

# Validate environment
validate_environment() {
    log "Validating environment: $ENVIRONMENT"

    case $ENVIRONMENT in
        development|staging|production)
            log "Environment '$ENVIRONMENT' is valid"
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    local required_tools=("docker" "docker-compose" "curl" "jq")

    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "Required tool not found: $tool"
            exit 1
        fi
    done

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi

    success "All prerequisites met"
}

# Load environment configuration
load_environment_config() {
    log "Loading environment configuration for: $ENVIRONMENT"

    local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"
    if [[ -f "$env_file" ]]; then
        # shellcheck source=/dev/null
        source "$env_file"
        log "Loaded environment file: $env_file"
    else
        warning "Environment file not found: $env_file"
    fi
}

# Build and push Docker images
build_and_push_images() {
    log "Building and pushing Docker images for $ENVIRONMENT..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would build and push images"
        return 0
    fi

    # Build images using GitHub Container Registry
    local registry="ghcr.io/$(echo "$GITHUB_REPOSITORY" | tr '[:upper:]' '[:lower:]')"
    local tag="${VERSION:-$(git rev-parse --short HEAD)}"

    # Build API image
    log "Building API image..."
    docker build -t "$registry/api:$tag" -f apps/api/Dockerfile .
    docker tag "$registry/api:$tag" "$registry/api:$ENVIRONMENT"

    # Build Web image
    log "Building Web image..."
    docker build -t "$registry/web:$tag" -f apps/web/Dockerfile .
    docker tag "$registry/web:$tag" "$registry/web:$ENVIRONMENT"

    # Push images
    if [[ -n "$GITHUB_TOKEN" ]]; then
        echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin

        docker push "$registry/api:$tag"
        docker push "$registry/api:$ENVIRONMENT"
        docker push "$registry/web:$tag"
        docker push "$registry/web:$ENVIRONMENT"

        success "Images built and pushed successfully"
    else
        warning "GITHUB_TOKEN not set, skipping image push"
    fi
}

# Health check function
health_check() {
    local service_url="$1"
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / 10))
    local attempt=1

    log "Performing health check on $service_url (timeout: ${HEALTH_CHECK_TIMEOUT}s)"

    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$service_url/health" > /dev/null 2>&1; then
            success "Health check passed for $service_url"
            return 0
        fi

        log "Health check attempt $attempt/$max_attempts failed, retrying in 10s..."
        sleep 10
        ((attempt++))
    done

    error "Health check failed for $service_url after $HEALTH_CHECK_TIMEOUT seconds"
    return 1
}

# Blue-green deployment
blue_green_deploy() {
    log "Starting blue-green deployment for $ENVIRONMENT"

    local compose_file="docker-compose.yml"
    if [[ "$ENVIRONMENT" != "development" ]]; then
        compose_file="docker-compose.$ENVIRONMENT.yml"
    fi

    # Determine current and next environments
    local current_env=""
    local next_env=""

    if docker-compose -f "$compose_file" ps | grep -q "green"; then
        current_env="green"
        next_env="blue"
    else
        current_env="blue"
        next_env="green"
    fi

    log "Current environment: $current_env, deploying to: $next_env"

    # Deploy to next environment
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would deploy to $next_env environment"
    else
        log "Deploying to $next_env environment..."

        # Update compose file with next environment suffix
        sed "s/optimizely-/optimizely-$next_env-/g" "$compose_file" > "docker-compose.$next_env.yml"

        # Start services in next environment
        docker-compose -f "docker-compose.$next_env.yml" up -d

        # Health check
        local api_url="http://localhost:4000"
        local web_url="http://localhost:3001"

        if [[ "$ENVIRONMENT" == "staging" ]]; then
            api_url="https://api-staging.optimizely.ai"
            web_url="https://staging.optimizely.ai"
        elif [[ "$ENVIRONMENT" == "production" ]]; then
            api_url="https://api.optimizely.ai"
            web_url="https://optimizely.ai"
        fi

        if health_check "$api_url" && health_check "$web_url"; then
            success "New environment ($next_env) is healthy"

            # Switch traffic
            log "Switching traffic to $next_env environment"
            # This would typically involve updating load balancer configuration

            # Clean up old environment
            if [[ -n "$current_env" ]]; then
                log "Cleaning up old environment: $current_env"
                docker-compose -f "docker-compose.$current_env.yml" down
                rm -f "docker-compose.$current_env.yml"
            fi

            success "Blue-green deployment completed successfully"
        else
            error "Health checks failed for new environment"

            if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
                log "Rolling back deployment..."
                docker-compose -f "docker-compose.$next_env.yml" down
                rm -f "docker-compose.$next_env.yml"
                error "Deployment rolled back"
            fi

            return 1
        fi
    fi
}

# Standard deployment
standard_deploy() {
    log "Starting standard deployment for $ENVIRONMENT"

    local compose_file="docker-compose.yml"
    if [[ "$ENVIRONMENT" != "development" ]]; then
        compose_file="docker-compose.$ENVIRONMENT.yml"
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would deploy using $compose_file"
        return 0
    fi

    # Pull latest images and restart services
    docker-compose -f "$compose_file" pull
    docker-compose -f "$compose_file" up -d

    # Health check
    local api_url="http://localhost:4000"
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        api_url="https://api-staging.optimizely.ai"
    elif [[ "$ENVIRONMENT" == "production" ]]; then
        api_url="https://api.optimizely.ai"
    fi

    if health_check "$api_url"; then
        success "Standard deployment completed successfully"
    else
        error "Health checks failed"
        return 1
    fi
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"

    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local color="good"
        if [[ "$status" == "failure" ]]; then
            color="danger"
        fi

        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\"}]}" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    # Add cleanup logic here
}

# Main deployment function
main() {
    local start_time=$(date +%s)

    log "Starting deployment to $ENVIRONMENT environment"
    log "Log file: $LOG_FILE"

    # Trap for cleanup
    trap cleanup EXIT

    # Validation
    validate_environment
    check_prerequisites
    load_environment_config

    # Confirmation for production
    if [[ "$ENVIRONMENT" == "production" && "$FORCE" != "true" ]]; then
        echo -n "Are you sure you want to deploy to PRODUCTION? (yes/no): "
        read -r confirmation
        if [[ "$confirmation" != "yes" ]]; then
            log "Deployment cancelled by user"
            exit 0
        fi
    fi

    # Build and push images
    build_and_push_images

    # Deploy
    if [[ "$BLUE_GREEN" == "true" && "$ENVIRONMENT" != "development" ]]; then
        if blue_green_deploy; then
            deployment_status="success"
        else
            deployment_status="failure"
        fi
    else
        if standard_deploy; then
            deployment_status="success"
        else
            deployment_status="failure"
        fi
    fi

    # Calculate deployment time
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Send notification
    if [[ "$deployment_status" == "success" ]]; then
        success "Deployment to $ENVIRONMENT completed successfully in ${duration}s"
        send_notification "success" "✅ Deployment to $ENVIRONMENT completed successfully in ${duration}s"
    else
        error "Deployment to $ENVIRONMENT failed after ${duration}s"
        send_notification "failure" "❌ Deployment to $ENVIRONMENT failed after ${duration}s"
        exit 1
    fi
}

# Parse arguments and run main function
parse_args "$@"
main
