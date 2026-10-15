import unittest
from workers.ingestion.src.parsers.chunker import CodeChunker

class TestCodeChunker(unittest.TestCase):
    def setUp(self):
        self.chunker = CodeChunker(max_lines_per_chunk=50, overlap_lines=5)

    def test_chunk_python_functions(self):
        code = """def add_numbers(a, b):
    return a + b

def subtract_numbers(a, b):
    return a - b
"""
        chunks = self.chunker.chunk_file(code, language="python")
        self.assertEqual(len(chunks), 2)
        self.assertEqual(chunks[0].symbol, "add_numbers")
        self.assertEqual(chunks[0].start_line, 1)
        self.assertEqual(chunks[1].symbol, "subtract_numbers")
        self.assertEqual(chunks[1].start_line, 4)

    def test_chunk_typescript_classes_and_functions(self):
        code = """export class PaymentService {
  process() {}
}

export function refundTransaction(id: string) {
  return true;
}
"""
        chunks = self.chunker.chunk_file(code, language="typescript")
        self.assertEqual(len(chunks), 2)
        self.assertEqual(chunks[0].symbol, "PaymentService")
        self.assertEqual(chunks[1].symbol, "refundTransaction")

    def test_chunk_fallback_window_on_plain_text(self):
        text = "\n".join([f"Line {i} content" for i in range(1, 101)])
        chunks = self.chunker.chunk_file(text, language="markdown")
        self.assertGreater(len(chunks), 1)
        self.assertIsNone(chunks[0].symbol)
        self.assertEqual(chunks[0].start_line, 1)
        self.assertEqual(chunks[0].end_line, 50)

if __name__ == '__main__':
    unittest.main()
