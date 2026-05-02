# Esprit-PIDEV-4SAE3-2026-learnify-offresgestion

This project was developed at Esprit School of Engineering-Tunisia as part of the PIDEV 2nd year engineering program (2025-2026), focusing on job offers using Spring Boot and Angular.

---

# LearnHub — Projet intégré (Angular + microservices)

Monorepo regroupant le **frontend Angular** et la stack **Spring Boot** (API Gateway, Eureka, services métier), ainsi qu’un microservice **Node.js** branché sur **MongoDB**.

## Contenu du dépôt

| Dossier | Description |
|---------|-------------|
| `frontend/` | Application Angular (port de dev **4200**). |
| `integrated/` | Microservices Java, `docker-compose.yml`, Config Server, service Node `mongo-event-service`. |

## Prérequis

- **JDK 17+**, **Maven**, **Node.js** (LTS) + **npm**
- **Docker Desktop** (recommandé pour RabbitMQ, bases MySQL et déploiement complet)
- URI **MongoDB** (Atlas ou autre) pour `mongo-event-service`

## Démarrage rapide

1. **Documentation détaillée (A → Z, architecture, intégrations)** : voir **[GUIDE_PROJET.md](./GUIDE_PROJET.md)**.

2. **Stack complète avec Docker** (depuis `integrated/`) :

   ```bash
   cd integrated
   # Créer un fichier .env avec MONGODB_URI=...
   docker compose up -d --build
   ```

3. **Frontend** :

   ```bash
   cd frontend
   npm install
   npm start
   ```

   Ouvrir **http://localhost:4200**. En développement, le proxy Angular pointe les API vers la gateway (**8080**), avec une règle spécifique pour `/api/mongo-events` vers le service Node (**8090**).

## Points d’entrée utiles

| Ressource | URL (local) |
|-----------|-------------|
| Application Angular | http://localhost:4200 |
| API Gateway | http://localhost:8080 |
| Eureka | http://localhost:8761 |
| Spring Cloud Config | http://localhost:8888 |
| RabbitMQ Management | http://localhost:15672 |
| mongo-event-service (direct) | http://localhost:8090/api/mongo-events/health |

## Intégrations principales

- **Spring Cloud Config** — configuration centralisée (`user-service`, `job-service`).
- **OpenFeign** — appels inter-services (ex. job-service ↔ preevaluation-service).
- **RabbitMQ** — événements asynchrones (`meeting.scheduled`, `user.registered`).
- **Swagger** — UI agrégée sur la gateway : `/swagger-ui.html`.
- **mongo-event-service** — API REST MongoDB ; **CRUD posts** exposé sous `/api/mongo-events/posts`, interface admin Angular sous `/admin/mongo-posts`.

Détail : `integrated/docs/INTER_MS_FEIGN_RABBIT_CONFIG_SWAGGER.md`.

## Git — bonnes pratiques

- Ne pas commiter de **secrets** : fichiers `.env`, mots de passe, clés API. Utiliser `.env.example` (sans valeurs sensibles) si besoin.
- Le fichier **`GUIDE_PROJET.md`** décrit les variables attendues et le run complet.

## Licence / équipe

Développé dans le cadre du programme PIDEV 2ème année (2025-2026).
