"""
Interactive graph visualization for course prerequisites and postrequisites.
Uses networkx for graph structure and plotly for interactive visualization.
"""

import csv
import networkx as nx
import plotly.graph_objects as go
from collections import defaultdict

def parse_course_relationships(csv_file):
    """Parse CSV and build graph of course relationships."""
    G = nx.DiGraph()
    course_info = {}

    # First pass: collect all course info and normalize course codes
    course_code_map = {}  # Maps normalized code (no space) to actual code (with space)

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            course_code = row['course_code'].strip()
            if not course_code:
                continue

            # Create normalized version (remove spaces for matching)
            normalized_code = course_code.replace(' ', '')
            course_code_map[normalized_code] = course_code

            # Store course information
            course_info[course_code] = {
                'name': row['course_name'],
                'major': row['major_minor'],
                'description': row['description'][:100] + '...' if len(row['description']) > 100 else row['description'],
                'credits': f"{row['credits_min']}-{row['credits_max']}" if row['credits_min'] != row['credits_max'] else row['credits_min']
            }

            # Add node
            G.add_node(course_code)

    # Second pass: add edges using normalized matching
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            course_code = row['course_code'].strip()
            if not course_code:
                continue

            # Parse prerequisites (edges pointing TO this course)
            prerequisites = row['prerequisites'].strip()
            if prerequisites:
                prereq_courses = prerequisites.split()
                for prereq in prereq_courses:
                    if prereq:  # Skip empty strings
                        # Look up the actual course code with space
                        actual_prereq = course_code_map.get(prereq, prereq)
                        if actual_prereq in G:
                            G.add_edge(actual_prereq, course_code, relationship='prerequisite')

            # Parse postrequisites (edges pointing FROM this course)
            postrequisites = row['postrequisites'].strip()
            if postrequisites:
                postreq_courses = postrequisites.split()
                for postreq in postreq_courses:
                    if postreq:  # Skip empty strings
                        # Look up the actual course code with space
                        actual_postreq = course_code_map.get(postreq, postreq)
                        if actual_postreq in G:
                            G.add_edge(course_code, actual_postreq, relationship='postrequisite')

    # Compute transitive closure to include indirect postrequisites
    # This will add edges for all reachable courses, not just direct connections
    print("Computing transitive relationships (this finds all indirect prerequisites/postrequisites)...")

    # Create a copy to iterate over original edges
    original_edges = list(G.edges())

    # For each node, find all descendants (courses that have this as a prerequisite)
    transitive_edges_added = 0
    for node in G.nodes():
        # Find all nodes reachable from this node (all courses that require this course, directly or indirectly)
        descendants = nx.descendants(G, node)
        for descendant in descendants:
            if not G.has_edge(node, descendant):
                G.add_edge(node, descendant, relationship='transitive_postrequisite')
                transitive_edges_added += 1

    print(f"  Added {transitive_edges_added} transitive relationships")
    print(f"  Total edges: {len(original_edges)} direct → {G.number_of_edges()} total")

    return G, course_info

def create_interactive_visualization(G, course_info, filter_major=None):
    """Create interactive plotly visualization of the course graph."""

    # Filter by major if specified
    if filter_major:
        nodes_to_keep = [node for node in G.nodes()
                        if node in course_info and course_info[node]['major'] == filter_major]
        G = G.subgraph(nodes_to_keep).copy()

    # Use hierarchical layout - courses with more connections are more central
    # First try to position nodes hierarchically based on their importance
    pos = nx.spring_layout(G, k=3, iterations=100, seed=42, weight='weight')

    # Create edge traces - differentiate between direct and transitive relationships
    direct_edges_x = []
    direct_edges_y = []
    transitive_edges_x = []
    transitive_edges_y = []

    for edge in G.edges(data=True):
        x0, y0 = pos[edge[0]]
        x1, y1 = pos[edge[1]]

        relationship = edge[2].get('relationship', 'prerequisite')

        if relationship == 'transitive_postrequisite':
            transitive_edges_x.extend([x0, x1, None])
            transitive_edges_y.extend([y0, y1, None])
        else:
            direct_edges_x.extend([x0, x1, None])
            direct_edges_y.extend([y0, y1, None])

    edge_trace = []

    # Transitive edges (lighter, thinner)
    if transitive_edges_x:
        edge_trace.append(
            go.Scatter(
                x=transitive_edges_x,
                y=transitive_edges_y,
                mode='lines',
                line=dict(width=0.3, color='rgba(150, 150, 150, 0.2)'),
                hoverinfo='none',
                showlegend=False
            )
        )

    # Direct edges (darker, thicker)
    if direct_edges_x:
        edge_trace.append(
            go.Scatter(
                x=direct_edges_x,
                y=direct_edges_y,
                mode='lines',
                line=dict(width=1, color='rgba(100, 100, 100, 0.5)'),
                hoverinfo='none',
                showlegend=False
            )
        )

    # Create node trace
    node_x = []
    node_y = []
    node_text = []
    node_size = []
    node_color = []

    for node in G.nodes():
        x, y = pos[node]
        node_x.append(x)
        node_y.append(y)

        # Size nodes based on their degree (number of connections)
        degree = G.in_degree(node) + G.out_degree(node)
        node_size.append(10 + degree * 2)  # Base size + scaling by degree

        # Color by degree (connectivity)
        node_color.append(degree)

        # Create hover text
        if node in course_info:
            info = course_info[node]

            # Count direct vs all prerequisites/postrequisites
            direct_prereqs = sum(1 for pred in G.predecessors(node)
                                if G[pred][node].get('relationship') != 'transitive_postrequisite')
            direct_postreqs = sum(1 for succ in G.successors(node)
                                 if G[node][succ].get('relationship') != 'transitive_postrequisite')
            all_prereqs = len(list(G.predecessors(node)))
            all_postreqs = len(list(G.successors(node)))

            hover_text = f"<b>{node}</b><br>"
            hover_text += f"{info['name']}<br>"
            hover_text += f"Major: {info['major']}<br>"
            hover_text += f"Credits: {info['credits']}<br>"
            hover_text += f"<i>{info['description']}</i><br>"
            hover_text += f"Direct Prerequisites: {direct_prereqs}<br>"
            hover_text += f"All Prerequisites (including indirect): {all_prereqs}<br>"
            hover_text += f"Direct Postrequisites: {direct_postreqs}<br>"
            hover_text += f"All Postrequisites (including indirect): {all_postreqs}<br>"
            hover_text += f"Total connections: {degree}"
            node_text.append(hover_text)
        else:
            node_text.append(f"<b>{node}</b><br>No additional info<br>Total connections: {degree}")

    node_trace = go.Scatter(
        x=node_x,
        y=node_y,
        mode='markers+text',
        text=[node for node in G.nodes()],
        textposition="top center",
        textfont=dict(size=7),
        hovertext=node_text,
        hoverinfo='text',
        marker=dict(
            showscale=True,
            colorscale='YlOrRd',
            color=node_color,
            size=node_size,
            colorbar=dict(
                thickness=15,
                title='Connections',
                xanchor='left'
            ),
            line=dict(width=1.5, color='white'),
            cmin=0,
            cmax=max(node_color) if node_color else 1
        ),
        showlegend=False
    )

    # Create figure
    fig = go.Figure(data=edge_trace + [node_trace],
                   layout=go.Layout(
                       title=dict(
                           text=f'Course Prerequisite/Postrequisite Graph{" - " + filter_major if filter_major else ""}',
                           x=0.5,
                           xanchor='center'
                       ),
                       showlegend=False,
                       hovermode='closest',
                       margin=dict(b=20, l=5, r=5, t=40),
                       xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                       yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                       plot_bgcolor='white',
                       width=1400,
                       height=900
                   ))

    return fig

