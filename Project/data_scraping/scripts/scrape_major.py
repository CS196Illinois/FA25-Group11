"""
Scrape a specific major from UIUC undergraduate catalog.
This script extracts all relevant information including requirements, courses, and sequences.
"""

import requests
from bs4 import BeautifulSoup
import json
import re


def scrape_major(url):
    """
    Scrape a major page from the UIUC undergraduate catalog.

    Args:
        url: The URL of the major page

    Returns:
        dict: Structured data containing all major information
    """
    response = requests.get(url)
    response.raise_for_status()

    soup = BeautifulSoup(response.content, 'html.parser')

    # Extract major name and degree
    page_title = soup.find('h1', class_='page-title')
    major_name = page_title.text.strip() if page_title else "Unknown Major"

    major_data = {
        'major_name': major_name,
        'url': url,
        'sections': {}
    }

    # The page uses tabs with specific container IDs
    tab_containers = [
        ('degree_requirements', 'degreerequirementstextcontainer'),
        ('sample_sequence', 'samplesequencetextcontainer'),
        ('learning_outcomes', 'learningoutcomestextcontainer'),
        ('contact_information', 'contactinformationtextcontainer')
    ]

    for section_name, container_id in tab_containers:
        container = soup.find('div', id=container_id)
        if container:
            section_data = extract_section_content(container)
            if section_data:
                major_data['sections'][section_name] = section_data
        else:
            # Some majors might have different structure - try alternative selectors
            if section_name == 'degree_requirements':
                # Try multiple alternative selectors
                alt_containers = [
                    soup.find('div', class_='sc_sccoursedescs'),
                    soup.find('div', id='requirements'),
                    soup.find('div', class_='degree-requirements'),
                    soup.find('div', class_='requirements'),
                    # Try finding by content - look for sections with "requirements" or "degree" in class/id
                    soup.find('div', class_=lambda x: x and ('requirement' in x.lower() or 'degree' in x.lower())),
                    # Check if there's a tab system with different structure
                    soup.find('div', id='degreerequirementstextcontainer'),
                    # Try finding tab content directly
                    soup.find('div', class_='tab-content'),
                    # Last resort: try main content area but be more selective
                    soup.find('main') or (soup.find('div', class_='main-content') if soup.find('div', class_='main-content') and soup.find('div', class_='main-content').find('table') else None)
                ]
                for alt_container in alt_containers:
                    if alt_container:
                        section_data = extract_section_content(alt_container)
                        if section_data and len(section_data) > 0:
                            # Make sure we actually found meaningful content (not just empty paragraphs)
                            meaningful_items = [item for item in section_data if item.get('type') in ['table', 'list'] or (item.get('type') == 'paragraph' and len(item.get('content', '')) > 50)]
                            if meaningful_items:
                                major_data['sections'][section_name] = section_data
                                break

    return major_data


