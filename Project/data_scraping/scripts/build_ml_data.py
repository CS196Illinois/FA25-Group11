"""
Build ML-ready data structures from processed course and major data.
Combines prerequisite graphs, major requirements, and course information.
"""

import json
import os
import networkx as nx
from collections import defaultdict


def load_processed_data(project_root):
    """Load all processed data files."""
    data = {}
    
    # Load courses with prerequisites
    courses_file = os.path.join(project_root, 'output', 'processed', 'courses_with_prereqs.json')
    if os.path.exists(courses_file):
        print(f"Loading courses from {courses_file}...")
        with open(courses_file, 'r', encoding='utf-8') as f:
            data['courses'] = json.load(f)
        print(f"  Loaded {len(data['courses'])} courses")
    else:
        print(f"Warning: Courses file not found at {courses_file}")
        data['courses'] = {}
    
    # Load prerequisite graph
    prereq_file = os.path.join(project_root, 'output', 'processed', 'prerequisite_graph.json')
    if os.path.exists(prereq_file):
        print(f"Loading prerequisite graph from {prereq_file}...")
        with open(prereq_file, 'r', encoding='utf-8') as f:
            data['prerequisite_graph'] = json.load(f)
        print(f"  Loaded {len(data['prerequisite_graph'])} course prerequisite relationships")
    else:
        print(f"Warning: Prerequisite graph not found at {prereq_file}")
        data['prerequisite_graph'] = {}
    
    # Load postrequisite graph
    postreq_file = os.path.join(project_root, 'output', 'processed', 'postrequisite_graph.json')
    if os.path.exists(postreq_file):
        print(f"Loading postrequisite graph from {postreq_file}...")
        with open(postreq_file, 'r', encoding='utf-8') as f:
            data['postrequisite_graph'] = json.load(f)
        print(f"  Loaded {len(data['postrequisite_graph'])} course postrequisite relationships")
    else:
        print(f"Warning: Postrequisite graph not found at {postreq_file}")
        data['postrequisite_graph'] = {}
    
    # Load structured majors
    majors_file = os.path.join(project_root, 'output', 'processed', 'majors_structured.json')
    if os.path.exists(majors_file):
        print(f"Loading majors from {majors_file}...")
        with open(majors_file, 'r', encoding='utf-8') as f:
            data['majors'] = json.load(f)
        print(f"  Loaded {len(data['majors'])} majors")
    else:
        print(f"Warning: Majors file not found at {majors_file}")
        data['majors'] = {}
    
    # Load alignments
    alignments_file = os.path.join(project_root, 'output', 'processed', 'major_course_alignments.json')
    if os.path.exists(alignments_file):
        print(f"Loading alignments from {alignments_file}...")
        with open(alignments_file, 'r', encoding='utf-8') as f:
            alignments_data = json.load(f)
            data['alignments'] = alignments_data.get('alignments', {})
        print(f"  Loaded alignments for {len(data['alignments'])} majors")
    else:
        print(f"Warning: Alignments file not found at {alignments_file}")
        data['alignments'] = {}
    
    return data


def build_networkx_graph(prerequisite_graph, courses):
    """
    Build a NetworkX directed graph from prerequisite relationships.
    """
    print("\nBuilding NetworkX graph...")
    G = nx.DiGraph()
    
    # Add all courses as nodes
    for course_code in courses.keys():
        course_info = courses[course_code]
        G.add_node(course_code, **course_info)
    
    # Add edges for prerequisites
    for course, prereqs in prerequisite_graph.items():
        if course in G:
            for prereq in prereqs:
                if prereq in G:
                    G.add_edge(prereq, course)  # Edge from prerequisite to course
    
    print(f"  Graph nodes: {G.number_of_nodes()}")
    print(f"  Graph edges: {G.number_of_edges()}")
    
    return G


def create_course_graph_json(G, output_file):
    """
    Convert NetworkX graph to JSON-serializable format.
    """
    print(f"\nConverting graph to JSON format...")
    
    graph_data = {
        'nodes': [],
        'edges': []
    }
    
    # Add nodes with attributes
    for node, attrs in G.nodes(data=True):
        node_data = {
            'course_code': node,
            'name': attrs.get('name', ''),
            'credits': attrs.get('credits', ''),
            'description': attrs.get('description', '')[:200]  # Truncate long descriptions
        }
        graph_data['nodes'].append(node_data)
    
    # Add edges
    for source, target in G.edges():
        graph_data['edges'].append({
            'from': source,
            'to': target,
            'relationship': 'prerequisite'
        })
    
    # Save to file
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(graph_data, f, indent=2, ensure_ascii=False)
    
    print(f"  Saved {len(graph_data['nodes'])} nodes and {len(graph_data['edges'])} edges")
    print(f"  Output: {output_file}")
    
    return graph_data


