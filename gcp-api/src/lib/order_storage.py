"""
Order storage utilities for handling image storage after validation.
"""

import logging
import numpy as np
from lib.storage_config import StorageConfig
from lib.storage import get_storage_client

log = logging.getLogger(__name__)


class OrderStorage:
    """Handles storage operations for validated orders."""

    @classmethod
    def store_validated_order(
        cls,
        order_id: str,
        validated_bgr: np.ndarray,
    ) -> dict[str, str]:
        """
        Store images for a validated order.

        Args:
            order_id: UUID4 order ID for organizing files
            validated_bgr: Processed OpenCV BGR image array

        Returns:
            Storage information dict
        """
        try:
            # Get the appropriate storage client from the factory
            storage_client = get_storage_client()

            # Store validated (processed) image
            validated_blob_name = f"{order_id}/validated.jpg"
            storage_client.save_image(validated_bgr, validated_blob_name)
            validated_signed_url = storage_client.get_signed_url(
                validated_blob_name,
                expiration=StorageConfig.SIGNED_URL_EXPIRATION
            )

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

    @classmethod
    def get_order_image_original(cls, order_id: str) -> np.ndarray:
        """
        Get the original image for an order.
        """
        storage_client = get_storage_client()
        return storage_client.get_image(f"{order_id}/original.jpg")
