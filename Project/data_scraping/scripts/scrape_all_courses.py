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

    soup = BeautifulSoup(response.text, "html.parser")

    departments = []

    # Find all links in the page
    for link in soup.find_all("a", href=True):
        href = link.get("href", "")
        # Look for department links matching the pattern /courses-of-instruction/XXX/
        if "/courses-of-instruction/" in href and href.count("/") >= 3:
            # Extract department code from the link text
            text = link.get_text(strip=True)
            if text and "-" in text:
                # Format is typically "DEPT - Department Name"
                dept_code = text.split("-")[0].strip()
                dept_name = (
                    text.split("-", 1)[1].strip() if len(text.split("-")) > 1 else ""
                )

                # Build full URL
                if href.startswith("http"):
                    full_url = href
                else:
                    full_url = f"https://catalog.illinois.edu{href}"

                departments.append(
                    {"code": dept_code, "name": dept_name, "url": full_url}
                )

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

    soup = BeautifulSoup(response.text, "html.parser")

    courses = []

    # Find all courseblock divs
    course_blocks = soup.find_all("div", class_="courseblock")

    for block in course_blocks:
        # Find the title paragraph
        title_tag = block.find("p", class_="courseblocktitle")
        if not title_tag:
            continue

        # Find the link with course info
        link_tag = title_tag.find("a")
        if not link_tag:
            continue

        # Extract the course link
        course_link = link_tag.get("href", "")
        if course_link and not course_link.startswith("http"):
            course_link = f"https://courses.illinois.edu{course_link}"

        # Extract the full text from the link (course ID, name, credit hours)
        link_text = link_tag.get_text(strip=True)

        # Parse the link text to extract course ID, name, and credit hours
        # Format: "DEPT 123   Course Name   credit: 3 Hours."
        match = re.match(
            r"^([A-Z]+\s+\d+)\s+(.+?)\s+credit:\s+([\d\-]+(?:\s+to\s+[\d\-]+)?)\s+Hours?\.?$",
            link_text,
        )

        if not match:
            continue

        course_id = match.group(1)
        course_name = match.group(2)
        credit_hours = match.group(3)

        # Find the description paragraph
        desc_tag = block.find("p", class_="courseblockdesc")
        description = ""
        if desc_tag:
            # Get text with proper spacing by handling text nodes and links
            description = desc_tag.get_text(separator=" ", strip=True)
            # Clean up multiple spaces
            description = re.sub(r"\s+", " ", description)

        # Extract prerequisite and co-requisite sentences
        prerequisite = ""
        corequisite = ""
        if description:
            # Split description into sentences
            sentences = re.split(r"(?<=[.!?])\s+", description)
            # Find sentences containing "prerequisite" (case insensitive)
            prereq_sentences = [s for s in sentences if "prerequisite" in s.lower()]
            if prereq_sentences:
                prerequisite = " ".join(prereq_sentences)
            # Find sentences containing "corequisite" or "co-requisite"
            coreq_sentences = [
                s
                for s in sentences
                if "corequisite" in s.lower() or "co-requisite" in s.lower()
            ]
            if coreq_sentences:
                corequisite = " ".join(coreq_sentences)
                # Try to extract course codes from corequisite text
                coreq_codes = re.findall(
                    r"([A-Z]{2,4})\s+(\d{3}[A-Z]?)", corequisite, re.IGNORECASE
                )
                if coreq_codes:
                    # Store both the text and the extracted codes
                    corequisite_codes = [
                        f"{dept.upper()} {num}" for dept, num in coreq_codes
                    ]
                    # Add codes to the corequisite field for easier parsing later
                    corequisite = (
                        f"{corequisite} [CODES: {', '.join(corequisite_codes)}]"
                    )

        # Extract course level from course number (e.g., CS 124 -> 100-level)
        course_level = None
        course_num_match = re.search(r"(\d)(\d{2})", course_id)
        if course_num_match:
            first_digit = int(course_num_match.group(1))
            course_level = first_digit * 100  # 124 -> 100, 225 -> 200, etc.

        # Extract General Education categories
        gen_ed_categories = []
        if description:
            # Pattern: "This course satisfies the General Education Criteria for: Category1 Category2"
            gen_ed_match = re.search(
                r"General Education Criteria for:\s*([^.]+?)(?:\.|$|This course)",
                description,
                re.IGNORECASE,
            )
            if gen_ed_match:
                categories_text = gen_ed_match.group(1).strip()
                # Split by "and" first, then handle commas
                # Common format: "Category1 and Category2" or "Category1, Category2"
                # Also handle: "Quantitative Reasoning II" (should stay together)
                # Split on "and" first, then on commas
                if " and " in categories_text.lower():
                    parts = re.split(r"\s+and\s+", categories_text, flags=re.IGNORECASE)
                    for part in parts:
                        # Further split by comma if needed
                        subparts = [p.strip() for p in part.split(",") if p.strip()]
                        gen_ed_categories.extend(subparts)
                else:
                    # Just split by comma
                    categories = [
                        cat.strip() for cat in categories_text.split(",") if cat.strip()
                    ]
                    gen_ed_categories = categories

        # Parse credit hours into min/max
        credit_min = None
        credit_max = None
        if credit_hours:
            # Handle ranges like "3-4", "1 to 5"
            range_match = re.search(r"(\d+)(?:\s*[-to]+\s*)(\d+)", credit_hours)
            if range_match:
                credit_min = int(range_match.group(1))
                credit_max = int(range_match.group(2))
            else:
                # Single value
                single_match = re.search(r"(\d+)", credit_hours)
                if single_match:
                    credit_min = int(single_match.group(1))
                    credit_max = credit_min

        # Extract restrictions
        restrictions = []
        if description:
            # Patterns: "Restricted to...", "Open only to...", "Not open to..."
            restriction_patterns = [
                r"Restricted to[^.]*(?:\.|$)",
                r"Open only to[^.]*(?:\.|$)",
                r"Not open to[^.]*(?:\.|$)",
                r"Limited to[^.]*(?:\.|$)",
            ]
            for pattern in restriction_patterns:
                matches = re.findall(pattern, description, re.IGNORECASE)
                restrictions.extend(matches)

        # Extract repeatability information
        repeatable = False
        repeat_max_hours = None
        if description:
            repeat_match = re.search(
                r"May be repeated(?: to a maximum of (\d+) hours?)?",
                description,
                re.IGNORECASE,
            )
            if repeat_match:
                repeatable = True
                if repeat_match.group(1):
                    repeat_max_hours = int(repeat_match.group(1))

        # Extract "Same as" / cross-listed courses
        same_as_courses = []
        if description:
            same_as_match = re.search(
                r"Same as\s+([^.]+?)(?:\.|$)", description, re.IGNORECASE
            )
            if same_as_match:
                courses_text = same_as_match.group(1)
                # Extract course codes (e.g., "LLS 200", "AFRO 201, LLS 201, PS 201")
                course_codes = re.findall(r"([A-Z]{2,4})\s+(\d{3}[A-Z]?)", courses_text)
                same_as_courses = [f"{dept} {num}" for dept, num in course_codes]

        courses.append(
            {
                "course_id": course_id,
                "name": course_name,
                "credit_hours": credit_hours,
                "credit_min": credit_min,
                "credit_max": credit_max,
                "course_level": course_level,
                "description": description,
                "prerequisite": prerequisite,
                "corequisite": corequisite,
                "gen_ed_categories": (
                    ", ".join(gen_ed_categories) if gen_ed_categories else ""
                ),
                "restrictions": "; ".join(restrictions) if restrictions else "",
                "repeatable": repeatable,
                "repeat_max_hours": repeat_max_hours,
                "same_as": ", ".join(same_as_courses) if same_as_courses else "",
                "link": course_link,
            }
        )

    print(f"  Found {len(courses)} courses in {dept_code}")
    return courses


