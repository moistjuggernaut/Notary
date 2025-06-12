#!/usr/bin/env python3
"""
Script to create synthetic test images for passport photo validation unit tests.
Creates various scenarios: valid photos, photos with issues, edge cases.
"""

import cv2
import numpy as np
import os

def create_valid_passport_photo(filename="valid_passport.jpg", size=(827, 1063)):
    """Create a synthetic valid passport photo."""
    width, height = size
    
    # Create light background
    image = np.full((height, width, 3), 240, dtype=np.uint8)
    
    # Add face oval in the center
    face_center_x = width // 2
    face_center_y = int(height * 0.45)  # Face slightly above center
    face_width = int(width * 0.5)
    face_height = int(height * 0.6)
    
    # Draw face (skin tone)
    cv2.ellipse(image, (face_center_x, face_center_y), (face_width//2, face_height//2), 0, 0, 360, (220, 180, 160), -1)
    
    # Add eyes
    eye_y = face_center_y - int(face_height * 0.15)
    left_eye_x = face_center_x - int(face_width * 0.2)
    right_eye_x = face_center_x + int(face_width * 0.2)
    
    cv2.circle(image, (left_eye_x, eye_y), 8, (50, 50, 50), -1)  # Left eye
    cv2.circle(image, (right_eye_x, eye_y), 8, (50, 50, 50), -1)  # Right eye
    
    # Add nose
    nose_y = face_center_y
    cv2.circle(image, (face_center_x, nose_y), 3, (200, 160, 140), -1)
    
    # Add mouth
    mouth_y = face_center_y + int(face_height * 0.2)
    cv2.ellipse(image, (face_center_x, mouth_y), (15, 5), 0, 0, 180, (150, 100, 100), 2)
    
    # Add hair
    hair_y = face_center_y - int(face_height * 0.4)
    cv2.ellipse(image, (face_center_x, hair_y), (face_width//2, face_height//4), 0, 0, 180, (80, 60, 40), -1)
    
    cv2.imwrite(filename, image)
    return image

def create_multiple_faces_photo(filename="multiple_faces.jpg", size=(827, 1063)):
    """Create a photo with multiple faces (should fail validation)."""
    width, height = size
    image = np.full((height, width, 3), 240, dtype=np.uint8)
    
    # Add two faces side by side
    for i, x_offset in enumerate([-0.25, 0.25]):
        face_center_x = int(width * (0.5 + x_offset))
        face_center_y = int(height * 0.45)
        face_size = int(min(width, height) * 0.15)
        
        # Draw face
        cv2.circle(image, (face_center_x, face_center_y), face_size, (220, 180, 160), -1)
        
        # Add eyes
        eye_offset = face_size // 3
        cv2.circle(image, (face_center_x - eye_offset//2, face_center_y - eye_offset//2), 3, (50, 50, 50), -1)
        cv2.circle(image, (face_center_x + eye_offset//2, face_center_y - eye_offset//2), 3, (50, 50, 50), -1)
    
    cv2.imwrite(filename, image)
    return image

def create_no_face_photo(filename="no_face.jpg", size=(827, 1063)):
    """Create a photo with no face (should fail validation)."""
    width, height = size
    
    # Create random noise pattern
    image = np.random.randint(100, 200, (height, width, 3), dtype=np.uint8)
    
    # Add some geometric shapes but no face
    cv2.rectangle(image, (100, 100), (200, 200), (150, 150, 150), -1)
    cv2.circle(image, (width//2, height//2), 50, (100, 100, 100), -1)
    
    cv2.imwrite(filename, image)
    return image

def create_dark_background_photo(filename="dark_background.jpg", size=(827, 1063)):
    """Create a photo with dark background (should fail background validation)."""
    width, height = size
    
    # Create dark background
    image = np.full((height, width, 3), 50, dtype=np.uint8)
    
    # Add face
    face_center_x = width // 2
    face_center_y = int(height * 0.45)
    face_size = int(min(width, height) * 0.2)
    
    cv2.circle(image, (face_center_x, face_center_y), face_size, (220, 180, 160), -1)
    
    # Add eyes
    eye_offset = face_size // 3
    cv2.circle(image, (face_center_x - eye_offset, face_center_y - eye_offset//2), 5, (50, 50, 50), -1)
    cv2.circle(image, (face_center_x + eye_offset, face_center_y - eye_offset//2), 5, (50, 50, 50), -1)
    
    cv2.imwrite(filename, image)
    return image

def create_red_eye_photo(filename="red_eye.jpg", size=(827, 1063)):
    """Create a photo with red-eye effect."""
    width, height = size
    image = np.full((height, width, 3), 240, dtype=np.uint8)
    
    # Add face
    face_center_x = width // 2
    face_center_y = int(height * 0.45)
    face_width = int(width * 0.5)
    face_height = int(height * 0.6)
    
    cv2.ellipse(image, (face_center_x, face_center_y), (face_width//2, face_height//2), 0, 0, 360, (220, 180, 160), -1)
    
    # Add red eyes
    eye_y = face_center_y - int(face_height * 0.15)
    left_eye_x = face_center_x - int(face_width * 0.2)
    right_eye_x = face_center_x + int(face_width * 0.2)
    
    cv2.circle(image, (left_eye_x, eye_y), 12, (0, 0, 255), -1)  # Red left eye
    cv2.circle(image, (right_eye_x, eye_y), 12, (0, 0, 255), -1)  # Red right eye
    
    cv2.imwrite(filename, image)
    return image

def create_tilted_head_photo(filename="tilted_head.jpg", size=(827, 1063)):
    """Create a photo with significantly tilted head (should fail pose validation)."""
    width, height = size
    image = np.full((height, width, 3), 240, dtype=np.uint8)
    
    # Create face but rotated
    face_center = (width // 2, int(height * 0.45))
    face_size = (int(width * 0.25), int(height * 0.4))
    
    # Create rotated face using transformation
    angle = 30  # 30 degree tilt
    rotation_matrix = cv2.getRotationMatrix2D(face_center, angle, 1)
    
    # Draw face on temporary image first
    temp_image = np.zeros_like(image)
    cv2.ellipse(temp_image, face_center, face_size, 0, 0, 360, (220, 180, 160), -1)
    
    # Add eyes to temp image
    eye_offset_x = face_size[0] // 3
    eye_offset_y = face_size[1] // 4
    cv2.circle(temp_image, (face_center[0] - eye_offset_x, face_center[1] - eye_offset_y), 8, (50, 50, 50), -1)
    cv2.circle(temp_image, (face_center[0] + eye_offset_x, face_center[1] - eye_offset_y), 8, (50, 50, 50), -1)
    
    # Apply rotation
    rotated_face = cv2.warpAffine(temp_image, rotation_matrix, (width, height))
    
    # Combine with background
    mask = cv2.cvtColor(rotated_face, cv2.COLOR_BGR2GRAY) > 0
    image[mask] = rotated_face[mask]
    
    cv2.imwrite(filename, image)
    return image

def create_blurry_photo(filename="blurry.jpg", size=(827, 1063)):
    """Create a blurry photo (should fail sharpness validation)."""
    # First create a normal photo
    image = create_valid_passport_photo("temp.jpg", size)
    
    # Apply strong blur
    blurred = cv2.GaussianBlur(image, (51, 51), 20)
    
    cv2.imwrite(filename, blurred)
    
    # Clean up temp file
    if os.path.exists("temp.jpg"):
        os.remove("temp.jpg")
    
    return blurred

def create_small_face_photo(filename="small_face.jpg", size=(827, 1063)):
    """Create a photo with face too small (should fail chin-to-crown ratio)."""
    width, height = size
    image = np.full((height, width, 3), 240, dtype=np.uint8)
    
    # Add very small face
    face_center_x = width // 2
    face_center_y = int(height * 0.45)
    face_size = int(min(width, height) * 0.08)  # Much smaller than required
    
    cv2.circle(image, (face_center_x, face_center_y), face_size, (220, 180, 160), -1)
    
    # Add tiny eyes
    eye_offset = face_size // 3
    cv2.circle(image, (face_center_x - eye_offset//2, face_center_y - eye_offset//2), 2, (50, 50, 50), -1)
    cv2.circle(image, (face_center_x + eye_offset//2, face_center_y - eye_offset//2), 2, (50, 50, 50), -1)
    
    cv2.imwrite(filename, image)
    return image

def create_all_test_images():
    """Create all test images for unit testing."""
    print("Creating test images for passport photo validation...")
    
    # Ensure images directory exists
    os.makedirs(".", exist_ok=True)
    
    test_images = [
        ("valid_passport.jpg", create_valid_passport_photo, "Valid passport photo for positive testing"),
        ("multiple_faces.jpg", create_multiple_faces_photo, "Multiple faces detected"),
        ("no_face.jpg", create_no_face_photo, "No face detected"),
        ("dark_background.jpg", create_dark_background_photo, "Dark background validation"),
        ("red_eye.jpg", create_red_eye_photo, "Red-eye detection testing"),
        ("tilted_head.jpg", create_tilted_head_photo, "Head pose validation"),
        ("blurry.jpg", create_blurry_photo, "Sharpness validation"),
        ("small_face.jpg", create_small_face_photo, "Face size validation"),
    ]
    
    created_files = []
    
    for filename, create_func, description in test_images:
        print(f"  Creating {filename}: {description}")
        try:
            create_func(filename)
            created_files.append(filename)
            print(f"    ✅ {filename} created successfully")
        except Exception as e:
            print(f"    ❌ Error creating {filename}: {e}")
    
    print(f"\nTest image creation complete. Created {len(created_files)} images.")
    
    # Create a README for the test images
    with open("README.md", "w") as f:
        f.write("# Test Images for Passport Photo Validation\n\n")
        f.write("This directory contains synthetic test images for unit testing the passport photo validation system.\n\n")
        f.write("## Test Images:\n\n")
        
        for filename, _, description in test_images:
            if filename in created_files:
                f.write(f"- **{filename}**: {description}\n")
        
        f.write("\n## Usage:\n\n")
        f.write("These images are used by the unit test suite to test various validation scenarios:\n")
        f.write("- Positive cases (should pass validation)\n")
        f.write("- Negative cases (should fail validation)\n")
        f.write("- Edge cases and error conditions\n\n")
        f.write("The images are automatically generated and do not contain real personal data.\n")
    
    print("README.md created with image descriptions.")
    
    return created_files

if __name__ == "__main__":
    created_files = create_all_test_images() 