"""Scrape sample sequences from all major catalog pages."""
import requests
from bs4 import BeautifulSoup
import json
import re
import os
import sys
import time
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def print_flush(*args, **kwargs):
    """Print with immediate flush."""
    print(*args, **kwargs)
    sys.stdout.flush()
    sys.stderr.flush()


def extract_courses_from_cell(course_cell, hours_cell) -> List[Dict]:
    """Extract course codes and credits from a table cell.
    
    Args:
        course_cell: Cell containing course information
        hours_cell: Cell containing credit hours
    
    Returns:
        List of course dictionaries
    """
    courses = []
    
    # Get hours from hours cell
    hours_text = hours_cell.get_text(strip=True) if hours_cell else '3'
    # Clean up hours (handle ranges like "3-4" or "4-3")
    hours_match = re.search(r'(\d+)', hours_text)
    credits = hours_match.group(1) if hours_match else '3'
    
    # Extract course codes from links
    links = course_cell.find_all('a', href=re.compile(r'/search/\?P='))
    for link in links:
        link_text = link.get_text(strip=True)
        # Extract course code (format: DEPT 123)
        code_match = re.search(r'([A-Z]{2,4})\s*(\d{3}[A-Z]?)', link_text, re.IGNORECASE)
        if code_match:
            code = f"{code_match.group(1).upper()} {code_match.group(2)}"
            courses.append({
                'code': code,
                'credits': credits,
                'required': True
            })
    
    # Also try direct text extraction if no links found
    if not courses:
        cell_text = course_cell.get_text(strip=True)
        # Look for course codes in text
        code_matches = re.findall(r'([A-Z]{2,4})\s+(\d{3}[A-Z]?)', cell_text, re.IGNORECASE)
        for dept, num in code_matches:
            code = f"{dept.upper()} {num}"
            courses.append({
                'code': code,
                'credits': credits,
                'required': True
            })
    
    return courses

