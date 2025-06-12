"""
Baby Picture Validator API Package

Main package for passport photo validation system.
Contains compliance checking, face analysis, and image processing modules.
"""

__version__ = "1.0.0"
__author__ = "Baby Picture Validator Team"

# Make main modules available at package level
from .compliance_checker import ComplianceChecker
from .quick_check import handler as quick_check_handler

__all__ = ['ComplianceChecker', 'quick_check_handler'] 