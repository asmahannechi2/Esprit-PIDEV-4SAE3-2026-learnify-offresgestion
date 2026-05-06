# 🚀 ÉTAPES MAINTENANT - Déploiement Kubernetes

## ✅ Ce qui a été fait

1. ✅ **Manifestes Kubernetes créés** dans `kubernetes/`
2. ✅ **Jenkinsfiles mis à jour** pour déployer sur Kubernetes
3. ✅ **Monitoring ajouté** (Prometheus + Grafana)
4. ✅ **Scripts de déploiement** créés
5. ✅ **Documentation complète** rédigée

---

## 🎯 CE QUE VOUS DEVEZ FAIRE MAINTENANT

### Étape 1: Installer K3s sur la VM Jenkins

```bash
# Se connecter à la VM
ssh vagrant@votre-vm-ip

# Installer K3s
curl -sfL https://get.k3s.io | sh -

# Configurer kubectl
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
export KUBECONFIG=~/.kube/config

# Ajouter à .bashrc pour persistance
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc

# Vérifier
kubectl get nodes
```

### Étape 2: Configurer Jenkins pour Kubernetes

```bash
# Donner les permissions à Jenkins
sudo usermod -aG docker jenkins
sudo cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config
sudo chown jenkins:jenkins /var/lib/jenkins/.kube/config

# Redémarrer Jenkins
sudo systemctl restart jenkins
```

### Étape 3: Push le code vers GitHub

```bash
# Sur votre machine locale
git add .
git commit -m "feat: add Kubernetes deployment with Prometheus and Grafana monitoring"
git push origin main
```

### Étape 4: Lancer les builds Jenkins

**ORDRE IMPORTANT**:

1. **eureka-server** → Build Now → Attendre SUCCESS (3-4 min)
2. **api-gateway** → Build Now → Attendre SUCCESS (3-4 min)
3. **user-service** → Build Now → Attendre SUCCESS (4-5 min)
4. **job-service** → Build Now → Attendre SUCCESS (4-5 min)
5. **frontend** → Build Now → Attendre SUCCESS (5-6 min)

### Étape 5: Déployer Prometheus et Grafana

```bash
# Sur la VM
cd ~/Esprit-PIDEV-4SAE3-2026-learnify-offresgestion

# Déployer le monitoring
kubectl apply -f kubernetes/monitoring/prometheus-config.yaml
kubectl apply -f kubernetes/monitoring/prometheus.yaml
kubectl apply -f kubernetes/monitoring/grafana.yaml

# Vérifier
kubectl get pods -n pidev
```

### Étape 6: Vérifier le déploiement

```bash
# Voir tous les pods
kubectl get pods -n pidev

# Voir tous les services
kubectl get services -n pidev

# Obtenir l'IP du node
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "Node IP: ${NODE_IP}"
```

### Étape 7: Accéder à l'application

Ouvrir dans le navigateur:

- **Frontend**: http://NODE_IP:30088
- **API Gateway**: http://NODE_IP:30080
- **Eureka**: http://NODE_IP:30761
- **Prometheus**: http://NODE_IP:30090
- **Grafana**: http://NODE_IP:30300 (admin/admin123)

---

## 📊 Vérifications

### ✅ Checklist

- [ ] K3s installé et `kubectl get nodes` fonctionne
- [ ] Jenkins peut exécuter `kubectl`
- [ ] Code pushé sur GitHub
- [ ] 5 builds Jenkins réussis
- [ ] Tous les pods en état Running
- [ ] Eureka Dashboard accessible
- [ ] 3 services enregistrés dans Eureka
- [ ] Frontend accessible
- [ ] Prometheus accessible
- [ ] Grafana accessible

### 🔍 Commandes de vérification

```bash
# Pods
kubectl get pods -n pidev

# Services
kubectl get services -n pidev

# Logs d'un service
kubectl logs -f deployment/user-service -n pidev

# Health checks
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
curl http://${NODE_IP}:30761/actuator/health
curl http://${NODE_IP}:30080/actuator/health
curl http://${NODE_IP}:30081/actuator/health
curl http://${NODE_IP}:30082/actuator/health
```

---

## 🐛 Si quelque chose ne marche pas

### Problème: kubectl ne fonctionne pas

```bash
# Vérifier K3s
sudo systemctl status k3s

# Reconfigurer kubectl
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
export KUBECONFIG=~/.kube/config
```

### Problème: Jenkins ne peut pas déployer

```bash
# Vérifier les permissions
sudo usermod -aG docker jenkins
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo systemctl restart jenkins
```

### Problème: Pod en CrashLoopBackOff

```bash
# Voir les logs
kubectl logs <pod-name> -n pidev

# Voir les événements
kubectl describe pod <pod-name> -n pidev

# Redémarrer
kubectl rollout restart deployment/<service-name> -n pidev
```

### Problème: Service non accessible

```bash
# Ouvrir les ports du firewall
sudo ufw allow 30088/tcp
sudo ufw allow 30080/tcp
sudo ufw allow 30761/tcp
sudo ufw allow 30081/tcp
sudo ufw allow 30082/tcp
sudo ufw allow 30090/tcp
sudo ufw allow 30300/tcp
```

---

## 📚 Documentation

- **Guide complet**: `GUIDE_KUBERNETES.md`
- **README Kubernetes**: `kubernetes/README.md`
- **Architecture**: `ARCHITECTURE.md`

---

## 🎯 Résultat attendu

Après avoir suivi ces étapes, vous aurez:

✅ Application complète déployée sur Kubernetes  
✅ Pipeline CI/CD Jenkins → Docker Hub → Kubernetes  
✅ Monitoring avec Prometheus + Grafana  
✅ Service Discovery avec Eureka  
✅ Load Balancing automatique  
✅ Rolling updates sans downtime  

**Votre projet DevOps Sprint 3 est complet !** 🎉