def create_major_requirements_ml_format(majors, alignments, courses):
    """
    Create ML-ready format for major requirements.
    Includes prerequisite chains and validated course information.
    """
    print("\nCreating ML-ready major requirements format...")
    
    ml_majors = {}
    
    for major_name, major_data in majors.items():
        alignment = alignments.get(major_name, {})
        validated_courses = alignment.get('validated_courses', [])
        
        # Build course lookup for this major
        course_lookup = {c['course_code']: c for c in validated_courses}
        
        # Process requirement groups
        ml_requirement_groups = []
        for group in major_data.get('requirement_groups', []):
            ml_group = {
                'group_name': group.get('group_name', ''),
                'course_codes': group.get('course_codes', []),
                'courses': []
            }
            
            # Add validated course information
            for course_code in group.get('course_codes', []):
                if course_code in course_lookup:
                    course_info = course_lookup[course_code].copy()
                    # Add prerequisite information
                    if course_code in courses:
                        course_info['prerequisites'] = courses[course_code].get('prerequisites', [])
                        course_info['postrequisites'] = courses[course_code].get('postrequisites', [])
                    ml_group['courses'].append(course_info)
            
            if ml_group['courses']:
                ml_requirement_groups.append(ml_group)
        
        ml_majors[major_name] = {
            'major_name': major_name,
            'url': major_data.get('url', ''),
            'requirement_groups': ml_requirement_groups,
            'all_courses': major_data.get('all_courses', []),
            'validated_courses': [c['course_code'] for c in validated_courses],
            'total_courses': len(major_data.get('all_courses', [])),
            'validated_count': alignment.get('validated_count', 0),
            'missing_count': alignment.get('missing_count', 0)
        }
    
    print(f"  Processed {len(ml_majors)} majors")
    return ml_majors


def save_ml_data(course_graph, major_requirements, output_dir):
    """Save ML-ready data files."""
    os.makedirs(output_dir, exist_ok=True)
    
    # Save course graph
    graph_file = os.path.join(output_dir, 'course_graph.json')
    with open(graph_file, 'w', encoding='utf-8') as f:
        json.dump(course_graph, f, indent=2, ensure_ascii=False)
    print(f"\nSaved course graph to: {graph_file}")
    
    # Save major requirements
    majors_file = os.path.join(output_dir, 'major_requirements.json')
    with open(majors_file, 'w', encoding='utf-8') as f:
        json.dump(major_requirements, f, indent=2, ensure_ascii=False)
    print(f"Saved major requirements to: {majors_file}")


def print_statistics(data, G, ml_majors):
    """Print statistics about the ML-ready data."""
    print("\n" + "="*80)
    print("ML DATA STATISTICS")
    print("="*80)
    
    print(f"\nCourses:")
    print(f"  Total courses: {len(data['courses'])}")
    print(f"  Courses with prerequisites: {sum(1 for c in data['courses'].values() if c.get('prerequisites'))}")
    print(f"  Courses with postrequisites: {sum(1 for c in data['courses'].values() if c.get('postrequisites'))}")
    
    print(f"\nGraph:")
    print(f"  Nodes: {G.number_of_nodes()}")
    print(f"  Edges: {G.number_of_edges()}")
    print(f"  Is DAG: {nx.is_directed_acyclic_graph(G)}")
    
    # Find most connected courses
    in_degrees = dict(G.in_degree())
    out_degrees = dict(G.out_degree())
    
    top_prereqs = sorted(in_degrees.items(), key=lambda x: x[1], reverse=True)[:10]
    top_postreqs = sorted(out_degrees.items(), key=lambda x: x[1], reverse=True)[:10]
    
    print(f"\nTop 10 courses with most prerequisites (foundational):")
    for i, (course, count) in enumerate(top_prereqs[:10], 1):
        course_name = data['courses'].get(course, {}).get('name', 'Unknown')[:50]
        print(f"  {i:2d}. {course:12s} ({count:2d} prerequisites) - {course_name}")
    
    print(f"\nTop 10 courses with most postrequisites (advanced):")
    for i, (course, count) in enumerate(top_postreqs[:10], 1):
        course_name = data['courses'].get(course, {}).get('name', 'Unknown')[:50]
        print(f"  {i:2d}. {course:12s} ({count:2d} postrequisites) - {course_name}")
    
    print(f"\nMajors:")
    print(f"  Total majors: {len(ml_majors)}")
    total_validated = sum(m.get('validated_count', 0) for m in ml_majors.values())
    total_missing = sum(m.get('missing_count', 0) for m in ml_majors.values())
    print(f"  Total validated courses: {total_validated}")
    print(f"  Total missing courses: {total_missing}")
    
    print("="*80)


def main():
    """Main function."""
    # Get paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    output_dir = os.path.join(project_root, 'output', 'ml_ready')
    
    print("="*80)
    print("BUILDING ML-READY DATA")
    print("="*80)
    
    # Load all processed data
    data = load_processed_data(project_root)
    
    if not data['courses']:
        print("\nError: No course data found. Please run parse_prerequisites.py first.")
        return
    
    if not data['majors']:
        print("\nError: No major data found. Please run parse_requirements.py first.")
        return
    
    # Build NetworkX graph
    G = build_networkx_graph(data['prerequisite_graph'], data['courses'])
    
    # Create course graph JSON
    course_graph_file = os.path.join(output_dir, 'course_graph.json')
    course_graph = create_course_graph_json(G, course_graph_file)
    
    # Create ML-ready major requirements
    ml_majors = create_major_requirements_ml_format(data['majors'], data['alignments'], data['courses'])
    
    # Save ML data
    save_ml_data(course_graph, ml_majors, output_dir)
    
    # Print statistics
    print_statistics(data, G, ml_majors)
    
    print("\n✓ ML-ready data build complete!")
    print(f"\nOutput files saved to: {output_dir}")


if __name__ == "__main__":
    main()

