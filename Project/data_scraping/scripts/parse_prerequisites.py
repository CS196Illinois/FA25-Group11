"""
Parse prerequisites from all_courses.csv and build prerequisite/postrequisite graphs.
"""

import csv
import json
import re
import os
from collections import defaultdict


def normalize_course_code(course_code):
    """Normalize course code format (e.g., 'CS124' -> 'CS 124')."""
    if not course_code:
        return None
    
    # Remove extra spaces
    course_code = course_code.strip()
    
    # Pattern: DEPT123 or DEPT 123
    match = re.match(r'^([A-Z]{2,4})\s*(\d{3}[A-Z]?)$', course_code.upper())
    if match:
        dept = match.group(1)
        number = match.group(2)
        return f"{dept} {number}"
    
    return course_code.upper()


def extract_course_codes_from_text(text):
    """
    Extract all course codes from prerequisite text.
    Handles patterns like:
    - "CS 124"
    - "CS 124 or CS 128"
    - "CS 124, CS 128"
    - "CS 100-200 level"
    - "MATH 221 and MATH 231"
    """
    if not text:
        return []
    
    # Pattern to match course codes: DEPT 123 or DEPT123
    pattern = r'([A-Z]{2,4})\s*(\d{3}[A-Z]?)'
    matches = re.findall(pattern, text.upper())
    
    courses = []
    for dept, num in matches:
        course_code = f"{dept} {num}"
        courses.append(course_code)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_courses = []
    for course in courses:
        normalized = normalize_course_code(course)
        if normalized and normalized not in seen:
            seen.add(normalized)
            unique_courses.append(normalized)
    
    return unique_courses


def parse_prerequisites(csv_file):
    """
    Parse prerequisites from all_courses.csv.
    
    Returns:
        dict: {
            'courses': {course_id: {name, credits, description, prerequisites, postrequisites}},
            'prerequisite_graph': {course: [list of prerequisite courses]},
            'postrequisite_graph': {course: [list of courses that require it]}
        }
    """
    courses = {}
    prerequisite_graph = defaultdict(list)
    postrequisite_graph = defaultdict(list)
    
    print(f"Loading courses from {csv_file}...")
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            course_id = row['course_id'].strip()
            if not course_id:
                continue
            
            # Normalize course ID
            normalized_id = normalize_course_code(course_id)
            if not normalized_id:
                continue
            
            # Extract prerequisites from the prerequisite text
            prereq_text = row.get('prerequisite', '').strip()
            prerequisites = extract_course_codes_from_text(prereq_text)
            
            # Normalize prerequisite course codes
            normalized_prereqs = [normalize_course_code(p) for p in prerequisites]
            normalized_prereqs = [p for p in normalized_prereqs if p and p != normalized_id]
            
            # Extract co-requisites
            coreq_text = row.get('corequisite', '').strip()
            corequisites = extract_course_codes_from_text(coreq_text)
            # Also check for [CODES: ...] format we added
            if '[CODES:' in coreq_text:
                codes_match = re.search(r'\[CODES:\s*([^\]]+)\]', coreq_text)
                if codes_match:
                    codes_str = codes_match.group(1)
                    codes_list = [c.strip() for c in codes_str.split(',') if c.strip()]
                    corequisites.extend(codes_list)
            normalized_coreqs = [normalize_course_code(c) for c in corequisites]
            normalized_coreqs = [c for c in normalized_coreqs if c and c != normalized_id]
            
            # Store course information with all new fields
            courses[normalized_id] = {
                'name': row.get('name', '').strip(),
                'credits': row.get('credit_hours', '').strip(),
                'credit_min': row.get('credit_min', ''),
                'credit_max': row.get('credit_max', ''),
                'course_level': row.get('course_level', ''),
                'description': row.get('description', '').strip(),
                'prerequisites': normalized_prereqs,
                'corequisites': normalized_coreqs,
                'gen_ed_categories': [cat.strip() for cat in row.get('gen_ed_categories', '').split(',') if cat.strip()] if row.get('gen_ed_categories') else [],
                'restrictions': row.get('restrictions', '').strip(),
                'repeatable': row.get('repeatable', '').lower() == 'true' if row.get('repeatable') else False,
                'repeat_max_hours': row.get('repeat_max_hours', ''),
                'same_as': [c.strip() for c in row.get('same_as', '').split(',') if c.strip()] if row.get('same_as') else [],
                'postrequisites': [],  # Will be filled in next step
                'link': row.get('link', '').strip()
            }
            
            # Build prerequisite graph (this course requires these)
            prerequisite_graph[normalized_id] = normalized_prereqs
    
    print(f"Loaded {len(courses)} courses")
    print(f"Found {sum(len(prereqs) for prereqs in prerequisite_graph.values())} prerequisite relationships")
    
    # Build postrequisite graph (reverse of prerequisite graph)
    print("Building postrequisite graph...")
    for course, prereqs in prerequisite_graph.items():
        for prereq in prereqs:
            if prereq in courses:  # Only add if prerequisite course exists
                if course not in postrequisite_graph[prereq]:
                    postrequisite_graph[prereq].append(course)
    
    # Update courses with postrequisites
    for course_id, postreqs in postrequisite_graph.items():
        if course_id in courses:
            courses[course_id]['postrequisites'] = sorted(postreqs)
    
    print(f"Found {sum(len(postreqs) for postreqs in postrequisite_graph.values())} postrequisite relationships")
    
    return {
        'courses': courses,
        'prerequisite_graph': dict(prerequisite_graph),
        'postrequisite_graph': dict(postrequisite_graph)
    }


