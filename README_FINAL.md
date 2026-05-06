# 🚀 LearnHub - Projet DevOps Complet avec Kubernetes

## 📌 Vue d'ensemble

Projet DevOps complet pour **Sprint 3 - PIDEV 4SAE3** à Esprit avec:

✅ **Pipeline CI/CD Jenkins** (Build → Test → Docker → Kubernetes)  
✅ **Déploiement Kubernetes** (K3s)  
✅ **Monitoring** (Prometheus + Grafana)  
✅ **Service Discovery** (Eureka)  
✅ **Microservices** (User, Job, Gateway, Eureka, Frontend)  
✅ **Bases de données** (MySQL avec Persistent Volumes)  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DÉVELOPPEUR                                   │
│                   git push → GitHub                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    JENKINS CI/CD                                 │
│  1. Checkout  2. Test  3. Build  4. Docker  5. Push  6. Deploy │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER HUB                                    │
│  wiwi2003/eureka-server, api-gateway, user-service, etc.       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              KUBERNETES CLUSTER (K3s)                            │
│                  Namespace: pidev                                │
│                                                                  │
│  Frontend (Angular) → API Gateway → Microservices               │
│                                      ├─ User Service + MySQL    │
│                                      ├─ Job Service + MySQL     │
│                                      └─ Eureka Server           │
│                                                                  │
│  Monitoring: Prometheus + Grafana                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Services déployés

| Service | Port | NodePort | Description |
|---------|------|----------|-------------|
| **Frontend** | 80 | 30080 | Interface Angular |
| **API Gateway** | 8080 | 30080 | Point d'entrée API |
| **Eureka Server** | 8761 | 30761 | Service Discovery |
| **User Service** | 8081 | 30081 | Gestion utilisateurs |
| **Job Service** | 8082 | 30082 | Gestion offres d'emploi |
| **MySQL User** | 3306 | - | Base de données User |
| **MySQL Job** | 3306 | - | Base de données Job |
| **Prometheus** | 9090 | 30090 | Collecte métriques |
| **Grafana** | 3000 | 30300 | Visualisation |

---

## 🚀 Démarrage rapide (3 étapes)

### 1️⃣ Installer K3s (5 min)

```bash
# Sur la VM Jenkins
curl -sfL https://get.k3s.io | sh -
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc
```

### 2️⃣ Configurer Jenkins (2 min)

```bash
sudo usermod -aG docker jenkins
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo systemctl restart jenkins
```

### 3️⃣ Déployer (20 min)

```bash
# Push le code
git add .
git commit -m "feat: Kubernetes deployment"
git push origin main

# Dans Jenkins (http://VM_IP:8080), lancer les builds:
# 1. eureka-server
# 2. api-gateway
# 3. user-service
# 4. job-service
# 5. frontend
```

---

## 📚 Documentation

### 🎯 Pour commencer

| Document | Description |
|----------|-------------|
| **START_HERE_KUBERNETES.md** | 🚀 Point de départ - 3 étapes rapides |
| **ETAPES_MAINTENANT_KUBERNETES.md** | 📝 Étapes détaillées à suivre maintenant |
| **RESUME_KUBERNETES.txt** | 📊 Résumé visuel de l'architecture |

### 📖 Guides complets

| Document | Description |
|----------|-------------|
| **GUIDE_KUBERNETES.md** | 📘 Guide complet Kubernetes (50+ pages) |
| **kubernetes/README.md** | 📄 Documentation des manifestes K8s |
| **ARCHITECTURE.md** | 🏗️ Architecture technique détaillée |

### 🔧 Références

| Document | Description |
|----------|-------------|
| **COMMANDES_KUBERNETES.txt** | 💻 Toutes les commandes kubectl utiles |
| **FICHIERS_KUBERNETES.md** | 📁 Liste des fichiers créés |

---

## 🌐 Accès aux services

```bash
# Obtenir l'IP du node
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
```

### URLs

- **Application**: http://NODE_IP:30080
- **Eureka Dashboard**: http://NODE_IP:30761
- **Prometheus**: http://NODE_IP:30090
- **Grafana**: http://NODE_IP:30300 (admin/admin123)

---

## 📊 Pipeline CI/CD

### Flux complet

```
Code → GitHub → Jenkins:
                 ├─ Checkout
                 ├─ Tests (Maven/npm)
                 ├─ Build (JAR/Angular)
                 ├─ Docker Build
                 ├─ Push to Docker Hub
                 └─ Deploy to Kubernetes
                    ├─ kubectl apply
                    └─ kubectl rollout status
```

### Jenkinsfiles

Tous les Jenkinsfiles ont été mis à jour avec le stage:

```groovy
stage('Deploy to Kubernetes') {
    steps {
        script {
            sh "kubectl apply -f kubernetes/<service>.yaml"
            sh "kubectl rollout status deployment/<service> -n pidev"
        }
    }
}
```

---

## 🔍 Vérification

### Commandes essentielles

```bash
# Voir tous les pods
kubectl get pods -n pidev

# Voir tous les services
kubectl get services -n pidev

# Voir les logs
kubectl logs -f deployment/user-service -n pidev

# Vérifier la santé
curl http://${NODE_IP}:30761/actuator/health
```

### Checklist

- [ ] K3s installé (`kubectl get nodes`)
- [ ] Jenkins configuré pour kubectl
- [ ] Code pushé sur GitHub
- [ ] 5 builds Jenkins SUCCESS
- [ ] Tous les pods Running
- [ ] Eureka Dashboard accessible
- [ ] 3 services enregistrés dans Eureka
- [ ] Frontend accessible
- [ ] Prometheus collecte les métriques
- [ ] Grafana accessible

