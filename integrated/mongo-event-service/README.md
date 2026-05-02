# mongo-event-service (Node.js + MongoDB)

Microservice **Node.js 20** (Express, Mongoose) — **langage et runtime distincts** des services Java Spring Boot.

## Prérequis Atlas

- URI **MongoDB Atlas** dans la variable **`MONGODB_URI`** (base recommandée : `learnify_mongo` dans le path de l’URI).
- **Network Access** : autoriser l’IP de ta machine (ou celle du serveur qui exécute Docker).

## Lancer en local

```bash
cd integrated/mongo-event-service
cp .env.example .env
# Éditer .env : coller ton mongodb+srv://...
npm install
npm start
```

Santé : `GET http://localhost:8090/api/mongo-events/health`

## Via l’API Gateway

Avec la gateway sur `:8080` :

- `GET http://localhost:8080/api/mongo-events/health`
- `GET http://localhost:8080/api/mongo-events/events`
- `POST http://localhost:8080/api/mongo-events/events`  
  Corps JSON : `{ "eventType": "DEMO", "message": "test", "metadata": {} }`

## Docker Compose

À la racine `integrated/`, créer un fichier **`.env`** :

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/learnify_mongo?retryWrites=true&w=majority
```

Puis `docker compose up -d mongo-event-service` (la gateway utilise `MONGO_EVENT_SERVICE_URI=http://mongo-event-service:8090`).

**Ne pas committer** le fichier `.env` contenant le mot de passe.