def extract_section_content(container):
    """Extract all content from a tab container."""
    import re
    content = []

    for element in container.find_all(['h2', 'h3', 'h4', 'p', 'ul', 'ol', 'table'], recursive=False):
        if element.name in ['h2', 'h3', 'h4']:
            content.append({
                'type': 'heading',
                'level': element.name,
                'content': element.text.strip()
            })

        elif element.name == 'p':
            text = element.text.strip()
            if text and len(text) > 0:
                paragraph_data = {'type': 'paragraph', 'content': text}
                # Extract course codes mentioned in paragraph
                course_codes = re.findall(r'\b([A-Z]{2,4})\s+(\d{3}[A-Z]?)\b', text)
                if course_codes:
                    paragraph_data['course_codes'] = [f"{dept} {num}" for dept, num in course_codes]
                # Check for level requirements (e.g., "300-level or higher", "400-level courses")
                level_req = re.search(r'(\d{3})[-\s]*(?:level|or higher)', text, re.IGNORECASE)
                if level_req:
                    paragraph_data['level_requirement'] = level_req.group(1)
                # Check for credit hour requirements (e.g., "9 hours", "12-13 hours")
                credit_req = re.search(r'(\d+)(?:-(\d+))?\s*hours?', text, re.IGNORECASE)
                if credit_req:
                    if credit_req.group(2):
                        paragraph_data['credit_requirement'] = f"{credit_req.group(1)}-{credit_req.group(2)}"
                    else:
                        paragraph_data['credit_requirement'] = credit_req.group(1)
                content.append(paragraph_data)

        elif element.name in ['ul', 'ol']:
            items = [li.text.strip() for li in element.find_all('li', recursive=False)]
            if items:
                list_data = {'type': 'list', 'list_type': element.name, 'content': items}
                # Extract course codes from list items
                all_codes = []
                for item in items:
                    codes = re.findall(r'\b([A-Z]{2,4})\s+(\d{3}[A-Z]?)\b', item)
                    all_codes.extend([f"{dept} {num}" for dept, num in codes])
                if all_codes:
                    list_data['course_codes'] = all_codes
                content.append(list_data)

        elif element.name == 'table':
            # Check if it's a course list table
            if 'sc_courselist' in element.get('class', []):
                table_data = extract_course_table(element)
            else:
                table_data = extract_table(element)

            if table_data:
                content.append({'type': 'table', 'content': table_data})

    # Also check for any nested divs with course blocks
    course_divs = container.find_all('div', class_='sc_sccoursedescs')
    for div in course_divs:
        courses = extract_courses_from_desc(div)
        if courses:
            content.append({'type': 'course_descriptions', 'content': courses})

    return content if content else None


