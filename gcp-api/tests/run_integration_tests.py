#!/usr/bin/env python3
"""
Integration test runner for the passport photo validation system.
This script runs integration tests that use actual image files.

Usage:
    python run_integration_tests.py
    python run_integration_tests.py --verbose
"""

import unittest
import sys
import os
import argparse

# Add the api directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_integration_tests(verbosity=2):
    """
    Run integration tests that use actual image files.
    
    Args:
        verbosity (int): Test output verbosity level (0-2)
        
    Returns:
        unittest.TestResult: Test results
    """
    print("=" * 70)
    print("PASSPORT PHOTO VALIDATION SYSTEM - INTEGRATION TESTS")
    print("=" * 70)
    print("These tests use actual image files and test the complete workflow.")
    print("Make sure you have OpenCV properly installed and configured.")
    print()
    
    try:
        # Import the integration test module
        from test_integration import TestIntegrationWithRealImages
        
        # Create test suite
        loader = unittest.TestLoader()
        suite = loader.loadTestsFromTestCase(TestIntegrationWithRealImages)
        
        # Run the tests
        runner = unittest.TextTestRunner(verbosity=verbosity, buffer=True)
        result = runner.run(suite)
        
        # Print summary
        print("\n" + "=" * 70)
        print("INTEGRATION TEST SUMMARY")
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
            print("Status:          ✅ ALL INTEGRATION TESTS PASSED")
        
        print("=" * 70)
        
        return result
        
    except ImportError as e:
        print(f"❌ ERROR: Could not import integration tests: {e}")
        print("\nThis is likely due to missing dependencies (OpenCV, etc.)")
        print("Make sure you have installed all required packages:")
        print("  pip install opencv-python numpy")
        print("\nOr if you're in a headless environment:")
        print("  pip install opencv-python-headless")
        return None
    except Exception as e:
        print(f"❌ ERROR: Unexpected error running integration tests: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main entry point for the integration test runner."""
    parser = argparse.ArgumentParser(description='Run integration tests for passport photo validation system')
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
    
    # Run integration tests
    result = run_integration_tests(verbosity)
    
    # Exit with appropriate code
    if result and (result.failures or result.errors):
        sys.exit(1)
    elif result is None:
        sys.exit(2)  # Import/setup error
    else:
        sys.exit(0)

if __name__ == '__main__':
    main() 