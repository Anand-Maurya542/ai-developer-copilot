import os
import re
from typing import Tuple, Optional

# File extensions strictly excluded (binaries, compiled assets, archives)
BINARY_EXTENSIONS = {
    '.exe', '.bin', '.dll', '.so', '.dylib', '.iso', '.tar', '.gz', '.zip',
    '.7z', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.docx',
    '.xlsx', '.pyc', '.pyo', '.class', '.jar', '.war', '.lock',
}

# Directories completely ignored from ingestion
IGNORED_DIRECTORIES = {
    'node_modules', 'dist', 'build', '.git', '.github', '.next', '.venv',
    'venv', 'vendor', '__pycache__', '.idea', '.vscode', 'coverage',
}

# Secret/sensitive file name patterns to exclude
SECRET_FILE_PATTERNS = [
    re.compile(r'^\.env(\..+)?$', re.IGNORECASE),
    re.compile(r'.*\.pem$', re.IGNORECASE),
    re.compile(r'.*\.key$', re.IGNORECASE),
    re.compile(r'.*id_rsa.*', re.IGNORECASE),
    re.compile(r'.*credentials.*\.json$', re.IGNORECASE),
]

class SafeFileFilter:
    def __init__(self, max_file_size_bytes: int = 1_048_576):
        self.max_file_size_bytes = max_file_size_bytes

    def should_index(self, relative_path: str, file_size_bytes: int) -> Tuple[bool, Optional[str]]:
        """
        Determines if a file should be indexed.
        Returns: (should_index: bool, skip_reason: Optional[str])
        """
        parts = relative_path.replace('\\', '/').split('/')
        file_name = parts[-1]

        # 1. Directory exclusion check
        for part in parts[:-1]:
            if part in IGNORED_DIRECTORIES:
                return False, f"IGNORED_DIRECTORY_{part.upper()}"

        # 2. Secret file check
        for pattern in SECRET_FILE_PATTERNS:
            if pattern.match(file_name):
                return False, "EXCLUDED_SECRET_FILE"

        # 3. Binary extension check
        _, ext = os.path.splitext(file_name)
        if ext.lower() in BINARY_EXTENSIONS:
            return False, f"BINARY_EXTENSION_{ext.upper().strip('.')}"

        # 4. Oversized file check
        if file_size_bytes > self.max_file_size_bytes:
            return False, "OVERSIZED_FILE"

        return True, None

