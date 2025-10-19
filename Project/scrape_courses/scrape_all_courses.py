import requests
from bs4 import BeautifulSoup
import csv
import re
import time
import os

def get_all_departments():
    """Scrape list of all departments from the main courses page."""
    url = "https://catalog.illinois.edu/courses-of-instruction/"

    print("Fetching department list...")
    response = requests.get(url)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'html.parser')

    departments = []

    # Find all links in the page
    for link in soup.find_all('a', href=True):
        href = link.get('href', '')
        # Look for department links matching the pattern /courses-of-instruction/XXX/
        if '/courses-of-instruction/' in href and href.count('/') >= 3:
            # Extract department code from the link text
            text = link.get_text(strip=True)
            if text and '-' in text:
                # Format is typically "DEPT - Department Name"
                dept_code = text.split('-')[0].strip()
                dept_name = text.split('-', 1)[1].strip() if len(text.split('-')) > 1 else ""

                # Build full URL
                if href.startswith('http'):
                    full_url = href
                else:
                    full_url = f"https://catalog.illinois.edu{href}"

                departments.append({
                    'code': dept_code,
                    'name': dept_name,
                    'url': full_url
                })

    print(f"Found {len(departments)} departments")
    return departments

def scrape_department_courses(dept_url, dept_code):
    """Scrape all courses for a specific department."""
    print(f"  Fetching courses from {dept_url}...")

    try:
        response = requests.get(dept_url)
        response.raise_for_status()
    except Exception as e:
        print(f"  ERROR fetching {dept_url}: {e}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')

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
        if course_link and not course_link.startswith('http'):
            course_link = f"https://courses.illinois.edu{course_link}"

        # Extract the full text from the link (course ID, name, credit hours)
        link_text = link_tag.get_text(strip=True)

        # Parse the link text to extract course ID, name, and credit hours
        # Format: "DEPT 123   Course Name   credit: 3 Hours."
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

    print(f"  Found {len(courses)} courses in {dept_code}")
    return courses

def save_courses_to_csv(courses, filename):
    """Save courses to CSV file (append mode)."""
    file_exists = os.path.exists(filename)

    with open(filename, 'a', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['course_id', 'name', 'credit_hours', 'description', 'prerequisite', 'link']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        # Write header only if file doesn't exist
        if not file_exists:
            writer.writeheader()

        writer.writerows(courses)

def main():
    """Main function to scrape all courses from all departments."""
    output_file = 'all_courses.csv'
    progress_file = 'scrape_progress.txt'

    # Check if we should resume from a previous run
    completed_depts = set()
    if os.path.exists(progress_file):
        with open(progress_file, 'r') as f:
            completed_depts = set(line.strip() for line in f)
        print(f"Resuming from previous run. Already completed: {len(completed_depts)} departments")
    else:
        # Remove output file if starting fresh
        if os.path.exists(output_file):
            os.remove(output_file)
            print("Starting fresh - removed existing output file")

    # Get all departments
    departments = get_all_departments()

    # Track statistics
    total_courses = 0
    successful_depts = 0
    failed_depts = []

    # Process each department
    for i, dept in enumerate(departments, 1):
        dept_code = dept['code']

        # Skip if already completed
        if dept_code in completed_depts:
            print(f"[{i}/{len(departments)}] Skipping {dept_code} (already completed)")
            continue

        print(f"\n[{i}/{len(departments)}] Processing {dept_code} - {dept['name']}")

        try:
            # Scrape courses for this department
            courses = scrape_department_courses(dept['url'], dept_code)

            # Save to CSV immediately
            if courses:
                save_courses_to_csv(courses, output_file)
                total_courses += len(courses)
                print(f"  ✓ Saved {len(courses)} courses to {output_file}")
            else:
                print(f"  ⚠ No courses found")

            successful_depts += 1

            # Mark as completed
            with open(progress_file, 'a') as f:
                f.write(f"{dept_code}\n")

        except Exception as e:
            print(f"  ✗ ERROR processing {dept_code}: {e}")
            failed_depts.append(dept_code)

        # Small delay to be respectful to the server
        time.sleep(0.5)

    # Final summary
    print("\n" + "="*80)
    print("SCRAPING COMPLETE")
    print("="*80)
    print(f"Total departments processed: {successful_depts}/{len(departments)}")
    print(f"Total courses scraped: {total_courses}")
    print(f"Output file: {output_file}")

    if failed_depts:
        print(f"\nFailed departments ({len(failed_depts)}): {', '.join(failed_depts)}")

    # Clean up progress file on successful completion
    if not failed_depts and os.path.exists(progress_file):
        os.remove(progress_file)
        print(f"\nProgress file removed (scraping completed successfully)")

if __name__ == "__main__":
    main()
