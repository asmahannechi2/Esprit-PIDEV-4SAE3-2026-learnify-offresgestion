package pi.integrated.jobservice.service;

import pi.integrated.jobservice.model.Job;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Calcule un score de correspondance (0-100) "avancé" entre une candidature et l'offre.
 * Utilise un algorithme de similarité cosinus sur des vecteurs de mots-clés pondérés.
 */
@Service
public class ApplicationMatchScoreService {
    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
    private final String ML_SERVICE_URL = "http://localhost:5001";

    private static final int MIN_WORD_LENGTH = 3;
    
    private static final Set<String> STOP_WORDS = Set.of(
        "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "have", "has",
        "le", "la", "les", "des", "une", "qui", "que", "est", "son", "ses", "dans", "sur", "avec", "pas", "pour", "par",
        "aux", "du", "ce", "cet", "cette", "ces", "mon", "ma", "mes", "ton", "ta", "tes", "notre", "votre", "leur", "leurs",
        "être", "avoir", "fait", "faire", "plus", "tout", "tous", "toute", "toutes", "autre", "autres", "comme", "sans", "donc", "ainsi",
        "this", "that", "with", "from", "they", "their", "will", "would", "could", "should", "about", "into", "through", "during"
    );

    private static final Map<String, Integer> HARD_SKILLS = Map.ofEntries(
        Map.entry("tefl", 25), Map.entry("tesol", 25), Map.entry("celta", 35), Map.entry("delta", 40),
        Map.entry("ielts", 15), Map.entry("toefl", 15), Map.entry("toeic", 15), Map.entry("cambridge", 10),
        Map.entry("esl", 20), Map.entry("tesl", 20), Map.entry("grammar", 10), Map.entry("vocabulary", 8),
        Map.entry("pronunciation", 10), Map.entry("linguistics", 10), Map.entry("e-learning", 10),
        Map.entry("online", 10), Map.entry("methodology", 10)
    );

    private static final List<String> LANG_LEVELS = List.of("a1", "a2", "b1", "b2", "c1", "c2", "native", "advanced", "proficient");


    public int computeJobMatchScoreForCvText(String cvText, Job job) {
        return calculateAdvancedCorrelation(job, cvText);
    }

    private int calculateAdvancedCorrelation(Job job, String candidateRawText) {
        if (job == null || candidateRawText == null || candidateRawText.isBlank()) return 10;

        try {
            Map<String, String> body = new HashMap<>();
            body.put("cv_text", candidateRawText);
            body.put("job_text", job.getTitre() + " " + job.getRequirements() + " " + job.getDescription());
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(ML_SERVICE_URL + "/match", body, Map.class);
            if (response != null && response.containsKey("score")) {
                return ((Number) response.get("score")).intValue();
            }
        } catch (Exception e) {
            System.err.println("ML Service unreachable, using Java fallback matching.");
        }

        Map<String, Double> jobVector = buildJobVector(job);
        Map<String, Double> candidateVector = buildCandidateVector(candidateRawText);
        double cosineSim = computeCosineSimilarity(jobVector, candidateVector);
        double levelMatch = checkLanguageLevelCompatibility(job, candidateRawText);
        double skillBoost = calculateSkillBoost(jobVector, candidateVector);

        double finalScore = (cosineSim * 70.0) + (levelMatch * 15.0) + (skillBoost * 15.0);
        return (int) Math.min(100, Math.max(0, Math.round(finalScore)));
    }

    private Map<String, Double> buildJobVector(Job job) {
        Map<String, Double> vector = new HashMap<>();
        addTextToVector(vector, job.getTitre(), 5.0);
        addTextToVector(vector, job.getRequirements(), 3.0);
        addTextToVector(vector, job.getDescription(), 1.0);
        return vector;
    }

    private Map<String, Double> buildCandidateVector(String text) {
        Map<String, Double> vector = new HashMap<>();
        addTextToVector(vector, text, 1.0);
        return vector;
    }

    private void addTextToVector(Map<String, Double> vector, String text, double weight) {
        if (text == null || text.isBlank()) return;
        List<String> tokens = tokenize(text);
        for (String token : tokens) {
            if (STOP_WORDS.contains(token)) continue;
            double finalWeight = weight;
            if (HARD_SKILLS.containsKey(token)) {
                finalWeight += HARD_SKILLS.get(token) / 2.0;
            }
            vector.merge(token, finalWeight, Double::sum);
        }
    }

    private double computeCosineSimilarity(Map<String, Double> v1, Map<String, Double> v2) {
        Set<String> both = new HashSet<>(v1.keySet());
        both.retainAll(v2.keySet());
        double dotProduct = 0.0;
        for (String key : both) dotProduct += v1.get(key) * v2.get(key);
        double normA = computeNorm(v1);
        double normB = computeNorm(v2);
        if (normA == 0 || normB == 0) return 0.0;
        return dotProduct / (normA * normB);
    }

    private double computeNorm(Map<String, Double> vector) {
        double sum = 0.0;
        for (double val : vector.values()) sum += val * val;
        return Math.sqrt(sum);
    }

    private double checkLanguageLevelCompatibility(Job job, String candidateText) {
        String jobLevel = detectHighestLevel(job.getTitre() + " " + job.getRequirements());
        String candLevel = detectHighestLevel(candidateText);
        if (jobLevel == null) return 1.0;
        if (candLevel == null) return 0.5;
        int jobIdx = LANG_LEVELS.indexOf(jobLevel);
        int candIdx = LANG_LEVELS.indexOf(candLevel);
        if (candIdx >= jobIdx) return 1.0;
        if (candIdx == jobIdx - 1) return 0.7;
        return 0.3;
    }

    private String detectHighestLevel(String text) {
        if (text == null) return null;
        String t = text.toLowerCase(Locale.ROOT);
        String highest = null;
        for (String level : LANG_LEVELS) {
            if (t.contains(level)) {
                highest = level;
            }
        }
        return highest;
    }

    private double calculateSkillBoost(Map<String, Double> jobV, Map<String, Double> candV) {
        double foundSkillsCount = 0;
        double totalJobHardSkills = 0;
        for (String skill : HARD_SKILLS.keySet()) {
            if (jobV.containsKey(skill)) {
                totalJobHardSkills++;
                if (candV.containsKey(skill)) foundSkillsCount++;
            }
        }
        if (totalJobHardSkills == 0) return 0.5;
        return foundSkillsCount / totalJobHardSkills;
    }

    private static List<String> tokenize(String text) {
        if (text == null || text.isBlank()) return Collections.emptyList();
        return Arrays.stream(text.toLowerCase(Locale.ROOT).split("[\\s\\p{Punct}]+"))
                .map(w -> w.replaceAll("[^a-z0-9àâäéèêëïîôùûüç]", ""))
                .filter(w -> w.length() >= MIN_WORD_LENGTH)
                .collect(Collectors.toList());
    }


    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
