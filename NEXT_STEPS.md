# 🎯 Prochaines étapes - Déploiement Kubernetes

## 📍 Où vous en êtes

✅ Tous les fichiers Kubernetes ont été créés  
✅ Tous les Jenkinsfiles ont été mis à jour  
✅ La documentation complète est disponible  
✅ Les scripts de déploiement sont prêts  

---

## 🚀 CE QUE VOUS DEVEZ FAIRE MAINTENANT

### Étape 1: Push vers GitHub (2 minutes)

```bash
# Sur votre machine Windows
git add .
git commit -m "feat: add Kubernetes deployment with Prometheus and Grafana monitoring"
git push origin main
```

**Pourquoi?** Pour que Jenkins puisse récupérer les nouveaux Jenkinsfiles et manifestes Kubernetes.

---

### Étape 2: Installer K3s sur la VM (5 minutes)

```bash
# Se connecter à la VM
ssh vagrant@VOTRE_VM_IP

# Installer K3s
curl -sfL https://get.k3s.io | sh -

# Configurer kubectl
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
export KUBECONFIG=~/.kube/config
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc

# Vérifier
kubectl get nodes
# Doit afficher: Ready
```

**Pourquoi?** K3s est le cluster Kubernetes léger qui va héberger vos services.

---

### Étape 3: Configurer Jenkins (2 minutes)

```bash
# Toujours sur la VM
sudo usermod -aG docker jenkins
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo systemctl restart jenkins

# Attendre 30 secondes
sleep 30

# Vérifier
sudo -u jenkins kubectl get nodes
# Doit afficher: Ready
```

**Pourquoi?** Jenkins doit pouvoir exécuter `kubectl` pour déployer sur Kubernetes.

---

### Étape 4: Lancer les builds Jenkins (20 minutes)

Ouvrir Jenkins: `http://VOTRE_VM_IP:8080`

**IMPORTANT: Respecter cet ordre!**

#### 1. eureka-server (3-4 min)
- Aller dans le job `eureka-server`
- Cliquer sur **"Build Now"**
- Attendre que le statut soit **SUCCESS** ✅
- Vérifier: `http://VOTRE_VM_IP:30761`

#### 2. api-gateway (3-4 min)
- Aller dans le job `api-gateway`
- Cliquer sur **"Build Now"**
- Attendre que le statut soit **SUCCESS** ✅
- Vérifier: `http://VOTRE_VM_IP:30080/actuator/health`

#### 3. user-service (4-5 min)
- Aller dans le job `user-service`
- Cliquer sur **"Build Now"**
- Attendre que le statut soit **SUCCESS** ✅

#### 4. job-service (4-5 min)
- Aller dans le job `job-service`
- Cliquer sur **"Build Now"**
- Attendre que le statut soit **SUCCESS** ✅

#### 5. frontend (5-6 min)
- Aller dans le job `frontend`
- Cliquer sur **"Build Now"**
- Attendre que le statut soit **SUCCESS** ✅

**Pourquoi cet ordre?** Eureka doit démarrer en premier pour que les autres services puissent s'y enregistrer.

---

### Étape 5: Déployer le monitoring (2 minutes)

```bash
# Sur la VM
cd ~/Esprit-PIDEV-4SAE3-2026-learnify-offresgestion

# Déployer Prometheus et Grafana
kubectl apply -f kubernetes/monitoring/prometheus-config.yaml
kubectl apply -f kubernetes/monitoring/prometheus.yaml
kubectl apply -f kubernetes/monitoring/grafana.yaml

# Attendre 30 secondes
sleep 30

# Vérifier
kubectl get pods -n pidev | grep -E "prometheus|grafana"
```

**Pourquoi?** Pour avoir le monitoring complet de votre application.

---

### Étape 6: Vérifier le déploiement (2 minutes)

```bash
# Sur la VM
kubectl get pods -n pidev
# Tous les pods doivent être "Running"

kubectl get services -n pidev
# Tous les services doivent être listés

# Obtenir l'IP du node
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "Node IP: ${NODE_IP}"
```

---

### Étape 7: Accéder à l'application (1 minute)

Ouvrir dans votre navigateur:

- **Application**: `http://NODE_IP:30080`
- **Eureka Dashboard**: `http://NODE_IP:30761`
- **Prometheus**: `http://NODE_IP:30090`
- **Grafana**: `http://NODE_IP:30300` (admin/admin123)

---

## ✅ Checklist de vérification

Cochez au fur et à mesure:

- [ ] Code pushé sur GitHub
- [ ] K3s installé (`kubectl get nodes` fonctionne)
- [ ] Jenkins configuré (`sudo -u jenkins kubectl get nodes` fonctionne)
- [ ] Build eureka-server SUCCESS
- [ ] Build api-gateway SUCCESS
- [ ] Build user-service SUCCESS
- [ ] Build job-service SUCCESS
- [ ] Build frontend SUCCESS
- [ ] Monitoring déployé
- [ ] Tous les pods Running
- [ ] Eureka Dashboard accessible
- [ ] 3 services enregistrés dans Eureka (API-GATEWAY, USER-SERVICE, JOB-SERVICE)
- [ ] Frontend accessible
- [ ] Prometheus accessible
- [ ] Grafana accessible

---

## 🆘 En cas de problème

### Problème: kubectl ne fonctionne pas

```bash
sudo systemctl status k3s
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
export KUBECONFIG=~/.kube/config
```

### Problème: Jenkins ne peut pas déployer

```bash
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo systemctl restart jenkins
```

### Problème: Pod en CrashLoopBackOff

```bash
kubectl logs <pod-name> -n pidev
kubectl describe pod <pod-name> -n pidev
```

### Problème: Service non accessible

```bash
sudo ufw allow 30080/tcp
sudo ufw allow 30761/tcp
sudo ufw allow 30090/tcp
sudo ufw allow 30300/tcp
```

---

## 📚 Documentation disponible

Si vous avez besoin de plus de détails:

| Document | Quand l'utiliser |
|----------|------------------|
| **START_HERE_KUBERNETES.md** | Pour un démarrage rapide |
| **ACTION_IMMEDIATE.txt** | Pour une checklist visuelle |
| **GUIDE_KUBERNETES.md** | Pour tous les détails techniques |
| **COMMANDES_KUBERNETES.txt** | Pour les commandes kubectl |
| **ETAPES_MAINTENANT_KUBERNETES.md** | Pour des étapes détaillées |

---

## 🎯 Temps estimé

| Étape | Temps |
|-------|-------|
| Push code | 2 min |
| Installer K3s | 5 min |
| Configurer Jenkins | 2 min |
| Builds Jenkins | 20 min |
| Déployer monitoring | 2 min |
| Vérification | 2 min |
| **TOTAL** | **~35 minutes** |

---

## 🎉 Après avoir terminé

Vous aurez:

✅ Application complète déployée sur Kubernetes  
✅ Pipeline CI/CD fonctionnel  
✅ Monitoring avec Prometheus + Grafana  
✅ Service Discovery avec Eureka  
✅ Tout accessible via navigateur  

**Votre projet DevOps Sprint 3 sera complet !** 🚀

---

## 💡 Conseils

1. **Suivez l'ordre des étapes** - C'est important!
2. **Attendez que chaque build soit SUCCESS** avant de passer au suivant
3. **Vérifiez les logs** si quelque chose ne marche pas
4. **Utilisez la documentation** si vous êtes bloqué

---

**Bon courage !** 🎓

Commencez par l'étape 1: Push vers GitHub
