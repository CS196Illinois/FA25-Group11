"""
Discover and scrape all undergraduate majors from UIUC catalog.
This script finds all major URLs and uses scrape_major.py to scrape them.
"""

import requests
from bs4 import BeautifulSoup
import json
import os
import time
from scrape_major import scrape_major, save_major_data


def discover_all_majors():
    """
    Discover all undergraduate majors from the UIUC catalog.
    Returns a list of dictionaries with major name and URL.
    """
    base_url = "https://catalog.illinois.edu/undergraduate/"
    
    print("Fetching undergraduate catalog page...")
    response = requests.get(base_url)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    majors = []
    seen_urls = set()
    
    # Find all links that point to major pages
    # Major URLs typically follow pattern: /undergraduate/[college]/[major-name]/
    for link in soup.find_all('a', href=True):
        href = link.get('href', '')
        
        # Check if this looks like a major page URL
        # Pattern: /undergraduate/[something]/[something]/
        if '/undergraduate/' in href:
            # Build full URL
            if href.startswith('http'):
                full_url = href
            else:
                full_url = f"https://catalog.illinois.edu{href}"
            
            # Skip if we've seen this URL before
            if full_url in seen_urls:
                continue
            
            # Check if it's a major page (not a college page or other page)
            # Major pages typically have a degree suffix like -bs/, -ba/, etc.
            # or end with a major name
            url_lower = full_url.lower()
            if any(suffix in url_lower for suffix in ['-bs/', '-ba/', '-bsw/', '-bfa/', '-bmus/']):
                major_name = link.get_text(strip=True)
                if major_name:
                    majors.append({
                        'name': major_name,
                        'url': full_url
                    })
                    seen_urls.add(full_url)
            # Also check for pages that might be majors without degree suffix
            # by looking for specific patterns in the URL structure
            elif href.count('/') >= 4 and 'undergraduate' in href:
                # Check if it's not a known non-major page
                if not any(skip in url_lower for skip in ['/courses-of-instruction', '/general-information', '/academic-calendar']):
                    major_name = link.get_text(strip=True)
                    if major_name and len(major_name) > 3:  # Filter out very short names
                        majors.append({
                            'name': major_name,
                            'url': full_url
                        })
                        seen_urls.add(full_url)
    
    # Also try to find majors by exploring college pages
    # Many colleges list their majors on their main page
    college_links = []
    for link in soup.find_all('a', href=True):
        href = link.get('href', '')
        if '/undergraduate/' in href and href.count('/') == 3:
            # This might be a college page
            if href.startswith('http'):
                college_url = href
            else:
                college_url = f"https://catalog.illinois.edu{href}"
            college_links.append(college_url)
    
    # Visit college pages to find majors
    print(f"Found {len(college_links)} potential college pages to explore...")
    for college_url in college_links[:20]:  # Limit to first 20 to avoid too many requests
        try:
            time.sleep(0.5)  # Be respectful
            response = requests.get(college_url, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                for link in soup.find_all('a', href=True):
                    href = link.get('href', '')
                    if '/undergraduate/' in href and any(suffix in href.lower() for suffix in ['-bs/', '-ba/', '-bsw/', '-bfa/', '-bmus/']):
                        if href.startswith('http'):
                            full_url = href
                        else:
                            full_url = f"https://catalog.illinois.edu{href}"
                        
                        if full_url not in seen_urls:
                            major_name = link.get_text(strip=True)
                            if major_name:
                                majors.append({
                                    'name': major_name,
                                    'url': full_url
                                })
                                seen_urls.add(full_url)
        except Exception as e:
            print(f"  Warning: Could not explore {college_url}: {e}")
            continue
    
    print(f"Discovered {len(majors)} majors")
    return majors


def scrape_all_majors(majors, output_dir, resume=True):
    """
    Scrape all discovered majors.
    
    Args:
        majors: List of major dictionaries with 'name' and 'url'
        output_dir: Directory to save raw JSON files
        resume: If True, skip majors that have already been scraped
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Check which majors have already been scraped
    completed_majors = set()
    if resume:
        for filename in os.listdir(output_dir):
            if filename.endswith('.json'):
                # Extract major name from filename
                major_name = filename.replace('.json', '').replace('_', ' ')
                completed_majors.add(major_name.lower())
    
    total = len(majors)
    successful = 0
    failed = []
    
    for i, major in enumerate(majors, 1):
        major_name = major['name']
        url = major['url']
        
        # Create a safe filename
        safe_filename = major_name.replace(' ', '_').replace('/', '_').replace('\\', '_')
        safe_filename = ''.join(c for c in safe_filename if c.isalnum() or c in ('_', '-'))
        output_file = os.path.join(output_dir, f"{safe_filename}.json")
        
        # Skip if already completed
        if resume and major_name.lower() in completed_majors:
            print(f"[{i}/{total}] Skipping {major_name} (already scraped)")
            continue
        
        print(f"\n[{i}/{total}] Scraping {major_name}...")
        print(f"  URL: {url}")
        
        try:
            # Scrape the major
            major_data = scrape_major(url)
            
            # Save to file
            save_major_data(major_data, output_file)
            
            successful += 1
            print(f"  ✓ Successfully scraped {major_name}")
            
            # Small delay to be respectful
            time.sleep(1)
            
        except Exception as e:
            print(f"  ✗ ERROR scraping {major_name}: {e}")
            failed.append({'name': major_name, 'url': url, 'error': str(e)})
            time.sleep(0.5)
    
    # Summary
    print("\n" + "="*80)
    print("MAJOR SCRAPING COMPLETE")
    print("="*80)
    print(f"Total majors: {total}")
    print(f"Successfully scraped: {successful}")
    print(f"Failed: {len(failed)}")
    
    if failed:
        print("\nFailed majors:")
        for item in failed:
            print(f"  - {item['name']}: {item['error']}")
    
    return successful, failed


def main():
    """Main function."""
    # Get paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    output_dir = os.path.join(project_root, 'raw_data', 'majors')
    
    print("="*80)
    print("UIUC MAJOR SCRAPER")
    print("="*80)
    
    # Discover all majors
    print("\nStep 1: Discovering all undergraduate majors...")
    majors = discover_all_majors()
    
    if not majors:
        print("No majors found. Exiting.")
        return
    
    # Save list of discovered majors
    majors_list_file = os.path.join(output_dir, '_majors_list.json')
    os.makedirs(output_dir, exist_ok=True)
    with open(majors_list_file, 'w', encoding='utf-8') as f:
        json.dump(majors, f, indent=2, ensure_ascii=False)
    print(f"\nSaved list of {len(majors)} majors to {majors_list_file}")
    
    # Scrape all majors
    print("\nStep 2: Scraping all majors...")
    successful, failed = scrape_all_majors(majors, output_dir, resume=True)
    
    print(f"\n✓ Scraping complete! {successful} majors scraped successfully.")
    if failed:
        print(f"⚠ {len(failed)} majors failed. Check the output above for details.")


if __name__ == "__main__":
    main()

