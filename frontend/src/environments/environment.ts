/**
 * Dev avec `ng serve` : `proxy.conf.mjs` → API Gateway :8080 (`/api`, `/oauth2`, `/uploads`).
 *
 * Avec Eureka (recommandé) :
 *   1) eureka-server sur http://localhost:8761 (dashboard des services)
 *   2) microservices (enregistrement automatique)
 *   3) api-gateway : mvn spring-boot:run dans integrated/api-gateway — sans profil `local`
 *
 * Sans Eureka : gateway avec `-Dspring-boot.run.profiles=local` + instances dans application-local.yml.
 */
export const environment = {
  production: false,
  apiBase: '/api',
  courseApiBase: '/api/courses',
  /** Base vide : requêtes relatives → même origine (:4200) → proxy → gateway. */
  apiGatewayUrl: '',
  /**
   * Même principe qu’ang/UandPManagement (signin.ts / signup.ts) : « Continue with Google » pointe vers le user-service
   * en direct, pas via le proxy :4200. Sinon la redirect_uri côté Google ne correspond pas à celle du projet indiv (8080).
   */
  oauthUserServiceUrl: 'http://localhost:8087'
};
