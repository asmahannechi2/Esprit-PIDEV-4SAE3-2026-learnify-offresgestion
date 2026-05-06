# 🏗️ Architecture LearnHub - Microservices

## 📊 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                         UTILISATEUR                                  │
│                      (Navigateur Web)                                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                     │
│                      Angular Application                             │
│                         Port 80                                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY                                    │
│                   Spring Cloud Gateway                               │
│                         Port 8080                                    │
│                                                                       │
│  Fonctions :                                                         │
│  • Routage des requêtes                                             │
│  • Load balancing                                                    │
│  • Authentification centralisée                                     │
│  • Rate limiting                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │     USER     │ │     JOB      │ │    OTHER     │
    │   SERVICE    │ │   SERVICE    │ │   SERVICES   │
    │              │ │              │ │              │
    │  Port 8081   │ │  Port 8082   │ │  Port 808x   │
    │              │ │              │ │              │
    │  • Users     │ │  • Jobs      │ │  • Courses   │
    │  • Auth      │ │  • Apply     │ │  • Events    │
    │  • Profile   │ │  • Search    │ │  • ...       │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           │                │                │
           └────────────────┼────────────────┘
                            │
                            │ Service Registration
                            │ Health Check
                            ▼
           ┌─────────────────────────────────┐
           │       EUREKA SERVER             │
           │    (Service Discovery)          │
           │         Port 8761               │
           │                                 │
           │  Fonctions :                    │
           │  • Service registry             │
           │  • Health monitoring            │
           │  • Load balancing info          │
           └─────────────────────────────────┘
```

---

## 🔄 Flux de communication

### 1️⃣ Démarrage des services

```
Eureka Server démarre (8761)
    ↓
API Gateway démarre et s'enregistre dans Eureka
    ↓
User Service démarre et s'enregistre dans Eureka
    ↓
Job Service démarre et s'enregistre dans Eureka
    ↓
Frontend démarre et se connecte à l'API Gateway
```

### 2️⃣ Requête utilisateur

```
Utilisateur → Frontend (Angular)
    ↓
Frontend → API Gateway (:8080/api/users/...)
    ↓
API Gateway consulte Eureka pour trouver User Service
    ↓
API Gateway → User Service (:8081)
    ↓
User Service traite la requête
    ↓
User Service → API Gateway (réponse)
    ↓
API Gateway → Frontend (réponse)
    ↓
Frontend → Utilisateur (affichage)
```

---

## 🎯 Détail des services

### 🔵 Eureka Server (Port 8761)

**Rôle** : Service Discovery (annuaire de services)

**Fonctionnalités** :
- Enregistrement des microservices
- Monitoring de la santé des services
- Fournit les informations de localisation aux clients

**Technologies** :
- Spring Cloud Netflix Eureka
- Java 17

**Endpoints** :
- Dashboard : `http://localhost:8761`
- API : `http://localhost:8761/eureka/apps`

---

### 🟢 API Gateway (Port 8080)

**Rôle** : Point d'entrée unique pour tous les clients

**Fonctionnalités** :
- Routage intelligent des requêtes
- Load balancing automatique
- Authentification et autorisation
- Rate limiting et throttling
- Logging centralisé

**Technologies** :
- Spring Cloud Gateway
- Spring Security
- Java 17

**Routes** :
```
/api/users/**    → USER-SERVICE
/api/jobs/**     → JOB-SERVICE
/api/courses/**  → COURSE-SERVICE
```

**Endpoints** :
- Health : `http://localhost:8080/actuator/health`
- Routes : `http://localhost:8080/actuator/gateway/routes`

---

### 🟡 User Service (Port 8081)

**Rôle** : Gestion des utilisateurs et authentification

**Fonctionnalités** :
- Inscription / Connexion
- Gestion des profils utilisateurs
- Authentification JWT
- Gestion des rôles et permissions
- Pré-évaluation des étudiants

**Technologies** :
- Spring Boot 3.2.0
- Spring Security
- Spring Data JPA
- MySQL / H2 (tests)
- Java 17

**Endpoints principaux** :
```
POST   /api/users/register
POST   /api/users/login
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/{id}
```

**Base de données** :
- Tables : users, roles, permissions, preevaluations

---

### 🟠 Job Service (Port 8082)

**Rôle** : Gestion des offres d'emploi

**Fonctionnalités** :
- Création d'offres d'emploi
- Recherche et filtrage d'offres
- Candidatures
- Matching candidats/offres
- Statistiques

**Technologies** :
- Spring Boot 3.2.0
- Spring Data JPA
- MySQL / H2 (tests)
- Java 17

**Endpoints principaux** :
```
GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/{id}
PUT    /api/jobs/{id}
DELETE /api/jobs/{id}
POST   /api/jobs/{id}/apply
GET    /api/jobs/search
```

**Base de données** :
- Tables : jobs, applications, companies

---

### 🔴 Frontend (Port 80)

**Rôle** : Interface utilisateur

**Fonctionnalités** :
- Interface responsive
- Authentification
- Gestion du profil
- Recherche d'offres
- Candidatures
- Dashboard

**Technologies** :
- Angular 19
- TypeScript
- RxJS
- Angular Material
- SCSS