def get_course_path(G, start_course, end_course):
    """Find prerequisite path between two courses."""
    try:
        path = nx.shortest_path(G, start_course, end_course)
        return path
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return None

def analyze_graph(G, course_info):
    """Print basic graph statistics."""
    print("="*60)
    print("COURSE GRAPH STATISTICS")
    print("="*60)
    print(f"Total courses: {G.number_of_nodes()}")
    print(f"Total prerequisite/postrequisite relationships: {G.number_of_edges()}")
    print(f"\nMost connected courses (by total prerequisites + postrequisites):")

    # Calculate degree (in + out)
    degrees = [(node, G.in_degree(node) + G.out_degree(node)) for node in G.nodes()]
    degrees.sort(key=lambda x: x[1], reverse=True)

    for i, (node, degree) in enumerate(degrees[:10], 1):
        if node in course_info:
            print(f"{i:2d}. {node:12s} - {degree:2d} connections - {course_info[node]['name'][:40]}")

    print(f"\nCourses with most prerequisites (foundational courses):")
    prereqs = [(node, G.out_degree(node)) for node in G.nodes()]
    prereqs.sort(key=lambda x: x[1], reverse=True)

    for i, (node, out_deg) in enumerate(prereqs[:10], 1):
        if node in course_info and out_deg > 0:
            print(f"{i:2d}. {node:12s} - {out_deg:2d} postrequisites - {course_info[node]['name'][:40]}")

    print(f"\nCourses with most postrequisites (advanced courses):")
    postreqs = [(node, G.in_degree(node)) for node in G.nodes()]
    postreqs.sort(key=lambda x: x[1], reverse=True)

    for i, (node, in_deg) in enumerate(postreqs[:10], 1):
        if node in course_info and in_deg > 0:
            print(f"{i:2d}. {node:12s} - {in_deg:2d} prerequisites - {course_info[node]['name'][:40]}")

    print("\n" + "="*60)

def main():
    # Parse the CSV file
    print("Loading course data...")
    G, course_info = parse_course_relationships('courses.csv')

    # Analyze the graph
    analyze_graph(G, course_info)

    # Create full visualization - single comprehensive graph
    print("\nGenerating comprehensive course network visualization...")
    print("Hub courses (high connectivity) will appear larger and more central.")
    fig = create_interactive_visualization(G, course_info)
    fig.write_html('course_network_visualization.html')
    print("✓ Saved: course_network_visualization.html")

    print("\n" + "="*60)
    print("Visualization complete!")
    print("Open 'course_network_visualization.html' in your browser to explore.")
    print("\nKey features:")
    print("  • Node size = number of connections (larger = more connected)")
    print("  • Node color = connectivity (darker red = hub courses)")
    print("  • Dark edges = direct prerequisites")
    print("  • Light edges = indirect/transitive prerequisites")
    print("  • Hover over nodes for detailed course information")
    print("  • Zoom, pan, and interact with the graph")
    print("="*60)

    # Example: Find path between courses
    print("\nExample prerequisite paths:")
    examples = [
        ('MATH221', 'AE443'),
        ('MATH231', 'CS357'),
        ('CHEM102', 'BIOE360')
    ]

    for start, end in examples:
        if start in G and end in G:
            path = get_course_path(G, start, end)
            if path:
                print(f"  {start} → {end}: {' → '.join(path)}")
            else:
                print(f"  {start} → {end}: No path found")

if __name__ == '__main__':
    main()
