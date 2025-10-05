"""
Course scraper for UIUC CS curriculum map.

NOTE: The data-post attribute (postrequisites) is added by JavaScript after page load.
To extract postrequisites, install Playwright:
    pip install playwright
    playwright install chromium
"""

import csv
import re
from bs4 import BeautifulSoup

try:
    from playwright.sync_api import sync_playwright
    use_js = True
    print("Using Playwright for JavaScript rendering...")
except ImportError:
    import requests
    use_js = False
    print("WARNING: Playwright not installed. data-post attributes (postrequisites) won't be extracted.")
    print("Install with: pip install playwright && playwright install chromium")

# Fetch the webpage
url = "https://grainger.illinois.edu/academics/undergraduate/majors-and-minors/cs-map"

if use_js:
    # Use Playwright to render JavaScript
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url)
        page.wait_for_timeout(3000)  # Wait 3 seconds for JavaScript to execute
        html = page.content()
        browser.close()
else:
    # Fallback to regular requests (won't get data-post attributes)
    response = requests.get(url)
    html = response.content

# Parse with BeautifulSoup
soup = BeautifulSoup(html, 'html.parser')

# First, collect all notes by their data-target
notes_dict = {}
notes_section = soup.find('h2', string=lambda text: text and 'Note' in text)
if notes_section:
    notes_list = notes_section.find_next('ol')
    if notes_list:
        for note_item in notes_list.find_all('li'):
            target = note_item.get('data-target', '')
            if target:
                notes_dict[target] = note_item.get_text(strip=True)

# Find all elements with class containing "item course"
course_elements = soup.find_all(class_=re.compile(r'item.*course|course.*item'))

# Collect course data
courses_data = []

# Define the fields we want to keep
desired_fields = [
    'course_id',
    'course_code',
    'course_name',
    'description',
    'credits_min',
    'credits_max',
    'prerequisites',
    'corequisites',
    'postrequisites',
    'schedule_link',
    'notes'
]

for element in course_elements:
    # Extract basic course info
    course_id = element.get('data-id', '')
    course_code = element.get('data-label', '')

    # Build schedule link from course code (e.g., "CS 124" -> subject="CS", number="124")
    schedule_link = ''
    if course_code:
        # Extract subject and number from course code
        parts = course_code.split()
        if len(parts) == 2:
            subject, number = parts
            schedule_link = f"https://courses.illinois.edu/schedule/terms/{subject}/{number}"

    # Extract notes - match by course_id (e.g., "MATH257") in the notes_dict
    notes = notes_dict.get(course_id, '')

    course_info = {
        'course_id': element.get('data-course-id', ''),
        'course_code': course_code,
        'course_name': element.get('data-name', ''),
        'description': element.get('data-content', ''),
        'credits_min': element.get('data-credits-min', ''),
        'credits_max': element.get('data-credits-max', ''),
        'prerequisites': element.get('data-pre', ''),
        'corequisites': element.get('data-co', ''),
        'postrequisites': element.get('data-post', ''),
        'schedule_link': schedule_link,
        'notes': notes
    }

    courses_data.append(course_info)

# Write to CSV
with open('courses.csv', 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=desired_fields)
    writer.writeheader()
    writer.writerows(courses_data)

print(f"Found {len(courses_data)} course elements")
print(f"Extracted fields: {', '.join(desired_fields)}")
print("Data saved to courses.csv")