def extract_course_table(table_element):
    """Extract course information from course list tables."""
    import re
    courses = []

    tbody = table_element.find('tbody')
    if not tbody:
        return None

    rows = list(tbody.find_all('tr', recursive=False))
    i = 0
    
    while i < len(rows):
        tr = rows[i]
        # Skip header or summary rows
        if tr.find('th'):
            i += 1
            continue

        course_data = {}

        # Get course code and title
        title_cell = tr.find('td', class_='codecol')
        if title_cell:
            # Extract course code - first try link, then extract from text
            code_elem = title_cell.find('a')
            if code_elem:
                code_text = code_elem.text.strip()
                # Normalize whitespace (replace non-breaking spaces, etc.)
                code_text = re.sub(r'\s+', ' ', code_text)
                course_data['code'] = code_text
            else:
                # No link - try to extract course code from text
                full_text = title_cell.get_text(strip=True)
                # Normalize whitespace
                full_text = re.sub(r'\s+', ' ', full_text)
                code_match = re.match(r'^([A-Z]{2,4})\s+(\d{3}[A-Z]?)', full_text, re.IGNORECASE)
                if code_match:
                    course_data['code'] = f"{code_match.group(1).upper()} {code_match.group(2)}"

            # Extract course title (often in a separate span or after the code)
            title_text = title_cell.get_text(strip=True)
            # Remove the code from the title to get just the name
            if 'code' in course_data:
                title_text = title_text.replace(course_data['code'], '').strip()
            
            # Check for co-requisite sequences (courses that must be taken together, marked with "&")
            if '&' in title_text or title_text.startswith('&'):
                # This is a co-requisite sequence
                all_codes_in_text = re.findall(r'([A-Z]{2,4})\s+(\d{3}[A-Z]?)', title_cell.get_text(), re.IGNORECASE)
                if all_codes_in_text:
                    course_data['type'] = 'sequence'
                    course_data['sequence'] = [f"{dept.upper()} {num}" for dept, num in all_codes_in_text]
                    # Primary code is the first one
                    if 'code' not in course_data:
                        course_data['code'] = course_data['sequence'][0]
            # Check if this row or next row contains "or" indicating choice courses
            elif title_text and (' or ' in title_text.lower() or title_text.lower().startswith('or')):
                choice_codes = []
                if 'code' in course_data:
                    choice_codes.append(course_data['code'])
                # Extract all course codes from title
                all_codes = re.findall(r'([A-Z]{2,4})\s+(\d{3}[A-Z]?)', title_text, re.IGNORECASE)
                choice_codes.extend([f"{dept.upper()} {num}" for dept, num in all_codes])
                
                # Check next row if it starts with "or" or has "or" in title
                if i + 1 < len(rows):
                    next_tr = rows[i + 1]
                    next_title_cell = next_tr.find('td', class_='codecol')
                    if next_title_cell:
                        next_text = next_title_cell.get_text(strip=True)
                        next_text_lower = next_text.lower()
                        # Check if next row is a continuation of choice (starts with "or" or has "or" with course code)
                        if next_text_lower.startswith('or') or ('or' in next_text_lower and re.search(r'[A-Z]{2,4}\s+\d{3}', next_text)):
                            # Extract codes from next row
                            next_codes = re.findall(r'([A-Z]{2,4})\s+(\d{3}[A-Z]?)', next_text, re.IGNORECASE)
                            choice_codes.extend([f"{dept.upper()} {num}" for dept, num in next_codes])
                            # Also check if next row has a code element
                            next_code_elem = next_title_cell.find('a')
                            if next_code_elem:
                                next_code = next_code_elem.text.strip()
                                # Normalize whitespace
                                next_code = re.sub(r'\s+', ' ', next_code)
                                if next_code not in choice_codes:
                                    choice_codes.append(next_code)
                            # Skip the next row since we've processed it
                            i += 1
                
                # If we found multiple codes, mark as choice
                if len(choice_codes) > 1:
                    # Normalize all codes
                    choice_codes = [re.sub(r'\s+', ' ', code) for code in choice_codes]
                    course_data['type'] = 'choice'
                    course_data['options'] = list(set(choice_codes))  # Remove duplicates
                    # Keep first code as primary
                    if 'code' not in course_data and choice_codes:
                        course_data['code'] = choice_codes[0]
                    else:
                        # Normalize existing code
                        course_data['code'] = re.sub(r'\s+', ' ', course_data['code'])
            # Check if next row is an "or" continuation (even if current row doesn't have "or" in title)
            elif 'code' in course_data and i + 1 < len(rows):
                next_tr = rows[i + 1]
                next_title_cell = next_tr.find('td', class_='codecol')
                if next_title_cell:
                    next_text = next_title_cell.get_text(strip=True)
                    next_text_lower = next_text.lower()
                    # If next row is just "or" or starts with "or", this might be a choice
                    if next_text_lower.strip() == 'or' or next_text_lower.startswith('or'):
                        # Check if there's a code in the next row after "or"
                        next_code_elem = next_title_cell.find('a')
                        if next_code_elem:
                            next_code = next_code_elem.text.strip()
                            # Normalize whitespace
                            next_code = re.sub(r'\s+', ' ', next_code)
                            # This is a choice course
                            course_data['type'] = 'choice'
                            # Normalize current code too
                            current_code = re.sub(r'\s+', ' ', course_data['code'])
                            course_data['options'] = [current_code, next_code]
                            course_data['code'] = current_code  # Update with normalized
                            # Mark next row to be skipped after we process it
                            # We'll handle skipping in the loop
            elif 'code' in course_data:
                # Regular single course
                pass
            
            course_data['title'] = title_text

        # Get credit hours
        hours_cell = tr.find('td', class_='hourscol')
        if hours_cell:
            hours_text = hours_cell.text.strip()
            # Store credit hours - could be a range like "3-4" or "3 or 6"
            course_data['hours'] = hours_text
            # Also parse into min/max if it's a range
            if hours_text:
                # Pattern: "3-4", "1 to 5", "3 or 6"
                range_match = re.search(r'(\d+)(?:\s*[-to]+\s*|\s+or\s+)(\d+)', hours_text, re.IGNORECASE)
                if range_match:
                    course_data['hours_min'] = int(range_match.group(1))
                    course_data['hours_max'] = int(range_match.group(2))
                else:
                    # Single value
                    single_match = re.search(r'(\d+)', hours_text)
                    if single_match:
                        val = int(single_match.group(1))
                        course_data['hours_min'] = val
                        course_data['hours_max'] = val
        else:
            # No hours in this row - check if this is a continuation row (like "or" row)
            # If previous row had hours and this is a choice continuation, inherit hours
            if i > 0 and 'code' in course_data:
                prev_row = rows[i - 1]
                prev_hours_cell = prev_row.find('td', class_='hourscol')
                if prev_hours_cell:
                    prev_hours = prev_hours_cell.text.strip()
                    # If previous row had hours and this row is part of a choice, use those hours
                    if prev_hours and ('or' in title_text.lower() if title_text else False):
                        course_data['hours'] = prev_hours
                        # Parse the hours
                        range_match = re.search(r'(\d+)(?:\s*[-to]+\s*|\s+or\s+)(\d+)', prev_hours, re.IGNORECASE)
                        if range_match:
                            course_data['hours_min'] = int(range_match.group(1))
                            course_data['hours_max'] = int(range_match.group(2))
                        else:
                            single_match = re.search(r'(\d+)', prev_hours)
                            if single_match:
                                val = int(single_match.group(1))
                                course_data['hours_min'] = val
                                course_data['hours_max'] = val

        # Filter out summary rows (hours only, no code, no title with course code)
        # These are typically total/summary rows in tables
        if course_data:
            has_code = 'code' in course_data and course_data.get('code')
            has_title_with_code = 'title' in course_data and course_data.get('title') and re.search(r'[A-Z]{2,4}\s+\d{3}', course_data.get('title', ''))
            has_hours = 'hours' in course_data and course_data.get('hours') and course_data.get('hours').strip()
            
            # Skip if it's just hours with no course information
            if has_hours and not has_code and not has_title_with_code:
                # This is likely a summary row - skip it
                i += 1
                continue
            
            # Skip rows that are just "or" with no code (these are continuation rows already processed)
            if not has_code and 'title' in course_data:
                title_lower = course_data.get('title', '').lower().strip()
                if title_lower == 'or' or title_lower.startswith('or'):
                    # This is a continuation row that should have been merged - skip it
                    i += 1
                    continue
            
            courses.append(course_data)
        
        i += 1

    return courses if courses else None


