"""
Factory for creating a storage client based on the environment.
"""

from lib.storage_config import StorageConfig
from typing import TYPE_CHECKING, Union

if TYPE_CHECKING:
    from lib.storage import StorageClient
    from lib.storage_local import StorageClientLocal


def get_storage_client() -> Union["StorageClient", "StorageClientLocal"]:
    """
    Factory function to get the appropriate storage client.
    
    Returns an instance of StorageClientLocal for development,
    and StorageClient for production.
    """
    if StorageConfig.IS_DEVELOPMENT:
        # Import happens dynamically to avoid including local-only code in production
        from lib.storage_local import StorageClientLocal
        return StorageClientLocal()
    else:
        # Import happens dynamically to keep client instantiation consistent
        from lib.storage import StorageClient
        return StorageClient()
