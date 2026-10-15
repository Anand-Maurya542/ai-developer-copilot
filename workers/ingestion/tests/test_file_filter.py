import unittest
from workers.ingestion.src.filters.file_filter import SafeFileFilter

class TestSafeFileFilter(unittest.TestCase):
    def test_safe_file_filter_allows_source_files(self):
        f = SafeFileFilter(max_file_size_bytes=1024 * 1024)
        ok, reason = f.should_index("src/services/auth.ts", 4096)
        self.assertTrue(ok)
        self.assertIsNone(reason)

    def test_safe_file_filter_excludes_node_modules(self):
        f = SafeFileFilter()
        ok, reason = f.should_index("node_modules/express/index.js", 2048)
        self.assertFalse(ok)
        self.assertIn("IGNORED_DIRECTORY_NODE_MODULES", reason)

    def test_safe_file_filter_excludes_secrets(self):
        f = SafeFileFilter()
        ok, reason = f.should_index(".env", 512)
        self.assertFalse(ok)
        self.assertEqual(reason, "EXCLUDED_SECRET_FILE")

        ok, reason = f.should_index("config/.env.production", 512)
        self.assertFalse(ok)
        self.assertEqual(reason, "EXCLUDED_SECRET_FILE")

        ok, reason = f.should_index("certs/server.pem", 1024)
        self.assertFalse(ok)
        self.assertEqual(reason, "EXCLUDED_SECRET_FILE")

    def test_safe_file_filter_excludes_binaries(self):
        f = SafeFileFilter()
        ok, reason = f.should_index("assets/logo.png", 50000)
        self.assertFalse(ok)
        self.assertIn("BINARY_EXTENSION", reason)

    def test_safe_file_filter_excludes_oversized(self):
        f = SafeFileFilter(max_file_size_bytes=1000)
        ok, reason = f.should_index("src/huge.json", 2000)
        self.assertFalse(ok)
        self.assertEqual(reason, "OVERSIZED_FILE")

if __name__ == '__main__':
    unittest.main()
