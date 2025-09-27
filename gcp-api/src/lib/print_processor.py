"""
Print processor module for passport photo printing.
Handles arranging processed photos for printing on standard 10×15 cm paper.
"""

import cv2
import numpy as np
from lib.config import Config

class PrintProcessor:
    """Handles arranging passport photos for printing with cutting guides."""
    
    def __init__(self):
        """Initialize the PrintProcessor."""
        self.config = Config()
        
        # Print paper dimensions (10×15 cm)
        self.PAPER_WIDTH_MM = 100
        self.PAPER_HEIGHT_MM = 150

        # Desired spacing between photos (in mm)
        self.PHOTO_SPACING_MM = 6
        
        # Calculate paper dimensions in pixels at target DPI
        self.PAPER_WIDTH_PX = int((self.PAPER_WIDTH_MM / 25.4) * self.config.TARGET_DPI)
        self.PAPER_HEIGHT_PX = int((self.PAPER_HEIGHT_MM / 25.4) * self.config.TARGET_DPI)
        
        # Photo dimensions (already defined in config)
        self.PHOTO_WIDTH_PX = self.config.FINAL_OUTPUT_WIDTH_PX
        self.PHOTO_HEIGHT_PX = self.config.FINAL_OUTPUT_HEIGHT_PX
        
        # Grid layout (2x2 for 4 photos)
        self.GRID_COLS = 2
        self.GRID_ROWS = 2
        
        # Calculate spacing and margins
        self._calculate_layout()
    
    def _calculate_layout(self):
        """Calculate the optimal layout for photos on the print paper."""
        # Calculate photo spacing in pixels (ensure at least 1px)
        spacing_px = int((self.PHOTO_SPACING_MM / 25.4) * self.config.TARGET_DPI)
        self.spacing_x = max(spacing_px, 1)
        self.spacing_y = max(spacing_px, 1)

        # Calculate total area needed for photos
        total_photos_width = (self.PHOTO_WIDTH_PX * self.GRID_COLS) + self.spacing_x * (self.GRID_COLS - 1)
        total_photos_height = (self.PHOTO_HEIGHT_PX * self.GRID_ROWS) + self.spacing_y * (self.GRID_ROWS - 1)
        
        # Calculate margins
        self.margin_x = (self.PAPER_WIDTH_PX - total_photos_width) // 2
        self.margin_y = (self.PAPER_HEIGHT_PX - total_photos_height) // 2
        
        # Ensure minimum margins
        min_margin_px = int((5 / 25.4) * self.config.TARGET_DPI)  # 5mm minimum margin
        self.margin_x = max(self.margin_x, min_margin_px)
        self.margin_y = max(self.margin_y, min_margin_px)
        
        # Precompute grid dimensions for later use
        self.grid_width = total_photos_width
        self.grid_height = total_photos_height
    
    def _draw_cutting_guides(self, print_canvas):
        """Draw cutting guides on the print canvas."""
        # Cutting guide color (light gray)
        guide_color = (128, 128, 128)
        guide_thickness = 2

        tick_length = int((6 / 25.4) * self.config.TARGET_DPI)
        tick_length = max(tick_length, 6)

        for row in range(self.GRID_ROWS):
            for col in range(self.GRID_COLS):
                x0 = self.margin_x + col * (self.PHOTO_WIDTH_PX + self.spacing_x)
                y0 = self.margin_y + row * (self.PHOTO_HEIGHT_PX + self.spacing_y)
                x1 = x0 + self.PHOTO_WIDTH_PX
                y1 = y0 + self.PHOTO_HEIGHT_PX

                # Top-left corner
                cv2.line(
                    print_canvas,
                    (max(x0 - tick_length, 0), y0),
                    (x0, y0),
                    guide_color,
                    guide_thickness,
                )
                cv2.line(
                    print_canvas,
                    (x0, max(y0 - tick_length, 0)),
                    (x0, y0),
                    guide_color,
                    guide_thickness,
                )

                # Top-right corner
                cv2.line(
                    print_canvas,
                    (x1, y0),
                    (min(x1 + tick_length, self.PAPER_WIDTH_PX), y0),
                    guide_color,
                    guide_thickness,
                )
                cv2.line(
                    print_canvas,
                    (x1, max(y0 - tick_length, 0)),
                    (x1, y0),
                    guide_color,
                    guide_thickness,
                )

                # Bottom-left corner
                cv2.line(
                    print_canvas,
                    (max(x0 - tick_length, 0), y1),
                    (x0, y1),
                    guide_color,
                    guide_thickness,
                )
                cv2.line(
                    print_canvas,
                    (x0, y1),
                    (x0, min(y1 + tick_length, self.PAPER_HEIGHT_PX)),
                    guide_color,
                    guide_thickness,
                )

                # Bottom-right corner
                cv2.line(
                    print_canvas,
                    (x1, y1),
                    (min(x1 + tick_length, self.PAPER_WIDTH_PX), y1),
                    guide_color,
                    guide_thickness,
                )
                cv2.line(
                    print_canvas,
                    (x1, y1),
                    (x1, min(y1 + tick_length, self.PAPER_HEIGHT_PX)),
                    guide_color,
                    guide_thickness,
                )
    
    def _add_print_info(self, print_canvas):
        """Add printing information text to the canvas."""
        # Font settings
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.8 # Increased size
        font_color = (64, 64, 64)  # Dark gray
        
        # Text content
        url_text = "www.passportphotovalidator.com"
        info_text = f"4x Passport Photos (35x45mm) - Cut along guides"
        dpi_text = f"Print at {self.config.TARGET_DPI} DPI"

        # Thicknesses
        url_thickness = 2  # Bold
        info_thickness = 1 # Regular
        dpi_thickness = 1  # Regular

        # Get text sizes to calculate layout
        (url_w, url_h), _ = cv2.getTextSize(url_text, font, font_scale, url_thickness)
        (info_w, info_h), _ = cv2.getTextSize(info_text, font, font_scale, info_thickness)
        (dpi_w, dpi_h), _ = cv2.getTextSize(dpi_text, font, font_scale, dpi_thickness)

        # Define margins and spacing
        bottom_margin = int((4 / 25.4) * self.config.TARGET_DPI)  # 4mm from bottom
        line_spacing = int((2 / 25.4) * self.config.TARGET_DPI)   # 2mm between lines

        # Calculate Y positions from the bottom up
        dpi_y = self.PAPER_HEIGHT_PX - bottom_margin
        info_y = dpi_y - dpi_h - line_spacing
        url_y = info_y - info_h - line_spacing
        
        # Calculate X positions to center the text
        url_x = (self.PAPER_WIDTH_PX - url_w) // 2
        info_x = (self.PAPER_WIDTH_PX - info_w) // 2
        dpi_x = (self.PAPER_WIDTH_PX - dpi_w) // 2
        
        # Draw the text on the canvas
        cv2.putText(print_canvas, url_text, (url_x, url_y), 
                   font, font_scale, font_color, url_thickness)
        cv2.putText(print_canvas, info_text, (info_x, info_y), 
                   font, font_scale, font_color, info_thickness)
        cv2.putText(print_canvas, dpi_text, (dpi_x, dpi_y), 
                   font, font_scale, font_color, dpi_thickness)
    
    def create_print_layout(self, photo_bgr):
        """
        Create a print layout with 4 copies of the photo arranged on 10×15 cm paper.
        
        Args:
            photo_bgr (numpy.ndarray): The processed passport photo in BGR format
            
        Returns:
            tuple: (print_canvas, info_dict) where print_canvas is the printable image
                   and info_dict contains layout information
        """
        if photo_bgr is None:
            raise ValueError("Photo cannot be None")
        
        # Validate photo dimensions
        if photo_bgr.shape[:2] != (self.PHOTO_HEIGHT_PX, self.PHOTO_WIDTH_PX):
            # Resize photo to expected dimensions if needed
            photo_bgr = cv2.resize(photo_bgr, (self.PHOTO_WIDTH_PX, self.PHOTO_HEIGHT_PX), 
                                 interpolation=cv2.INTER_AREA)
        
        # Create white canvas for print layout
        print_canvas = np.full((self.PAPER_HEIGHT_PX, self.PAPER_WIDTH_PX, 3), 
                              255, dtype=np.uint8)
        
        # Place 4 copies of the photo in a 2×2 grid
        for row in range(self.GRID_ROWS):
            for col in range(self.GRID_COLS):
                # Calculate position for this photo
                x = self.margin_x + col * (self.PHOTO_WIDTH_PX + self.spacing_x)
                y = self.margin_y + row * (self.PHOTO_HEIGHT_PX + self.spacing_y)
                
                # Place photo on canvas
                print_canvas[y:y+self.PHOTO_HEIGHT_PX, x:x+self.PHOTO_WIDTH_PX] = photo_bgr
        
        # Add cutting guides
        self._draw_cutting_guides(print_canvas)
        
        # Add print information
        self._add_print_info(print_canvas)
        
        # Create info dictionary
        info_dict = {
            "paper_size_mm": f"{self.PAPER_WIDTH_MM}×{self.PAPER_HEIGHT_MM}",
            "paper_size_px": f"{self.PAPER_WIDTH_PX}×{self.PAPER_HEIGHT_PX}",
            "photo_size_mm": f"{self.config.TARGET_PHOTO_WIDTH_MM}×{self.config.TARGET_PHOTO_HEIGHT_MM}",
            "photo_size_px": f"{self.PHOTO_WIDTH_PX}×{self.PHOTO_HEIGHT_PX}",
            "photos_count": self.GRID_ROWS * self.GRID_COLS,
            "dpi": self.config.TARGET_DPI,
            "margins_px": {"x": self.margin_x, "y": self.margin_y}
        }
        
        return print_canvas, info_dict
    
    def save_print_layout(self, photo_bgr, output_path):
        """
        Create and save a print layout to a file.
        
        Args:
            photo_bgr (numpy.ndarray): The processed passport photo in BGR format
            output_path (str): Path to save the print layout
            
        Returns:
            dict: Layout information
        """
        print_canvas, info_dict = self.create_print_layout(photo_bgr)
        
        # Save with high quality
        cv2.imwrite(output_path, print_canvas, [cv2.IMWRITE_JPEG_QUALITY, 95])
        
        return info_dict 