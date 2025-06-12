#!/usr/bin/env python3
"""
Test runner for the passport photo validation system.
Runs all unit tests and provides a comprehensive report.
"""

import unittest
import sys
import os
from io import StringIO

# Add the api directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_all_tests(verbosity=2):
    """
    Discover and run all tests in the tests directory.
    
    Args:
        verbosity (int): Test output verbosity level (0-2)
        
    Returns:
        unittest.TestResult: Test results
    """
    # Discover all test modules
    loader = unittest.TestLoader()
    test_dir = os.path.dirname(os.path.abspath(__file__))
    test_suite = loader.discover(test_dir, pattern='test_*.py')
    
    # Create a test runner with custom result formatting
    stream = StringIO()
    runner = unittest.TextTestRunner(
        stream=stream,
        verbosity=verbosity,
        buffer=True
    )
    
    print("=" * 70)
    print("PASSPORT PHOTO VALIDATION SYSTEM - UNIT TEST SUITE")
    print("=" * 70)
    print()
    
    # Run the tests
    result = runner.run(test_suite)
    
    # Print results
    output = stream.getvalue()
    print(output)
    
    # Print summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    total_tests = result.testsRun
    failures = len(result.failures)
    errors = len(result.errors)
    skipped = len(result.skipped) if hasattr(result, 'skipped') else 0
    success = total_tests - failures - errors - skipped
    
    print(f"Total Tests:     {total_tests}")
    print(f"Successful:      {success}")
    print(f"Failed:          {failures}")
    print(f"Errors:          {errors}")
    print(f"Skipped:         {skipped}")
    
    if failures > 0 or errors > 0:
        print(f"\nSuccess Rate:    {(success/total_tests)*100:.1f}%")
        print("Status:          ❌ SOME TESTS FAILED")
        
        if failures > 0:
            print(f"\nFAILURES ({failures}):")
            for test, traceback in result.failures:
                print(f"  - {test}")
        
        if errors > 0:
            print(f"\nERRORS ({errors}):")
            for test, traceback in result.errors:
                print(f"  - {test}")
    else:
        print(f"\nSuccess Rate:    100.0%")
        print("Status:          ✅ ALL TESTS PASSED")
    
    print("=" * 70)
    
    return result

def run_specific_module(module_name, verbosity=2):
    """
    Run tests for a specific module.
    
    Args:
        module_name (str): Name of the test module (without test_ prefix)
        verbosity (int): Test output verbosity level
    """
    test_module = f"test_{module_name}"
    
    try:
        # Import the specific test module
        exec(f"from {test_module} import *")
        
        # Discover tests in the specific module
        loader = unittest.TestLoader()
        suite = loader.loadTestsFromName(test_module)
        
        # Run the tests
        runner = unittest.TextTestRunner(verbosity=verbosity)
        print(f"\n{'='*50}")
        print(f"RUNNING TESTS FOR: {module_name.upper()}")
        print(f"{'='*50}")
        
        result = runner.run(suite)
        return result
        
    except ImportError as e:
        print(f"Error: Could not import test module '{test_module}': {e}")
        return None

def main():
    """Main entry point for the test runner."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Run unit tests for passport photo validation system')
    parser.add_argument(
        '--module', '-m',
        help='Run tests for specific module (config, face_analyzer, photo_validator, image_preprocessor, compliance_checker, integration)',
        choices=['config', 'face_analyzer', 'photo_validator', 'image_preprocessor', 'compliance_checker', 'integration']
    )
    parser.add_argument(
        '--verbose', '-v',
        action='count',
        default=1,
        help='Increase verbosity (use -v, -vv, or -vvv)'
    )
    parser.add_argument(
        '--quiet', '-q',
        action='store_true',
        help='Minimal output'
    )
    
    args = parser.parse_args()
    
    # Set verbosity
    if args.quiet:
        verbosity = 0
    else:
        verbosity = min(args.verbose, 2)
    
    # Run tests
    if args.module:
        result = run_specific_module(args.module, verbosity)
    else:
        result = run_all_tests(verbosity)
    
    # Exit with appropriate code
    if result and (result.failures or result.errors):
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == '__main__':
    main() 