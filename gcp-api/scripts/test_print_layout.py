"""
Local test script to generate a print layout with a dummy image.
This helps visualize the cutting guides without needing a real photo.

To run from the project root:
    python gcp-api/scripts/test_print_layout.py

The output file will be saved as 'test_print_layout.jpg' in the project root.
"""
import os
import sys
import cv2
import numpy as np

# Add the 'src' directory to the Python path to allow importing 'lib' modules
script_dir = os.path.dirname(os.path.abspath(__file__))
gcp_api_src_path = os.path.join(os.path.dirname(script_dir), "src")
if gcp_api_src_path not in sys.path:
    sys.path.insert(0, gcp_api_src_path)

from lib.print_processor import PrintProcessor

def create_dummy_photo(width: int, height: int) -> np.ndarray:
    """Creates a light gray dummy image with a dark border for clear visualization."""
    dummy_photo = np.full((height, width, 3), 240, dtype=np.uint8)
    # Add a border to make the photo edges obvious
    cv2.rectangle(dummy_photo, (5, 5), (width - 6, height - 6), (200, 200, 200), -1) # Inner fill
    cv2.rectangle(dummy_photo, (0, 0), (width - 1, height - 1), (100, 100, 100), 5)
    return dummy_photo

def main() -> None:
    """Generates a test print layout with a dummy image."""
    print("Initializing PrintProcessor to determine target photo dimensions...")
    processor = PrintProcessor()

    photo_width = processor.PHOTO_WIDTH_PX
    photo_height = processor.PHOTO_HEIGHT_PX

    print(f"Creating a dummy photo of size {photo_width}x{photo_height}px...")
    dummy_photo = create_dummy_photo(photo_width, photo_height)

    print("Generating print layout from dummy photo...")
    print_canvas, info = processor.create_print_layout(dummy_photo)

    # Save the output in the project root for easy access
    project_root = os.path.dirname(os.path.dirname(script_dir))
    output_filename = os.path.join(project_root, "test_print_layout.jpg")

    print(f"Saving test layout to '{output_filename}'...")
    cv2.imwrite(output_filename, print_canvas, [cv2.IMWRITE_JPEG_QUALITY, 95])

    print("\nScript finished successfully.")
    print(f"Check the generated image: {output_filename}")
    print("\nLayout details:")
    for key, value in info.items():
        print(f"  - {key}: {value}")

if __name__ == "__main__":
    main()
