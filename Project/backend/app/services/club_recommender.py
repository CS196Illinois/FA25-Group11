"""Club recommendation service using TF-IDF and MMR."""
import pandas as pd
import numpy as np
import os
from pathlib import Path
from typing import Dict, List, Set, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from fuzzywuzzy import process


class ClubRecommender:
    """Recommends clubs based on student interests and preferences."""
    
    def __init__(self, clubs_path: Optional[str] = None, tags_path: Optional[str] = None):
        """Initialize club recommender.
        
        Args:
            clubs_path: Path to clubs.csv file
            tags_path: Path to clubs_by_tags.csv file
        """
        if clubs_path is None:
            script_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            clubs_path = os.path.join(script_dir, 'data_scraping', 'raw_data', 'clubs.csv')
        
        if tags_path is None:
            script_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            tags_path = os.path.join(script_dir, 'data_scraping', 'raw_data', 'clubs_by_tags.csv')
        
        self.clubs_path = clubs_path
        self.tags_path = tags_path
        self._clubs_df: Optional[pd.DataFrame] = None
        self._tag_categories: Optional[Dict] = None
        self._vectorizer: Optional[TfidfVectorizer] = None
        self._X_tfidf = None
        self._vocab: Optional[Set[str]] = None
    
    def warmup(self) -> None:
        """Pre-load all data to avoid first-request delays."""
        import logging
        import time
        logger = logging.getLogger(__name__)
        
        logger.info("[ClubRecommender] Starting warmup - preloading data...")
        start = time.time()
        
        try:
            self._load_tag_categories()
            self._load_clubs()  # This also builds TF-IDF
            logger.info(f"[ClubRecommender] Warmup completed in {time.time() - start:.2f}s")
        except Exception as e:
            logger.error(f"[ClubRecommender] Warmup failed: {e}", exc_info=True)
    
    def _load_tag_categories(self) -> Dict[str, List[str]]:
        """Load tag categories from CSV."""
        if self._tag_categories is None:
            try:
                tags_df = pd.read_csv(self.tags_path)
                self._tag_categories = {}
                for _, row in tags_df.iterrows():
                    if 'tag' in row:
                        self._tag_categories[row['tag']] = row
            except Exception as e:
                print(f"Warning: Could not load tag categories: {e}")
                self._tag_categories = {}
        return self._tag_categories
    
    def _load_clubs(self) -> pd.DataFrame:
        """Load and prepare club data."""
        if self._clubs_df is None:
            try:
                df = pd.read_csv(self.clubs_path, encoding='latin-1')
            except Exception:
                df = pd.read_csv(self.clubs_path)
            
            # Clean and prepare data
            df['title'] = df['title'].fillna('')
            df['mission'] = df['mission'].fillna('')
            df['tags'] = df['tags'].fillna('')
            df['membership_benefits'] = df['membership_benefits'].fillna('')
            df['website'] = df['website'].fillna('')
            
            # Extract categories from tags
            def extract_categories(tag_str):
                if pd.isna(tag_str) or tag_str == '':
                    return ''
                
                lines = str(tag_str).split('\n')
                categories = []
                
                for line in lines:
                    if 'Student Organization' in line:
                        continue
                    if ' - ' in line:
                        cats = line.split(' - ', 1)[1] if ' - ' in line else line
                        categories.append(cats.strip())
                
                return ' '.join(categories)
            
            df['clean_tags'] = df['tags'].apply(extract_categories)
            self._clubs_df = df
            
            # Build vocabulary
            self._vocab = self._build_vocab()
            
            # Build TF-IDF
            self._build_tfidf()
        
        return self._clubs_df
    
    def _build_vocab(self) -> Set[str]:
        """Build vocabulary from clubs data."""
        df = self._clubs_df
        tag_categories = self._load_tag_categories()
        
        vocab = set()
        vocab.update(df['clean_tags'].str.lower().str.split().explode().unique())
        vocab.update(df['title'].str.lower().str.split().explode().unique())
        vocab.update(df['mission'].str.lower().str.split().explode().unique())
        vocab.update([t.lower() for t in tag_categories.keys()])
        vocab = {v for v in vocab if isinstance(v, str) and v.strip()}
        return vocab
    
    def _build_tfidf(self):
        """Build TF-IDF vectorizer and transform corpus."""
        df = self._clubs_df
        
        def build_text(df: pd.DataFrame) -> pd.Series:
            return (
                df["title"].fillna("").astype(str) + " " +
                df["mission"].fillna("").astype(str) + " " +
                df["clean_tags"].fillna("").astype(str)
            )
        
        corpus = build_text(df)
        self._vectorizer = TfidfVectorizer(
            max_df=0.7,
            min_df=2,
            ngram_range=(1, 2),
            stop_words="english"
        )
        self._X_tfidf = self._vectorizer.fit_transform(corpus)
    
    def _merge_related_tags(self, user_interests: List[str], tag_categories: Dict) -> Set[str]:
        """Smart tag merging using actual categories."""
        merged_tags = set()
        
        interests_str = ' '.join(user_interests).lower()
        
        tag_rules = {
            'sports': ['Athletic & Recreation', 'Club Sports'],
            'sport': ['Athletic & Recreation', 'Club Sports'],
            'athletic': ['Athletic & Recreation', 'Club Sports'],
            'fitness': ['Athletic & Recreation', 'Club Sports'],
            'exercise': ['Athletic & Recreation', 'Club Sports'],
            'gym': ['Athletic & Recreation', 'Club Sports'],
            'business': ['Business'],
            'professional': ['Business'],
            'career': ['Business'],
            'engineering': ['Engineering & Mathematics'],
            'math': ['Engineering & Mathematics'],
            'art': ['Media Arts', 'Performance Arts'],
            'music': ['Performance Arts'],
            'dance': ['Performance Arts'],
            'theater': ['Performance Arts'],
            'theatre': ['Performance Arts'],
            'performance': ['Performance Arts'],
            'creative': ['Media Arts', 'Performance Arts'],
            'volunteer': ['Community Service & Philanthropy'],
            'service': ['Community Service & Philanthropy'],
            'community': ['Community Service & Philanthropy'],
            'philanthropy': ['Community Service & Philanthropy'],
            'social': ['Social & Leisure', 'Community Service & Philanthropy'],
            'technology': ['Technology'],
            'tech': ['Technology'],
            'computer': ['Technology', 'Information & Data Sciences'],
            'programming': ['Technology'],
            'coding': ['Technology'],
            'data': ['Information & Data Sciences'],
            'science': ['Life & Physical Sciences', 'Social & Behavioral Sciences'],
            'stem': ['Technology', 'Engineering & Mathematics', 'Life & Physical Sciences'],
            'culture': ['Identity & Culture'],
            'cultural': ['Identity & Culture'],
            'identity': ['Identity & Culture'],
            'international': ['International'],
            'health': ['Health & Wellness', 'Health & Human Sciences'],
            'medical': ['Health & Wellness'],
            'medicine': ['Health & Wellness'],
            'wellness': ['Health & Wellness'],
            'activism': ['Advocacy & Activism'],
            'advocacy': ['Advocacy & Activism'],
            'justice': ['Advocacy & Activism'],
            'education': ['Education', 'Pedagogy & Instruction'],
            'teaching': ['Education', 'Pedagogy & Instruction'],
            'faith': ['Faith', 'Religion & Spirituality'],
            'religion': ['Religion & Spirituality'],
            'spiritual': ['Religion & Spirituality'],
            'greek': ['Social Fraternities & Sororities'],
            'fraternity': ['Social Fraternities & Sororities'],
            'sorority': ['Social Fraternities & Sororities'],
            'environment': ['Environmental & Sustainability'],
            'sustainability': ['Environmental & Sustainability'],
            'politics': ['Ideology & Politics'],
            'political': ['Ideology & Politics'],
            'law': ['Law'],
        }
        
        for keyword, tags in tag_rules.items():
            if keyword in interests_str:
                merged_tags.update(tags)
        
        for interest in user_interests:
            if interest in tag_categories:
                merged_tags.add(interest)
        
        return merged_tags
    
    def _fix_typo(self, text_or_list, vocab):
        """Fix typos in user input using fuzzy matching."""
        if isinstance(text_or_list, str):
            items = text_or_list.lower().replace(',', ' ').split()
        else:
            items = [x.lower() for x in text_or_list]
        cleaned = []
        for word in items:
            if word.strip():
                match, score = process.extractOne(word, vocab)
                cleaned.append(match if score > 70 else word)
        return cleaned
    
    def recommend_clubs(
        self,
        interests: str = "",
        preferred_tags: List[str] = None,
        avoid_tags: List[str] = None,
        topk: int = 20,
        mmr_lambda: float = 0.7
    ) -> List[Dict]:
        """Recommend clubs based on student profile.
        
        Args:
            interests: Free-form text describing interests
            preferred_tags: List of preferred club categories
            avoid_tags: List of categories to avoid
            topk: Number of recommendations to return
            mmr_lambda: MMR diversification parameter (0-1)
        
        Returns:
            List of recommended clubs with scores
        """
        # Load data if not already loaded
        df = self._load_clubs()
        tag_categories = self._load_tag_categories()
        
        if preferred_tags is None:
            preferred_tags = []
        if avoid_tags is None:
            avoid_tags = []
        
        # Fix typos
        vocab = self._vocab
        interests_words = self._fix_typo(interests, vocab)
        interests = ' '.join(interests_words)
        preferred_tags = self._fix_typo(preferred_tags, vocab)
        avoid_tags = self._fix_typo(avoid_tags, vocab)
        
        # Apply smart tag merging
        all_interests = interests.split() + preferred_tags
        merged_tags = self._merge_related_tags(all_interests, tag_categories)
        
        # Vectorize interests
        query_vec = self._vectorizer.transform([interests])
        sims = cosine_similarity(query_vec, self._X_tfidf).flatten()
        
        # Tag matching boost
        tag_boost = np.zeros(len(df))
        if merged_tags:
            for i, row in df.iterrows():
                club_tags = str(row.get("clean_tags", "")).lower()
                matches = sum(1 for tag in merged_tags if tag.lower() in club_tags)
                tag_boost[i] = 0.2 * matches
        
        # Tag avoidance penalty
        tag_penalty = np.zeros(len(df))
        if avoid_tags:
            for i, row in df.iterrows():
                club_tags = str(row.get("clean_tags", "")).lower()
                penalties = sum(1 for tag in avoid_tags if tag.lower() in club_tags)
                tag_penalty[i] = -0.3 * penalties
        
        # Combined score
        scores = sims + tag_boost + tag_penalty
        
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
                        sims_to_selected = cosine_similarity(X[c:c+1], X[selected]).flatten()
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
        
        # Get diverse recommendations
        top_indices = mmr_diversify(scores, self._X_tfidf, topk, mmr_lambda)
        
        result = df.iloc[top_indices].copy()
        result["score"] = scores[top_indices]
        result = result.sort_values("score", ascending=False)
        
        # Format results
        recommendations = []
        for idx, row in result.head(topk).iterrows():
            recommendations.append({
                "title": row.get("title", ""),
                "website": row.get("website", ""),
                "mission": row.get("mission", ""),
                "tags": row.get("clean_tags", ""),
                "membership_benefits": row.get("membership_benefits", ""),
                "score": float(row.get("score", 0))
            })
        
        return recommendations


# Singleton instance
_club_recommender: Optional[ClubRecommender] = None


def get_club_recommender() -> ClubRecommender:
    """Get singleton club recommender instance."""
    global _club_recommender
    if _club_recommender is None:
        _club_recommender = ClubRecommender()
    return _club_recommender

