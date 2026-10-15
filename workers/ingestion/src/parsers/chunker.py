import hashlib
import re
from typing import List, Dict, Any, Optional

class CodeChunk:
    def __init__(
        self,
        symbol: Optional[str],
        start_line: int,
        end_line: int,
        content: str,
        chunker_version: str = "ast-v1.0"
    ):
        self.symbol = symbol
        self.start_line = start_line
        self.end_line = end_line
        self.content = content
        self.content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        self.chunker_version = chunker_version

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "start_line": self.start_line,
            "end_line": self.end_line,
            "content": self.content,
            "content_hash": self.content_hash,
            "chunker_version": self.chunker_version,
        }

class CodeChunker:
    """
    Symbol-aware chunker with bounded window fallback.
    Recognizes functions, classes, exports, and maintains exact 1-indexed line numbers.
    """
    def __init__(self, max_lines_per_chunk: int = 150, overlap_lines: int = 20):
        self.max_lines_per_chunk = max_lines_per_chunk
        self.overlap_lines = overlap_lines

        # Regex for common function/class declarations across JS/TS, Python, Go, Java
        self.symbol_patterns = [
            re.compile(r'^\s*(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)', re.MULTILINE),
            re.compile(r'^\s*(?:export\s+)?class\s+([a-zA-Z0-9_$]+)', re.MULTILINE),
            re.compile(r'^\s*(?:export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>', re.MULTILINE),
            re.compile(r'^\s*def\s+([a-zA-Z0-9_]+)\s*\(', re.MULTILINE),
            re.compile(r'^\s*class\s+([a-zA-Z0-9_]+)(?:\([^)]*\))?:', re.MULTILINE),
            re.compile(r'^\s*func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(', re.MULTILINE),
            re.compile(r'^\s*(?:public|private|protected)?\s*(?:static\s+)?[a-zA-Z0-9_<>[\]]+\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{', re.MULTILINE),
        ]

    def chunk_file(self, content: str, language: Optional[str] = None) -> List[CodeChunk]:
        lines = content.splitlines(keepends=True)
        if not lines:
            return []

        chunks: List[CodeChunk] = []
        total_lines = len(lines)

        # Find symbol boundary candidates
        symbol_boundaries = []
        for idx, line in enumerate(lines):
            line_num = idx + 1
            for pat in self.symbol_patterns:
                m = pat.match(line)
                if m:
                    symbol_boundaries.append((line_num, m.group(1)))
                    break

        if symbol_boundaries:
            for i, (start_line, symbol_name) in enumerate(symbol_boundaries):
                next_start = symbol_boundaries[i + 1][0] if i + 1 < len(symbol_boundaries) else total_lines + 1
                end_line = min(next_start - 1, total_lines)

                # Cap oversized symbols
                if (end_line - start_line + 1) > self.max_lines_per_chunk:
                    end_line = start_line + self.max_lines_per_chunk - 1

                chunk_content = "".join(lines[start_line - 1 : end_line])
                chunks.append(CodeChunk(
                    symbol=symbol_name,
                    start_line=start_line,
                    end_line=end_line,
                    content=chunk_content,
                    chunker_version="ast-v1.0"
                ))

        # Fallback to bounded window if no symbols were extracted
        if not chunks:
            curr_start = 1
            while curr_start <= total_lines:
                curr_end = min(curr_start + self.max_lines_per_chunk - 1, total_lines)
                chunk_content = "".join(lines[curr_start - 1 : curr_end])
                chunks.append(CodeChunk(
                    symbol=None,
                    start_line=curr_start,
                    end_line=curr_end,
                    content=chunk_content,
                    chunker_version="window-v1.0"
                ))
                if curr_end >= total_lines:
                    break
                curr_start = curr_end - self.overlap_lines + 1

        return chunks
