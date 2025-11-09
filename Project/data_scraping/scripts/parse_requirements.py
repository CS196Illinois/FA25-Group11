"""
Parse scraped major data into structured requirement groups.

This processes all majors and converts raw scraped HTML content into
the structured format needed for the ML model.
"""

import json
import re
import os
from collections import defaultdict


def normalize_course_code(course_code):
    """Normalize course code format."""
    if not course_code:
        return None
    course_code = course_code.strip().upper()
    # Pattern: DEPT123 or DEPT 123
    match = re.match(r'^([A-Z]{2,4})\s*(\d{3}[A-Z]?)$', course_code)
    if match:
        dept = match.group(1)
        number = match.group(2)
        return f"{dept} {number}"
    return course_code


def parse_course_code(text):
    """
    Extract course code from text.
    Examples: 'CS 124', 'MATH 221', 'CS 210 or CS 211'
    Returns list of course codes (normalized)
    """
    if not text:
        return []
    
    # Pattern for course codes like "CS 124" or "MATH 221"
    pattern = r'([A-Z]{2,4})\s*(\d{3}[A-Z]?)'
    matches = re.findall(pattern, text.upper())

    if not matches:
        return []

    courses = [f'{dept} {num}' for dept, num in matches]
    
    # Normalize all courses
    normalized = [normalize_course_code(c) for c in courses]
    normalized = [c for c in normalized if c]
    
    return normalized


def parse_credit_hours(text):
    """
    Extract credit hours from text.
    Examples: '3', '3-4', '1-4'
    """
    pattern = r'(\d+)(?:-(\d+))?'
    match = re.search(pattern, text)

    if not match:
        return None

    if match.group(2):
        return f'{match.group(1)}-{match.group(2)}'
    return int(match.group(1))


def parse_course_table(table_data):
    """
    Parse a course list table into structured courses.

    Table data format from scraper:
    [
        {'code': 'CS 124', 'title': 'Intro to Computer Science', 'hours': '3'},
        {'code': 'CS 128', 'title': 'Intro to CS II', 'hours': '3'},
        {'type': 'choice', 'code': 'IS 307', 'options': ['IS 307', 'IS 308', 'IS 309'], 'hours': '3'},
        ...
    ]
    """
    courses = []

    for item in table_data:
        course = {}

        # Handle sequence courses (co-requisites that must be taken together)
        if item.get('type') == 'sequence' and 'sequence' in item:
            course['type'] = 'sequence'
            course['sequence'] = []
            for seq_code in item['sequence']:
                normalized = normalize_course_code(seq_code)
                if normalized:
                    course['sequence'].append(normalized)
            # Use first course as primary code
            if course['sequence']:
                course['code'] = course['sequence'][0]
        # Handle choice courses (new format from improved scraper)
        elif item.get('type') == 'choice' and 'options' in item:
            # This is a choice course - student can pick one
            course['type'] = 'choice'
            course['options'] = []
            for option_code in item['options']:
                normalized = normalize_course_code(option_code)
                if normalized:
                    course['options'].append(normalized)
            # Use first option as primary code
            if course['options']:
                course['code'] = course['options'][0]
        else:
            # Regular course - parse course code
            if 'code' in item and item['code']:
                codes = parse_course_code(item['code'])
                if codes:
                    if len(codes) == 1:
                        course['code'] = codes[0]
                    else:
                        # Multiple codes found - treat as choice
                        course['type'] = 'choice'
                        course['options'] = codes
                        course['code'] = codes[0]
                else:
                    course['code'] = normalize_course_code(item['code']) or item['code']

        # Parse credit hours
        if 'hours' in item and item['hours']:
            course['credits'] = parse_credit_hours(item['hours'])
        
        # Use structured credit hours if available (from improved scraper)
        if 'hours_min' in item and 'hours_max' in item:
            course['credits_min'] = item['hours_min']
            course['credits_max'] = item['hours_max']
            # Also set credits to range format if not already set
            if 'credits' not in course:
                if item['hours_min'] == item['hours_max']:
                    course['credits'] = item['hours_min']
                else:
                    course['credits'] = f"{item['hours_min']}-{item['hours_max']}"

        # Add title if present
        if 'title' in item and item['title']:
            course['title'] = item['title']

        # Mark as required (default for table courses)
        course['required'] = True

        if course:
            courses.append(course)

    return courses