def save_courses_with_prereqs(data, output_file):
    """Save processed course data with prerequisites to JSON."""
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data['courses'], f, indent=2, ensure_ascii=False)
    
    print(f"Saved courses with prerequisites to {output_file}")


def save_graphs(data, output_dir):
    """Save prerequisite and postrequisite graphs separately."""
    os.makedirs(output_dir, exist_ok=True)
    
    prereq_file = os.path.join(output_dir, 'prerequisite_graph.json')
    postreq_file = os.path.join(output_dir, 'postrequisite_graph.json')
    
    with open(prereq_file, 'w', encoding='utf-8') as f:
        json.dump(data['prerequisite_graph'], f, indent=2, ensure_ascii=False)
    
    with open(postreq_file, 'w', encoding='utf-8') as f:
        json.dump(data['postrequisite_graph'], f, indent=2, ensure_ascii=False)
    
    print(f"Saved prerequisite graph to {prereq_file}")
    print(f"Saved postrequisite graph to {postreq_file}")


def analyze_graph_statistics(data):
    """Print statistics about the prerequisite graph."""
    courses = data['courses']
    prereq_graph = data['prerequisite_graph']
    postreq_graph = data['postrequisite_graph']
    
    print("\n" + "="*60)
    print("PREREQUISITE GRAPH STATISTICS")
    print("="*60)
    print(f"Total courses: {len(courses)}")
    print(f"Courses with prerequisites: {sum(1 for prereqs in prereq_graph.values() if prereqs)}")
    print(f"Courses with postrequisites: {sum(1 for postreqs in postreq_graph.values() if postreqs)}")
    
    # Find courses with most prerequisites
    courses_by_prereq_count = sorted(
        [(course, len(prereqs)) for course, prereqs in prereq_graph.items() if prereqs],
        key=lambda x: x[1],
        reverse=True
    )
    
    print(f"\nTop 10 courses with most prerequisites:")
    for i, (course, count) in enumerate(courses_by_prereq_count[:10], 1):
        course_name = courses.get(course, {}).get('name', 'Unknown')
        print(f"  {i:2d}. {course:12s} ({count:2d} prerequisites) - {course_name[:50]}")
    
    # Find courses with most postrequisites (foundational courses)
    courses_by_postreq_count = sorted(
        [(course, len(postreqs)) for course, postreqs in postreq_graph.items() if postreqs],
        key=lambda x: x[1],
        reverse=True
    )
    
    print(f"\nTop 10 foundational courses (most postrequisites):")
    for i, (course, count) in enumerate(courses_by_postreq_count[:10], 1):
        course_name = courses.get(course, {}).get('name', 'Unknown')
        print(f"  {i:2d}. {course:12s} ({count:2d} postrequisites) - {course_name[:50]}")
    
    print("="*60)


def main():
    """Main function."""
    # Get paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    csv_file = os.path.join(project_root, 'raw_data', 'all_courses.csv')
    output_file = os.path.join(project_root, 'output', 'processed', 'courses_with_prereqs.json')
    graphs_dir = os.path.join(project_root, 'output', 'processed')
    
    print("="*80)
    print("PREREQUISITE PARSER")
    print("="*80)
    
    # Parse prerequisites
    data = parse_prerequisites(csv_file)
    
    # Analyze statistics
    analyze_graph_statistics(data)
    
    # Save results
    print("\nSaving results...")
    save_courses_with_prereqs(data, output_file)
    save_graphs(data, graphs_dir)
    
    print("\n✓ Prerequisite parsing complete!")


if __name__ == "__main__":
    main()