def save_courses_to_csv(courses, filename):
    """Save courses to CSV file (append mode)."""
    file_exists = os.path.exists(filename)

    with open(filename, "a", newline="", encoding="utf-8") as csvfile:
        fieldnames = [
            "course_id",
            "name",
            "credit_hours",
            "credit_min",
            "credit_max",
            "course_level",
            "description",
            "prerequisite",
            "corequisite",
            "gen_ed_categories",
            "restrictions",
            "repeatable",
            "repeat_max_hours",
            "same_as",
            "link",
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        # Write header only if file doesn't exist
        if not file_exists:
            writer.writeheader()

        writer.writerows(courses)


def main():
    """Main function to scrape all courses from all departments."""
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    output_file = os.path.join(project_root, "raw_data", "all_courses.csv")
    progress_file = os.path.join(script_dir, "scrape_progress.txt")

    # Check if we should resume from a previous run
    completed_depts = set()
    if os.path.exists(progress_file):
        with open(progress_file, "r") as f:
            completed_depts = set(line.strip() for line in f)
        print(
            f"Resuming from previous run. Already completed: {len(completed_depts)} departments"
        )
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
        dept_code = dept["code"]

        # Skip if already completed
        if dept_code in completed_depts:
            print(f"[{i}/{len(departments)}] Skipping {dept_code} (already completed)")
            continue

        print(f"\n[{i}/{len(departments)}] Processing {dept_code} - {dept['name']}")

        try:
            # Scrape courses for this department
            courses = scrape_department_courses(dept["url"], dept_code)

            # Save to CSV immediately
            if courses:
                save_courses_to_csv(courses, output_file)
                total_courses += len(courses)
                print(f"  ✓ Saved {len(courses)} courses to {output_file}")
            else:
                print(f"  ⚠ No courses found")

            successful_depts += 1

            # Mark as completed
            with open(progress_file, "a") as f:
                f.write(f"{dept_code}\n")

        except Exception as e:
            print(f"  ✗ ERROR processing {dept_code}: {e}")
            failed_depts.append(dept_code)

        # Small delay to be respectful to the server
        time.sleep(0.5)

    # Final summary
    print("\n" + "=" * 80)
    print("SCRAPING COMPLETE")
    print("=" * 80)
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
