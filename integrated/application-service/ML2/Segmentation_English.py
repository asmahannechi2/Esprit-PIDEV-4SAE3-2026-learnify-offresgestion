import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

print("🚀 Démarrage de la Segmentation Spécialisée : LEARNIFY ENGLISH")

# 1. Chargement ou Simulation de Données (Spécialisation Anglais)
try:
    offres = pd.read_csv('offres_emploi_600.csv')
    cv_users = pd.read_csv('utilisateurs_cv_.csv')
    
    # Si les données sont en français/tech, on les "anglicise" pour la démonstration
    if 'Développeur' in offres['titre'].values[0]:
        print("⚠️ Données techniques détectées. Conversion en spécialisation Anglais...")
        offres['titre'] = np.random.choice(['English Teacher', 'ESL Instructor', 'IELTS Trainer', 'Business English Coach'], size=len(offres))
        offres['competences'] = np.random.choice(['TEFL, Grammar, British English', 'CELTA, Communication, ESL', 'IELTS, TOEFL, Academic', 'Business English, ESP, Corporate'], size=len(offres))
        
        cv_users['competences_cv'] = np.random.choice(['CELTA certified, 5 years experience', 'Native speaker, TEFL, Phonics', 'IELTS Expert, 8.5 score', 'Business English specialist'], size=len(cv_users))

except Exception as e:
    print("📝 Création de données d'exemple Spécialisées Anglais...")
    offres = pd.DataFrame({
        'id': range(1, 11),
        'titre': ['English Teacher', 'ESL Instructor', 'IELTS Trainer', 'Business English Coach'] * 2 + ['Phonics Specialist', 'University Lecturer'],
        'competences': ['TEFL, Grammar, British English', 'CELTA, Communication, ESL', 'IELTS, TOEFL, Academic', 'Business English, ESP, Corporate'] * 2 + ['Phonics, Kids, Creative', 'Academic Writing, Research, Delta']
    })
    cv_users = pd.DataFrame({
        'id': range(1, 11),
        'nom': [f'Teacher {i}' for i in range(1, 11)],
        'competences_cv': ['CELTA, ESL, Kids', 'TEFL, Grammar, Advanced', 'IELTS, TOEFL, Writing', 'Business English, Management'] * 2 + ['Phonics expert', 'PhD Applied Linguistics, Delta']
    })

# 2. Prétraitement TF-IDF (Spécialisé Anglais)
vectorizer = TfidfVectorizer(stop_words='english')
X_cv = vectorizer.fit_transform(cv_users['competences_cv'])
X_offres = vectorizer.transform(offres['competences'])

# 3. Matching via Similarité Cosinus
print("🔍 Calcul du matching IA...")
similarites = cosine_similarity(X_cv, X_offres)
meilleures_offres_indices = np.argmax(similarites, axis=1)

# Attribution des recommandations
cv_users['offre_recommandee_titre'] = offres.iloc[meilleures_offres_indices]['titre'].values

# 4. Modèle de Classification (Segmentation)
print("📊 Entraînement du modèle de segmentation...")
X = X_cv
y = cv_users['offre_recommandee_titre']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# 5. Évaluation
y_pred = clf.predict(X_test)
print("\n✅ Rapport de Classification (Spécialisation Anglais) :")
print(classification_report(y_test, y_pred))

# 6. Test de prédiction
def predict_job(new_cv_text):
    vec = vectorizer.transform([new_cv_text])
    prediction = clf.predict(vec)
    return prediction[0]

print(f"\n💡 Test d'IA : Un CV avec 'CELTA and IELTS' est segmenté comme : {predict_job('I have a CELTA and 3 years teaching IELTS students')}")
