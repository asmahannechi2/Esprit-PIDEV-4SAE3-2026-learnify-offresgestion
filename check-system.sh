#!/bin/bash

# Script de vérification du système LearnHub
# Usage: ./check-system.sh

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        🔍 Vérification du système LearnHub               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Vérifier Docker
echo "━━━ Docker ━━━"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker installé${NC}"
    docker --version
else
    echo -e "${RED}❌ Docker non installé${NC}"
fi
echo ""

# 2. Vérifier Jenkins
echo "━━━ Jenkins ━━━"
if systemctl is-active --quiet jenkins; then
    echo -e "${GREEN}✅ Jenkins actif${NC}"
    systemctl status jenkins --no-pager | head -3
else
    echo -e "${RED}❌ Jenkins inactif${NC}"
fi
echo ""

# 3. Vérifier les conteneurs Docker
echo "━━━ Conteneurs Docker ━━━"
SERVICES=("eureka-server" "api-gateway" "user-service" "job-service" "frontend")
RUNNING=0
STOPPED=0
MISSING=0

for service in "${SERVICES[@]}"; do
    if docker ps | grep -q $service; then
        echo -e "${GREEN}✅ $service : Running${NC}"
        RUNNING=$((RUNNING + 1))
    elif docker ps -a | grep -q $service; then
        echo -e "${YELLOW}⚠️  $service : Stopped${NC}"
        STOPPED=$((STOPPED + 1))
    else
        echo -e "${RED}❌ $service : Not found${NC}"
        MISSING=$((MISSING + 1))
    fi
done
echo ""
echo "Résumé : $RUNNING running, $STOPPED stopped, $MISSING missing"
echo ""

# 4. Vérifier les ports
echo "━━━ Ports réseau ━━━"
PORTS=(8761 8080 8081 8082 80)
PORT_NAMES=("Eureka" "Gateway" "User-Service" "Job-Service" "Frontend")

for i in "${!PORTS[@]}"; do
    PORT=${PORTS[$i]}
    NAME=${PORT_NAMES[$i]}
    
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Port $PORT ($NAME) : Utilisé${NC}"
    else
        echo -e "${RED}❌ Port $PORT ($NAME) : Libre${NC}"
    fi
done
echo ""

# 5. Tester les endpoints
echo "━━━ Endpoints HTTP ━━━"

# Eureka
if curl -s http://localhost:8761 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Eureka Dashboard accessible${NC}"
else
    echo -e "${RED}❌ Eureka Dashboard inaccessible${NC}"
fi

# API Gateway
if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway accessible${NC}"
else
    echo -e "${RED}❌ API Gateway inaccessible${NC}"
fi

# Frontend
if curl -s http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend accessible${NC}"
else
    echo -e "${RED}❌ Frontend inaccessible${NC}"
fi
echo ""

# 6. Vérifier les images Docker
echo "━━━ Images Docker ━━━"
REQUIRED_IMAGES=("eureka-server" "api-gateway" "user-service" "job-service")

for image in "${REQUIRED_IMAGES[@]}"; do
    if docker images | grep -q "$image"; then
        SIZE=$(docker images --format "{{.Size}}" $image:latest 2>/dev/null | head -1)
        echo -e "${GREEN}✅ $image : $SIZE${NC}"
    else
        echo -e "${RED}❌ $image : Non trouvée${NC}"
    fi
done
echo ""

# 7. Vérifier la mémoire et le disque
echo "━━━ Ressources système ━━━"
echo "Mémoire :"
free -h | grep -E "Mem|Swap"
echo ""
echo "Disque :"
df -h / | grep -v Filesystem
echo ""

# 8. Vérifier les services enregistrés dans Eureka
echo "━━━ Services enregistrés dans Eureka ━━━"
if curl -s http://localhost:8761/eureka/apps > /dev/null 2>&1; then
    REGISTERED=$(curl -s http://localhost:8761/eureka/apps | grep -o "<name>[^<]*</name>" | sed 's/<[^>]*>//g' | sort -u)
    if [ -n "$REGISTERED" ]; then
        echo "$REGISTERED" | while read -r line; do
            echo -e "${GREEN}✅ $line${NC}"
        done
    else
        echo -e "${YELLOW}⚠️  Aucun service enregistré${NC}"
    fi
else
    echo -e "${RED}❌ Impossible de contacter Eureka${NC}"
fi
echo ""

# 9. Logs récents (dernières erreurs)
echo "━━━ Dernières erreurs dans les logs ━━━"
for service in "${SERVICES[@]}"; do
    if docker ps | grep -q $service; then
        ERRORS=$(docker logs $service 2>&1 | grep -i "error" | tail -2)
        if [ -n "$ERRORS" ]; then
            echo -e "${YELLOW}⚠️  $service :${NC}"
            echo "$ERRORS"
            echo ""
        fi
    fi
done

# Résumé final
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                      📊 Résumé                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ $RUNNING -eq 5 ]; then
    echo -e "${GREEN}✅ Tous les services sont opérationnels !${NC}"
elif [ $RUNNING -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Système partiellement opérationnel ($RUNNING/5 services)${NC}"
else
    echo -e "${RED}❌ Aucun service n'est démarré${NC}"
fi
echo ""

# Suggestions
if [ $MISSING -gt 0 ]; then
    echo -e "${BLUE}💡 Suggestion : Lancez les builds Jenkins pour créer les images manquantes${NC}"
fi

if [ $STOPPED -gt 0 ]; then
    echo -e "${BLUE}💡 Suggestion : Démarrez les services arrêtés avec ./deploy-all.sh${NC}"
fi

echo ""
