"""
Gemini LLM-based photo validation module.
Validates processed photos against ICAO and country-specific requirements using Google's Gemini Flash model.
"""

import base64
import json
import logging
import os
from enum import Enum
from pathlib import Path
from typing import Dict, Any, Optional

import cv2
import numpy as np
import google.generativeai as genai

log = logging.getLogger(__name__)


class GeminiStatusReason(str, Enum):
    """Enumeration of possible Gemini validation status reasons."""

    NO_FACE = "NO_FACE"
    BG = "BG"
    POSE_DIR = "POSE_DIR"
    POSE_CTR = "POSE_CTR"
    EXPR = "EXPR"
    LIGHT = "LIGHT"
    EYES_OBS = "EYES_OBS"
    EYES_CL = "EYES_CL"
    GLS_GLARE = "GLS_GLARE"
    GLS_TINT = "GLS_TINT"
    HD_COVER = "HD_COVER"
    QUAL_BLUR = "QUAL_BLUR"
    QUAL_REDEYE = "QUAL_REDEYE"
    CTRY_DIM = "CTRY_DIM"
    CTRY_SPEC = "CTRY_SPEC"
    ICAO_OTH = "ICAO_OTH"

    INVALID_RESPONSE = "INVALID_RESPONSE"
    PARSE_ERROR = "PARSE_ERROR"
    EMPTY_RESPONSE = "EMPTY_RESPONSE"
    VALIDATION_ERROR = "VALIDATION_ERROR"

    @property
    def description(self) -> str:
        descriptions = {
            GeminiStatusReason.NO_FACE: "No face detected.",
            GeminiStatusReason.BG: "Background is not compliant with requirements.",
            GeminiStatusReason.POSE_DIR: "Head is not facing the camera directly.",
            GeminiStatusReason.POSE_CTR: "Head is not centered in the frame.",
            GeminiStatusReason.EXPR: "Expression is not neutral.",
            GeminiStatusReason.LIGHT: "Lighting issues detected (shadows, over/under exposure).",
            GeminiStatusReason.EYES_OBS: "Eyes are obscured.",
            GeminiStatusReason.EYES_CL: "Eyes appear closed.",
            GeminiStatusReason.GLS_GLARE: "Glare detected on glasses.",
            GeminiStatusReason.GLS_TINT: "Tinted glasses detected.",
            GeminiStatusReason.HD_COVER: "Head covering obscures portions of the face.",
            GeminiStatusReason.QUAL_BLUR: "Image is blurry or out of focus.",
            GeminiStatusReason.QUAL_REDEYE: "Red-eye effect detected.",
            GeminiStatusReason.CTRY_DIM: "Photo dimensions or crop are incorrect for the country.",
            GeminiStatusReason.CTRY_SPEC: "Country-specific rule violation detected.",
            GeminiStatusReason.ICAO_OTH: "Other ICAO requirement violation detected.",
            GeminiStatusReason.INVALID_RESPONSE: "Gemini returned an invalid response.",
            GeminiStatusReason.PARSE_ERROR: "Failed to parse the response from Gemini.",
            GeminiStatusReason.EMPTY_RESPONSE: "Gemini returned an empty response.",
            GeminiStatusReason.VALIDATION_ERROR: "Gemini validation encountered an unexpected error.",
        }
        return descriptions.get(self, self.value)


