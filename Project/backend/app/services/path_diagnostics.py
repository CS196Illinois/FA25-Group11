"""Diagnostic script to check file paths in Railway."""
import os
import logging

logger = logging.getLogger(__name__)

def diagnose_paths():
    """Print diagnostic information about paths."""
    cwd = os.getcwd()
    script_file = __file__
    script_dir = os.path.dirname(script_file)
    
    logger.info("=" * 60)
    logger.info("PATH DIAGNOSTICS")
    logger.info("=" * 60)
    logger.info(f"Current working directory: {cwd}")
    logger.info(f"Script file: {script_file}")
    logger.info(f"Script directory: {script_dir}")
    
    # Check DATA_DIR
    data_dir = os.getenv("DATA_DIR")
    logger.info(f"DATA_DIR environment variable: {data_dir}")
    
    # List directory contents
    logger.info(f"\nContents of CWD ({cwd}):")
    try:
        items = os.listdir(cwd)
        for item in sorted(items)[:20]:  # First 20 items
            item_path = os.path.join(cwd, item)
            item_type = "DIR" if os.path.isdir(item_path) else "FILE"
            logger.info(f"  {item_type}: {item}")
    except Exception as e:
        logger.error(f"Error listing CWD: {e}")
    
    # Check parent directory
    parent_dir = os.path.dirname(cwd)
    logger.info(f"\nContents of parent directory ({parent_dir}):")
    try:
        items = os.listdir(parent_dir)
        for item in sorted(items)[:20]:
            item_path = os.path.join(parent_dir, item)
            item_type = "DIR" if os.path.isdir(item_path) else "FILE"
            logger.info(f"  {item_type}: {item}")
    except Exception as e:
        logger.error(f"Error listing parent: {e}")
    
    # Try to find data files
    logger.info(f"\nSearching for data files...")
    search_paths = [
        os.path.join(cwd, '..', 'data_scraping', 'output', 'ml_ready'),
        os.path.join(cwd, '..', 'Project', 'data_scraping', 'output', 'ml_ready'),
        os.path.join(parent_dir, 'data_scraping', 'output', 'ml_ready'),
        os.path.join(parent_dir, 'Project', 'data_scraping', 'output', 'ml_ready'),
        '/app/data_scraping/output/ml_ready',
        '/app/Project/data_scraping/output/ml_ready',
    ]
    
    for path in search_paths:
        abs_path = os.path.abspath(path)
        exists = os.path.exists(abs_path)
        logger.info(f"  {abs_path}: {'EXISTS' if exists else 'NOT FOUND'}")
        if exists:
            try:
                files = os.listdir(abs_path)
                logger.info(f"    Files: {', '.join(files[:5])}")
            except:
                pass
    
    logger.info("=" * 60)
