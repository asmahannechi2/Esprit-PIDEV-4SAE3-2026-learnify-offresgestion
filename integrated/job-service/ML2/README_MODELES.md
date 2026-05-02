# Explication des trois modèles de recommandation et de segmentation

## 1. Système de Recommandation d'Emplois basé sur les Compétences

Ce modèle utilise les compétences extraites des CV utilisateurs et des offres d'emploi pour recommander à chaque utilisateur l'offre la plus adaptée.

- **TF-IDF (Term Frequency-Inverse Document Frequency)** :
  - Transforme les listes de compétences en vecteurs numériques pour chaque CV et chaque offre.
  - Permet de mesurer l'importance d'une compétence dans un document par rapport à l'ensemble du corpus.
- **Cosine Similarity** :
  - Calcule la similarité entre chaque CV et chaque offre d'emploi.
  - L'offre la plus similaire à chaque CV est recommandée.
- **KNN (K-Nearest Neighbors)** :
  - Un modèle de classification supervisée utilisé ici pour prédire le titre de l'offre la plus adaptée à chaque utilisateur.
  - Permet d'évaluer la performance de la recommandation (accuracy).

## 2. Prédiction de Salaire (Prediction_Salarie.ipynb)

Ce modèle vise à prédire le salaire d'un employé à partir de ses caractéristiques (diplôme, expérience, poste, etc.).

- **Prétraitement** :
  - Nettoyage des données, gestion des valeurs manquantes, encodage des variables catégorielles.
- **Modélisation** :
  - Utilisation de modèles de régression (ex : LinearRegression, RandomForestRegressor) pour prédire le salaire.
- **Évaluation** :
  - Mesures de performance comme le RMSE (Root Mean Squared Error) ou le R².

## 3. Segmentation des Utilisateurs (Segmentation (3).ipynb)

Ce modèle segmente les utilisateurs (ou clients) en groupes homogènes selon leurs caractéristiques ou comportements.

- **Prétraitement** :
  - Nettoyage, normalisation des données.
- **Clustering (ex : KMeans)** :
  - Regroupe les utilisateurs en clusters selon la similarité de leurs profils.
- **Visualisation** :
  - Affichage des groupes sur des graphiques pour interpréter les segments.

---

**Résumé** :
- Le modèle de recommandation propose des offres personnalisées selon les compétences.
- Le modèle de prédiction de salaire estime la rémunération attendue selon le profil.
- Le modèle de segmentation regroupe les utilisateurs pour mieux cibler les actions RH ou marketing.

Chaque modèle répond à un besoin spécifique d’analyse ou de valorisation des données RH.
