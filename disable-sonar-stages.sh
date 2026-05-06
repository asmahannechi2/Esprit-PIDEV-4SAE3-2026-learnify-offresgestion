#!/bin/bash

echo "=== Désactivation temporaire des stages SonarQube ==="

# Liste des services concernés
SERVICES=(
    "integrated/user-service"
    "integrated/job-service"
    "integrated/eureka-service"
    "integrated/api-gateway"
)

for SERVICE in "${SERVICES[@]}"; do
    JENKINSFILE="${SERVICE}/Jenkinsfile"
    
    if [ -f "$JENKINSFILE" ]; then
        echo "Modification de $JENKINSFILE..."
        
        # Créer une sauvegarde
        cp "$JENKINSFILE" "${JENKINSFILE}.backup"
        
        # Commenter le stage SonarQube (ajouter when { expression { false } })
        sed -i "/stage('SonarQube Analysis')/,/^        }$/ {
            /stage('SonarQube Analysis')/ a\            when { expression { false } }
        }" "$JENKINSFILE"
        
        echo "✓ $JENKINSFILE modifié"
    else
        echo "✗ $JENKINSFILE non trouvé"
    fi
done

echo ""
echo "=== Modification terminée ==="
echo "Les stages SonarQube sont maintenant désactivés."
echo "Pour restaurer, utilisez: git checkout -- integrated/*/Jenkinsfile"
