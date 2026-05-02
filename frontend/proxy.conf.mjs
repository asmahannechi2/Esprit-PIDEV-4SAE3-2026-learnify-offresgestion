/**
 * Dev : API + OAuth + fichiers → API Gateway :8080 (routage Eureka : lb://… dans la gateway).
 * Prérequis avec Eureka : eureka-server :8761, microservices démarrés, api-gateway sans profil `local`.
 * Ne pas proxifier `/login` / `/logout` seuls (routes Angular) ; OAuth via `/oauth2/**`.
 */
function withBrowserForwardedHeaders(options) {
  return {
    ...options,
    secure: options.secure ?? false,
    changeOrigin: options.changeOrigin ?? true,
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq, req) => {
        const host = req.headers.host;
        if (!host) return;
        proxyReq.setHeader('X-Forwarded-Host', host);
        proxyReq.setHeader('X-Forwarded-Proto', 'http');
        const colon = host.lastIndexOf(':');
        if (colon > 0) {
          const port = host.slice(colon + 1);
          if (/^\d+$/.test(port)) {
            proxyReq.setHeader('X-Forwarded-Port', port);
          }
        }
      });
    },
  };
}

const gateway = 'http://127.0.0.1:8080';
/** mongo-event-service (Node) — en dev, évite d’exiger la gateway si ce seul MS tourne sur 8090. */
const mongoEventService = 'http://127.0.0.1:8090';

export default [
  {
    context: ['/api/mongo-events'],
    ...withBrowserForwardedHeaders({ target: mongoEventService }),
  },
  {
    context: ['/api', '/oauth2', '/uploads'],
    ...withBrowserForwardedHeaders({ target: gateway }),
  },
];
