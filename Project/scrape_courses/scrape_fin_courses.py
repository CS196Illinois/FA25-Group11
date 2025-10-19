import requests
from bs4 import BeautifulSoup
import csv
import re

def scrape_fin_courses():
    """Scrape FIN courses from Illinois catalog and save to CSV."""
    url = "https://catalog.illinois.edu/courses-of-instruction/fin/"

    # Fetch the page
    response = requests.get(url)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'html.parser')

    # Find all course entries
    courses = []

    # Find all courseblock divs
    course_blocks = soup.find_all('div', class_='courseblock')

    for block in course_blocks:
        # Find the title paragraph
        title_tag = block.find('p', class_='courseblocktitle')
        if not title_tag:
            continue

        # Find the link with course info
        link_tag = title_tag.find('a')
        if not link_tag:
            continue

        # Extract the course link
        course_link = link_tag.get('href', '')

        # Extract the full text from the link (course ID, name, credit hours)
        link_text = link_tag.get_text(strip=True)

        # Parse the link text to extract course ID, name, and credit hours
        # Format: "FIN 221   Corporate Finance   credit: 3 Hours."
        match = re.match(r'^([A-Z]+\s+\d+)\s+(.+?)\s+credit:\s+([\d\-]+(?:\s+to\s+[\d\-]+)?)\s+Hours?\.?$', link_text)

        if not match:
            continue

        course_id = match.group(1)
        course_name = match.group(2)
        credit_hours = match.group(3)

        # Find the description paragraph
        desc_tag = block.find('p', class_='courseblockdesc')
        description = ""
        if desc_tag:
            # Get text with proper spacing by handling text nodes and links
            description = desc_tag.get_text(separator=' ', strip=True)
            # Clean up multiple spaces
            description = re.sub(r'\s+', ' ', description)

        # Extract prerequisite sentence if present
        prerequisite = ""
        if description:
            # Find sentences containing "prerequisite" (case insensitive)
            sentences = re.split(r'(?<=[.!?])\s+', description)
            prereq_sentences = [s for s in sentences if 'prerequisite' in s.lower()]
            if prereq_sentences:
                prerequisite = ' '.join(prereq_sentences)

        courses.append({
            'course_id': course_id,
            'name': course_name,
            'credit_hours': credit_hours,
            'description': description,
            'prerequisite': prerequisite,
            'link': course_link
        })

    # Write to CSV
    output_file = 'fin_courses.csv'
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['course_id', 'name', 'credit_hours', 'description', 'prerequisite', 'link']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        writer.writerows(courses)

    print(f"Successfully scraped {len(courses)} courses and saved to {output_file}")
    return courses

if __name__ == "__main__":
    scrape_fin_courses()
