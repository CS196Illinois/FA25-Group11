"""
Organize all majors by college.

This script reads all major JSON files from raw_data/majors and organizes them
by college, extracting college information from the URL paths.
"""

import json
import os
import re
from collections import defaultdict


# College code to full name mapping
COLLEGE_NAMES = {
    'aces': 'Agricultural, Consumer and Environmental Sciences',
    'bus': 'Gies College of Business',
    'engineering': 'Grainger College of Engineering',
    'las': 'College of Liberal Arts and Sciences',
    'faa': 'College of Fine and Applied Arts',
    'media': 'College of Media',
    'ahs': 'College of Applied Health Sciences',
    'education': 'College of Education',
    'ischool': 'School of Information Sciences',
    'socw': 'School of Social Work',
    'eng_aces': 'Engineering & ACES (Joint Program)',
    'eng_las': 'Engineering & LAS (Joint Program)',
    'eng_media': 'Engineering & Media (Joint Program)',
    'eng_faa': 'Engineering & FAA (Joint Program)',
    'ahs_faa': 'AHS & FAA (Joint Program)',
}


def extract_college_from_url(url):
    """
    Extract college code from URL.
    
    URL format: https://catalog.illinois.edu/undergraduate/{college}/{major-name}/
    Returns the college code or None if not found.
    """
    if not url:
        return None
    
    # Pattern to match: /undergraduate/{college}/{major-name}/
    pattern = r'/undergraduate/([^/]+)/'
    match = re.search(pattern, url)
    
    if match:
        return match.group(1)
    return None


def get_college_name(college_code):
    """Get full college name from code, or return formatted code if not found."""
    return COLLEGE_NAMES.get(college_code, college_code.replace('_', ' ').title())


def process_majors_by_college(majors_dir, output_file):
    """
    Process all major JSON files and organize them by college.
    
    Args:
        majors_dir: Directory containing major JSON files
        output_file: Path to output JSON file
    """
    print("="*80)
    print("ORGANIZING MAJORS BY COLLEGE")
    print("="*80)
    
    # Dictionary to store majors by college
    colleges = defaultdict(lambda: {'college_name': '', 'majors': []})
    
    # Get all JSON files in majors directory (excluding _majors_list.json)
    major_files = [
        f for f in os.listdir(majors_dir) 
        if f.endswith('.json') and not f.startswith('_')
    ]
    
    print(f"\nFound {len(major_files)} major files to process...\n")
    
    successful = 0
    failed = []
    skipped = []
    
    for i, filename in enumerate(major_files, 1):
        filepath = os.path.join(majors_dir, filename)
        
        try:
            # Load major data
            with open(filepath, 'r', encoding='utf-8') as f:
                major_data = json.load(f)
            
            # Extract major name and URL
            major_name = major_data.get('major_name', filename.replace('.json', '').replace('_', ' '))
            url = major_data.get('url', '')
            
            if not url:
                skipped.append(f"{filename}: No URL found")
                continue
            
            # Extract college code from URL
            college_code = extract_college_from_url(url)
            
            if not college_code:
                skipped.append(f"{filename}: Could not extract college from URL: {url}")
                continue
            
            # Get or set college name
            if not colleges[college_code]['college_name']:
                colleges[college_code]['college_name'] = get_college_name(college_code)
            
            # Add major to college
            colleges[college_code]['majors'].append({
                'major_name': major_name,
                'url': url
            })
            
            successful += 1
            
            if i % 50 == 0:
                print(f"  Processed {i}/{len(major_files)} files...")
        
        except json.JSONDecodeError as e:
            failed.append(f"{filename}: JSON decode error - {str(e)}")
        except Exception as e:
            failed.append(f"{filename}: {str(e)}")
    
    # Convert defaultdict to regular dict and sort majors within each college
    result = {}
    for college_code in sorted(colleges.keys()):
        # Sort majors alphabetically by name
        colleges[college_code]['majors'].sort(key=lambda x: x['major_name'])
        result[college_code] = colleges[college_code]
    
    # Write output
    output_dir = os.path.dirname(output_file)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    # Print summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Total files processed: {len(major_files)}")
    print(f"Successfully organized: {successful}")
    print(f"Failed: {len(failed)}")
    print(f"Skipped: {len(skipped)}")
    print(f"\nColleges found: {len(result)}")
    
    for college_code, college_data in sorted(result.items()):
        print(f"  {college_code}: {len(college_data['majors'])} majors")
    
    if failed:
        print(f"\nFailed files:")
        for failure in failed[:10]:  # Show first 10
            print(f"  - {failure}")
        if len(failed) > 10:
            print(f"  ... and {len(failed) - 10} more")
    
    if skipped:
        print(f"\nSkipped files:")
        for skip in skipped[:10]:  # Show first 10
            print(f"  - {skip}")
        if len(skipped) > 10:
            print(f"  ... and {len(skipped) - 10} more")
    
    print(f"\nOutput written to: {output_file}")


def main():
    """Main entry point."""
    # Get script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define paths relative to script directory
    project_root = os.path.dirname(os.path.dirname(script_dir))
    majors_dir = os.path.join(project_root, 'data_scraping', 'raw_data', 'majors')
    output_file = os.path.join(project_root, 'data_scraping', 'output', 'processed', 'majors_by_college.json')
    
    # Check if majors directory exists
    if not os.path.exists(majors_dir):
        print(f"Error: Majors directory not found: {majors_dir}")
        return
    
    # Process majors
    process_majors_by_college(majors_dir, output_file)


if __name__ == '__main__':
    main()




