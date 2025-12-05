"""Technical course recommendation service using TF-IDF and rule-based boosting."""
import pandas as pd
import numpy as np
import os
import re
import json
from pathlib import Path
from typing import Dict, List, Set, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from fuzzywuzzy import process

from .prereq_checker import can_take_course, normalize_course_code
from .year_detector import detect_student_year


class TechnicalRecommender:
    """Recommends technical courses based on student interests, completed courses, and major requirements."""
    
    def __init__(
        self,
        majors_file: Optional[str] = None,
        prereq_file: Optional[str] = None,
        postreq_file: Optional[str] = None,
        courses_file: Optional[str] = None
    ):
        """Initialize technical recommender.
        
        Args:
            majors_file: Path to majors_structured.json
            prereq_file: Path to prerequisite_graph.json
            postreq_file: Path to postrequisite_graph.json
            courses_file: Path to all_courses.csv
        """
        script_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        
        if majors_file is None:
            majors_file = os.path.join(script_dir, 'data_scraping', 'output', 'processed', 'majors_structured.json')
        if prereq_file is None:
            prereq_file = os.path.join(script_dir, 'data_scraping', 'output', 'processed', 'prerequisite_graph.json')
        if postreq_file is None:
            postreq_file = os.path.join(script_dir, 'data_scraping', 'output', 'processed', 'postrequisite_graph.json')
        if courses_file is None:
            courses_file = os.path.join(script_dir, 'data_scraping', 'raw_data', 'all_courses.csv')
        
        self.majors_file = majors_file
        self.prereq_file = prereq_file
        self.postreq_file = postreq_file
        self.courses_file = courses_file
        
        self._prereq_graph: Optional[Dict] = None
        self._postreq_graph: Optional[Dict] = None
        self._all_courses_df: Optional[pd.DataFrame] = None
        self._majors_data: Optional[Dict] = None
    
    def _load_json(self, filepath: str) -> Dict:
        """Load JSON file."""
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _load_prereq_graph(self) -> Dict[str, List[str]]:
        """Load prerequisite graph."""
        if self._prereq_graph is None:
            self._prereq_graph = self._load_json(self.prereq_file)
        return self._prereq_graph
    
    def _load_postreq_graph(self) -> Dict[str, List[str]]:
        """Load postrequisite graph."""
        if self._postreq_graph is None:
            self._postreq_graph = self._load_json(self.postreq_file)
        return self._postreq_graph
    
    def _load_majors_data(self) -> Dict:
        """Load majors data."""
        if self._majors_data is None:
            self._majors_data = self._load_json(self.majors_file)
        return self._majors_data
    
    def _load_course_data(self) -> pd.DataFrame:
        """Load course data from CSV."""
        if self._all_courses_df is None:
            df = pd.read_csv(self.courses_file)
            
            # Normalize course_id: turn non-breaking space into a normal space
            df['course_code'] = (
                df['course_id']
                .astype(str)
                .str.replace('\xa0', ' ', regex=False)
                .str.strip()
            )
            
            # Combine name and description for richer text features
            df['text'] = df['name'].fillna('') + ' ' + df['description'].fillna('')
            
            # Extract subject and number from the CLEANED code
            df[['subject', 'number']] = df['course_code'].str.extract(r'^([A-Z]+)\s+(\d+)$')
            
            # Infer level from the numeric part
            def get_level(num_str):
                try:
                    num = int(num_str)
                    if num >= 400:
                        return 'advanced'
                    elif num >= 200:
                        return 'intermediate'
                    else:
                        return 'introductory'
                except Exception:
                    return 'unknown'
            
            df['level'] = df['number'].apply(get_level)
            self._all_courses_df = df
        
        return self._all_courses_df
    
    def _extract_technical_courses(self, major_data: Dict) -> Dict[str, List[str]]:
        """Extract technical courses from major requirements."""
        required_courses = []
        elective_courses = []
        area_courses = []
        
        for group in major_data.get('requirement_groups', []):
            group_name = group.get('group_name', '').lower()
            
            # Check if this is a technical group
            is_technical = any(keyword in group_name for keyword in [
                'technical', 'elective', 'cs ', 'computer science',
                'programming', 'advanced', 'areas', 'specialization',
                'core', 'major', 'concentration'
            ])
            
            is_elective = any(keyword in group_name for keyword in [
                'elective', 'choose', 'select', 'option'
            ])
            
            is_area = 'area' in group_name or 'specialization' in group_name
            
            # Extract courses from this group
            for course in group.get('courses', []):
                if isinstance(course, dict) and 'code' in course:
                    course_code = normalize_course_code(course['code'])
                    
                    if is_area:
                        area_courses.append(course_code)
                    elif is_elective or not course.get('required', True):
                        elective_courses.append(course_code)
                    elif is_technical or course.get('required', False):
                        required_courses.append(course_code)
            
            # Also check course_codes list
            for course_code in group.get('course_codes', []):
                course_code = normalize_course_code(course_code)
                if is_area:
                    area_courses.append(course_code)
                elif is_elective:
                    elective_courses.append(course_code)
                elif is_technical:
                    required_courses.append(course_code)
        
        return {
            'required': list(set(required_courses)),
            'electives': list(set(elective_courses)),
            'areas': list(set(area_courses))
        }
    
    def _create_technical_course_dataframe(
        self,
        technical_courses: List[str],
        all_courses_df: pd.DataFrame,
        prereq_graph: Dict[str, List[str]],
        postreq_graph: Dict[str, List[str]]
    ) -> pd.DataFrame:
        """Create dataframe for technical courses with metadata."""
        # Filter to only technical courses
        df = all_courses_df[all_courses_df['course_code'].isin(technical_courses)].copy()
        
        # Add code column (normalized)
        df['code'] = df['course_code']
        
        # Add prereq and postreq counts
        df['prereq_count'] = df['code'].apply(lambda c: len(prereq_graph.get(c, [])))
        df['postreq_count'] = df['code'].apply(lambda c: len(postreq_graph.get(c, [])))
        
        return df
    
    def _get_course_level(self, course_code: str) -> int:
        """Extract course level from code."""
        if not course_code or not isinstance(course_code, str):
            return 5  # Default to high if can't parse
        
        match = re.match(r'[A-Z]{2,4}\s*(\d)(\d{2})', course_code.upper())
        if match:
            return int(match.group(1))
        return 5  # Default to high if can't parse
    
    def _get_eligible_courses(
        self,
        candidate_courses: List[str],
        courses_completed: List[str],
        courses_in_progress: List[str],
        prereq_graph: Dict[str, List[str]]
    ) -> List[str]:
        """Filter courses based on prerequisites."""
        eligible = []
        completed_or_in_progress = set(courses_completed + courses_in_progress)
        
        for course in candidate_courses:
            # Build course data dict with prerequisites
            course_data = {
                'prerequisites': prereq_graph.get(course, [])
            }
            
            # Use backend's robust prerequisite checking
            can_take, missing = can_take_course(
                course,
                completed_or_in_progress,
                course_data
            )
            
            if can_take:
                eligible.append(course)
        
        return eligible
    
    def _build_text_corpus(self, df: pd.DataFrame) -> pd.Series:
        """Build text corpus from course data."""
        return (
            df["name"].fillna("").astype(str) + " " +
            df["description"].fillna("").astype(str) + " " +
            df["subject"].fillna("").astype(str) + " " +
            df["level"].fillna("").astype(str)
        )
    
    def _calculate_rule_based_boost(
        self,
        course_row: pd.Series,
        student_year: str,
        prefer_foundational: bool = False,
        prefer_advanced: bool = False
    ) -> float:
        """Calculate rule-based boost multiplier for a course."""
        boost = 1.0
        
        # 1. Foundational boost (courses that unlock many others)
        if prefer_foundational and course_row.get('postreq_count', 0) > 5:
            boost *= 1.2  # +20%
        
        # 2. Advanced course preference
        if prefer_advanced and course_row.get('level') == 'advanced':
            boost *= 1.3  # +30%
        
        # 3. Level appropriateness based on student year
        course_level = self._get_course_level(course_row['code'])
        year_to_level = {
            'freshman': 1,
            'sophomore': 2,
            'junior': 3,
            'senior': 4
        }
        expected_level = year_to_level.get(student_year, 2)
        
        # Boost courses at or slightly above student level
        if course_level == expected_level or course_level == expected_level + 1:
            boost *= 1.1  # +10%
        
        # Penalize courses too advanced
        elif course_level > expected_level + 1:
            boost *= 0.7  # -30%
        
        # Penalize very basic courses for advanced students
        elif student_year in ['junior', 'senior'] and course_level <= 1:
            boost *= 0.8  # -20%
        
        return boost
    
    def _mmr_diversify(
        self,
        scores: np.ndarray,
        X: np.ndarray,
        topk: int,
        lambda_param: float = 0.7
    ) -> List[int]:
        """Maximal Marginal Relevance for diversity."""
        selected = []
        candidates = np.arange(len(scores))
        
        # Select highest scoring course first
        first = np.argmax(scores)
        selected.append(first)
        candidates = np.delete(candidates, np.where(candidates == first))
        
        while len(selected) < topk and len(candidates) > 0:
            mmr_scores = []
            for c in candidates:
                relevance = scores[c]
                
                # Calculate similarity to already selected courses
                if len(selected) > 0:
                    sims_to_selected = cosine_similarity(
                        X[c:c+1], X[selected]
                    ).flatten()
                    max_sim = np.max(sims_to_selected)
                else:
                    max_sim = 0
                
                # MMR score: balance relevance and diversity
                mmr = lambda_param * relevance - (1 - lambda_param) * max_sim
                mmr_scores.append(mmr)
            
            # Select best MMR score
            best_idx = np.argmax(mmr_scores)
            best_candidate = candidates[best_idx]
            selected.append(best_candidate)
            candidates = np.delete(candidates, best_idx)
        
        return selected
    
    def recommend_courses(
        self,
        major_name: str,
        completed_courses: List[str],
        interests: str = "",
        courses_in_progress: List[str] = None,
        prefer_foundational: bool = False,
        prefer_advanced: bool = False,
        topk: int = 20,
        mmr_lambda: float = 0.7
    ) -> List[Dict]:
        """Recommend technical courses based on student profile.
        
        Args:
            major_name: Name of the major
            completed_courses: List of completed course codes (from DARS)
            interests: Free-form text describing interests
            courses_in_progress: List of courses currently in progress
            prefer_foundational: Prefer courses that unlock many others
            prefer_advanced: Prefer advanced (400-level) courses
            topk: Number of recommendations to return
            mmr_lambda: MMR diversification parameter (0-1)
        
        Returns:
            List of recommended courses with scores
        """
        if courses_in_progress is None:
            courses_in_progress = []
        
        # Normalize completed courses
        completed_courses = [normalize_course_code(c) for c in completed_courses]
        courses_in_progress = [normalize_course_code(c) for c in courses_in_progress]
        
        # Load data
        majors_data = self._load_majors_data()
        prereq_graph = self._load_prereq_graph()
        postreq_graph = self._load_postreq_graph()
        all_courses_df = self._load_course_data()
        
        # Get major requirements
        if major_name not in majors_data:
            raise ValueError(f"Major '{major_name}' not found")
        
        major_data = majors_data[major_name]
        tech_courses = self._extract_technical_courses(major_data)
        
        # Create course dataframe for this major
        all_technical = tech_courses['required'] + tech_courses['electives'] + tech_courses['areas']
        courses_df = self._create_technical_course_dataframe(
            all_technical, all_courses_df, prereq_graph, postreq_graph
        )
        
        if len(courses_df) == 0:
            return []
        
        # Build TF-IDF for this major's courses
        corpus = self._build_text_corpus(courses_df)
        vectorizer = TfidfVectorizer(
            max_df=0.7,
            min_df=2,
            ngram_range=(1, 2),
            stop_words='english'
        )
        X_tfidf = vectorizer.fit_transform(corpus)
        
        # STEP 1: Rule-Based Filtering (prerequisites)
        all_courses = courses_df['code'].tolist()
        
        # Exclude courses already completed or in-progress
        already_taken = set(completed_courses + courses_in_progress)
        candidate_courses = [c for c in all_courses if c not in already_taken]
        
        eligible_courses = self._get_eligible_courses(
            candidate_courses,
            completed_courses,
            courses_in_progress,
            prereq_graph
        )
        
        # Detect student year for level-based boosting
        student_year = detect_student_year(completed_courses)
        
        # Hard filter for course levels based on student year
        level_filtered = []
        year_to_level = {
            'freshman': 1,
            'sophomore': 2,
            'junior': 3,
            'senior': 4
        }
        max_level_allowed = year_to_level.get(student_year, 2) + 1  # Can take 1 level above
        
        for course in eligible_courses:
            course_level = self._get_course_level(course)
            if course_level <= max_level_allowed:
                level_filtered.append(course)
        
        # Filter dataframe to only eligible courses
        df_eligible = courses_df[courses_df['code'].isin(level_filtered)].copy()
        eligible_indices = df_eligible.index.tolist()
        
        if len(df_eligible) == 0:
            return []
        
        # Get TF-IDF vectors for eligible courses
        X_eligible = X_tfidf[eligible_indices]
        
        # STEP 2: TF-IDF Interest Scoring
        if interests:
            query_vec = vectorizer.transform([interests])
            interest_scores = cosine_similarity(query_vec, X_eligible).flatten()
        else:
            # If no interests, use uniform scores
            interest_scores = np.ones(len(df_eligible)) * 0.1
        
        # STEP 3: Rule-Based Boosting
        rule_boosts = np.array([
            self._calculate_rule_based_boost(
                row,
                student_year,
                prefer_foundational,
                prefer_advanced
            )
            for _, row in df_eligible.iterrows()
        ])
        
        # STEP 4: Combine Scores
        boosted_scores = interest_scores * rule_boosts
        
        # Filter to courses with non-zero interest if interests provided
        if interests:
            non_zero_mask = interest_scores > 0
            if non_zero_mask.sum() > 0:
                df_eligible = df_eligible[non_zero_mask].copy()
                eligible_indices = [idx for idx, mask in zip(eligible_indices, non_zero_mask) if mask]
                X_eligible = X_eligible[non_zero_mask]
                interest_scores = interest_scores[non_zero_mask]
                rule_boosts = rule_boosts[non_zero_mask]
                boosted_scores = boosted_scores[non_zero_mask]
        
        if len(df_eligible) == 0:
            return []
        
        # STEP 5: Apply MMR for Diversity
        top_indices = self._mmr_diversify(
            boosted_scores, X_eligible, min(topk, len(df_eligible)), mmr_lambda
        )
        
        # Get results
        result_df_indices = [eligible_indices[i] for i in top_indices]
        result = courses_df.loc[result_df_indices].copy()
        result['interest_score'] = interest_scores[top_indices]
        result['rule_boost'] = rule_boosts[top_indices]
        result['final_score'] = boosted_scores[top_indices]
        result = result.sort_values('final_score', ascending=False)
        
        # Format results
        recommendations = []
        for idx, row in result.head(topk).iterrows():
            recommendations.append({
                'course_code': row.get('code', ''),
                'title': row.get('name', ''),
                'description': row.get('description', ''),
                'subject': row.get('subject', ''),
                'level': row.get('level', ''),
                'prereq_count': int(row.get('prereq_count', 0)),
                'postreq_count': int(row.get('postreq_count', 0)),
                'interest_score': float(row.get('interest_score', 0)),
                'rule_boost': float(row.get('rule_boost', 1.0)),
                'final_score': float(row.get('final_score', 0))
            })
        
        return recommendations


# Singleton instance
_technical_recommender: Optional[TechnicalRecommender] = None


def get_technical_recommender() -> TechnicalRecommender:
    """Get singleton technical recommender instance."""
    global _technical_recommender
    if _technical_recommender is None:
        _technical_recommender = TechnicalRecommender()
    return _technical_recommender

