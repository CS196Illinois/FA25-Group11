"""GenEd course recommendation service using TF-IDF and MMR."""
import pandas as pd
import numpy as np
import os
from typing import Dict, List, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from fuzzywuzzy import process


class GenedRecommender:
    """Recommends GenEd courses based on student interests and preferences."""
    
    def __init__(self, data_path: Optional[str] = None):
        """Initialize gened recommender.
        
        Args:
            data_path: Path to gened_courses_with_avg_gpa.csv file
        """
        if data_path is None:
            script_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            data_path = os.path.join(script_dir, 'Model', 'gened_courses_with_avg_gpa.csv')
        
        self.data_path = data_path
        self._courses_df: Optional[pd.DataFrame] = None
        self._vectorizer: Optional[TfidfVectorizer] = None
        self._X_tfidf = None
        self._vocab: Optional[set] = None
    
    def warmup(self) -> None:
        """Pre-load all data to avoid first-request delays."""
        import logging
        import time
        logger = logging.getLogger(__name__)
        
        logger.info("[GenedRecommender] Starting warmup - preloading data...")
        start = time.time()
        
        try:
            self._load_courses()  # This also builds TF-IDF
            logger.info(f"[GenedRecommender] Warmup completed in {time.time() - start:.2f}s")
        except Exception as e:
            logger.error(f"[GenedRecommender] Warmup failed: {e}", exc_info=True)
    
    def _load_courses(self) -> pd.DataFrame:
        """Load and prepare GenEd course data."""
        if self._courses_df is None:
            try:
                df = pd.read_csv(self.data_path, encoding='latin-1')
            except Exception:
                df = pd.read_csv(self.data_path)
            
            # Rename columns
            df = df.rename(columns={
                'COURSE': 'code_key',
                'TITLE': 'title',
                'Average_GPA': 'gpa'
            })
            
            # Extract subject and number
            if 'subject' not in df.columns:
                df[['subject', 'number']] = df['code_key'].str.split(r'\s+', n=1, expand=True)
            
            # Build gened categories
            gened_cols = ['ACP', 'CS', 'COMP1', 'HUM', 'NAT', 'QR', 'SBS']
            def make_gened(row):
                categories = []
                for col in gened_cols:
                    if col in row and pd.notna(row[col]) and row[col] != '':
                        categories.append(col)
                # Add cultural studies tags
                if 'US' in str(row.get('CS', '')):
                    categories.append('US')
                if 'WCC' in str(row.get('CS', '')):
                    categories.append('WCC')
                if 'NW' in str(row.get('CS', '')):
                    categories.append('NW')
                return ' '.join(categories)
            
            df['gened'] = df.apply(make_gened, axis=1)
            
            # Create tags from keywords
            vocab = [
                "humanities", "social", "natural", "arts", "composition", "advanced", "lab",
                "cs", "computer", "programming", "math", "statistics", "finance", "economics",
                "history", "biology", "chemistry", "psychology", "design", "business",
                "communication", "media", "society", "writing", "data", "engineering",
                "science", "literature", "culture", "language", "philosophy", "ethics",
                "environment", "health", "education", "political", "gender", "race",
                "architecture", "music", "dance", "theater", "film", "art"
            ]
            
            def make_tags(row):
                txt = f"{row.get('title', '')} {row.get('gened', '')}".lower()
                return ", ".join(sorted({t for t in vocab if t in txt}))
            
            df['tags'] = df.apply(make_tags, axis=1)
            
            # Clean data
            df['title'] = df['title'].fillna('')
            df['gened'] = df['gened'].fillna('')
            df['tags'] = df['tags'].fillna('')
            df['gpa'] = pd.to_numeric(df['gpa'], errors='coerce').fillna(0)
            
            self._courses_df = df
            
            # Build vocabulary
            self._vocab = self._build_vocab()
            
            # Build TF-IDF
            self._build_tfidf()
        
        return self._courses_df
    
    def _build_vocab(self) -> set:
        """Build vocabulary from courses data."""
        df = self._courses_df
        valid = set()
        valid.update(df['subject'].str.lower().unique())
        valid.update(df['tags'].str.lower().str.split(',').explode().str.strip().unique())
        return valid
    
    def _build_tfidf(self):
        """Build TF-IDF vectorizer and transform corpus."""
        df = self._courses_df
        
        def build_text(df: pd.DataFrame) -> pd.Series:
            return (
                df["title"].fillna("").astype(str) + " " +
                df["gened"].fillna("").astype(str) + " " +
                df["tags"].fillna("").astype(str)
            )
        
        corpus = build_text(df)
        self._vectorizer = TfidfVectorizer(
            max_df=0.7,
            min_df=2,
            ngram_range=(1, 2),
            stop_words="english"
        )
        self._X_tfidf = self._vectorizer.fit_transform(corpus)
    
    def _fix_typo(self, text, courses_df):
        """Fix typos in user input using fuzzy matching."""
        valid = self._vocab
        fixed = []
        for word in text.lower().split(','):
            word = word.strip()
            if word:
                match, score = process.extractOne(word, valid)
                fixed.append(match if score > 70 else word)
        return fixed
    
    def recommend_courses(
        self,
        interests: str = "",
        gened_preferences: List[str] = None,
        min_gpa: float = 3.0,
        avoid_subjects: List[str] = None,
        topk: int = 20,
        mmr_lambda: float = 0.7
    ) -> List[Dict]:
        """Recommend GenEd courses based on student profile.
        
        Args:
            interests: Free-form text describing interests
            gened_preferences: List of preferred GenEd categories (e.g., ['HUM', 'CS'])
            min_gpa: Minimum GPA threshold
            avoid_subjects: List of subject codes to avoid (e.g., ['BTW', 'CEE'])
            topk: Number of recommendations to return
            mmr_lambda: MMR diversification parameter (0-1)
        
        Returns:
            List of recommended courses with scores
        """
        # Load data if not already loaded
        df = self._load_courses()
        
        if gened_preferences is None:
            gened_preferences = []
        if avoid_subjects is None:
            avoid_subjects = []
        
        # Fix typos
        interests_fixed = " ".join(self._fix_typo(interests.replace(" ", ","), df)) if interests else ""
        avoid_subjects = self._fix_typo(",".join(avoid_subjects), df) if avoid_subjects else []
        
        # Vectorize interests
        query_vec = self._vectorizer.transform([interests_fixed])
        sims = cosine_similarity(query_vec, self._X_tfidf).flatten()
        
        # GPA boost
        gpa_boost = np.where(
            df["gpa"] >= min_gpa,
            0.2 * (df["gpa"] - min_gpa),
            0.0
        )
        
        # GenEd matching boost
        gened_boost = np.zeros(len(df))
        if gened_preferences:
            for i, row in df.iterrows():
                gened_str = str(row.get("gened", "")).upper()
                matches = sum(1 for pref in gened_preferences if pref.upper() in gened_str)
                gened_boost[i] = 0.15 * matches
        
        # Subject avoidance penalty
        subject_penalty = np.zeros(len(df))
        if avoid_subjects:
            for i, row in df.iterrows():
                subj = str(row.get("subject", "")).upper()
                if subj in [s.upper() for s in avoid_subjects]:
                    subject_penalty[i] = -0.5
        
        # Combined score
        scores = sims + gpa_boost + gened_boost + subject_penalty
        
        # MMR diversification
        def mmr_diversify(scores, X, topk, lambda_param=0.7):
            selected = []
            candidates = np.arange(len(scores))
            
            first = np.argmax(scores)
            selected.append(first)
            candidates = np.delete(candidates, np.where(candidates == first))
            
            while len(selected) < topk and len(candidates) > 0:
                mmr_scores = []
                for c in candidates:
                    relevance = scores[c]
                    if len(selected) > 0:
                        sims_to_selected = cosine_similarity(
                            X[c:c+1], X[selected]
                        ).flatten()
                        max_sim = np.max(sims_to_selected)
                    else:
                        max_sim = 0
                    
                    mmr = lambda_param * relevance - (1 - lambda_param) * max_sim
                    mmr_scores.append(mmr)
                
                best_idx = np.argmax(mmr_scores)
                best_candidate = candidates[best_idx]
                selected.append(best_candidate)
                candidates = np.delete(candidates, best_idx)
            
            return selected
        
        # Get diverse top-k
        top_indices = mmr_diversify(scores, self._X_tfidf, topk, mmr_lambda)
        
        result = df.iloc[top_indices].copy()
        result["score"] = scores[top_indices]
        result = result.sort_values("score", ascending=False)
        
        # Format results
        recommendations = []
        for idx, row in result.head(topk).iterrows():
            recommendations.append({
                "course_code": row.get("code_key", ""),
                "title": row.get("title", ""),
                "gened": row.get("gened", ""),
                "gpa": float(row.get("gpa", 0)),
                "tags": row.get("tags", ""),
                "score": float(row.get("score", 0))
            })
        
        return recommendations


# Singleton instance
_gened_recommender: Optional[GenedRecommender] = None


def get_gened_recommender() -> GenedRecommender:
    """Get singleton gened recommender instance."""
    global _gened_recommender
    if _gened_recommender is None:
        _gened_recommender = GenedRecommender()
    return _gened_recommender

