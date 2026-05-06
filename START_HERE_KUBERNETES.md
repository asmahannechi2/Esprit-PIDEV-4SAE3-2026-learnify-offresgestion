# 🚀 START HERE - Déploiement Kubernetes LearnHub

## 📌 Vous êtes ici

Vous avez maintenant un **projet DevOps complet** avec:
- ✅ Pipeline CI/CD Jenkins
- ✅ Déploiement Kubernetes
- ✅ Monitoring Prometheus + Grafana
- ✅ Service Discovery Eureka

---

## 🎯 3 ÉTAPES RAPIDES

### 1️⃣ Installer K3s (5 minutes)

```bash
# Sur votre VM Jenkins
ssh vagrant@votre-vm-ip

# Installer K3s
curl -sfL https://get.k3s.io | sh -

# Configurer kubectl
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc
source ~/.bashrc

# Vérifier
kubectl get nodes
```

### 2️⃣ Configurer Jenkins (2 minutes)

```bash
# Donner les permissions
sudo usermod -aG docker jenkins
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo systemctl restart jenkins
```

### 3️⃣ Push et Build (20 minutes)

```bash
# Sur votre machine locale
git add .
git commit -m "feat: Kubernetes deployment with monitoring"
git push origin main
```

Puis dans Jenkins (http://VM_IP:8080):
1. Build `eureka-server` → Attendre SUCCESS
2. Build `api-gateway` → Attendre SUCCESS
3. Build `user-service` → Attendre SUCCESS
4. Build `job-service` → Attendre SUCCESS
5. Build `frontend` → Attendre SUCCESS

---

## ✅ Vérification

```bash
# Sur la VM
kubectl get pods -n pidev
kubectl get services -n pidev

# Obtenir l'IP
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "Accéder à: http://${NODE_IP}:30080"
```

---

## 📚 Documentation complète

| Document | Description |
|----------|-------------|
| **GUIDE_KUBERNETES.md** | Guide complet avec tous les détails |
| **ETAPES_MAINTENANT_KUBERNETES.md** | Étapes détaillées à suivre |
| **RESUME_KUBERNETES.txt** | Résumé visuel de l'architecture |
| **kubernetes/README.md** | Documentation des manifestes K8s |

---

## 🌐 URLs d'accès

Remplacez `NODE_IP` par l'IP de votre node:

```bash
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
```

- **Application**: http://NODE_IP:30080
- **Eureka**: http://NODE_IP:30761
- **Prometheus**: http://NODE_IP:30090
- **Grafana**: http://NODE_IP:30300 (admin/admin123)

---

## 🆘 Besoin d'aide ?

### Problème avec K3s ?
```bash
sudo systemctl status k3s
sudo journalctl -u k3s -f
```

### Problème avec Jenkins ?
```bash
sudo systemctl status jenkins
sudo tail -f /var/log/jenkins/jenkins.log
```

### Problème avec un pod ?
```bash
kubectl get pods -n pidev
kubectl logs <pod-name> -n pidev
kubectl describe pod <pod-name> -n pidev
```

---

## 🎉 C'est tout !

Après ces 3 étapes, votre application sera:
- ✅ Déployée sur Kubernetes
- ✅ Accessible via navigateur
- ✅ Monitorée par Prometheus/Grafana
- ✅ Avec Service Discovery Eureka
- ✅ Pipeline CI/CD complet

**Bon courage !** 🚀
