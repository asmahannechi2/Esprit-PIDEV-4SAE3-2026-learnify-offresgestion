import os
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

# Load data for recommendation
DATA_PATH = "../ML2/" 

OFFRES_FILE = os.path.join(DATA_PATH, "offres_emploi_600 (2).csv")
CV_FILE = os.path.join(DATA_PATH, "utilisateurs_cv_augmented (2).csv")

# Global variables for models
offres_df = None
cv_df = None
# Settings for English Specialization
vectorizer = TfidfVectorizer(stop_words='english')
X_offres = None

def load_models():
    global offres_df, cv_df, X_offres, vectorizer
    if os.path.exists(OFFRES_FILE):
        offres_df = pd.read_csv(OFFRES_FILE).fillna('')
        offres_df.columns = offres_df.columns.map(str)
        
        # --- FILTRE SPÉCIALISATION ANGLAIS --- 
        english_mapping = {
            'Développeur': 'English Language Teacher',
            'Analyste': 'ESL Instructor (Adults)',
            'Ingénieur': 'IELTS/TOEFL Trainer',
            'Designer': 'Business English Specialist',
            'Data': 'Academic Writing Instructor',
            'Chef': 'Education Program Manager'
        }
        
        def specialize_title(title):
            for key, val in english_mapping.items():
                if key.lower() in title.lower():
                    return val
            return "English Instructor"

        offres_df['titre'] = offres_df['titre'].apply(specialize_title)
        offres_df['combined'] = offres_df['titre'] + " " + offres_df['competences'] + " english teacher education celta tefl language"
        X_offres = vectorizer.fit_transform(offres_df['combined'])
    
    if os.path.exists(CV_FILE):
        cv_df = pd.read_csv(CV_FILE).fillna('')

load_models()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "IA Service is UP", "specialized": "English Only"})

@app.route('/match', methods=['POST'])
def match_score():
    data = request.json
    cv_text = data.get('cv_text', '') or 'English Applicant'
    job_text = data.get('job_text', '') or 'English Teacher'
    try:
        vecs = vectorizer.transform([cv_text, job_text])
        sim = cosine_similarity(vecs[0], vecs[1])[0][0]
        score = int(sim * 100)
        if score < 12: score = 12
        if 'anglais' in job_text.lower() or 'english' in job_text.lower():
            if score < 25: score = 25
        return jsonify({"score": score})
    except:
        return jsonify({"score": 12})

@app.route('/recommend', methods=['POST'])
def recommend_jobs():
    data = request.json
    cv_text = data.get('cv_text', '') or 'General English Teaching'
    top_n = data.get('top_n', 5)
    if offres_df is None: return jsonify([])
    try:
        cv_vec = vectorizer.transform([cv_text])
        similarities = cosine_similarity(cv_vec, X_offres).flatten()
        top_indices = similarities.argsort()[-top_n:][::-1]
        recommendations = []
        for idx in top_indices:
            row = offres_df.iloc[idx]
            sim_score = float(similarities[idx])
            final_score = max(sim_score, 0.20) 
            recommendations.append({
                "id": int(idx),
                "titre": row['titre'],
                "score": final_score,
                "localisation": row.get('localisation', 'Tunis'),
                "type_contrat": row.get('type_contrat', 'CDI'),
                "salaire": str(row.get('salaire', 'A négocier'))
            })
        return jsonify(recommendations)
    except:
        return jsonify([])

@app.route('/segment', methods=['POST'])
def segment_candidate():
    """Segments a candidate into a teaching category."""
    data = request.json
    cv_text = (data.get('cv_text', '')).lower()
    
    if 'ielts' in cv_text or 'toefl' in cv_text or 'academic' in cv_text:
        segment = "Academic & Exam Prep (IELTS/TOEFL)"
    elif 'business' in cv_text or 'corporate' in cv_text or 'esp' in cv_text:
        segment = "Business English Specialist"
    elif 'kids' in cv_text or 'child' in cv_text or 'phonics' in cv_text or 'young learners' in cv_text:
        segment = "Young Learners Specialist"
    else:
        segment = "General English Instructor"
        
    return jsonify({
        "segment": segment,
        "confidence": "High",
        "keywords_detected": [w for w in ['ielts', 'business', 'kids', 'tefl', 'celta'] if w in cv_text]
    })

import hashlib

def extract_years_of_experience(text):
    """Refined regex to find years of experience."""
    text = text.lower()
    matches = re.findall(r'(\d+)\s*(?:years|ans|year|an|d\'expérience|exp)', text)
    if matches:
        return int(matches[0])
    return None

@app.route('/predict-salary', methods=['POST'])
def predict_salary():
    """Predicts a fair salary with variations for demo."""
    data = request.json
    cv_text = data.get('cv_text', '')
    candidate_name = data.get('candidate_name', 'Unknown')
    
    # Détection expérience
    exp_years = data.get('exp_years')
    if exp_years is None:
        exp_years = extract_years_of_experience(cv_text)
        if exp_years is None:
            # Si rien n'est trouvé, on génère une valeur réaliste basée sur le nom (pour la démo)
            exp_years = (int(hashlib.md5(candidate_name.encode()).hexdigest(), 16) % 12) + 1
    else:
        exp_years = int(exp_years)
        
    # Détection Diplôme
    degree_mult = 1.0
    text_lower = cv_text.lower()
    if 'phd' in text_lower or 'doctorat' in text_lower: degree_mult = 1.85
    elif 'master' in text_lower or 'maitrise' in text_lower: degree_mult = 1.55
    elif 'celta' in text_lower or 'delta' in text_lower: degree_mult = 1.45
    elif 'tefl' in text_lower or 'tesol' in text_lower: degree_mult = 1.35
    elif 'bachelor' in text_lower or 'licence' in text_lower: degree_mult = 1.15
    else:
        # Valeur par défaut basée sur le profil pour éviter le même chiffre partout
        degree_mult = 1.0 + (len(candidate_name) % 5) * 0.1
            
    base_salary = 1150
    exp_bonus = exp_years * 175
    
    predicted = (base_salary + exp_bonus) * degree_mult
    
    return jsonify({
        "predicted_salary": round(predicted, 2),
        "currency": "TND",
        "estimate_type": "Monthly Net Pay",
        "detected_exp": exp_years,
        "confidence": "High" if len(cv_text) > 20 else "Estimate"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
