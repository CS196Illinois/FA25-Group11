"""
Align major requirements with courses from all_courses.csv.
Validates course codes exist and links prerequisite chains.
"""

import json
import csv
import os
from collections import defaultdict


def normalize_course_code(course_code):
    """Normalize course code format."""
    if not course_code:
        return None
    course_code = course_code.strip().upper()
    # Pattern: DEPT123 or DEPT 123
    import re
    match = re.match(r'^([A-Z]{2,4})\s*(\d{3}[A-Z]?)$', course_code)
    if match:
        dept = match.group(1)
        number = match.group(2)
        return f"{dept} {number}"
    return course_code


def load_courses(csv_file):
    """Load all courses from CSV and create a lookup dictionary."""
    courses = {}
    print(f"Loading courses from {csv_file}...")
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            course_id = row['course_id'].strip()
            if course_id:
                normalized = normalize_course_code(course_id)
                if normalized:
                    courses[normalized] = {
                        'original_id': course_id,
                        'name': row.get('name', '').strip(),
                        'credits': row.get('credit_hours', '').strip(),
                        'description': row.get('description', '').strip(),
                        'link': row.get('link', '').strip()
                    }
    
    print(f"Loaded {len(courses)} courses")
    return courses


def load_majors_structured(json_file):
    """Load structured major requirements."""
    print(f"Loading majors from {json_file}...")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        majors = json.load(f)
    
    print(f"Loaded {len(majors)} majors")
    return majors


def load_prerequisite_graph(json_file):
    """Load prerequisite graph."""
    print(f"Loading prerequisite graph from {json_file}...")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        prereq_graph = json.load(f)
    
    print(f"Loaded prerequisite graph with {len(prereq_graph)} courses")
    return prereq_graph


def align_major_with_courses(major_name, major_data, courses, prereq_graph):
    """
    Align a major's requirements with course data.
    Returns alignment information including validation results.
    """
    alignment = {
        'major_name': major_name,
        'validated_courses': [],
        'missing_courses': [],
        'courses_with_prereqs': {},
        'total_courses_in_major': len(major_data.get('all_courses', [])),
        'validated_count': 0,
        'missing_count': 0
    }
    
    all_course_codes = major_data.get('all_courses', [])
    
    for course_code in all_course_codes:
        normalized = normalize_course_code(course_code)
        
        if normalized in courses:
            # Course exists in catalog
            course_info = courses[normalized].copy()
            course_info['course_code'] = normalized
            
            # Add prerequisite information
            if normalized in prereq_graph:
                course_info['prerequisites'] = prereq_graph[normalized]
            else:
                course_info['prerequisites'] = []
            
            alignment['validated_courses'].append(course_info)
            alignment['validated_count'] += 1
            
            # Track courses with prerequisites
            if course_info['prerequisites']:
                alignment['courses_with_prereqs'][normalized] = course_info['prerequisites']
        else:
            # Course not found in catalog
            alignment['missing_courses'].append({
                'course_code': course_code,
                'normalized': normalized
            })
            alignment['missing_count'] += 1
    
    return alignment


def create_major_course_alignments(majors, courses, prereq_graph):
    """
    Create alignments for all majors.
    """
    print("\n" + "="*80)
    print("ALIGNING MAJORS WITH COURSES")
    print("="*80)
    
    alignments = {}
    summary_stats = {
        'total_majors': len(majors),
        'total_courses_validated': 0,
        'total_courses_missing': 0,
        'majors_with_missing_courses': 0
    }
    
    for major_name, major_data in majors.items():
        print(f"\nProcessing: {major_name}")
        
        alignment = align_major_with_courses(major_name, major_data, courses, prereq_graph)
        alignments[major_name] = alignment
        
        print(f"  ✓ Validated: {alignment['validated_count']} courses")
        if alignment['missing_count'] > 0:
            print(f"  ⚠ Missing: {alignment['missing_count']} courses")
            summary_stats['majors_with_missing_courses'] += 1
            # Show first few missing courses
            for missing in alignment['missing_courses'][:5]:
                print(f"     - {missing['course_code']}")
            if alignment['missing_count'] > 5:
                print(f"     ... and {alignment['missing_count'] - 5} more")
        
        summary_stats['total_courses_validated'] += alignment['validated_count']
        summary_stats['total_courses_missing'] += alignment['missing_count']
    
    print("\n" + "="*80)
    print("ALIGNMENT SUMMARY")
    print("="*80)
    print(f"Total majors processed: {summary_stats['total_majors']}")
    print(f"Total courses validated: {summary_stats['total_courses_validated']}")
    print(f"Total courses missing: {summary_stats['total_courses_missing']}")
    print(f"Majors with missing courses: {summary_stats['majors_with_missing_courses']}")
    print("="*80)
    
    return alignments, summary_stats


def save_alignments(alignments, summary_stats, output_file):
    """Save alignment data to JSON."""
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    output_data = {
        'summary': summary_stats,
        'alignments': alignments
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved alignments to: {output_file}")


def main():
    """Main function."""
    # Get paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    courses_csv = os.path.join(project_root, 'raw_data', 'all_courses.csv')
    majors_json = os.path.join(project_root, 'output', 'processed', 'majors_structured.json')
    prereq_graph_json = os.path.join(project_root, 'output', 'processed', 'prerequisite_graph.json')
    output_file = os.path.join(project_root, 'output', 'processed', 'major_course_alignments.json')
    
    # Load data
    courses = load_courses(courses_csv)
    majors = load_majors_structured(majors_json)
    
    # Load prerequisite graph if it exists
    prereq_graph = {}
    if os.path.exists(prereq_graph_json):
        prereq_graph = load_prerequisite_graph(prereq_graph_json)
    else:
        print(f"Warning: Prerequisite graph not found at {prereq_graph_json}")
        print("  Run parse_prerequisites.py first to generate it.")
    
    # Create alignments
    alignments, summary_stats = create_major_course_alignments(majors, courses, prereq_graph)
    
    # Save results
    save_alignments(alignments, summary_stats, output_file)
    
    print("\n✓ Major-course alignment complete!")


if __name__ == "__main__":
    main()