def identify_selection_rule(group_text):
    """
    Analyze text to determine the selection rule.

    Looks for phrases like:
    - "all courses required" -> all_required
    - "pick 2" / "choose 2" -> pick_n
    - "minimum of 6" / "at least 6" -> pick_n_credits
    """
    text_lower = group_text.lower()

    # Check for "all required"
    if 'all' in text_lower and any(word in text_lower for word in ['required', 'must take']):
        return {'type': 'all_required'}

    # Check for "pick N" or "choose N"
    pick_pattern = r'(?:pick|choose|select|take)\s+(?:at least\s+)?(\d+)'
    match = re.search(pick_pattern, text_lower)
    if match:
        n = int(match.group(1))
        return {
            'type': 'pick_n',
            'min_courses': n
        }

    # Check for credit requirements
    credits_pattern = r'(?:minimum|at least)\s+(?:of\s+)?(\d+)\s+(?:credit\s+)?hours?'
    match = re.search(credits_pattern, text_lower)
    if match:
        credits = int(match.group(1))
        return {
            'type': 'pick_n_credits',
            'min_credits': credits
        }

    # Default: all required
    return {'type': 'all_required'}


def extract_all_course_codes_from_content(content_item):
    """Extract all course codes from any content item (paragraph, list, table, etc.)."""
    course_codes = []
    
    if content_item['type'] == 'paragraph':
        text = content_item.get('content', '')
        course_codes.extend(parse_course_code(text))
    
    elif content_item['type'] == 'list':
        items = content_item.get('content', [])
        for item in items:
            course_codes.extend(parse_course_code(item))
    
    elif content_item['type'] == 'table':
        table_data = content_item.get('content', {})
        if isinstance(table_data, dict) and 'rows' in table_data:
            for row in table_data['rows']:
                for cell in row:
                    course_codes.extend(parse_course_code(cell))
        elif isinstance(table_data, list):
            # Course table format
            for item in table_data:
                # Handle sequence courses (co-requisites)
                if item.get('type') == 'sequence' and 'sequence' in item:
                    for seq_code in item['sequence']:
                        normalized = normalize_course_code(seq_code)
                        if normalized:
                            course_codes.append(normalized)
                # Handle choice courses (new format)
                elif item.get('type') == 'choice' and 'options' in item:
                    for option in item['options']:
                        normalized = normalize_course_code(option)
                        if normalized:
                            course_codes.append(normalized)
                elif 'code' in item:
                    codes = parse_course_code(item['code'])
                    course_codes.extend(codes)
    
    elif content_item['type'] == 'course_descriptions':
        courses = content_item.get('content', [])
        for course in courses:
            if 'title' in course:
                course_codes.extend(parse_course_code(course['title']))
    
    return course_codes


