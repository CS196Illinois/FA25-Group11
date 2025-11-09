"""
Monitor scraping process and show real-time statistics.
"""

import csv
import os
import time
from collections import defaultdict


def analyze_csv_output(csv_file):
    """Analyze the CSV output and show extraction statistics."""
    if not os.path.exists(csv_file):
        return None

    stats = {
        "total": 0,
        "with_prereqs": 0,
        "with_coreqs": 0,
        "with_gen_ed": 0,
        "with_restrictions": 0,
        "repeatable": 0,
        "with_same_as": 0,
        "with_level": 0,
        "with_credit_range": 0,
        "gen_ed_categories": defaultdict(int),
        "course_levels": defaultdict(int),
        "restriction_types": defaultdict(int),
    }

    try:
        with open(csv_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                stats["total"] += 1

                if row.get("prerequisite"):
                    stats["with_prereqs"] += 1

                if row.get("corequisite"):
                    stats["with_coreqs"] += 1

                if row.get("gen_ed_categories"):
                    stats["with_gen_ed"] += 1
                    # Count categories
                    cats = [
                        c.strip()
                        for c in row["gen_ed_categories"].split(",")
                        if c.strip()
                    ]
                    for cat in cats:
                        stats["gen_ed_categories"][cat] += 1

                if row.get("restrictions"):
                    stats["with_restrictions"] += 1
                    # Analyze restriction type
                    restrict_text = row["restrictions"].lower()
                    if "restricted to" in restrict_text:
                        stats["restriction_types"]["restricted_to"] += 1
                    if "open only to" in restrict_text:
                        stats["restriction_types"]["open_only_to"] += 1
                    if "not open to" in restrict_text:
                        stats["restriction_types"]["not_open_to"] += 1

                if row.get("repeatable", "").lower() == "true":
                    stats["repeatable"] += 1

                if row.get("same_as"):
                    stats["with_same_as"] += 1

                if row.get("course_level"):
                    stats["with_level"] += 1
                    level = row["course_level"]
                    stats["course_levels"][level] += 1

                if row.get("credit_min") and row.get("credit_max"):
                    if row["credit_min"] != row["credit_max"]:
                        stats["with_credit_range"] += 1
    except Exception as e:
        return {"error": str(e)}

    return stats


def print_stats(stats):
    """Print statistics in a readable format."""
    if not stats or "error" in stats:
        print("No data or error reading file")
        return

    print("\n" + "=" * 80)
    print("EXTRACTION STATISTICS")
    print("=" * 80)
    print(f"Total courses: {stats['total']}")

    if stats["total"] > 0:
        print(f"\nField Extraction Rates:")
        print(
            f"  Prerequisites: {stats['with_prereqs']} ({stats['with_prereqs']/stats['total']*100:.1f}%)"
        )
        print(
            f"  Co-requisites: {stats['with_coreqs']} ({stats['with_coreqs']/stats['total']*100:.1f}%)"
        )
        print(
            f"  Gen Ed: {stats['with_gen_ed']} ({stats['with_gen_ed']/stats['total']*100:.1f}%)"
        )
        print(
            f"  Restrictions: {stats['with_restrictions']} ({stats['with_restrictions']/stats['total']*100:.1f}%)"
        )
        print(
            f"  Repeatable: {stats['repeatable']} ({stats['repeatable']/stats['total']*100:.1f}%)"
        )
        print(
            f"  Same as: {stats['with_same_as']} ({stats['with_same_as']/stats['total']*100:.1f}%)"
        )
        print(
            f"  Course level: {stats['with_level']} ({stats['with_level']/stats['total']*100:.1f}%)"
        )
        print(
            f"  Credit ranges: {stats['with_credit_range']} ({stats['with_credit_range']/stats['total']*100:.1f}%)"
        )

        if stats["gen_ed_categories"]:
            print(f"\nTop Gen Ed Categories:")
            sorted_cats = sorted(
                stats["gen_ed_categories"].items(), key=lambda x: x[1], reverse=True
            )
            for cat, count in sorted_cats[:10]:
                print(f"  {cat}: {count}")

        if stats["course_levels"]:
            print(f"\nCourse Levels:")
            for level in sorted(stats["course_levels"].keys()):
                count = stats["course_levels"][level]
                print(f"  {level}-level: {count} ({count/stats['total']*100:.1f}%)")

        if stats["restriction_types"]:
            print(f"\nRestriction Types:")
            for rtype, count in stats["restriction_types"].items():
                print(f"  {rtype}: {count}")

    print("=" * 80)


def monitor_file(csv_file, interval=5):
    """Monitor a CSV file and show updated statistics."""
    last_size = 0
    last_count = 0

    print(f"Monitoring {csv_file}")
    print("Press Ctrl+C to stop\n")

    try:
        while True:
            if os.path.exists(csv_file):
                current_size = os.path.getsize(csv_file)
                stats = analyze_csv_output(csv_file)

                if stats and "total" in stats:
                    current_count = stats["total"]
                    new_courses = current_count - last_count

                    if new_courses > 0 or current_size != last_size:
                        print(
                            f"\n[{time.strftime('%H:%M:%S')}] Courses: {current_count} (+{new_courses})"
                        )
                        print_stats(stats)

                    last_count = current_count
                    last_size = current_size
                else:
                    print(f"[{time.strftime('%H:%M:%S')}] Waiting for data...")
            else:
                print(f"[{time.strftime('%H:%M:%S')}] File not found, waiting...")

            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n\nMonitoring stopped.")


if __name__ == "__main__":
    import sys

    csv_file = sys.argv[1] if len(sys.argv) > 1 else "../raw_data/all_courses.csv"
    monitor_file(csv_file)
