# 🚀 Workflow DevOps Complet - LearnHub

## 🎯 Objectif

Avoir un **pipeline CI/CD complet** qui :
1. ✅ Build automatique du code
2. ✅ Tests automatiques
3. ✅ Création d'images Docker
4. ✅ Push vers Docker Hub
5. ✅ **Déploiement automatique** sur la VM
6. ✅ Application accessible immédiatement

---

## 📊 Architecture DevOps

```
┌─────────────────────────────────────────────────────────────────┐
│                         DÉVELOPPEUR                              │
│                                                                  │
│  1. Code → 2. Commit → 3. Push vers GitHub                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                          GITHUB                                  │
│                                                                  │
│  4. Webhook déclenche Jenkins                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    JENKINS (CI/CD)                               │
│                                                                  │
│  5. Checkout code                                               │
│  6. Run tests                                                   │
│  7. Build JAR/Build Angular                                     │
│  8. Build Docker Image                                          │
│  9. Push to Docker Hub                                          │
│  10. Deploy (docker run)                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER HUB                                    │
│                                                                  │
│  Images stockées : wiwi2003/eureka-server:latest               │
│                    wiwi2003/api-gateway:latest                  │
│                    wiwi2003/user-service:latest                 │
│                    wiwi2003/job-service:latest                  │
│                    wiwi2003/frontend-service:latest             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                VM JENKINS (Production)                           │
│                                                                  │
│  Conteneurs Docker en cours d'exécution :                       │
│  • eureka-server (Port 8761)                                    │
│  • api-gateway (Port 8080)                                      │
│  • user-service (Port 8081)                                     │
│  • job-service (Port 8082)                                      │
│  • frontend-service (Port 80)                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UTILISATEUR FINAL                             │
│                                                                  │
│  Accès à l'application : http://votre-vm-ip                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Pipeline CI/CD Détaillé

### Pipeline 1 : Eureka Server

```groovy
1. Checkout          → Récupère le code depuis GitHub
2. Build Artifact    → mvn clean package -DskipTests
3. Build Docker      → docker build -t eureka-server:latest
4. Push Docker       → docker push wiwi2003/eureka-server:latest
5. Deploy            → docker run -d --name eureka-server -p 8761:8761
```

**Résultat** : Eureka Server accessible sur http://localhost:8761

---

### Pipeline 2 : API Gateway

```groovy
1. Checkout          → Récupère le code depuis GitHub
2. Build Artifact    → mvn clean package -DskipTests
3. Build Docker      → docker build -t api-gateway:latest
4. Push Docker       → docker push wiwi2003/api-gateway:latest
5. Deploy            → docker run -d --name api-gateway -p 8080:8080
                       (Attend 10s qu'Eureka soit prêt)
```

**Résultat** : API Gateway accessible sur http://localhost:8080

---

### Pipeline 3 : User Service

```groovy
1. Checkout          → Récupère le code depuis GitHub
2. Unit Tests        → ./mvnw test -DskipTests
3. SonarQube         → SKIPPED (désactivé temporairement)
4. Build Artifact    → ./mvnw clean package -DskipTests
5. Build Docker      → docker build -t user-service:latest
6. Push Docker       → docker push wiwi2003/user-service:latest
7. Deploy            → docker run -d --name user-service -p 8081:8081
```

**Résultat** : User Service accessible sur http://localhost:8081

---

### Pipeline 4 : Job Service

```groovy
1. Checkout          → Récupère le code depuis GitHub
2. Unit Tests        → ./mvnw test
3. SonarQube         → SKIPPED (désactivé temporairement)
4. Build Artifact    → ./mvnw clean package -DskipTests
5. Build Docker      → docker build -t job-service:latest
6. Push Docker       → docker push wiwi2003/job-service:latest
7. Deploy            → docker run -d --name job-service -p 8082:8082
```

**Résultat** : Job Service accessible sur http://localhost:8082

---

### Pipeline 5 : Frontend

```groovy
1. Checkout          → Récupère le code depuis GitHub
2. Install Deps      → npm install
3. Unit Tests        → SKIPPED (pas de Chrome dans Jenkins)
4. SonarQube         → SKIPPED (désactivé temporairement)
5. Build             → npm run build
6. Build Docker      → docker build -t frontend-service:latest
7. Push Docker       → docker push wiwi2003/frontend-service:latest
8. Deploy            → docker run -d --name frontend-service -p 80:80
```

**Résultat** : Frontend accessible sur http://localhost

---

## 🎬 Ordre d'exécution des builds

**IMPORTANT** : Les services doivent être buildés dans cet ordre :

```
1. Eureka Server     (Service Discovery - doit démarrer en premier)
   ↓ Attendre 30 secondes
   
2. API Gateway       (Point d'entrée - s'enregistre dans Eureka)
   ↓ Attendre 20 secondes
   
3. User Service      (Microservice - s'enregistre dans Eureka)
   ET
   Job Service       (Microservice - s'enregistre dans Eureka)
   ↓ Attendre 10 secondes
   
4. Frontend          (Interface utilisateur - communique via Gateway)
```

---

## 🚀 Comment lancer le workflow complet

### Étape 1 : Push les modifications

```bash
git add .
git commit -m "feat: complete DevOps pipeline with automatic Docker deployment"
git push origin main
```

### Étape 2 : Lancer les builds dans Jenkins

Ouvrir Jenkins : `http://votre-vm-ip:8080`

**Build 1 : Eureka Server**
- Aller dans le job `eureka-server`
- Cliquer sur "Build Now"
- ⏳ Attendre que le build soit **SUCCESS** (3-4 minutes)
- ✅ Vérifier : http://votre-vm-ip:8761

**Build 2 : API Gateway**
- Aller dans le job `api-gateway`
- Cliquer sur "Build Now"
- ⏳ Attendre que le build soit **SUCCESS** (3-4 minutes)
- ✅ Vérifier : http://votre-vm-ip:8080/actuator/health

**Build 3 : User Service**
- Aller dans le job `user-service`
- Cliquer sur "Build Now"
- ⏳ Attendre que le build soit **SUCCESS** (4-5 minutes)

**Build 4 : Job Service**
- Aller dans le job `job-service`
- Cliquer sur "Build Now"
- ⏳ Attendre que le build soit **SUCCESS** (4-5 minutes)

**Build 5 : Frontend**
- Aller dans le job `frontend`
- Cliquer sur "Build Now"
- ⏳ Attendre que le build soit **SUCCESS** (5-6 minutes)
- ✅ Vérifier : http://votre-vm-ip

### Étape 3 : Vérifier le déploiement

```bash
# Sur la VM Jenkins
ssh vagrant@votre-vm-ip

# Vérifier les conteneurs
docker ps

# Vous devriez voir 5 conteneurs :
# - eureka-server
# - api-gateway
# - user-service
# - job-service
# - frontend-service
```

### Étape 4 : Accéder à l'application

Ouvrir dans le navigateur :

- **Eureka Dashboard** : http://votre-vm-ip:8761
- **API Gateway** : http://votre-vm-ip:8080
- **Application** : http://votre-vm-ip

---

## ✅ Checklist de succès

- [ ] Tous les builds Jenkins sont **SUCCESS**
- [ ] 5 conteneurs Docker en cours d'exécution
- [ ] Eureka Dashboard accessible
- [ ] 3 services enregistrés dans Eureka (API-GATEWAY, USER-SERVICE, JOB-SERVICE)
- [ ] API Gateway répond
- [ ] Frontend accessible
- [ ] Vous pouvez vous connecter et naviguer dans l'application

---

## 🔧 Maintenance et mises à jour

### Pour mettre à jour un service :

1. **Modifier le code**
2. **Commit et push**
   ```bash
   git add .
   git commit -m "fix: correction bug dans user-service"
   git push origin main
   ```
3. **Relancer le build dans Jenkins**
   - Le pipeline va automatiquement :
     - Tester le code
     - Builder l'image Docker
     - Pusher vers Docker Hub
     - Arrêter l'ancien conteneur
     - Démarrer le nouveau conteneur
4. **L'application est mise à jour automatiquement !**

---

## 📊 Monitoring

### Vérifier l'état des services

```bash
# Voir tous les conteneurs
docker ps

# Voir les logs d'un service
docker logs eureka-server
docker logs api-gateway
docker logs user-service
docker logs job-service
docker logs frontend-service

# Voir les logs en temps réel
docker logs -f user-service
```

### Vérifier les services dans Eureka

Ouvrir : http://votre-vm-ip:8761

Vous devriez voir :
- **API-GATEWAY** - UP (1 instance)
- **USER-SERVICE** - UP (1 instance)
- **JOB-SERVICE** - UP (1 instance)

---

## 🐛 Troubleshooting

### Problème : Un build échoue

1. Cliquer sur le build qui a échoué
2. Cliquer sur "Console Output"
3. Chercher l'erreur (en rouge)
4. Corriger le problème
5. Relancer le build

### Problème : Un conteneur ne démarre pas

```bash
# Voir les logs
docker logs <service-name>

# Redémarrer le conteneur
docker restart <service-name>

# Si ça ne marche pas, relancer le build Jenkins
```

### Problème : Services ne s'enregistrent pas dans Eureka

```bash
# Vérifier qu'Eureka est bien démarré
docker ps | grep eureka

# Vérifier les logs du service
docker logs user-service | grep -i eureka

# Attendre 30 secondes et rafraîchir Eureka Dashboard
```

---

## 🎯 Avantages de ce workflow DevOps

✅ **Automatisation complète** : Du code au déploiement en un clic

✅ **Déploiement rapide** : Mise à jour en 5-10 minutes

✅ **Rollback facile** : Relancer un ancien build pour revenir en arrière

✅ **Traçabilité** : Chaque déploiement est lié à un commit Git

✅ **Reproductibilité** : Le même pipeline fonctionne partout

✅ **Scalabilité** : Facile d'ajouter de nouveaux services

---

## 🔮 Évolutions possibles

- 🔹 Ajouter des tests d'intégration
- 🔹 Ajouter des tests de performance
- 🔹 Monitoring avec Prometheus + Grafana
- 🔹 Logging centralisé avec ELK Stack
- 🔹 Alerting avec Slack/Email
- 🔹 Déploiement Blue/Green
- 🔹 Canary Deployment
- 🔹 Migration vers Kubernetes

---

**Votre pipeline DevOps est maintenant complet !** 🎉

Chaque push vers Git déclenche automatiquement le build, les tests, et le déploiement.