def extract_requirement_groups(major_data):
    """
    Extract requirement groups from scraped major data.
    Enhanced to extract all course codes from all content types.
    """
    degree_reqs = major_data['sections'].get('degree_requirements', [])

    groups = []
    current_group = None
    all_courses_in_major = set()

    for item in degree_reqs:
        # Extract all course codes from this item
        course_codes = extract_all_course_codes_from_content(item)
        all_courses_in_major.update(course_codes)
        
        # Check if this is a section heading
        if item['type'] == 'paragraph':
            text = item['content']
            
            # Extract metadata from paragraph if present
            level_req = item.get('level_requirement')
            credit_req = item.get('credit_requirement')
            para_course_codes = item.get('course_codes', [])

            # Heuristic: if paragraph is short and title-like, it might be a group name
            if len(text) < 150 and any(keyword in text.lower() for keyword in [
                'requirements', 'core', 'electives', 'foundation', 'general education',
                'mathematics', 'science', 'technical', 'advanced', 'free'
            ]):
                # Save previous group
                if current_group:
                    groups.append(current_group)

                # Start new group
                current_group = {
                    'group_name': text,
                    'courses': [],
                    'course_codes': set(),  # Track unique course codes
                    'credits_required': credit_req,  # Use credit requirement if found
                    'level_requirement': level_req,  # Track level requirement
                    'description': []
                }
                # Add course codes from paragraph if any
                if para_course_codes:
                    current_group['course_codes'].update(para_course_codes)
            elif current_group:
                # Add text to group description
                current_group['description'].append(text)
                # Also extract course codes from description text
                current_group['course_codes'].update(course_codes)
                # Update credit requirement if found and not already set
                if credit_req and not current_group.get('credits_required'):
                    current_group['credits_required'] = credit_req
                # Update level requirement if found
                if level_req:
                    current_group['level_requirement'] = level_req

        # Extract courses from tables
        elif item['type'] == 'table' and current_group:
            courses = parse_course_table(item.get('content', []))
            current_group['courses'].extend(courses)
            
            # Extract course codes from table
            for course in courses:
                if 'code' in course:
                    code_value = course['code']
                    # Handle both string and list formats
                    if isinstance(code_value, str):
                        codes = parse_course_code(code_value)
                    elif isinstance(code_value, list):
                        codes = []
                        for c in code_value:
                            codes.extend(parse_course_code(c))
                    else:
                        codes = []
                    current_group['course_codes'].update(codes)

        # Extract from course descriptions
        elif item['type'] == 'course_descriptions' and current_group:
            courses = item.get('content', [])
            for course in courses:
                course_info = {}
                if 'title' in course:
                    codes = parse_course_code(course['title'])
                    if codes:
                        course_info['code'] = codes[0] if len(codes) == 1 else codes
                        course_info['type'] = 'choice' if len(codes) > 1 else 'single'
                        if len(codes) > 1:
                            course_info['options'] = codes
                if 'credit_hours' in course:
                    course_info['credits'] = parse_credit_hours(course['credit_hours'])
                if course_info:
                    current_group['courses'].append(course_info)
                    if codes:
                        current_group['course_codes'].update(codes)

    # Save last group
    if current_group:
        groups.append(current_group)

    # Convert sets to lists for JSON serialization
    for group in groups:
        group['course_codes'] = sorted(list(group['course_codes']))

    return groups, sorted(list(all_courses_in_major))


def extract_focus_areas(major_data):
    """
    Extract focus areas/concentrations from major data.
    Looks for patterns like "Focus Area", "Concentration", "Specialization"
    """
    focus_areas = []
    degree_reqs = major_data['sections'].get('degree_requirements', [])
    
    current_focus_area = None
    
    for item in degree_reqs:
        if item['type'] == 'paragraph':
            text = item['content'].lower()
            # Check if this is a focus area heading
            if any(keyword in text for keyword in ['focus area', 'concentration', 'specialization', 'track']):
                # Save previous focus area
                if current_focus_area and current_focus_area.get('courses'):
                    focus_areas.append(current_focus_area)
                
                # Start new focus area
                current_focus_area = {
                    'name': item['content'],
                    'courses': [],
                    'course_codes': set()
                }
            elif current_focus_area:
                # Extract course codes from description
                codes = extract_all_course_codes_from_content(item)
                current_focus_area['course_codes'].update(codes)
        
        elif item['type'] == 'table' and current_focus_area:
            # Extract courses from table
            if isinstance(item.get('content'), list):
                for course_item in item['content']:
                    if 'code' in course_item:
                        codes = parse_course_code(course_item['code'])
                        current_focus_area['course_codes'].update(codes)
                        current_focus_area['courses'].append({
                            'code': course_item.get('code', ''),
                            'title': course_item.get('title', ''),
                            'hours': course_item.get('hours', '')
                        })
    
    # Save last focus area
    if current_focus_area and current_focus_area.get('courses'):
        focus_areas.append(current_focus_area)
    
    # Convert sets to lists
    for area in focus_areas:
        area['course_codes'] = sorted(list(area['course_codes']))
    
    return focus_areas


