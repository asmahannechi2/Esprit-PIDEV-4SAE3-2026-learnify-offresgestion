#!/bin/bash

# Script de configuration initiale
# Usage: ./setup.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🔧 Configuration initiale LearnHub DevOps             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Rendre tous les scripts exécutables
echo "📝 Rendre les scripts exécutables..."
chmod +x deploy-all.sh
chmod +x check-system.sh
chmod +x check-sonar.sh
chmod +x disable-sonar-stages.sh

echo "✅ Scripts rendus exécutables :"
echo "   - deploy-all.sh"
echo "   - check-system.sh"
echo "   - check-sonar.sh"
echo "   - disable-sonar-stages.sh"
echo ""

# Afficher les fichiers de documentation
echo "📚 Documentation disponible :"
echo "   - README_DEVOPS.md (Guide complet)"
echo "   - GUIDE_DEPLOIEMENT.md (Guide détaillé)"
echo ""

# Vérifier les prérequis
echo "🔍 Vérification des prérequis..."
echo ""

# Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker installé : $(docker --version)"
else
    echo "❌ Docker non installé"
    echo "   Installation : curl -fsSL https://get.docker.com | sh"
fi

# Git
if command -v git &> /dev/null; then
    echo "✅ Git installé : $(git --version)"
else
    echo "❌ Git non installé"
fi

# Jenkins
if systemctl is-active --quiet jenkins 2>/dev/null; then
    echo "✅ Jenkins actif"
else
    echo "⚠️  Jenkins non actif ou non installé"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  🚀 Prochaines étapes                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Lisez README_DEVOPS.md pour comprendre l'architecture"
echo "2. Poussez les modifications vers Git :"
echo "   git add ."
echo "   git commit -m 'fix: disable SonarQube and add deployment scripts'"
echo "   git push origin main"
echo ""
echo "3. Lancez les builds Jenkins pour créer les images Docker"
echo ""
echo "4. Une fois les builds terminés, déployez avec :"
echo "   ./deploy-all.sh"
echo ""
echo "5. Vérifiez l'état du système avec :"
echo "   ./check-system.sh"
echo ""
echo "✅ Configuration terminée !"
