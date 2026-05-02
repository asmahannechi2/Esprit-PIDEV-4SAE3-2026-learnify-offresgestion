# Guide complet du projet LearnHub / intégration

Ce document décrit l’architecture du dépôt, le démarrage **de A à Z**, et les fonctionnalités **ajoutées ou intégrées** (Feign, RabbitMQ, Config Server, Swagger, microservice Mongo + admin posts, proxy Angular).

---

## 1. Vue d’ensemble

Le dépôt `merge_integ` regroupe :

| Zone | Rôle |
|------|------|
| **`frontend/`** | Application **Angular** (LearnHub) : site public, authentification, espace admin. |
| **`integrated/`** | Back-end **microservices** Java (Spring Boot), **API Gateway**, **Eureka**, **Config Server**, **RabbitMQ** (via Docker), service **Node.js** `mongo-event-service` (MongoDB Atlas). |

Flux typique en développement :

1. Le navigateur charge l’Angular sur **http://localhost:4200**.
2. Les appels API passent par **`proxy.conf.mjs`** vers **http://127.0.0.1:8080** (API Gateway), sauf exception documentée pour `mongo-events`.
3. La gateway route vers les microservices enregistrés dans **Eureka** (`lb://nom-du-service`).

---

## 2. Prérequis sur votre machine

| Outil | Usage |
|--------|--------|
| **JDK 17+** (souvent 21) | Microservices Spring Boot |
| **Maven** | Build Java (`mvn`) |
| **Node.js + npm** | Frontend Angular, service Node `mongo-event-service` |
| **Docker Desktop** (recommandé) | `docker compose` pour RabbitMQ, MySQL, Eureka, services conteneurisés |
| **Compte MongoDB Atlas** (ou URI MongoDB) | Variable `MONGODB_URI` pour `mongo-event-service` |

Sans Docker, vous pouvez lancer les services **à la main** (IDE ou `mvn spring-boot:run`) et installer **RabbitMQ** séparément sur Windows — voir section RabbitMQ.

---

## 3. Structure utile des dossiers

```
merge_integ/
├── README.md                 # Aperçu rapide + liens (Git)
├── GUIDE_PROJET.md           # Ce fichier (guide détaillé)
├── frontend/                 # Angular — npm install / ng serve
└── integrated/
    ├── api-gateway/          # Port 8080 — point d’entrée HTTP
    ├── eureka-server/        # Port 8761 — annuaire des services
    ├── config-server/        # Port 8888 — configuration centralisée
    ├── user-service/         # Port 8087 — auth, utilisateurs
    ├── job-service/          # Port 8088 — offres, candidatures, réunions
    ├── preevaluation-service/ — préévaluation (Feign vers user, etc.)
    ├── mongo-event-service/  # Port 8090 — Node + Express + Mongoose
    ├── docker-compose.yml    # Orchestration (DB, Rabbit, MS, gateway…)
    └── docs/
        └── INTER_MS_FEIGN_RABBIT_CONFIG_SWAGGER.md
```

---

## 4. Fonctionnalités intégrées (explications)

### 4.1 Spring Cloud Config Server

- **Module** : `integrated/config-server` (port **8888**, profil `native`).
- **Rôle** : centraliser des propriétés pour `user-service` et `job-service` (fichiers sous `classpath:/config`).
- **Client** : `spring.config.import=optional:configserver:http://${CONFIG_SERVER_HOST:localhost}:8888`.
- Sous Docker : `CONFIG_SERVER_HOST=config-server`.

### 4.2 OpenFeign (appels synchrones entre microservices)

Documenté dans `integrated/docs/INTER_MS_FEIGN_RABBIT_CONFIG_SWAGGER.md` :

- **preevaluation-service → user-service** : mise à jour du niveau final de préévaluation.
- **job-service → preevaluation-service** : appel de santé interne (`/api/preevaluation/internal/health`), exposé côté jobs pour test (ex. endpoint public documenté sur job-service).

### 4.3 RabbitMQ (messages asynchrones)

- **Exchange** : `learnify.topic` (type topic).
- **Scénario A** : après planification d’une réunion, **job-service** publie la clé `meeting.scheduled` ; **user-service** consomme.
- **Scénario B** : après `POST /api/auth/register/candidate`, **user-service** publie `user.registered` ; **job-service** consomme.

Ports broker : **5672** (AMQP), interface web **15672** (`guest` / `guest` par défaut dans le compose).

### 4.4 Swagger via l’API Gateway

- UI agrégée : **http://localhost:8080/swagger-ui.html** (nécessite Eureka + services enregistrés pour les routes `lb://`).
- Détail : `integrated/docs/INTER_MS_FEIGN_RABBIT_CONFIG_SWAGGER.md`.

### 4.5 Microservice `mongo-event-service` (Node + MongoDB)

- **Port** : **8090**.
- **Rôle** : API REST sous `/api/mongo-events/...`, persistance MongoDB (Atlas ou local selon `MONGODB_URI`).
- **Endpoints existants** :
  - Santé : `GET /api/mongo-events/health`
  - Événements génériques : `GET/POST /api/mongo-events/events`
  - **Posts (CRUD admin)** : `GET/POST /api/mongo-events/posts`, `GET/PUT/DELETE /api/mongo-events/posts/:id`

### 4.6 Frontend admin — gestion des posts Mongo

- **Routes** : `/admin/mongo-posts`, `/admin/mongo-posts/create`, `/admin/mongo-posts/edit/:id`.
- **Service Angular** : `MongoPostService` → `/api/mongo-events/posts` (via gateway ou proxy direct en dev).
- **Menu** : entrée « Posts Mongo » dans la barre latérale admin.

