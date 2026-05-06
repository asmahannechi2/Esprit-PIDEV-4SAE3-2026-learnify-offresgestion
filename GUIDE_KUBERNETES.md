# 🚀 Guide Complet Kubernetes - LearnHub DevOps

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Architecture Kubernetes](#architecture-kubernetes)
4. [Installation et Configuration](#installation-et-configuration)
5. [Déploiement](#déploiement)
6. [Monitoring avec Prometheus & Grafana](#monitoring)
7. [Pipeline CI/CD Jenkins](#pipeline-cicd)
8. [Vérification et Tests](#vérification)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

Ce guide vous accompagne pour déployer l'application LearnHub sur Kubernetes avec:

✅ **5 microservices** (Eureka, Gateway, User, Job, Frontend)  
✅ **2 bases MySQL** (User DB, Job DB)  
✅ **Monitoring complet** (Prometheus + Grafana)  
✅ **Pipeline CI/CD** (Jenkins → Docker Hub → Kubernetes)  
✅ **Service Discovery** (Eureka)  
✅ **Load Balancing** automatique

---

## 📦 Prérequis

### Sur la VM Jenkins

```bash
# 1. Kubernetes (K3s recommandé)
curl -sfL https://get.k3s.io | sh -

# Vérifier l'installation
sudo k3s kubectl get nodes

# Configurer kubectl pour l'utilisateur courant
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
export KUBECONFIG=~/.kube/config

# Vérifier
kubectl get nodes

# 2. Docker (déjà installé)
docker --version

# 3. Jenkins (déjà installé)
# Ajouter l'utilisateur jenkins au groupe docker
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins

# 4. Git (déjà installé)
git --version
```

### Configuration Jenkins

Dans Jenkins, installer les plugins:
- Kubernetes CLI Plugin
- Docker Pipeline Plugin

Ajouter les credentials:
- **dockerhub**: Username/Password pour Docker Hub
- **SONAR_TOKEN**: Token SonarQube (optionnel)

---

## 🏗️ Architecture Kubernetes

### Diagramme complet

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster (K3s)                          │
│                      Namespace: pidev                                │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    FRONTEND (Angular)                       │    │
│  │                  NodePort: 30080                            │    │
│  │                  Replicas: 1                                │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    API GATEWAY                              │    │
│  │                  NodePort: 30080                            │    │
│  │                  Replicas: 1                                │    │
│  └────────────────────┬───────────────────────────────────────┘    │
│                       │                                              │
│         ┌─────────────┼─────────────┐                               │
│         │             │             │                               │
│         ▼             ▼             ▼                               │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                        │
│  │   USER    │ │    JOB    │ │  EUREKA   │                        │
│  │  SERVICE  │ │  SERVICE  │ │  SERVER   │                        │
│  │ :30081    │ │ :30082    │ │ :30761    │                        │
│  └─────┬─────┘ └─────┬─────┘ └───────────┘                        │
│        │             │                                               │
│        ▼             ▼                                               │
│  ┌───────────┐ ┌───────────┐                                       │
│  │  MySQL    │ │  MySQL    │                                       │
│  │   User    │ │   Job     │                                       │
│  │  :3306    │ │  :3306    │                                       │
│  │  (PVC)    │ │  (PVC)    │                                       │
│  └───────────┘ └───────────┘                                       │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    MONITORING                               │    │
│  │                                                             │    │
│  │  ┌──────────────┐         ┌──────────────┐                │    │
│  │  │  Prometheus  │────────▶│   Grafana    │                │    │
│  │  │   :30090     │         │   :30300     │                │    │
│  │  │   (PVC)      │         │   (PVC)      │                │    │
│  │  └──────────────┘         └──────────────┘                │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Composants Kubernetes

| Composant | Type | Port | Description |
|-----------|------|------|-------------|
| **eureka-server** | Deployment + Service | 30761 | Service Discovery |
| **api-gateway** | Deployment + Service | 30080 | Point d'entrée API |
| **user-service** | Deployment + Service | 30081 | Gestion utilisateurs |
| **job-service** | Deployment + Service | 30082 | Gestion offres d'emploi |
| **frontend** | Deployment + Service | 30080 | Interface Angular |
| **mysql-user** | Deployment + Service + PVC | 3306 | Base de données User |
| **mysql-job** | Deployment + Service + PVC | 3306 | Base de données Job |
| **prometheus** | Deployment + Service + PVC | 30090 | Collecte de métriques |
| **grafana** | Deployment + Service + PVC | 30300 | Visualisation |

---

## 🚀 Installation et Configuration

### Étape 1: Cloner le projet

```bash
cd ~
git clone https://github.com/asmahannechi2/Esprit-PIDEV-4SAE3-2026-learnify-offresgestion.git
cd Esprit-PIDEV-4SAE3-2026-learnify-offresgestion
```

### Étape 2: Vérifier les manifestes Kubernetes

```bash
# Voir la structure
ls -la kubernetes/

# Contenu:
# - namespace.yaml
# - secrets.yaml
# - eureka-server.yaml
# - api-gateway.yaml
# - user-service.yaml
# - job-service.yaml
# - frontend.yaml
# - monitoring/
#   ├── prometheus-config.yaml
#   ├── prometheus.yaml
#   └── grafana.yaml
```

### Étape 3: Configurer les secrets (optionnel)

Par défaut, les credentials MySQL sont:
- Root password: `rootpassword`
- User: `learnhub`
- Password: `learnhub123`

Pour changer:

```bash
# Éditer le fichier
nano kubernetes/secrets.yaml

# Modifier les valeurs (en clair, Kubernetes les encodera)
```

---

## 🎬 Déploiement

### Option A: Déploiement automatique (Recommandé)

```bash
# Rendre le script exécutable
chmod +x kubernetes/deploy-all.sh

# Lancer le déploiement
./kubernetes/deploy-all.sh
```

Le script va:
1. Créer le namespace `pidev`
2. Créer les secrets MySQL
3. Déployer Eureka Server
4. Déployer API Gateway
5. Déployer User Service + MySQL
6. Déployer Job Service + MySQL
7. Déployer Frontend
8. Déployer Prometheus
9. Déployer Grafana
10. Afficher les URLs d'accès

### Option B: Déploiement manuel

```bash
# 1. Namespace
kubectl apply -f kubernetes/namespace.yaml

# 2. Secrets
kubectl apply -f kubernetes/secrets.yaml

# 3. Eureka Server (attendre 60s)
kubectl apply -f kubernetes/eureka-server.yaml
kubectl wait --for=condition=ready pod -l app=eureka-server -n pidev --timeout=300s

# 4. API Gateway (attendre 30s)
kubectl apply -f kubernetes/api-gateway.yaml
sleep 30

# 5. User Service (attendre 30s)
kubectl apply -f kubernetes/user-service.yaml
sleep 30

# 6. Job Service (attendre 30s)
kubectl apply -f kubernetes/job-service.yaml
sleep 30

# 7. Frontend (attendre 20s)
kubectl apply -f kubernetes/frontend.yaml
sleep 20

# 8. Prometheus
kubectl apply -f kubernetes/monitoring/prometheus-config.yaml
kubectl apply -f kubernetes/monitoring/prometheus.yaml
sleep 20

# 9. Grafana
kubectl apply -f kubernetes/monitoring/grafana.yaml
```

---

## 📊 Monitoring avec Prometheus & Grafana

### Configuration Prometheus

Prometheus est configuré pour scraper les métriques de:
- Eureka Server (`/actuator/prometheus`)
- API Gateway (`/actuator/prometheus`)
- User Service (`/actuator/prometheus`)
- Job Service (`/actuator/prometheus`)

### Accès Prometheus

```bash
# Obtenir l'IP du node
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

# Accéder à Prometheus
echo "http://${NODE_IP}:30090"
```

Dans Prometheus:
1. Aller dans **Status → Targets**
2. Vérifier que tous les services sont **UP**

### Accès Grafana

```bash
# URL Grafana
echo "http://${NODE_IP}:30300"
```

**Credentials**:
- Username: `admin`
- Password: `admin123`

### Importer des dashboards Grafana

1. Cliquer sur **+ → Import**
2. Importer ces dashboards:
   - **4701**: JVM (Micrometer)
   - **11378**: Spring Boot Statistics
   - **6756**: Spring Boot
   - **12900**: Spring Boot Observability

3. Sélectionner la datasource **Prometheus**

---

## 🔄 Pipeline CI/CD Jenkins

### Architecture du pipeline

```
┌──────────────┐
│  Developer   │
│  git push    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                    JENKINS PIPELINE                       │
│                                                           │
│  1. Checkout code from GitHub                            │
│  2. Run tests (Maven/npm)                                │
│  3. Build artifact (JAR/Angular build)                   │
│  4. Build Docker image                                   │
│  5. Push to Docker Hub (wiwi2003/*)                      │
│  6. Deploy to Kubernetes (kubectl apply)                 │
│  7. Wait for rollout (kubectl rollout status)           │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│              KUBERNETES CLUSTER                           │
│                                                           │
│  • Pull latest image from Docker Hub                     │
│  • Rolling update (zero downtime)                        │
│  • Health checks (liveness/readiness)                    │
│  • Service discovery via Eureka                          │
└───────────────────────────────────────────────────────────┘
```

### Ordre d'exécution des builds

**IMPORTANT**: Respecter cet ordre:

```
1. eureka-server     (Service Discovery)
   ⏳ Attendre 2-3 minutes
   
2. api-gateway       (API Gateway)
   ⏳ Attendre 2 minutes
   
3. user-service      (Microservice)
   ET
   job-service       (Microservice)
   ⏳ Attendre 2 minutes
   
4. frontend          (Interface)
```

### Lancer les builds

1. **Ouvrir Jenkins**: `http://VM_IP:8080`

2. **Build Eureka Server**:
   - Job: `eureka-server`
   - Cliquer sur **Build Now**
   - Attendre **SUCCESS** (3-4 min)

3. **Build API Gateway**:
   - Job: `api-gateway`
   - Cliquer sur **Build Now**
   - Attendre **SUCCESS** (3-4 min)

4. **Build User Service**:
   - Job: `user-service`
   - Cliquer sur **Build Now**
   - Attendre **SUCCESS** (4-5 min)

5. **Build Job Service**:
   - Job: `job-service`
   - Cliquer sur **Build Now**
   - Attendre **SUCCESS** (4-5 min)

6. **Build Frontend**:
   - Job: `frontend`
   - Cliquer sur **Build Now**
   - Attendre **SUCCESS** (5-6 min)

---

## ✅ Vérification et Tests

### Vérifier les pods

```bash
# Voir tous les pods
kubectl get pods -n pidev

# Résultat attendu:
# NAME                            READY   STATUS    RESTARTS   AGE
# eureka-server-xxx               1/1     Running   0          5m
# api-gateway-xxx                 1/1     Running   0          4m
# user-service-xxx                1/1     Running   0          3m
# job-service-xxx                 1/1     Running   0          3m
# frontend-xxx                    1/1     Running   0          2m
# mysql-user-xxx                  1/1     Running   0          3m
# mysql-job-xxx                   1/1     Running   0          3m
# prometheus-xxx                  1/1     Running   0          2m
# grafana-xxx                     1/1     Running   0          2m
```

### Vérifier les services

```bash
kubectl get services -n pidev

# Résultat attendu:
# NAME            TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
# eureka-server   NodePort   10.43.x.x       <none>        8761:30761/TCP   5m
# api-gateway     NodePort   10.43.x.x       <none>        8080:30080/TCP   4m
# user-service    NodePort   10.43.x.x       <none>        8081:30081/TCP   3m
# job-service     NodePort   10.43.x.x       <none>        8082:30082/TCP   3m
# frontend        NodePort   10.43.x.x       <none>        80:30080/TCP     2m
# prometheus      NodePort   10.43.x.x       <none>        9090:30090/TCP   2m
# grafana         NodePort   10.43.x.x       <none>        3000:30300/TCP   2m
```

### Tester les endpoints

```bash
# Obtenir l'IP du node
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

# Tester Eureka
curl http://${NODE_IP}:30761/actuator/health

# Tester API Gateway
curl http://${NODE_IP}:30080/actuator/health

# Tester User Service
curl http://${NODE_IP}:30081/actuator/health

# Tester Job Service
curl http://${NODE_IP}:30082/actuator/health

# Tester Frontend
curl http://${NODE_IP}:30080
```

### Vérifier Eureka Dashboard

```bash
# Ouvrir dans le navigateur
echo "http://${NODE_IP}:30761"
```

Vous devriez voir 3 services enregistrés:
- **API-GATEWAY**
- **USER-SERVICE**
- **JOB-SERVICE**

### Accéder à l'application

```bash
# Frontend
echo "http://${NODE_IP}:30080"
```

---

## 🐛 Troubleshooting

### Problème: Pod en CrashLoopBackOff

```bash
# Voir les logs
kubectl logs <pod-name> -n pidev

# Voir les événements
kubectl describe pod <pod-name> -n pidev

# Solutions courantes:
# 1. Problème de connexion MySQL → Vérifier que MySQL est démarré
# 2. Problème Eureka → Vérifier qu'Eureka est accessible
# 3. Image non trouvée → Vérifier Docker Hub
```

### Problème: Service ne s'enregistre pas dans Eureka

```bash
# Vérifier les logs du service
kubectl logs -f <service-pod> -n pidev | grep -i eureka

# Vérifier la variable d'environnement
kubectl exec <service-pod> -n pidev -- env | grep EUREKA

# Redémarrer le service
kubectl rollout restart deployment/<service-name> -n pidev
```

### Problème: Impossible d'accéder aux services

```bash
# Vérifier que K3s autorise les NodePorts
sudo iptables -L -n | grep 30080

# Vérifier le firewall
sudo ufw status
sudo ufw allow 30080/tcp
sudo ufw allow 30761/tcp
sudo ufw allow 30081/tcp
sudo ufw allow 30082/tcp
sudo ufw allow 30090/tcp
sudo ufw allow 30300/tcp
```

### Problème: MySQL ne démarre pas

```bash
# Vérifier les PVC
kubectl get pvc -n pidev

# Vérifier les logs MySQL
kubectl logs mysql-user-xxx -n pidev

# Supprimer et recréer
kubectl delete -f kubernetes/user-service.yaml
kubectl apply -f kubernetes/user-service.yaml
```

### Voir les logs en temps réel

```bash
# Logs d'un pod
kubectl logs -f <pod-name> -n pidev

# Logs de tous les pods d'un déploiement
kubectl logs -f deployment/user-service -n pidev

# Logs des 100 dernières lignes
kubectl logs --tail=100 <pod-name> -n pidev
```

### Redémarrer un service

```bash
# Rolling restart (zero downtime)
kubectl rollout restart deployment/user-service -n pidev

# Vérifier le statut
kubectl rollout status deployment/user-service -n pidev
```

### Mettre à jour une image

```bash
# Après avoir push une nouvelle image sur Docker Hub
kubectl set image deployment/user-service user-service=wiwi2003/user-service:latest -n pidev

# Ou forcer le pull
kubectl rollout restart deployment/user-service -n pidev
```

### Supprimer et redéployer

```bash
# Supprimer un service
kubectl delete -f kubernetes/user-service.yaml

# Attendre 10 secondes
sleep 10

# Redéployer
kubectl apply -f kubernetes/user-service.yaml
```

### Nettoyage complet

```bash
# Supprimer tout le namespace (ATTENTION: supprime tout!)
kubectl delete namespace pidev

# Redéployer
./kubernetes/deploy-all.sh
```

---

## 📝 Checklist de succès

- [ ] K3s installé et fonctionnel
- [ ] Tous les manifestes Kubernetes créés
- [ ] Namespace `pidev` créé
- [ ] Secrets MySQL créés
- [ ] Tous les pods en état **Running**
- [ ] Tous les services accessibles via NodePort
- [ ] Eureka Dashboard accessible
- [ ] 3 services enregistrés dans Eureka
- [ ] Frontend accessible
- [ ] Prometheus collecte les métriques
- [ ] Grafana accessible avec dashboards
- [ ] Pipeline Jenkins déploie sur Kubernetes
- [ ] Rolling updates fonctionnent

---

## 🎯 Commandes utiles

```bash
# Voir tout dans le namespace
kubectl get all -n pidev

# Voir les événements
kubectl get events -n pidev --sort-by='.lastTimestamp'

# Voir l'utilisation des ressources
kubectl top pods -n pidev
kubectl top nodes

# Accéder à un pod
kubectl exec -it <pod-name> -n pidev -- /bin/bash

# Port-forward (pour debug)
kubectl port-forward svc/eureka-server 8761:8761 -n pidev

# Voir la configuration d'un service
kubectl get svc user-service -n pidev -o yaml

# Voir les labels
kubectl get pods -n pidev --show-labels

# Filtrer par label
kubectl get pods -l app=user-service -n pidev
```

---

## 🚀 Prochaines étapes

1. ✅ **Déploiement Kubernetes** → Fait
2. ✅ **Monitoring Prometheus/Grafana** → Fait
3. ✅ **Pipeline CI/CD** → Fait
4. 🔄 **Améliorer la sécurité**:
   - Utiliser des Secrets chiffrés
   - Configurer NetworkPolicies
   - Activer RBAC
5. 🔄 **Ajouter un Ingress**:
   - Installer Nginx Ingress Controller
   - Configurer des routes
   - Ajouter TLS/SSL
6. 🔄 **Améliorer la scalabilité**:
   - Horizontal Pod Autoscaler
   - Cluster Autoscaler
7. 🔄 **Ajouter des tests**:
   - Tests d'intégration
   - Tests de charge

---

**Votre infrastructure Kubernetes est maintenant complète !** 🎉

Vous avez:
- ✅ Pipeline CI/CD complet
- ✅ Déploiement automatisé sur Kubernetes
- ✅ Monitoring avec Prometheus & Grafana
- ✅ Service Discovery avec Eureka
- ✅ Load Balancing automatique
- ✅ Rolling updates sans downtime

**Bon travail !** 🚀
