# 🚀 Déploiement Kubernetes - LearnHub

Ce dossier contient tous les manifestes Kubernetes pour déployer l'application LearnHub complète avec monitoring.

## 📁 Structure

```
kubernetes/
├── namespace.yaml              # Namespace 'pidev'
├── secrets.yaml                # Secrets MySQL
├── eureka-server.yaml          # Service Discovery
├── api-gateway.yaml            # API Gateway
├── user-service.yaml           # User Service + MySQL
├── job-service.yaml            # Job Service + MySQL
├── frontend.yaml               # Frontend Angular
├── monitoring/
│   ├── prometheus-config.yaml  # Configuration Prometheus
│   ├── prometheus.yaml         # Déploiement Prometheus
│   └── grafana.yaml            # Déploiement Grafana
├── deploy-all.sh               # Script de déploiement automatique
└── README.md                   # Ce fichier
```

## 🎯 Architecture Kubernetes

```
┌─────────────────────────────────────────────────────────────┐
│                    Namespace: pidev                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Eureka     │  │ API Gateway  │  │   Frontend   │     │
│  │   :30761     │  │   :30080     │  │   :30080     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ User Service │  │ Job Service  │                        │
│  │   :30081     │  │   :30082     │                        │
│  └──────┬───────┘  └──────┬───────┘                        │
│         │                  │                                 │
│  ┌──────▼───────┐  ┌──────▼───────┐                        │
│  │  MySQL User  │  │  MySQL Job   │                        │
│  │   :3306      │  │   :3306      │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Prometheus  │  │   Grafana    │                        │
│  │   :30090     │  │   :30300     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Déploiement Rapide

### Option 1: Script automatique (Recommandé)

```bash
# Rendre le script exécutable
chmod +x kubernetes/deploy-all.sh

# Lancer le déploiement complet
./kubernetes/deploy-all.sh
```

### Option 2: Déploiement manuel

```bash
# 1. Créer le namespace
kubectl apply -f kubernetes/namespace.yaml

# 2. Créer les secrets
kubectl apply -f kubernetes/secrets.yaml

# 3. Déployer Eureka Server
kubectl apply -f kubernetes/eureka-server.yaml
sleep 60  # Attendre qu'Eureka démarre

# 4. Déployer API Gateway
kubectl apply -f kubernetes/api-gateway.yaml
sleep 30

# 5. Déployer User Service
kubectl apply -f kubernetes/user-service.yaml
sleep 30

# 6. Déployer Job Service
kubectl apply -f kubernetes/job-service.yaml
sleep 30

# 7. Déployer Frontend
kubectl apply -f kubernetes/frontend.yaml
sleep 20

# 8. Déployer Prometheus
kubectl apply -f kubernetes/monitoring/prometheus-config.yaml
kubectl apply -f kubernetes/monitoring/prometheus.yaml
sleep 20

# 9. Déployer Grafana
kubectl apply -f kubernetes/monitoring/grafana.yaml
```

## 📊 Vérification du déploiement

```bash
# Voir tous les pods
kubectl get pods -n pidev

# Voir tous les services
kubectl get services -n pidev

# Voir les déploiements
kubectl get deployments -n pidev

# Voir les PVC
kubectl get pvc -n pidev
```

## 🌐 Accès aux services

Remplacez `NODE_IP` par l'IP de votre node Kubernetes:

```bash
# Obtenir l'IP du node
kubectl get nodes -o wide
```

### URLs d'accès:

- **Frontend**: http://NODE_IP:30080
- **API Gateway**: http://NODE_IP:30080
- **Eureka Dashboard**: http://NODE_IP:30761
- **User Service**: http://NODE_IP:30081/actuator/health
- **Job Service**: http://NODE_IP:30082/actuator/health
- **Prometheus**: http://NODE_IP:30090
- **Grafana**: http://NODE_IP:30300 (admin/admin123)

## 🔍 Monitoring avec Prometheus & Grafana

### Prometheus

1. Accéder à Prometheus: http://NODE_IP:30090
2. Vérifier les targets: Status → Targets
3. Vous devriez voir tous les services Spring Boot

### Grafana

1. Accéder à Grafana: http://NODE_IP:30300
2. Login: `admin` / `admin123`
3. La datasource Prometheus est déjà configurée
4. Importer des dashboards:
   - Dashboard ID 4701: JVM (Micrometer)
   - Dashboard ID 11378: Spring Boot Statistics
   - Dashboard ID 6756: Spring Boot

## 🐛 Troubleshooting

### Voir les logs d'un pod

```bash
# Lister les pods
kubectl get pods -n pidev