def extract_sample_sequence(soup: BeautifulSoup) -> Optional[Dict]:
    """Extract sample sequence from catalog page.
    
    Looks for the sample sequence in the 'samplesequencetextcontainer' div.
    """
    sequence = {}
    
    # Method 1: Look for the sample sequence container (most reliable)
    container = soup.find('div', id='samplesequencetextcontainer')
    
    # Method 2: Look for "Sample Sequence" heading and find nearby content
    if not container:
        sample_seq_heading = soup.find(string=re.compile(r'Sample Sequence', re.I))
        if sample_seq_heading:
            container = sample_seq_heading.find_parent(['div', 'section', 'article'])
            if not container:
                # Try to find the next table or div
                container = sample_seq_heading.find_next(['div', 'section'])
    
    if not container:
        return None
    
    # Look for tables in the container
    tables = container.find_all('table', recursive=True)
    
    if not tables:
        return None
    
    # Parse tables - sample sequence usually has year/semester structure
    # Structure: Row 0 = Year header, Row 1 = Semester headers, Row 2+ = Course data
    for table in tables:
        rows = table.find_all('tr')
        if len(rows) < 3:
            continue
        
        current_year = None
        i = 0
        
        while i < len(rows):
            row = rows[i]
            cells = row.find_all(['td', 'th'])
            
            if len(cells) == 0:
                i += 1
                continue
            
            # Check if this is a year header row (usually spans multiple columns or is first cell)
            first_cell_text = cells[0].get_text(strip=True).lower()
            
            # Detect year
            if 'first year' in first_cell_text:
                current_year = 'first_year'
                i += 1
                # Next row should be semester headers
                if i < len(rows):
                    header_row = rows[i]
                    header_cells = header_row.find_all(['td', 'th'])
                    # Check if this is the semester header row
                    header_text = ' '.join([c.get_text(strip=True).lower() for c in header_cells])
                    if 'semester' in header_text or 'hours' in header_text:
                        i += 1
                        # Now process course rows
                        while i < len(rows):
                            course_row = rows[i]
                            course_cells = course_row.find_all(['td', 'th'])
                            
                            # Check if this is a new year header
                            if len(course_cells) > 0:
                                first_cell = course_cells[0].get_text(strip=True).lower()
                                if 'second year' in first_cell:
                                    break
                                elif 'third year' in first_cell:
                                    break
                                elif 'fourth year' in first_cell:
                                    break
                            
                            # Extract fall and spring courses from this row
                            # Structure: [Course Fall | Hours Fall | Course Spring | Hours Spring]
                            if len(course_cells) >= 4:
                                # Fall semester (cells 0 and 1)
                                fall_course_cell = course_cells[0]
                                fall_hours_cell = course_cells[1]
                                
                                # Spring semester (cells 2 and 3)
                                spring_course_cell = course_cells[2]
                                spring_hours_cell = course_cells[3]
                                
                                # Extract fall course
                                fall_courses = extract_courses_from_cell(fall_course_cell, fall_hours_cell)
                                for course in fall_courses:
                                    if current_year not in sequence:
                                        sequence[current_year] = {}
                                    if 'fall' not in sequence[current_year]:
                                        sequence[current_year]['fall'] = {'courses': [], 'total_credits': 0}
                                    sequence[current_year]['fall']['courses'].append(course)
                                
                                # Extract spring course
                                spring_courses = extract_courses_from_cell(spring_course_cell, spring_hours_cell)
                                for course in spring_courses:
                                    if current_year not in sequence:
                                        sequence[current_year] = {}
                                    if 'spring' not in sequence[current_year]:
                                        sequence[current_year]['spring'] = {'courses': [], 'total_credits': 0}
                                    sequence[current_year]['spring']['courses'].append(course)
                            
                            i += 1
                continue
            
            elif 'second year' in first_cell_text:
                current_year = 'second_year'
                i += 1
                if i < len(rows):
                    header_row = rows[i]
                    header_cells = header_row.find_all(['td', 'th'])
                    header_text = ' '.join([c.get_text(strip=True).lower() for c in header_cells])
                    if 'semester' in header_text or 'hours' in header_text:
                        i += 1
                        while i < len(rows):
                            course_row = rows[i]
                            course_cells = course_row.find_all(['td', 'th'])
                            if len(course_cells) > 0:
                                first_cell = course_cells[0].get_text(strip=True).lower()
                                if 'third year' in first_cell or 'fourth year' in first_cell:
                                    break
                            if len(course_cells) >= 4:
                                fall_courses = extract_courses_from_cell(course_cells[0], course_cells[1])
                                spring_courses = extract_courses_from_cell(course_cells[2], course_cells[3])
                                for course in fall_courses:
                                    if current_year not in sequence:
                                        sequence[current_year] = {}
                                    if 'fall' not in sequence[current_year]:
                                        sequence[current_year]['fall'] = {'courses': [], 'total_credits': 0}
                                    sequence[current_year]['fall']['courses'].append(course)
                                for course in spring_courses:
                                    if current_year not in sequence:
                                        sequence[current_year] = {}
                                    if 'spring' not in sequence[current_year]:
                                        sequence[current_year]['spring'] = {'courses': [], 'total_credits': 0}
                                    sequence[current_year]['spring']['courses'].append(course)
                            i += 1
                continue
            
            elif 'third year' in first_cell_text:
                current_year = 'third_year'
                i += 1
                if i < len(rows):
                    header_row = rows[i]
                    header_cells = header_row.find_all(['td', 'th'])
                    header_text = ' '.join([c.get_text(strip=True).lower() for c in header_cells])
                    if 'semester' in header_text or 'hours' in header_text:
                        i += 1
                        while i < len(rows):
                            course_row = rows[i]
                            course_cells = course_row.find_all(['td', 'th'])
                            if len(course_cells) > 0:
                                first_cell = course_cells[0].get_text(strip=True).lower()
                                if 'fourth year' in first_cell:
                                    break
                            if len(course_cells) >= 4:
                                fall_courses = extract_courses_from_cell(course_cells[0], course_cells[1])
                                spring_courses = extract_courses_from_cell(course_cells[2], course_cells[3])
                                for course in fall_courses:
                                    if current_year not in sequence:
                                        sequence[current_year] = {}
                                    if 'fall' not in sequence[current_year]:
                                        sequence[current_year]['fall'] = {'courses': [], 'total_credits': 0}
                                    sequence[current_year]['fall']['courses'].append(course)
                                for course in spring_courses:
                                    if current_year not in sequence:
                                        sequence[current_year] = {}
                                    if 'spring' not in sequence[current_year]:
                                        sequence[current_year]['spring'] = {'courses': [], 'total_credits': 0}
                                    sequence[current_year]['spring']['courses'].append(course)
                            i += 1
                continue
            
            elif 'fourth year' in first_cell_text:
                current_year = 'fourth_year'
                i += 1
                if i < len(rows):
                    header_row = rows[i]
                    header_cells = header_row.find_all(['td', 'th'])
                    header_text = ' '.join([c.get_text(strip=True).lower() for c in header_cells])
                    if 'semester' in header_text or 'hours' in header_text:
                        i += 1
                        while i < len(rows):
                            course_row = rows[i]
                            course_cells = course_row.find_all(['td', 'th'])
                            if len(course_cells) >= 4:
                                fall_courses = extract_courses_from_cell(course_cells[0], course_cells[1])
                                spring_courses = extract_courses_from_cell(course_cells[2], course_cells[3])
                                for course in fall_courses:
                                    if current_year not in sequence:
                                        sequence[current_year] = {}
                                    if 'fall' not in sequence[current_year]:
                                        sequence[current_year]['fall'] = {'courses': [], 'total_credits': 0}
                                    sequence[current_year]['fall']['courses'].append(course)
                                for course in spring_courses:
                                    if current_year not in sequence:
                                        sequence[current_year] = {}
                                    if 'spring' not in sequence[current_year]:
                                        sequence[current_year]['spring'] = {'courses': [], 'total_credits': 0}
                                    sequence[current_year]['spring']['courses'].append(course)
                            i += 1
                continue
            
            i += 1
        
        # Calculate total credits for each semester
        for year in sequence:
            for semester in sequence[year]:
                total = 0
                for course in sequence[year][semester]['courses']:
                    try:
                        credits_str = str(course.get('credits', '3'))
                        # Handle ranges like "3-4" by taking first value
                        credits_val = float(credits_str.split('-')[0].split()[0])
                        total += credits_val
                    except (ValueError, AttributeError):
                        pass
                sequence[year][semester]['total_credits'] = total
    
    return sequence if sequence else None


