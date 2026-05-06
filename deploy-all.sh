#!/bin/bash

# Script de déploiement complet pour LearnHub
# Usage: ./deploy-all.sh

set -e  # Arrêter en cas d'erreur

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🚀 Déploiement LearnHub - Pipeline DevOps            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour vérifier si un service est prêt
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=0

    log_info "Attente du démarrage de $service_name sur le port $port..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:$port > /dev/null 2>&1; then
            log_success "$service_name est prêt !"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    log_error "$service_name n'a pas démarré dans le temps imparti"
    return 1
}

# 1. Vérifications préliminaires
echo ""
log_info "Étape 1/7 : Vérifications préliminaires"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker n'est pas installé"
    exit 1
fi
log_success "Docker est installé"

# Vérifier Jenkins
if ! systemctl is-active --quiet jenkins; then
    log_warning "Jenkins n'est pas actif, tentative de démarrage..."
    sudo systemctl start jenkins
    sleep 10
fi
log_success "Jenkins est actif"

# 2. Nettoyage des anciens conteneurs
echo ""
log_info "Étape 2/7 : Nettoyage des anciens conteneurs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SERVICES=("eureka-server" "api-gateway" "user-service" "job-service" "frontend")

for service in "${SERVICES[@]}"; do
    if docker ps -a | grep -q $service; then
        log_info "Arrêt et suppression de $service..."
        docker stop $service 2>/dev/null || true
        docker rm $service 2>/dev/null || true
        log_success "$service nettoyé"
    fi
done

# 3. Vérifier les images Docker
echo ""
log_info "Étape 3/7 : Vérification des images Docker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REQUIRED_IMAGES=("eureka-server:latest" "api-gateway:latest" "user-service:latest" "job-service:latest")
MISSING_IMAGES=()

for image in "${REQUIRED_IMAGES[@]}"; do
    if docker images | grep -q "${image%:*}"; then
        log_success "Image $image trouvée"
    else
        log_warning "Image $image manquante"
        MISSING_IMAGES+=("$image")
    fi
done

if [ ${#MISSING_IMAGES[@]} -gt 0 ]; then
    log_warning "Certaines images sont manquantes. Vous devez d'abord builder les services via Jenkins."
    log_info "Images manquantes : ${MISSING_IMAGES[*]}"
    read -p "Voulez-vous continuer quand même ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 4. Démarrer Eureka Server
echo ""
log_info "Étape 4/7 : Démarrage d'Eureka Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker images | grep -q "eureka-server"; then
    docker run -d \
        --name eureka-server \
        --network host \
        -p 8761:8761 \
        eureka-server:latest
    
    wait_for_service "Eureka Server" 8761
else
    log_error "Image eureka-server non trouvée. Lancez le build Jenkins d'abord."
    exit 1
fi

# 5. Démarrer API Gateway
echo ""
log_info "Étape 5/7 : Démarrage d'API Gateway"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker images | grep -q "api-gateway"; then
    docker run -d \
        --name api-gateway \
        --network host \
        -p 8080:8080 \
        -e EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://localhost:8761/eureka/ \
        api-gateway:latest
    
    wait_for_service "API Gateway" 8080
else
    log_warning "Image api-gateway non trouvée. Continuons sans..."
fi

# 6. Démarrer les microservices
echo ""
log_info "Étape 6/7 : Démarrage des microservices"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# User Service
if docker images | grep -q "user-service"; then
    log_info "Démarrage de User Service..."
    docker run -d \
        --name user-service \
        --network host \
        -p 8081:8081 \
        -e EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://localhost:8761/eureka/ \
        user-service:latest
    
    sleep 5
    log_success "User Service démarré"
else
    log_warning "Image user-service non trouvée"
fi

# Job Service
if docker images | grep -q "job-service"; then
    log_info "Démarrage de Job Service..."
    docker run -d \
        --name job-service \
        --network host \
        -p 8082:8082 \
        -e EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://localhost:8761/eureka/ \
        job-service:latest
    
    sleep 5
    log_success "Job Service démarré"
else
    log_warning "Image job-service non trouvée"
fi

# 7. Démarrer le Frontend
echo ""
log_info "Étape 7/7 : Démarrage du Frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker images | grep -q "frontend"; then
    docker run -d \
        --name frontend \
        -p 80:80 \
        frontend:latest
    
    log_success "Frontend démarré sur le port 80"
else
    log_warning "Image frontend non trouvée. Vous devrez le builder manuellement."
fi

# Résumé final
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  📊 Résumé du déploiement                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "eureka|gateway|user|job|frontend|NAMES"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    🌐 URLs d'accès                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "  🔹 Eureka Dashboard : http://localhost:8761"
echo "  🔹 API Gateway      : http://localhost:8080"
echo "  🔹 User Service     : http://localhost:8081"
echo "  🔹 Job Service      : http://localhost:8082"
echo "  🔹 Frontend         : http://localhost"
echo ""

log_success "Déploiement terminé !"
echo ""
log_info "Pour voir les logs d'un service : docker logs <service-name>"
log_info "Pour arrêter tous les services : docker stop eureka-server api-gateway user-service job-service frontend"
echo ""