def parse_sample_sequence(major_data):
    """
    Parse sample semester sequence from major data.
    Returns structured sequence with courses per semester.
    Handles both table format and list format.
    """
    sample_seq = major_data['sections'].get('sample_sequence', [])
    
    if not sample_seq:
        return None
    
    sequence = {
        'semesters': [],
        'total_semesters': 0
    }
    
    # Look for tables with semester information
    for item in sample_seq:
        if item['type'] == 'table':
            table_data = item.get('content', {})
            
            # Check if it's a table with headers (semester sequence table)
            if isinstance(table_data, dict) and 'headers' in table_data:
                headers = table_data.get('headers', [])
                rows = table_data.get('rows', [])
                
                # Find semester columns (e.g., "First Semester", "Second Semester", "Fall", "Spring")
                semester_cols = []
                for i, header in enumerate(headers):
                    header_lower = str(header).lower()
                    if any(keyword in header_lower for keyword in ['semester', 'fall', 'spring', 'summer', 'year']):
                        semester_cols.append((i, str(header)))
                
                # Extract courses from each semester column
                for col_idx, sem_name in semester_cols:
                    semester_courses = []
                    semester_codes = set()
                    
                    for row in rows:
                        if col_idx < len(row):
                            cell_content = str(row[col_idx])
                            # Extract course codes from cell
                            codes = parse_course_code(cell_content)
                            if codes:
                                semester_codes.update(codes)
                                semester_courses.append({
                                    'text': cell_content,
                                    'course_codes': codes
                                })
                    
                    if semester_codes:
                        sequence['semesters'].append({
                            'semester_name': sem_name,
                            'courses': semester_courses,
                            'course_codes': sorted(list(semester_codes))
                        })
            
            # Also handle list format tables
            elif isinstance(table_data, list):
                for course_item in table_data:
                    if 'code' in course_item:
                        codes = parse_course_code(course_item['code'])
                        if codes:
                            # Create a generic semester entry if none exists
                            if not sequence['semesters']:
                                sequence['semesters'].append({
                                    'semester_name': 'Sample Courses',
                                    'courses': [],
                                    'course_codes': set()
                                })
                            sequence['semesters'][0]['course_codes'].update(codes)
                            sequence['semesters'][0]['courses'].append({
                                'code': course_item.get('code', ''),
                                'title': course_item.get('title', ''),
                                'hours': course_item.get('hours', '')
                            })
        
        # Also check paragraphs and lists for course codes
        elif item['type'] in ['paragraph', 'list']:
            codes = extract_all_course_codes_from_content(item)
            if codes:
                # Add to a generic semester if found
                if not sequence['semesters']:
                    sequence['semesters'].append({
                        'semester_name': 'Sample Courses',
                        'courses': [],
                        'course_codes': set()
                    })
                sequence['semesters'][0]['course_codes'].update(codes)
    
    # Convert any remaining sets to lists
    for sem in sequence['semesters']:
        if isinstance(sem.get('course_codes'), set):
            sem['course_codes'] = sorted(list(sem['course_codes']))
    
    sequence['total_semesters'] = len(sequence['semesters'])
    
    return sequence if sequence['semesters'] else None


