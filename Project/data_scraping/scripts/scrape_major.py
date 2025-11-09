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

    return major_data


def extract_section_content(container):
    """Extract all content from a tab container."""
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
                content.append({'type': 'paragraph', 'content': text})

        elif element.name in ['ul', 'ol']:
            items = [li.text.strip() for li in element.find_all('li', recursive=False)]
            if items:
                content.append({'type': 'list', 'list_type': element.name, 'content': items})

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
    courses = []

    tbody = table_element.find('tbody')
    if not tbody:
        return None

    for tr in tbody.find_all('tr', recursive=False):
        # Skip header or summary rows
        if tr.find('th'):
            continue

        course_data = {}

        # Get course code and title
        title_cell = tr.find('td', class_='codecol')
        if title_cell:
            # Extract course code
            code_elem = title_cell.find('a')
            if code_elem:
                course_data['code'] = code_elem.text.strip()

            # Extract course title (often in a separate span or after the code)
            title_text = title_cell.get_text(strip=True)
            # Remove the code from the title to get just the name
            if 'code' in course_data:
                title_text = title_text.replace(course_data['code'], '').strip()
            course_data['title'] = title_text

        # Get credit hours
        hours_cell = tr.find('td', class_='hourscol')
        if hours_cell:
            course_data['hours'] = hours_cell.text.strip()

        if course_data:
            courses.append(course_data)

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
