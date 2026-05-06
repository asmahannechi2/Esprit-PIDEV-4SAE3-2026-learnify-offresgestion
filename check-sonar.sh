#!/bin/bash

echo "=== Vérification de SonarQube ==="

# Vérifier si le conteneur SonarQube existe
if docker ps -a | grep -q sonarqube; then
    echo "✓ Conteneur SonarQube trouvé"
    
    # Vérifier s'il est en cours d'exécution
    if docker ps | grep -q sonarqube; then
        echo "✓ SonarQube est en cours d'exécution"
    else
        echo "✗ SonarQube est arrêté. Démarrage..."
        docker start sonarqube
        echo "⏳ Attente du démarrage de SonarQube (cela peut prendre 1-2 minutes)..."
        sleep 60
    fi
else
    echo "✗ Conteneur SonarQube non trouvé. Création..."
    docker run -d --name sonarqube -p 9000:9000 sonarqube:lts
    echo "⏳ Attente du démarrage de SonarQube (cela peut prendre 2-3 minutes)..."
    sleep 120
fi

# Vérifier l'accessibilité
echo ""
echo "=== Test de connexion ==="
if curl -s http://localhost:9000 > /dev/null; then
    echo "✓ SonarQube est accessible sur http://localhost:9000"
else
    echo "✗ SonarQube n'est pas encore accessible"
    echo "Attendez quelques minutes et vérifiez les logs avec: docker logs sonarqube"
fi