# Voir les logs
kubectl logs -f <pod-name> -n pidev

# Exemples
kubectl logs -f eureka-server-xxx -n pidev
kubectl logs -f user-service-xxx -n pidev
```

### Redémarrer un déploiement

```bash
kubectl rollout restart deployment/user-service -n pidev
```

### Vérifier l'état d'un déploiement

```bash
kubectl rollout status deployment/user-service -n pidev
```

### Accéder à un pod

```bash
kubectl exec -it <pod-name> -n pidev -- /bin/bash
```

### Problème: Pod en CrashLoopBackOff

```bash
# Voir les logs
kubectl logs <pod-name> -n pidev

# Voir les événements
kubectl describe pod <pod-name> -n pidev
```

### Problème: Service non accessible

```bash
# Vérifier que le service existe
kubectl get svc -n pidev

# Vérifier les endpoints
kubectl get endpoints -n pidev

# Vérifier les règles de firewall
# Sur K3s, les NodePorts doivent être ouverts
```

## 🔄 Mise à jour d'un service

```bash
# Après avoir push une nouvelle image Docker
kubectl rollout restart deployment/user-service -n pidev

# Ou forcer le pull de la nouvelle image
kubectl set image deployment/user-service user-service=wiwi2003/user-service:latest -n pidev
```

## 🗑️ Nettoyage

### Supprimer un service spécifique

```bash
kubectl delete -f kubernetes/user-service.yaml
```

### Supprimer tout

```bash
# Supprimer le namespace (supprime tout dedans)
kubectl delete namespace pidev
```

## 📝 Configuration des secrets

Les secrets MySQL sont définis dans `secrets.yaml`:

```yaml
mysql-root-password: rootpassword
mysql-user: learnhub
mysql-password: learnhub123
```

Pour changer les mots de passe:

```bash
# Encoder en base64
echo -n "nouveau-password" | base64

# Modifier secrets.yaml avec les nouvelles valeurs
# Réappliquer
kubectl apply -f kubernetes/secrets.yaml

# Redémarrer les services
kubectl rollout restart deployment/mysql-user -n pidev
kubectl rollout restart deployment/mysql-job -n pidev
```

## 🔐 Sécurité

**IMPORTANT**: Pour la production:

1. Changer les mots de passe MySQL dans `secrets.yaml`
2. Changer le mot de passe Grafana
3. Utiliser des secrets Kubernetes chiffrés
4. Configurer des NetworkPolicies
5. Activer RBAC
6. Utiliser des Ingress avec TLS

## 📈 Scalabilité

Pour scaler un service:

```bash
# Scaler à 3 réplicas
kubectl scale deployment/user-service --replicas=3 -n pidev

# Vérifier
kubectl get pods -n pidev
```

Eureka et API Gateway géreront automatiquement le load balancing.

## 🎯 Intégration avec Jenkins

Les Jenkinsfiles ont été mis à jour pour déployer sur Kubernetes:

1. **Build** → Crée l'image Docker
2. **Push** → Push vers Docker Hub
3. **Deploy** → `kubectl apply -f kubernetes/<service>.yaml`

Le pipeline Jenkins va automatiquement:
- Créer le namespace si nécessaire
- Appliquer les secrets
- Déployer le service
- Attendre que le rollout soit terminé

## 📚 Ressources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [K3s Documentation](https://docs.k3s.io/)
- [Spring Boot on Kubernetes](https://spring.io/guides/gs/spring-boot-kubernetes/)
- [Prometheus Operator](https://prometheus-operator.dev/)

---

**Déploiement Kubernetes pour LearnHub** 🚀