def scrape_major_sample_sequence(major_url: str, major_name: str) -> Optional[Dict]:
    """Scrape sample sequence for a single major.
    
    Args:
        major_url: URL to the major's catalog page
        major_name: Name of the major
    
    Returns:
        Dictionary with sample sequence or None
    """
    try:
        print_flush(f"  Scraping sample sequence for: {major_name}")
        
        response = requests.get(major_url, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract sample sequence
        sequence = extract_sample_sequence(soup)
        
        if sequence:
            print_flush(f"    ✓ Found sample sequence with {len(sequence)} years")
            return sequence
        else:
            print_flush(f"    ✗ No sample sequence found")
            return None
            
    except Exception as e:
        print_flush(f"    ✗ Error: {str(e)}")
        return None


def scrape_all_sample_sequences():
    """Scrape sample sequences for all majors."""
    # Load major requirements to get URLs
    majors_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'output', 'ml_ready', 'major_requirements.json'
    )
    
    if not os.path.exists(majors_file):
        print_flush(f"Error: {majors_file} not found")
        return
    
    print_flush("Loading major requirements...")
    with open(majors_file, 'r', encoding='utf-8') as f:
        majors_data = json.load(f)
    
    print_flush(f"Found {len(majors_data)} majors\n")
    
    # Output directory
    output_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'output', 'ml_ready'
    )
    os.makedirs(output_dir, exist_ok=True)
    
    sequences = {}
    failed = []
    skipped = 0
    
    for major_name, major_data in majors_data.items():
        major_url = major_data.get('url', '')
        if not major_url:
            skipped += 1
            continue
        
        sequence = scrape_major_sample_sequence(major_url, major_name)
        
        if sequence:
            sequences[major_name] = sequence
        else:
            failed.append(major_name)
        
        # Rate limiting
        time.sleep(1)
        
        # Progress update
        if len(sequences) % 10 == 0:
            print_flush(f"\nProgress: {len(sequences)} sequences scraped, {len(failed)} failed\n")
    
    # Save all sequences
    output_file = os.path.join(output_dir, 'sample_sequences.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(sequences, f, indent=2, ensure_ascii=False)
    
    print_flush(f"\n=== Summary ===")
    print_flush(f"Total majors: {len(majors_data)}")
    print_flush(f"Sequences found: {len(sequences)}")
    print_flush(f"Failed: {len(failed)}")
    print_flush(f"Skipped (no URL): {skipped}")
    print_flush(f"\nSaved to: {output_file}")
    
    if failed:
        print_flush(f"\nFailed majors ({len(failed)}):")
        for major in failed[:20]:  # Show first 20
            print_flush(f"  - {major}")
        if len(failed) > 20:
            print_flush(f"  ... and {len(failed) - 20} more")


if __name__ == '__main__':
    scrape_all_sample_sequences()

