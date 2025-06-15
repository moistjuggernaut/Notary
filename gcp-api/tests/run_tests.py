#!/usr/bin/env python3
"""
Test runner for the passport photo validation system.
Runs all unit tests and provides a comprehensive report.
"""

import unittest
import os
import sys

# Add the parent directory ('gcp-api') to the Python path
# to allow for absolute imports of the 'lib' modules.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_all_tests():
    """
    Discover and run all tests in the 'gcp-api/tests' directory.
    """
    # Create a TestLoader instance
    loader = unittest.TestLoader()
    
    # Define the directory to discover tests in
    # __file__ is the path to this script (run_tests.py)
    start_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Discover all test cases in the directory
    suite = loader.discover(start_dir, pattern='test_*.py')
    
    # Create a TestResult object
    result = unittest.TestResult()
    
    # Run the test suite
    suite.run(result)
    
    # --- Print a formatted summary ---
    print("\n" + "="*70)
    print(" " * 28 + "TEST SUMMARY")
    print("="*70)
    
    total_tests = result.testsRun
    failures = len(result.failures)
    errors = len(result.errors)
    successes = total_tests - failures - errors
    
    print(f"Total Tests:     {total_tests}")
    print(f"Successful:      {successes}")
    print(f"Failed:          {failures}")
    print(f"Errors:          {errors}")
    
    success_rate = (successes / total_tests) * 100 if total_tests > 0 else 0
    print(f"\nSuccess Rate:    {success_rate:.1f}%")
    
    if failures == 0 and errors == 0:
        print("Status:          ✅ ALL TESTS PASSED")
    else:
        print("Status:          ❌ SOME TESTS FAILED")
    
    print("="*70 + "\n")

    # Print details of failures
    if result.failures:
        print("\n" + "-"*30 + " FAILURES " + "-"*30)
        for test, traceback_text in result.failures:
            print(f"\n[FAIL] {test.id()}")
            print(traceback_text)
        print("-" * 70)

    # Print details of errors
    if result.errors:
        print("\n" + "-"*30 + " ERRORS " + "-"*30)
        for test, traceback_text in result.errors:
            print(f"\n[ERROR] {test.id()}")
            print(traceback_text)
        print("-" * 70)
        
    # Return a status code for automation
    return len(result.failures) + len(result.errors)

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
        result = run_all_tests()
    
    # Exit with appropriate code
    if result:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == '__main__':
    main() 