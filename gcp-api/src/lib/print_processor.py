"""
Print processor module for passport photo printing.
Arranges processed photos for printing on standard 10×15 cm paper.
"""

import cv2
import numpy as np
from lib.app_config import config

class PrintProcessor:
    """Handles arranging passport photos for printing with cutting guides."""
    
    def __init__(self):
        self.config = config.icao
        
        self.PAPER_WIDTH_MM = 100
        self.PAPER_HEIGHT_MM = 150
        self.PHOTO_SPACING_MM = 6
        
        self.PAPER_WIDTH_PX = int((self.PAPER_WIDTH_MM / 25.4) * self.config.target_dpi)
        self.PAPER_HEIGHT_PX = int((self.PAPER_HEIGHT_MM / 25.4) * self.config.target_dpi)

        self.PHOTO_WIDTH_PX = self.config.final_output_width_px
        self.PHOTO_HEIGHT_PX = self.config.final_output_height_px
        
        self.GRID_COLS = 2
        self.GRID_ROWS = 2
        
        self._calculate_layout()
    
    def _calculate_layout(self):
        spacing_px = int((self.PHOTO_SPACING_MM / 25.4) * self.config.target_dpi)
        self.spacing_x = max(spacing_px, 1)
        self.spacing_y = max(spacing_px, 1)

        total_photos_width = (self.PHOTO_WIDTH_PX * self.GRID_COLS) + self.spacing_x * (self.GRID_COLS - 1)
        total_photos_height = (self.PHOTO_HEIGHT_PX * self.GRID_ROWS) + self.spacing_y * (self.GRID_ROWS - 1)
        
        self.margin_x = (self.PAPER_WIDTH_PX - total_photos_width) // 2
        self.margin_y = (self.PAPER_HEIGHT_PX - total_photos_height) // 2
        
        min_margin_px = int((5 / 25.4) * self.config.target_dpi)
        self.margin_x = max(self.margin_x, min_margin_px)
        self.margin_y = max(self.margin_y, min_margin_px)
    
    def _draw_cutting_guides(self, print_canvas):
        guide_color = (128, 128, 128)
        guide_thickness = 2
        tick_length = max(int((6 / 25.4) * self.config.target_dpi), 6)

        for row in range(self.GRID_ROWS):
            for col in range(self.GRID_COLS):
                x0 = self.margin_x + col * (self.PHOTO_WIDTH_PX + self.spacing_x)
                y0 = self.margin_y + row * (self.PHOTO_HEIGHT_PX + self.spacing_y)
                x1 = x0 + self.PHOTO_WIDTH_PX
                y1 = y0 + self.PHOTO_HEIGHT_PX

                # Top-left
                cv2.line(print_canvas, (max(x0 - tick_length, 0), y0), (x0, y0), guide_color, guide_thickness)
                cv2.line(print_canvas, (x0, max(y0 - tick_length, 0)), (x0, y0), guide_color, guide_thickness)
                # Top-right
                cv2.line(print_canvas, (x1, y0), (min(x1 + tick_length, self.PAPER_WIDTH_PX), y0), guide_color, guide_thickness)
                cv2.line(print_canvas, (x1, max(y0 - tick_length, 0)), (x1, y0), guide_color, guide_thickness)
                # Bottom-left
                cv2.line(print_canvas, (max(x0 - tick_length, 0), y1), (x0, y1), guide_color, guide_thickness)
                cv2.line(print_canvas, (x0, y1), (x0, min(y1 + tick_length, self.PAPER_HEIGHT_PX)), guide_color, guide_thickness)
                # Bottom-right
                cv2.line(print_canvas, (x1, y1), (min(x1 + tick_length, self.PAPER_WIDTH_PX), y1), guide_color, guide_thickness)
                cv2.line(print_canvas, (x1, y1), (x1, min(y1 + tick_length, self.PAPER_HEIGHT_PX)), guide_color, guide_thickness)
    
    def _add_print_info(self, print_canvas):
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 2
        font_color = (64, 64, 64)
        
        url_text = "www.passportphotovalidator.com"
        info_text = "4x Passport Photos (35x45mm) - Cut along guides"

        (url_w, url_h), _ = cv2.getTextSize(url_text, font, font_scale, 3)
        (info_w, info_h), _ = cv2.getTextSize(info_text, font, font_scale, 1)

        bottom_margin = int((4 / 25.4) * self.config.target_dpi)
        line_spacing = int((2 / 25.4) * self.config.target_dpi)

        info_y = self.PAPER_HEIGHT_PX - bottom_margin
        url_y = info_y - info_h - line_spacing
        
        cv2.putText(print_canvas, url_text, ((self.PAPER_WIDTH_PX - url_w) // 2, url_y), font, font_scale, font_color, 3)
        cv2.putText(print_canvas, info_text, ((self.PAPER_WIDTH_PX - info_w) // 2, info_y), font, font_scale, font_color, 1)
    
    def create_print_layout(self, photo_bgr):
        if photo_bgr is None:
            raise ValueError("Photo cannot be None")
        
        if photo_bgr.shape[:2] != (self.PHOTO_HEIGHT_PX, self.PHOTO_WIDTH_PX):
            photo_bgr = cv2.resize(photo_bgr, (self.PHOTO_WIDTH_PX, self.PHOTO_HEIGHT_PX), interpolation=cv2.INTER_AREA)
        
        print_canvas = np.full((self.PAPER_HEIGHT_PX, self.PAPER_WIDTH_PX, 3), 255, dtype=np.uint8)
        
        for row in range(self.GRID_ROWS):
            for col in range(self.GRID_COLS):
                x = self.margin_x + col * (self.PHOTO_WIDTH_PX + self.spacing_x)
                y = self.margin_y + row * (self.PHOTO_HEIGHT_PX + self.spacing_y)
                print_canvas[y:y+self.PHOTO_HEIGHT_PX, x:x+self.PHOTO_WIDTH_PX] = photo_bgr
        
        self._draw_cutting_guides(print_canvas)
        self._add_print_info(print_canvas)
        
        return print_canvas, {
            "paper_size_mm": f"{self.PAPER_WIDTH_MM}x{self.PAPER_HEIGHT_MM}",
            "photos_count": self.GRID_ROWS * self.GRID_COLS,
        }
