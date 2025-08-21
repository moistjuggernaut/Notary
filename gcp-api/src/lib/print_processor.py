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
        # Calculate total area needed for photos
        total_photos_width = self.PHOTO_WIDTH_PX * self.GRID_COLS
        total_photos_height = self.PHOTO_HEIGHT_PX * self.GRID_ROWS
        
        # Calculate margins
        self.margin_x = (self.PAPER_WIDTH_PX - total_photos_width) // 2
        self.margin_y = (self.PAPER_HEIGHT_PX - total_photos_height) // 2
        
        # Ensure minimum margins
        min_margin_px = int((5 / 25.4) * self.config.TARGET_DPI)  # 5mm minimum margin
        self.margin_x = max(self.margin_x, min_margin_px)
        self.margin_y = max(self.margin_y, min_margin_px)
        
        # Calculate spacing between photos
        self.spacing_x = 0  # No spacing between photos for easier cutting
        self.spacing_y = 0
    
    def _draw_cutting_guides(self, print_canvas):
        """Draw cutting guides on the print canvas."""
        # Cutting guide color (light gray)
        guide_color = (128, 128, 128)
        guide_thickness = 2
        
        # Draw outer cutting frame
        frame_margin = int((2 / 25.4) * self.config.TARGET_DPI)  # 2mm outside the photos
        
        # Calculate frame coordinates
        frame_x1 = self.margin_x - frame_margin
        frame_y1 = self.margin_y - frame_margin
        frame_x2 = self.margin_x + (self.PHOTO_WIDTH_PX * self.GRID_COLS) + frame_margin
        frame_y2 = self.margin_y + (self.PHOTO_HEIGHT_PX * self.GRID_ROWS) + frame_margin
        
        # Ensure frame is within canvas bounds
        frame_x1 = max(0, frame_x1)
        frame_y1 = max(0, frame_y1)
        frame_x2 = min(self.PAPER_WIDTH_PX, frame_x2)
        frame_y2 = min(self.PAPER_HEIGHT_PX, frame_y2)
        
        # Draw outer frame
        cv2.rectangle(print_canvas, (frame_x1, frame_y1), (frame_x2, frame_y2), guide_color, guide_thickness)
        
        # Draw individual photo cutting guides
        for row in range(self.GRID_ROWS):
            for col in range(self.GRID_COLS):
                x = self.margin_x + col * self.PHOTO_WIDTH_PX
                y = self.margin_y + row * self.PHOTO_HEIGHT_PX
                
                # Draw photo border
                cv2.rectangle(print_canvas, 
                            (x, y), 
                            (x + self.PHOTO_WIDTH_PX, y + self.PHOTO_HEIGHT_PX), 
                            guide_color, 1)
        
        # Draw cross marks at corners for precise cutting
        cross_size = int((3 / 25.4) * self.config.TARGET_DPI)  # 3mm cross marks
        
        # Corner positions for each photo
        for row in range(self.GRID_ROWS + 1):  # +1 to include bottom edge
            for col in range(self.GRID_COLS + 1):  # +1 to include right edge
                x = self.margin_x + col * self.PHOTO_WIDTH_PX
                y = self.margin_y + row * self.PHOTO_HEIGHT_PX
                
                # Draw cross mark
                cv2.line(print_canvas, 
                        (x - cross_size, y), (x + cross_size, y), 
                        guide_color, 1)
                cv2.line(print_canvas, 
                        (x, y - cross_size), (x, y + cross_size), 
                        guide_color, 1)
    
    def _add_print_info(self, print_canvas):
        """Add printing information text to the canvas."""
        # Font settings
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.6
        font_color = (64, 64, 64)  # Dark gray
        thickness = 1
        
        # Calculate text position (bottom of canvas)
        text_y = self.PAPER_HEIGHT_PX - int((3 / 25.4) * self.config.TARGET_DPI)  # 3mm from bottom
        
        # Add dimension info
        info_text = f"4x Passport Photos (35x45mm) - Cut along guides"
        text_size = cv2.getTextSize(info_text, font, font_scale, thickness)[0]
        text_x = (self.PAPER_WIDTH_PX - text_size[0]) // 2
        
        cv2.putText(print_canvas, info_text, (text_x, text_y), 
                   font, font_scale, font_color, thickness)
        
        # Add DPI info
        dpi_text = f"Print at {self.config.TARGET_DPI} DPI"
        dpi_size = cv2.getTextSize(dpi_text, font, font_scale, thickness)[0]
        dpi_x = (self.PAPER_WIDTH_PX - dpi_size[0]) // 2
        dpi_y = text_y + int((4 / 25.4) * self.config.TARGET_DPI)  # 4mm below main text
        
        cv2.putText(print_canvas, dpi_text, (dpi_x, dpi_y), 
                   font, font_scale, font_color, thickness)
    
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