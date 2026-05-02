# Interconnexion des microservices (Feign, RabbitMQ, Config Server, Swagger Gateway)

## 1. OpenFeign — appels **synchrones** (2 scénarios documentés)

| # | Client | Cible | Rôle |
|---|--------|-------|------|
| 1 | `preevaluation-service` | `user-service` | `UserProfileFeignClient` — synchronisation du niveau final (`PUT /api/users/me/preevaluation-final-level`). |
| 2 | `job-service` | `preevaluation-service` | `PreevaluationHealthFeignClient` — lecture de `GET /api/preevaluation/internal/health`. |

**Test manuel (2)** : avec Eureka + services démarrés, appeler  
`GET http://localhost:8088/api/jobs/public/preevaluation-health`  
(réponse JSON issue du préévaluation-service via Feign + load balancing).

## 2. RabbitMQ — messages **asynchrones** (2 scénarios)

- **Exchange** : `learnify.topic` (type topic).
- **Scénario A** : `job-service` publie la clé de routage `meeting.scheduled` après planification d’une réunion ; `user-service` consomme la file `learnify.q.user.meeting.events`.
- **Scénario B** : `user-service` publie `user.registered` après `registerCandidate` ; `job-service` consomme la file `learnify.q.job.user.events`.

**Docker** : service `rabbitmq` (ports `5672`, UI management `15672`).

## 3. Spring Cloud Config Server

- Module : `integrated/config-server` (port **8888**, profil `native`, fichiers dans `classpath:/config`).
- Clients : `user-service` et `job-service` importent `optional:configserver:http://${CONFIG_SERVER_HOST:localhost}:8888`.
- Sous Docker : `CONFIG_SERVER_HOST=config-server`.

## 4. Swagger agrégé sur l’API Gateway

- UI : `http://localhost:8080/swagger-ui.html`
- Les définitions OpenAPI des MS sont exposées via la gateway sous :
  - `/docs-job/v3/api-docs` → `job-service` (filtre `StripPrefix=1` : enlève le segment `docs-job`)
  - `/docs-user/v3/api-docs` → `user-service`

**503 Service Unavailable** sur ces URLs : la gateway résout `lb://…` via **Eureka**. Il faut **Eureka** + **instances enregistrées** (`job-service`, `user-service` démarrés). Sinon utiliser le Swagger direct sur les ports : `http://localhost:8088/swagger-ui.html`, `http://localhost:8087/swagger-ui.html`.

Chaque service expose aussi sa propre UI : `http://localhost:8088/swagger-ui.html` (job), `http://localhost:8087/swagger-ui.html` (user).