def extract_level_requirements(text):
    """
    Extract level requirements from text (e.g., "400-level or higher", "300- or 400-level").
    Returns dict with min_level, max_level if found.
    """
    if not text:
        return None
    
    text_lower = text.lower()
    level_req = {}
    
    # Pattern: "400-level or higher", "300- or 400-level"
    level_match = re.search(r'(\d{3})(?:-|\s+or\s+higher)?\s*level', text_lower)
    if level_match:
        level = int(level_match.group(1))
        if 'or higher' in text_lower or 'and above' in text_lower:
            level_req['min_level'] = level
            level_req['max_level'] = None  # No upper limit
        else:
            level_req['min_level'] = level
            level_req['max_level'] = level
    
    # Pattern: "300- or 400-level"
    range_match = re.search(r'(\d{3})\s*-\s*or\s*(\d{3})\s*level', text_lower)
    if range_match:
        level_req['min_level'] = int(range_match.group(1))
        level_req['max_level'] = int(range_match.group(2))
    
    return level_req if level_req else None


def analyze_major_structure(major_data):
    """
    Parse a single major and create structured requirements.
    Enhanced to extract focus areas, sample sequences, and level requirements.
    """
    # Extract requirement groups
    groups, all_courses = extract_requirement_groups(major_data)
    
    # Extract focus areas
    focus_areas = extract_focus_areas(major_data)
    
    # Parse sample sequence
    sample_sequence = parse_sample_sequence(major_data)
    
    # Extract level requirements from requirement groups
    for group in groups:
        # Check group description for level requirements
        for desc_text in group.get('description', []):
            level_req = extract_level_requirements(desc_text)
            if level_req:
                group['level_requirement'] = level_req
                break
        
        # Also check group name
        if 'level_requirement' not in group:
            level_req = extract_level_requirements(group.get('group_name', ''))
            if level_req:
                group['level_requirement'] = level_req

    # Create structured output
    structured = {
        'major_name': major_data['major_name'],
        'url': major_data['url'],
        'requirement_groups': groups,
        'all_courses': all_courses,
        'total_courses': len(all_courses),
        'focus_areas': focus_areas,
        'sample_sequence': sample_sequence
    }

    return structured


def process_all_majors(majors_dir, output_file):
    """
    Process all majors in the majors directory.
    """
    print("="*80)
    print("PARSING ALL MAJOR REQUIREMENTS")
    print("="*80)
    
    all_majors_structured = {}
    
    # Get all JSON files in majors directory
    major_files = [f for f in os.listdir(majors_dir) if f.endswith('.json') and not f.startswith('_')]
    
    print(f"\nFound {len(major_files)} major files to process...\n")
    
    successful = 0
    failed = []
    
    for i, filename in enumerate(major_files, 1):
        filepath = os.path.join(majors_dir, filename)
        
        try:
            # Load scraped data
            with open(filepath, 'r', encoding='utf-8') as f:
                major_data = json.load(f)
            
            major_name = major_data.get('major_name', filename.replace('.json', ''))
            print(f"[{i}/{len(major_files)}] Processing: {major_name}")
            
            # Parse major
            structured = analyze_major_structure(major_data)
            
            # Store in dictionary
            all_majors_structured[major_name] = structured
            
            print(f"  ✓ Found {len(structured['requirement_groups'])} requirement groups")
            print(f"  ✓ Extracted {structured['total_courses']} unique courses")
            
            successful += 1
            
        except Exception as e:
            print(f"  ✗ ERROR processing {filename}: {e}")
            failed.append({'file': filename, 'error': str(e)})
    
    # Save all structured majors
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_majors_structured, f, indent=2, ensure_ascii=False)
    
    print("\n" + "="*80)
    print("PARSING COMPLETE")
    print("="*80)
    print(f"Successfully processed: {successful}/{len(major_files)} majors")
    print(f"Failed: {len(failed)}")
    print(f"Output saved to: {output_file}")
    
    if failed:
        print("\nFailed majors:")
        for item in failed:
            print(f"  - {item['file']}: {item['error']}")
    
    return all_majors_structured


def main():
    """Main function."""
    # Get paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    majors_dir = os.path.join(project_root, 'raw_data', 'majors')
    output_file = os.path.join(project_root, 'output', 'processed', 'majors_structured.json')
    
    # Process all majors
    process_all_majors(majors_dir, output_file)
    
    print("\n✓ Major requirement parsing complete!")


if __name__ == '__main__':
    main()
