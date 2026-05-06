# 🚀 Guide de Déploiement DevOps - LearnHub

## 📋 Services concernés
- ✅ user-service
- ✅ job-service  
- ✅ eureka-server
- ✅ api-gateway
- ✅ frontend

## ⚠️ Problème identifié

Vos builds Jenkins échouent au stage **SonarQube Analysis** :
```
ERROR: SonarQube server [http://localhost:9000] can not be reached
Failed to connect to localhost/127.0.0.1:9000: Connection refused
```

## ✅ Solution appliquée

J'ai désactivé temporairement le stage SonarQube dans les Jenkinsfiles de :
- `integrated/user-service/Jenkinsfile`
- `integrated/job-service/Jenkinsfile`

Les stages Eureka et API Gateway n'avaient pas de SonarQube, donc ils sont OK.

---

## 🔧 Commandes à exécuter sur votre VM Jenkins

### 1️⃣ Vérifier que Docker et Jenkins fonctionnent

```bash
# Vérifier Jenkins
sudo systemctl status jenkins

# Vérifier Docker
docker ps

# Vérifier les images Docker existantes
docker images | grep -E "user-service|job-service|eureka|gateway"
```

### 2️⃣ Pousser les modifications vers Git

Sur votre machine locale (où vous avez ce code) :

```bash
# Ajouter les modifications
git add integrated/user-service/Jenkinsfile integrated/job-service/Jenkinsfile

# Commit
git commit -m "fix: disable SonarQube stage temporarily to fix pipeline"

# Push vers GitHub
git push origin main
```

### 3️⃣ Relancer les builds Jenkins

**Option A : Via l'interface Jenkins**
1. Ouvrez Jenkins : `http://votre-vm-ip:8080`
2. Allez dans chaque job :
   - `user-service`
   - `job-service`
   - `eureka-server`
   - `api-gateway`
3. Cliquez sur "Build Now"

**Option B : Via la ligne de commande**

```bash
# Depuis votre VM Jenkins
curl -X POST http://localhost:8080/job/user-service/build --user votre-user:votre-token
curl -X POST http://localhost:8080/job/job-service/build --user votre-user:votre-token
curl -X POST http://localhost:8080/job/eureka-server/build --user votre-user:votre-token
curl -X POST http://localhost:8080/job/api-gateway/build --user votre-user:votre-token
```

### 4️⃣ Vérifier que les conteneurs Docker sont créés

```bash
# Attendre que les builds se terminent (2-5 minutes)
# Puis vérifier les conteneurs

docker ps -a | grep -E "user-service|job-service|eureka|gateway"
```

### 5️⃣ Démarrer les services manuellement (si nécessaire)

Si les conteneurs sont créés mais pas démarrés :

```bash
# Démarrer Eureka en premier (service discovery)
docker start eureka-server
# Attendre 30 secondes
sleep 30

# Démarrer API Gateway
docker start api-gateway
sleep 20

# Démarrer les microservices
docker start user-service
docker start job-service

# Vérifier que tout tourne
docker ps
```

### 6️⃣ Vérifier les logs

```bash
# Logs Eureka
docker logs eureka-server --tail 50

# Logs API Gateway
docker logs api-gateway --tail 50

# Logs User Service
docker logs user-service --tail 50

# Logs Job Service
docker logs job-service --tail 50
```

### 7️⃣ Tester les endpoints

```bash
# Eureka Dashboard
curl http://localhost:8761

# API Gateway Health
curl http://localhost:8080/actuator/health

# User Service (via Gateway)
curl http://localhost:8080/api/users/health

# Job Service (via Gateway)
curl http://localhost:8080/api/jobs/health
```

---

## 🌐 Déployer le Frontend

### Option A : Build local et déploiement Docker

```bash
cd frontend

# Installer les dépendances
npm install

# Build de production
npm run build

# Créer l'image Docker
docker build -t frontend:latest .

# Lancer le conteneur
docker run -d --name frontend -p 80:80 frontend:latest
```

### Option B : Via Jenkins (si vous avez un job frontend)

```bash
# Relancer le build frontend
curl -X POST http://localhost:8080/job/frontend/build --user votre-user:votre-token
```

---

## 🎯 Accéder à l'application

Une fois tout démarré :

- **Frontend** : `http://votre-vm-ip` ou `http://votre-vm-ip:80`
- **Eureka Dashboard** : `http://votre-vm-ip:8761`
- **API Gateway** : `http://votre-vm-ip:8080`

---

## 🔍 Troubleshooting

### Problème : Les services ne se registrent pas dans Eureka

**Solution** : Vérifiez les configurations `application.properties` ou `application.yml`

```bash
# Vérifier la config Eureka dans user-service
cat integrated/user-service/src/main/resources/application.properties | grep eureka

# Vérifier la config Eureka dans job-service
cat integrated/job-service/src/main/resources/application.properties | grep eureka
```

La configuration devrait ressembler à :
```properties
eureka.client.service-url.defaultZone=http://localhost:8761/eureka/
eureka.instance.prefer-ip-address=true
```

### Problème : Port déjà utilisé

```bash
# Trouver quel processus utilise le port
sudo lsof -i :8080
sudo lsof -i :8761

# Tuer le processus si nécessaire
sudo kill -9 <PID>
```

### Problème : Pas assez de mémoire

```bash
# Vérifier la mémoire disponible
free -h

# Nettoyer les conteneurs inutilisés
docker system prune -a
```

---

## 📊 Architecture finale

```
┌─────────────────┐
│    Frontend     │ :80
│   (Angular)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │ :8080
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│  User   │ │  Job    │
│ Service │ │ Service │
│  :8081  │ │  :8082  │
└────┬────┘ └────┬────┘
     │           │
     └─────┬─────┘
           ▼
    ┌─────────────┐
    │   Eureka    │ :8761
    │   Server    │
    └─────────────┘
```

---

## 🔄 Pour réactiver SonarQube plus tard

1. Démarrer SonarQube :
```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts
```

2. Attendre 2-3 minutes que SonarQube démarre

3. Configurer le token dans Jenkins

4. Retirer le `when { expression { false } }` des Jenkinsfiles

5. Commit et push

---

## 📝 Checklist finale

- [ ] Jenkins est actif
- [ ] Docker est actif  
- [ ] Modifications Git poussées
- [ ] Builds Jenkins relancés
- [ ] Eureka démarre en premier
- [ ] API Gateway démarre après Eureka
- [ ] Services user et job démarrent
- [ ] Frontend build et déployé
- [ ] Tous les services visibles dans Eureka Dashboard
- [ ] Application accessible via navigateur

---

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes, envoyez-moi :
1. Les logs : `docker logs <service-name>`
2. Le statut : `docker ps -a`
3. Les erreurs Jenkins de la console output