**Routes principales** :
```
/                → Home
/login           → Connexion
/register        → Inscription
/profile         → Profil utilisateur
/jobs            → Liste des offres
/jobs/:id        → Détail d'une offre
/applications    → Mes candidatures
```

---

## 🔐 Sécurité

### Authentification

```
1. User → Frontend : Login (email/password)
2. Frontend → API Gateway → User Service : POST /api/users/login
3. User Service : Validation + Génération JWT
4. User Service → API Gateway → Frontend : JWT Token
5. Frontend : Stockage du token (localStorage)
6. Requêtes suivantes : Header "Authorization: Bearer <token>"
```

### Autorisation

```
API Gateway vérifie le JWT
    ↓
Extraction des rôles (ROLE_USER, ROLE_ADMIN, etc.)
    ↓
Vérification des permissions
    ↓
Routage vers le microservice approprié
```

---

## 📊 Monitoring et Observabilité

### Health Checks

Tous les services exposent un endpoint `/actuator/health` :

```bash
# Eureka
curl http://localhost:8761/actuator/health

# API Gateway
curl http://localhost:8080/actuator/health

# User Service
curl http://localhost:8081/actuator/health

# Job Service
curl http://localhost:8082/actuator/health
```

### Eureka Dashboard

Visualisation en temps réel :
- Services enregistrés
- Nombre d'instances
- Statut de santé
- Dernière mise à jour

URL : `http://localhost:8761`

---

## 🚀 Déploiement

### Architecture de déploiement

```
┌─────────────────────────────────────────────────────────────┐
│                      VM Jenkins                              │
│                   (Ubuntu 22.04)                             │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Jenkins   │  │   Docker   │  │    Git     │           │
│  │  :8080     │  │            │  │            │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Docker Containers                        │  │
│  │                                                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │  │
│  │  │  Eureka  │ │ Gateway  │ │   User   │ │   Job   │ │  │
│  │  │  :8761   │ │  :8080   │ │  :8081   │ │  :8082  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │  │
│  │                                                        │  │
│  │  ┌──────────┐                                         │  │
│  │  │ Frontend │                                         │  │
│  │  │   :80    │                                         │  │
│  │  └──────────┘                                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Pipeline CI/CD

```
1. Developer push code → GitHub
    ↓
2. Jenkins détecte le changement (webhook)
    ↓
3. Jenkins exécute le pipeline :
   • Checkout code
   • Run tests
   • Build JAR
   • Build Docker image
   • Push to Docker Hub
   • Deploy to VM
    ↓
4. Application mise à jour automatiquement
```

---

## 📈 Scalabilité

### Scaling horizontal

Chaque microservice peut être répliqué :

```bash
# Démarrer 2 instances de User Service
docker run -d --name user-service-1 -p 8081:8081 user-service:latest
docker run -d --name user-service-2 -p 8091:8081 user-service:latest

# Eureka et API Gateway gèrent automatiquement le load balancing
```

### Load Balancing

API Gateway utilise Ribbon pour le load balancing :
- Round Robin (par défaut)
- Weighted Response Time
- Availability Filtering

---

## 🔧 Configuration

### Variables d'environnement

Chaque service peut être configuré via des variables d'environnement :

```bash
# User Service
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/userdb
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=password
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://localhost:8761/eureka/

# Job Service
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/jobdb
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://localhost:8761/eureka/

# API Gateway
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://localhost:8761/eureka/
```

---

## 📚 Technologies utilisées

| Composant | Technologies |
|-----------|-------------|
| **Backend** | Spring Boot 3.2.0, Java 17 |
| **Service Discovery** | Spring Cloud Netflix Eureka |
| **API Gateway** | Spring Cloud Gateway |
| **Security** | Spring Security, JWT |
| **Database** | MySQL, H2 (tests) |
| **ORM** | Spring Data JPA, Hibernate |
| **Frontend** | Angular 19, TypeScript |
| **Build** | Maven, npm |
| **CI/CD** | Jenkins |
| **Containerization** | Docker |
| **Orchestration** | Docker Compose / Kubernetes (optionnel) |

---

## 🎯 Avantages de cette architecture

✅ **Scalabilité** : Chaque service peut être scalé indépendamment

✅ **Résilience** : Si un service tombe, les autres continuent de fonctionner

✅ **Maintenabilité** : Code organisé en domaines métier

✅ **Déploiement indépendant** : Chaque service peut être déployé séparément

✅ **Technologie flexible** : Chaque service peut utiliser sa propre stack

✅ **Load balancing automatique** : Géré par Eureka et API Gateway

✅ **Service discovery** : Pas besoin de hardcoder les URLs

---

## 🔮 Évolutions futures possibles

- 🔹 Ajout de Kubernetes pour l'orchestration
- 🔹 Monitoring avec Prometheus + Grafana
- 🔹 Logging centralisé avec ELK Stack
- 🔹 Tracing distribué avec Zipkin/Jaeger
- 🔹 Circuit Breaker avec Resilience4j
- 🔹 API Documentation avec Swagger/OpenAPI
- 🔹 Message Queue avec RabbitMQ/Kafka
- 🔹 Cache distribué avec Redis
- 🔹 Database per service pattern

---

**Documentation créée pour LearnHub DevOps** 🚀