### 4.7 Proxy de développement Angular (`frontend/proxy.conf.mjs`)

- Par défaut, `/api`, `/oauth2`, `/uploads` → **http://127.0.0.1:8080** (gateway).
- **Règle ajoutée** : `/api/mongo-events` → **http://127.0.0.1:8090** pour pouvoir tester **mongo-event-service** sans lancer la gateway (uniquement en `ng serve`).

---

## 5. Variables d’environnement importantes

| Variable | Où | Rôle |
|----------|-----|------|
| `MONGODB_URI` | Racine `integrated/` (fichier `.env` lu par Docker) ou `.env` du dossier `mongo-event-service` | Chaîne de connexion MongoDB pour le service Node |
| `MONGO_EVENT_SERVICE_URI` | API Gateway | URL du service Node (ex. `http://localhost:8090` en local, `http://mongo-event-service:8090` en Docker) |
| `SPRING_RABBITMQ_HOST` | user-service, job-service | Hôte RabbitMQ (`localhost` ou `rabbitmq`) |
| `CONFIG_SERVER_HOST` | user-service, job-service | Hôte du config server |

Ne commitez **pas** de secrets (clés API, mots de passe) : utilisez un fichier `.env` ignoré par Git et des variables d’environnement.

---

## 6. Lancer le projet de A à Z

### 6.1 Option A — Tout avec Docker (recommandé si Docker est installé)

1. Installez **Docker Desktop** et démarrez-le.
2. Créez `integrated/.env` avec au minimum :

   ```env
   MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/NOM_DB?retryWrites=true&w=majority
   ```

3. Depuis le dossier `integrated` :

   ```bash
   docker compose up -d --build
   ```

   (Le premier build peut être long.)

4. Vérifiez **Eureka** : http://localhost:8761  
5. Vérifiez la **gateway** : http://localhost:8080  
6. **Frontend** (machine hôte) :

   ```bash
   cd frontend
   npm install
   npm start
   ```

   Ouvrez **http://localhost:4200**. Le proxy envoie les API vers la gateway **8080**.

### 6.2 Option B — Développement hybride (sans tout Docker)

Ordre conseillé :

1. **RabbitMQ** : Docker `rabbitmq` uniquement, *ou* installation Windows native (ports 5672 / 15672).
2. **MySQL** : instances locales ou conteneurs MySQL du `docker-compose` ciblant les ports mappés (3312 user, 3313 job, etc. selon le compose).
3. **Eureka** : `mvn spring-boot:run` dans `integrated/eureka-server`.
4. **Config Server** : port 8888.
5. **user-service** (8087) et **job-service** (8088) avec `application.properties` / config pointant vers Rabbit, MySQL, Eureka, Config Server.
6. **api-gateway** (8080) avec `MONGO_EVENT_SERVICE_URI=http://localhost:8090` si le service Node tourne en local.
7. **mongo-event-service** : dans `integrated/mongo-event-service`, `npm install` puis `npm start` (ou `node src/server.js`) avec `MONGODB_URI` défini.
8. **Frontend** : `npm start` dans `frontend/`.

Adaptez les URLs JDBC et `spring.rabbitmq.host` à votre installation.

### 6.3 Minimal pour tester uniquement « Posts Mongo » en local

1. MongoDB Atlas (ou local) + `MONGODB_URI`.
2. Lancer **mongo-event-service** sur **8090**.
3. Lancer **ng serve** dans `frontend` : le proxy envoie `/api/mongo-events` directement vers **8090** (pas besoin de gateway pour cette partie).
4. Connexion **admin** dans l’app → menu **Posts Mongo**.

---

## 7. Table des ports (référence)

| Service | Port (habituel) |
|---------|------------------|
| API Gateway | 8080 |
| Eureka | 8761 |
| Config Server | 8888 |
| user-service | 8087 |
| job-service | 8088 |
| mongo-event-service | 8090 |
| Angular (dev) | 4200 |
| RabbitMQ AMQP | 5672 |
| RabbitMQ Management UI | 15672 |

Les autres microservices du compose (event, payment, course, etc.) utilisent **8081–8086** selon le fichier `docker-compose.yml`.

---

## 8. Tests rapides des intégrations

- **Feign (job → preevaluation)** : avec services démarrés, voir la doc dans `INTER_MS_FEIGN_RABBIT_CONFIG_SWAGGER.md` (ex. endpoint public sur job-service pour la santé préévaluation).
- **RabbitMQ** : planifier une réunion (job-service) → log user-service ; inscrire un candidat (user-service) → log job-service ; observer les files dans l’UI **15672**.
- **Swagger gateway** : http://localhost:8080/swagger-ui.html (si Eureka + instances OK).

---

## 9. Dépannage

| Problème | Piste |
|----------|--------|
| `docker` non reconnu | Installer Docker Desktop et redémarrer le terminal. |
| Posts Mongo vides / erreur réseau | Vérifier `mongo-event-service` (8090), `MONGODB_URI`, et en dev le `proxy.conf.mjs`. |
| 503 sur Swagger via gateway | Eureka indisponible ou service non enregistré — utiliser Swagger direct sur le port du MS. |
| RabbitMQ connection refused | Broker arrêté ou mauvais `spring.rabbitmq.host`. |

---

## 10. Fichiers de documentation complémentaires

- `integrated/docs/INTER_MS_FEIGN_RABBIT_CONFIG_SWAGGER.md` — Feign, Rabbit, Config, Swagger.
- `integrated/mongo-event-service/README.md` — détail du service Node si présent.

Ce guide et le `README.md` à la racine sont pensés pour le onboarding et la mise sur Git sans dupliquer tous les secrets du dépôt.
