"""Load and cache course and major data."""
import json
import os
from typing import Dict, Any, Optional, List


class DataLoader:
    """Loads and caches course graph and major requirements."""
    
    def __init__(self, data_dir: Optional[str] = None):
        """Initialize data loader.
        
        Args:
            data_dir: Path to data directory. If None, uses default location.
        """
        if data_dir is None:
            # Default to data_scraping/output/ml_ready
            # Go up from backend/app/services to Project, then to data_scraping
            script_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            data_dir = os.path.join(script_dir, 'data_scraping', 'output', 'ml_ready')
        
        self.data_dir = data_dir
        self._course_graph: Optional[Dict[str, Any]] = None
        self._major_requirements: Optional[Dict[str, Any]] = None
        self._courses_by_code: Optional[Dict[str, Dict]] = None
        self._sample_sequences: Optional[Dict[str, Dict]] = None
    
    def load_course_graph(self) -> Dict[str, Any]:
        """Load course graph from JSON file."""
        if self._course_graph is None:
            graph_path = os.path.join(self.data_dir, 'course_graph.json')
            with open(graph_path, 'r', encoding='utf-8') as f:
                self._course_graph = json.load(f)
            
            # Build lookup dictionary for fast course access
            self._courses_by_code = {}
            if 'nodes' in self._course_graph:
                for node in self._course_graph['nodes']:
                    course_code = node.get('course_code', '')
                    if course_code:
                        self._courses_by_code[course_code] = node
        
        return self._course_graph
    
    def load_major_requirements(self) -> Dict[str, Any]:
        """Load major requirements from JSON file."""
        if self._major_requirements is None:
            majors_path = os.path.join(self.data_dir, 'major_requirements.json')
            with open(majors_path, 'r', encoding='utf-8') as f:
                self._major_requirements = json.load(f)
        
        return self._major_requirements
    
    def get_course(self, course_code: str) -> Optional[Dict]:
        """Get course by code."""
        if self._courses_by_code is None:
            self.load_course_graph()
        
        return self._courses_by_code.get(course_code.upper())
    
    def get_major(self, major_name: str) -> Optional[Dict]:
        """Get major requirements by name."""
        if self._major_requirements is None:
            self.load_major_requirements()
        
        return self._major_requirements.get(major_name)
    
    def get_all_majors(self) -> List[Dict[str, str]]:
        """Get list of all available majors."""
        if self._major_requirements is None:
            self.load_major_requirements()
        
        return [
            {
                'name': name,
                'url': data.get('url', '')
            }
            for name, data in self._major_requirements.items()
        ]
    
    def load_sample_sequences(self) -> Dict[str, Any]:
        """Load sample sequences from JSON file."""
        if self._sample_sequences is None:
            # Try to load from consolidated file first (all majors)
            seq_path = os.path.join(self.data_dir, 'sample_sequences.json')
            if os.path.exists(seq_path):
                with open(seq_path, 'r', encoding='utf-8') as f:
                    self._sample_sequences = json.load(f)
            else:
                # Fallback: try CS-specific file
                cs_seq_path = os.path.join(self.data_dir, 'sample_sequence_cs.json')
                if os.path.exists(cs_seq_path):
                    with open(cs_seq_path, 'r', encoding='utf-8') as f:
                        cs_sequence = json.load(f)
                        # Convert to dict format
                        self._sample_sequences = {'Computer Science, BS': cs_sequence}
                else:
                    # Last fallback: check if sequences are in major_requirements
                    if self._major_requirements is None:
                        self.load_major_requirements()
                    
                    self._sample_sequences = {}
                    for major_name, major_data in self._major_requirements.items():
                        if 'sample_sequence' in major_data:
                            self._sample_sequences[major_name] = major_data['sample_sequence']
        
        return self._sample_sequences
    
    def get_sample_sequence(self, major_name: str) -> Optional[Dict]:
        """Get sample sequence for a specific major."""
        if self._sample_sequences is None:
            self.load_sample_sequences()
        
        # Check if we have a direct match
        if major_name in self._sample_sequences:
            return self._sample_sequences[major_name]
        
        # Try fuzzy matching (e.g., "Computer Science, BS" vs "Computer Science")
        for stored_name, sequence in self._sample_sequences.items():
            # Check if major_name contains key parts of stored_name or vice versa
            major_keywords = set(major_name.lower().split())
            stored_keywords = set(stored_name.lower().split())
            
            # If there's significant overlap, it's likely the same major
            if len(major_keywords.intersection(stored_keywords)) >= 2:
                return sequence
        
        # For CS specifically, try loading from file
        if 'Computer Science' in major_name:
            seq_path = os.path.join(self.data_dir, 'sample_sequence_cs.json')
            if os.path.exists(seq_path):
                with open(seq_path, 'r', encoding='utf-8') as f:
                    cs_sequence = json.load(f)
                    return cs_sequence
        
        return None


# Global instance
_data_loader: Optional[DataLoader] = None


def get_data_loader() -> DataLoader:
    """Get or create global data loader instance."""
    global _data_loader
    if _data_loader is None:
        _data_loader = DataLoader()
    return _data_loader

