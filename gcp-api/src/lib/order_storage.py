"""
Order storage utilities for handling image storage after validation.
"""

import logging
import numpy as np
from lib.storage_factory import get_storage_client

log = logging.getLogger(__name__)


class OrderStorage:
    """Handles storage operations for validated orders."""

    @classmethod
    def store_validated_order(
        cls,
        order_id: str,
        original_bgr: np.ndarray,
        processed_bgr: np.ndarray,
    ) -> dict[str, str]:
        """
        Store images for a validated order.

        Args:
            order_id: UUID4 order ID for organizing files
            original_bgr: Original OpenCV BGR image array
            processed_bgr: Processed OpenCV BGR image array

        Returns:
            Storage information dict
        """
        try:
            # Initialize storage using the factory
            storage_client = get_storage_client()

            # Store original image
            original_blob_name = f"{order_id}/original.jpg"
            storage_client.save_image(original_bgr, original_blob_name)
            # Store validated (processed) image
            validated_blob_name = f"{order_id}/validated.jpg"
            storage_client.save_image(processed_bgr, validated_blob_name)
            validated_signed_url = storage_client.get_signed_url(validated_blob_name)

            # Return storage information
            storage_info = {
                "order_id": order_id,
                "validated_image_url": validated_signed_url,
            }

            log.info(f"Images stored successfully for order: {order_id}")
            return storage_info

        except Exception as storage_error:
            log.error(f"Failed to store images: {storage_error}")
            raise storage_error
