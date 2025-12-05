from pathlib import Path
import re
from typing import List

from pypdf import PdfReader


SEMESTER_PREFIX = re.compile(r"^(FA|SP|SU|WN)\d{2}\b")
DEPT_COURSE = re.compile(r"^[A-Z]{2,}$")
COURSE_NUMBER = re.compile(r"^\d{3}$")


def parse_courses(pdf_path: str | Path) -> List[str]:
    """Return list of courses like 'CS 124' from a DARS PDF."""
    reader = PdfReader(str(pdf_path))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)

    marker = "SUMMARY OF COURSES TAKEN"
    upper_text = text.upper()
    start = upper_text.find(marker)
    if start != -1:
        text = text[start:]

    courses: List[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or not SEMESTER_PREFIX.match(line):
            continue
        tokens = line.split()[1:]  # drop semester token
        for first, second in zip(tokens, tokens[1:]):
            if DEPT_COURSE.fullmatch(first) and COURSE_NUMBER.fullmatch(second):
                courses.append(f"{first} {second}")
                break
    return courses


def main() -> None:
    pdf_path = input("PDF path:\n> ").strip()
    if not pdf_path:
        print("No path provided.")
        return
    try:
        courses = parse_courses(pdf_path)
    except Exception as exc:
        print(f"Failed to parse PDF: {exc}")
        return
    print(courses)


if __name__ == "__main__":
    main()