---

## 📁 Structure du projet

```
.
├── kubernetes/                    # Manifestes Kubernetes
│   ├── namespace.yaml
│   ├── secrets.yaml
│   ├── eureka-server.yaml
│   ├── api-gateway.yaml
│   ├── user-service.yaml
│   ├── job-service.yaml
│   ├── frontend.yaml
│   ├── monitoring/
│   │   ├── prometheus-config.yaml
│   │   ├── prometheus.yaml
│   │   └── grafana.yaml
│   ├── deploy-all.sh
│   └── README.md
│
├── integrated/
│   ├── eureka-server/
│   │   ├── Jenkinsfile           # ✏️ Modifié
│   │   └── ...
│   ├── api-gateway/
│   │   ├── Jenkinsfile           # ✏️ Modifié
│   │   └── ...
│   ├── user-service/
│   │   ├── Jenkinsfile           # ✏️ Modifié
│   │   └── ...
│   └── job-service/
│       ├── Jenkinsfile           # ✏️ Modifié
│       └── ...
│
├── frontend/
│   ├── Jenkinsfile               # ✏️ Modifié
│   └── ...
│
└── Documentation/
    ├── START_HERE_KUBERNETES.md
    ├── GUIDE_KUBERNETES.md
    ├── ETAPES_MAINTENANT_KUBERNETES.md
    ├── RESUME_KUBERNETES.txt
    ├── COMMANDES_KUBERNETES.txt
    ├── FICHIERS_KUBERNETES.md
    └── README_FINAL.md           # Ce fichier
```

---

## 🛠️ Technologies utilisées

### Backend
- **Spring Boot** 3.2.0
- **Spring Cloud** (Eureka, Gateway)
- **Java** 17
- **MySQL** 8.0

### Frontend
- **Angular** 19
- **TypeScript**
- **Nginx**

### DevOps
- **Jenkins** (CI/CD)
- **Docker** (Containerization)
- **Kubernetes** (K3s - Orchestration)
- **Prometheus** (Monitoring)
- **Grafana** (Visualization)

---

## 🎯 Fonctionnalités DevOps

### ✅ CI/CD
- Build automatique sur push GitHub
- Tests automatiques (Maven, npm)
- Build Docker images
- Push vers Docker Hub
- Déploiement automatique sur Kubernetes

### ✅ Kubernetes
- Namespace isolation (`pidev`)
- Deployments avec replicas
- Services (ClusterIP, NodePort)
- Persistent Volumes pour MySQL
- Secrets management
- Health checks (liveness/readiness)
- Rolling updates

### ✅ Monitoring
- Prometheus scrape Spring Boot metrics
- Grafana dashboards pré-configurés
- Métriques JVM, HTTP, custom
- Alerting (configurable)

### ✅ Service Discovery
- Eureka Server
- Auto-registration des services
- Load balancing automatique
- Health monitoring

---

## 🐛 Troubleshooting

### Pod en CrashLoopBackOff

```bash
kubectl logs <pod-name> -n pidev
kubectl describe pod <pod-name> -n pidev
```

### Service non accessible

```bash
# Ouvrir les ports
sudo ufw allow 30080/tcp
sudo ufw allow 30761/tcp
sudo ufw allow 30081/tcp
sudo ufw allow 30082/tcp
sudo ufw allow 30090/tcp
sudo ufw allow 30300/tcp
```

### Jenkins ne peut pas déployer

```bash
sudo usermod -aG docker jenkins
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo systemctl restart jenkins
```

---

## 📈 Améliorations futures

- [ ] Ingress Controller (Nginx)
- [ ] TLS/SSL avec Let's Encrypt
- [ ] Horizontal Pod Autoscaler
- [ ] NetworkPolicies
- [ ] RBAC avancé
- [ ] Helm Charts
- [ ] GitOps avec ArgoCD
- [ ] Service Mesh (Istio)

---

## 👥 Équipe

- **Projet**: LearnHub
- **Sprint**: Sprint 3 - DevOps
- **Cours**: PIDEV 4SAE3
- **École**: Esprit
- **Année**: 2026

---

## 📞 Support

### Documentation
- Lire `START_HERE_KUBERNETES.md` pour commencer
- Consulter `GUIDE_KUBERNETES.md` pour les détails
- Utiliser `COMMANDES_KUBERNETES.txt` comme référence

### Commandes utiles
```bash
# Voir tout
kubectl get all -n pidev

# Logs
kubectl logs -f deployment/<service> -n pidev

# Redémarrer
kubectl rollout restart deployment/<service> -n pidev

# Supprimer tout
kubectl delete namespace pidev
```

---

## ✅ Résultat final

Après avoir suivi ce guide, vous aurez:

✅ **Pipeline CI/CD complet** (GitHub → Jenkins → Docker Hub → Kubernetes)  
✅ **Application déployée sur Kubernetes** avec 5 microservices  
✅ **Monitoring complet** avec Prometheus + Grafana  
✅ **Service Discovery** avec Eureka  
✅ **Bases de données persistantes** avec PVC  
✅ **Rolling updates** sans downtime  
✅ **Health checks** automatiques  
✅ **Load balancing** automatique  

---

## 🎉 Félicitations !

Votre projet DevOps Sprint 3 est maintenant **complet** et **prêt pour la production** !

**Bon courage pour votre présentation !** 🚀

---

**Documentation créée le**: 2026  
**Dernière mise à jour**: Déploiement Kubernetes avec monitoring  
**Version**: 2.0 - Kubernetes Edition