def extract_table(table_element):
    """Extract data from an HTML table."""
    rows = []

    # Get headers
    headers = []
    header_row = table_element.find('thead')
    if header_row:
        headers = [th.text.strip() for th in header_row.find_all('th')]

    # Get body rows
    tbody = table_element.find('tbody')
    if tbody:
        for tr in tbody.find_all('tr'):
            row_data = []
            for td in tr.find_all(['td', 'th']):
                row_data.append(td.text.strip())
            if row_data:
                rows.append(row_data)

    return {'headers': headers, 'rows': rows} if rows else None


def extract_courses_from_desc(div_element):
    """Extract course information from course description divs."""
    courses = []

    for course_block in div_element.find_all('div', class_='courseblock'):
        course_info = {}

        # Course title
        title = course_block.find('p', class_='courseblocktitle')
        if title:
            course_info['title'] = title.text.strip()

            # Extract course code (e.g., CS 124)
            code_match = re.match(r'^([A-Z]+)\s+(\d+)', course_info['title'])
            if code_match:
                course_info['subject'] = code_match.group(1)
                course_info['number'] = code_match.group(2)

        # Course description
        desc = course_block.find('p', class_='courseblockdesc')
        if desc:
            course_info['description'] = desc.text.strip()

        # Credit hours
        hours = course_block.find('p', class_='courseblockhours')
        if hours:
            course_info['credit_hours'] = hours.text.strip()

        if course_info:
            courses.append(course_info)

    return courses if courses else None


def save_major_data(major_data, filename):
    """Save major data to a JSON file."""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(major_data, f, indent=2, ensure_ascii=False)
    print(f"Saved major data to {filename}")


if __name__ == "__main__":
    # Test with Computer Science BS
    cs_url = "https://catalog.illinois.edu/undergraduate/engineering/computer-science-bs/"

    print("Scraping Computer Science BS major...")
    major_data = scrape_major(cs_url)

    # Save to JSON
    save_major_data(major_data, "scrape_majors/computer_science_bs.json")

    # Print summary
    print(f"\nMajor: {major_data['major_name']}")
    print(f"Sections found: {len(major_data['sections'])}")
    print("\nSection names:")
    for section_name in major_data['sections'].keys():
        print(f"  - {section_name}")
