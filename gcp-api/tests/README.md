# Passport Photo Validation System - Test Suite

This directory contains comprehensive unit tests and integration tests for the passport photo validation system.

## Test Structure

The test suite is organized into the following modules:

### Unit Tests
- **`test_config.py`** - Tests for configuration constants and calculations
- **`test_face_analyzer.py`** - Tests for face detection and analysis (requires OpenCV)
- **`test_image_preprocessor.py`** - Tests for image preprocessing workflow (requires OpenCV)
- **`test_photo_validator.py`** - Tests for ICAO compliance validation (requires OpenCV)
- **`test_compliance_checker.py`** - Tests for the main orchestrator and API handler (requires OpenCV)

### Integration Tests
- **`test_integration.py`** - End-to-end tests using actual image files (requires OpenCV)

### Test Infrastructure
- **`run_tests.py`** - Main test runner for unit tests
- **`run_integration_tests.py`** - Dedicated runner for integration tests
- **`images/`** - Directory containing test images and image generation scripts

## Running Tests

### Prerequisites

Make sure you have the required dependencies installed:

```bash
# For basic config tests (no OpenCV required)
pip install numpy

# For full test suite (including OpenCV-dependent tests)
pip install opencv-python numpy insightface

# For headless environments (servers without GUI)
pip install opencv-python-headless numpy insightface
```

### Running Unit Tests

#### Run All Unit Tests
```bash
cd api/tests
python run_tests.py
```

#### Run Specific Module Tests
```bash
# Configuration tests (works without OpenCV)
python run_tests.py --module config

# Face analyzer tests (requires OpenCV)
python run_tests.py --module face_analyzer

# Image preprocessor tests (requires OpenCV)
python run_tests.py --module image_preprocessor

# Photo validator tests (requires OpenCV)
python run_tests.py --module photo_validator

# Compliance checker tests (requires OpenCV)
python run_tests.py --module compliance_checker
```

#### Verbosity Options
```bash
# Quiet mode (minimal output)
python run_tests.py --quiet

# Verbose mode
python run_tests.py --verbose

# Extra verbose mode
python run_tests.py -vv
```

### Running Integration Tests

Integration tests use actual image files and test the complete workflow:

```bash
cd api/tests
python run_integration_tests.py
```

#### Integration Test Options
```bash
# Quiet mode
python run_integration_tests.py --quiet

# Verbose mode
python run_integration_tests.py --verbose
```

## Test Images

The `images/` directory contains:
- **`valid1.jpg`** - A real passport photo for testing
- **`create_test_images.py`** - Script to generate synthetic test images

### Generating Test Images

To create additional synthetic test images for testing:

```bash
cd api/tests/images
python create_test_images.py
```

This will create various test scenarios:
- Valid passport photos
- Photos with multiple faces
- Photos with no faces
- Photos with poor backgrounds
- Photos with red eyes
- Blurry photos
- Photos with tilted heads

## Test Coverage

### What's Tested

#### Configuration (`test_config.py`)
- ✅ Photo dimensions and DPI calculations
- ✅ Aspect ratio validations
- ✅ Chin-to-crown ratio ranges
- ✅ Pose tolerance values
- ✅ Background check parameters
- ✅ Eye detection thresholds
- ✅ Landmark indices

#### Face Analysis (`test_face_analyzer.py`)
- ✅ Face detection initialization
- ✅ Image analysis with BGR/RGB conversion
- ✅ Quick check with downscaling
- ✅ Multiple face handling
- ✅ Error handling for failed detection

#### Image Preprocessing (`test_image_preprocessor.py`)
- ✅ Face detail extraction
- ✅ Crop coordinate calculation
- ✅ Background checking
- ✅ Background removal (with rembg)
- ✅ Complete processing pipeline
- ✅ Error handling for edge cases

#### Photo Validation (`test_photo_validator.py`)
- ✅ Head pose validation
- ✅ Chin-to-crown ratio checking
- ✅ Eye aspect ratio detection
- ✅ Red-eye detection
- ✅ Sharpness assessment
- ✅ Background validation
- ✅ Contrast checking

#### Compliance Checking (`test_compliance_checker.py`)
- ✅ Workflow orchestration
- ✅ Recommendation generation
- ✅ File-based processing
- ✅ Array-based processing
- ✅ API handler with CORS
- ✅ Error handling and logging

#### Integration Tests (`test_integration.py`)
- ✅ End-to-end workflow with real images
- ✅ File-based and array-based processing
- ✅ Multiple face detection scenarios
- ✅ No face detection scenarios
- ✅ Preprocessing failure scenarios
- ✅ Validation failure scenarios
- ✅ Image dimension compatibility

### Test Approach

- **Extensive Mocking**: Unit tests use mocking to avoid loading actual ML models during testing
- **Synthetic Data**: Tests create synthetic images and face data to avoid privacy issues
- **Real Image Testing**: Integration tests use actual image files for end-to-end validation
- **Error Scenarios**: Comprehensive testing of failure modes and edge cases
- **API Testing**: Full testing of the serverless handler with CORS support

## Environment Considerations

### Local Development
- Full test suite should work with `opencv-python` installed
- All tests should pass in a proper development environment

### CI/CD Environments
- Use `opencv-python-headless` for server environments
- Some tests may be skipped if OpenCV is not available
- Config tests will always work regardless of OpenCV availability

### Docker/Container Environments
- Install system dependencies for OpenCV if needed
- Use headless OpenCV variant
- Ensure test images are available in the container

## Troubleshooting

### Common Issues

#### "libGL.so.1: cannot open shared object file"
This is a common OpenCV issue in headless environments:
```bash
# Solution 1: Use headless OpenCV
pip uninstall opencv-python
pip install opencv-python-headless

# Solution 2: Install system dependencies (Ubuntu/Debian)
apt-get update && apt-get install -y libgl1-mesa-glx
```

#### "No module named 'api'"
Make sure you're running tests from the correct directory:
```bash
cd api/tests
python run_tests.py
```

#### "Test image not found"
Make sure the test images are in the correct location:
```bash
ls api/tests/images/valid1.jpg
```

### Getting Help

If you encounter issues:
1. Check that all dependencies are installed
2. Verify you're in the correct directory
3. Try running just the config tests first: `python run_tests.py --module config`
4. Check the error messages for specific missing dependencies

## Contributing

When adding new tests:
1. Follow the existing naming convention (`test_*.py`)
2. Use appropriate mocking to avoid loading ML models in unit tests
3. Add integration tests for new end-to-end workflows
4. Update this README if you add new test modules
5. Ensure tests work in both local and headless environments 