class GeminiValidator:
    """Validates photos using Gemini Flash LLM for ICAO compliance checking."""
    
    def __init__(self):
        """Initialize the GeminiValidator with configuration."""
        # Configure Gemini with optional API key (defaults to ADC when unset)
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Load prompt template
        self.prompt_template = self._load_prompt_template()
        
    def _load_prompt_template(self) -> str:
        """Load the prompt template from file."""
        try:
            # Get the directory of this file
            current_dir = Path(__file__).parent
            # Go up one level to gcp-api, then into prompts
            prompt_file = current_dir.parent / "prompts" / "validation_prompt.txt"
            
            with open(prompt_file, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            log.error(f"Failed to load prompt template: {e}")
            raise RuntimeError(f"Could not load prompt template: {e}")
    
    def _encode_image_to_base64(self, image_bgr: np.ndarray) -> str:
        """
        Convert BGR image to base64 string for Gemini API.
        
        Args:
            image_bgr (numpy.ndarray): Input image in BGR format
            
        Returns:
            str: Base64 encoded image string
        """
        try:
            # Convert BGR to RGB for proper display
            image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
            
            # Encode as JPEG
            success, buffer = cv2.imencode('.jpg', image_rgb, [cv2.IMWRITE_JPEG_QUALITY, 95])
            if not success:
                raise ValueError("Failed to encode image as JPEG")
            
            # Convert to base64
            image_base64 = base64.b64encode(buffer).decode('utf-8')
            return image_base64
            
        except Exception as e:
            log.error(f"Failed to encode image to base64: {e}")
            raise RuntimeError(f"Could not encode image: {e}")
    
    def _substitute_prompt_variables(self, country: Optional[str]) -> str:
        """
        Substitute COUNTRY_OF_ISSUE placeholder in the prompt template.
        
        Args:
            country (Optional[str]): Country of issue (e.g., "Belgium")
            
        Returns:
            str: Prompt with variables substituted
        """
        country_value = country or "Belgium"
        return self.prompt_template.replace("{COUNTRY_OF_ISSUE}", country_value)
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse Gemini's JSON response and return structured validation result.
        
        Args:
            response_text (str): Raw response from Gemini
            
        Returns:
            dict: Parsed validation result
        """
        try:
            # Clean the response text (remove any extra whitespace/newlines)
            cleaned_response = response_text.strip()
            
            # Parse JSON
            response_data = json.loads(cleaned_response)
            
            # Validate response structure
            if not isinstance(response_data, dict):
                raise ValueError("Response is not a JSON object")
            
            if "status" not in response_data:
                raise ValueError("Response missing 'status' field")
            
            status = response_data["status"]
            if status not in ["COMPLIANT", "NON_COMPLIANT"]:
                raise ValueError(f"Invalid status: {status}")
            
            # Build result
            result = {
                "success": status == "COMPLIANT",
                "status": status,
                "validation_response": response_data
            }
            
            # Add status_reason if present
            reason_value = response_data.get("status_reason")
            if reason_value:
                try:
                    reason_enum = GeminiStatusReason(reason_value)
                    result["status_reason"] = reason_enum.value
                    result["status_reason_description"] = reason_enum.description
                except ValueError:
                    log.warning(f"Gemini returned unknown status_reason '{reason_value}'")
                    result["status_reason"] = reason_value
            
            return result
            
        except json.JSONDecodeError as e:
            log.error(f"Failed to parse Gemini response as JSON: {e}")
            log.error(f"Raw response: {response_text}")
            return {
                "success": False,
                "status": "ERROR",
                "status_reason": GeminiStatusReason.INVALID_RESPONSE.value,
                "status_reason_description": GeminiStatusReason.INVALID_RESPONSE.description,
                "error": f"Failed to parse Gemini response: {e}",
                "validation_response": {"raw_response": response_text}
            }
        except Exception as e:
            log.error(f"Error parsing Gemini response: {e}")
            return {
                "success": False,
                "status": "ERROR", 
                "status_reason": GeminiStatusReason.PARSE_ERROR.value,
                "status_reason_description": GeminiStatusReason.PARSE_ERROR.description,
                "error": f"Error parsing response: {e}",
                "validation_response": {"raw_response": response_text}
            }
    
    def validate(self, image_bgr: np.ndarray, country: Optional[str] = None) -> Dict[str, Any]:
        """
        Validate a photo using Gemini Flash LLM.
        
        Args:
            image_bgr (numpy.ndarray): Preprocessed image in BGR format
            country (Optional[str]): Country of issue for validation context
            
        Returns:
            dict: Validation result with success, status, and optional status_reason
        """
        try:
            country = country or "Belgium"
            log.info(f"Starting Gemini validation for country={country}")
            
            # Encode image to base64
            image_base64 = self._encode_image_to_base64(image_bgr)
            
            # Prepare prompt with variables
            prompt = self._substitute_prompt_variables(country)
            
            # Create content for Gemini (image + text)
            content = [
                {
                    "mime_type": "image/jpeg",
                    "data": image_base64
                },
                prompt
            ]
            
            # Call Gemini API
            log.info("Calling Gemini Flash model...")
            response = self.model.generate_content(content)
            
            if not response.text:
                log.error("Gemini returned empty response")
                return {
                    "success": False,
                    "status": "ERROR",
                    "status_reason": GeminiStatusReason.EMPTY_RESPONSE.value,
                    "status_reason_description": GeminiStatusReason.EMPTY_RESPONSE.description,
                    "error": "Gemini returned empty response",
                    "validation_response": {}
                }
            
            # Parse and return result
            result = self._parse_gemini_response(response.text)
            log.info(f"Gemini validation completed: {result['status']}")
            
            return result
            
        except Exception as e:
            log.error(f"Error during Gemini validation: {e}", exc_info=True)
            return {
                "success": False,
                "status": "ERROR",
                "status_reason": GeminiStatusReason.VALIDATION_ERROR.value, 
                "status_reason_description": GeminiStatusReason.VALIDATION_ERROR.description,
                "error": f"Gemini validation failed: {e}",
                "validation_response": {}
            }
