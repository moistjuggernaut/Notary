from abc import ABC, abstractmethod
from typing import Union
import numpy as np

class BaseStorageClient(ABC):
    """
    Abstract base class defining the contract for a storage client.
    """

    @abstractmethod
    def save_image(self, image: Union[np.ndarray, bytes], blob_name: str) -> str:
        """Save an image and return its storage URL."""
        pass

    @abstractmethod
    def get_signed_url(self, blob_name: str, expiration: int) -> str:
        """Generate a URL to access a stored image."""
        pass
