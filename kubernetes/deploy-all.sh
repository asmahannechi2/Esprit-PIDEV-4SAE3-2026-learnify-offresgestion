#!/bin/bash

# Script de déploiement complet sur Kubernetes
# Usage: ./deploy-all.sh

set -e

echo "🚀 Déploiement complet de LearnHub sur Kubernetes"
echo "=================================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Créer le namespace
echo -e "\n${BLUE}📦 Étape 1: Création du namespace 'pidev'${NC}"
kubectl apply -f kubernetes/namespace.yaml
sleep 2

# 2. Créer les secrets
echo -e "\n${BLUE}🔐 Étape 2: Création des secrets MySQL${NC}"
kubectl apply -f kubernetes/secrets.yaml
sleep 2

# 3. Déployer Eureka Server
echo -e "\n${BLUE}🔵 Étape 3: Déploiement d'Eureka Server${NC}"
kubectl apply -f kubernetes/eureka-server.yaml
echo "⏳ Attente du démarrage d'Eureka Server (60 secondes)..."
sleep 60

# Vérifier qu'Eureka est prêt
kubectl wait --for=condition=ready pod -l app=eureka-server -n pidev --timeout=300s

# 4. Déployer API Gateway
echo -e "\n${BLUE}🟢 Étape 4: Déploiement de l'API Gateway${NC}"
kubectl apply -f kubernetes/api-gateway.yaml
echo "⏳ Attente du démarrage de l'API Gateway (30 secondes)..."
sleep 30

# 5. Déployer User Service avec MySQL
echo -e "\n${BLUE}🟡 Étape 5: Déploiement de User Service + MySQL${NC}"
kubectl apply -f kubernetes/user-service.yaml
echo "⏳ Attente du démarrage de MySQL User (30 secondes)..."
sleep 30

# 6. Déployer Job Service avec MySQL
echo -e "\n${BLUE}🟠 Étape 6: Déploiement de Job Service + MySQL${NC}"
kubectl apply -f kubernetes/job-service.yaml
echo "⏳ Attente du démarrage de MySQL Job (30 secondes)..."
sleep 30

# 7. Déployer Frontend
echo -e "\n${BLUE}🔴 Étape 7: Déploiement du Frontend${NC}"
kubectl apply -f kubernetes/frontend.yaml
echo "⏳ Attente du démarrage du Frontend (20 secondes)..."
sleep 20

# 8. Déployer Prometheus
echo -e "\n${BLUE}📊 Étape 8: Déploiement de Prometheus${NC}"
kubectl apply -f kubernetes/monitoring/prometheus-config.yaml
kubectl apply -f kubernetes/monitoring/prometheus.yaml
echo "⏳ Attente du démarrage de Prometheus (20 secondes)..."
sleep 20

# 9. Déployer Grafana
echo -e "\n${BLUE}📈 Étape 9: Déploiement de Grafana${NC}"
kubectl apply -f kubernetes/monitoring/grafana.yaml
echo "⏳ Attente du démarrage de Grafana (20 secondes)..."
sleep 20

# 10. Afficher l'état des déploiements
echo -e "\n${GREEN}✅ Déploiement terminé !${NC}"
echo -e "\n${YELLOW}📊 État des pods:${NC}"
kubectl get pods -n pidev

echo -e "\n${YELLOW}🌐 Services disponibles:${NC}"
kubectl get services -n pidev

# Récupérer l'IP du node
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

echo -e "\n${GREEN}🎉 Application déployée avec succès !${NC}"
echo -e "\n${YELLOW}📍 URLs d'accès:${NC}"
echo "  • Frontend:        http://${NODE_IP}:30080"
echo "  • API Gateway:     http://${NODE_IP}:30080"
echo "  • Eureka Server:   http://${NODE_IP}:30761"
echo "  • User Service:    http://${NODE_IP}:30081"
echo "  • Job Service:     http://${NODE_IP}:30082"
echo "  • Prometheus:      http://${NODE_IP}:30090"
echo "  • Grafana:         http://${NODE_IP}:30300 (admin/admin123)"

echo -e "\n${BLUE}💡 Commandes utiles:${NC}"
echo "  • Voir les pods:        kubectl get pods -n pidev"
echo "  • Voir les services:    kubectl get services -n pidev"
echo "  • Voir les logs:        kubectl logs -f <pod-name> -n pidev"
echo "  • Supprimer tout:       kubectl delete namespace pidev"
