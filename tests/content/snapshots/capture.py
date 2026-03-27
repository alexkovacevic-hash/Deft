"""Capture a baseline snapshot of the Deft repo's markdown structure.

Walks the repo root, records every ``.md`` file, its top-level section
headers, and all internal markdown links.  Writes the result to
``tests/content/snapshots/baseline.json``.

Usage::

    uv run python tests/content/snapshots/capture.py

Author: Phase 2 — Content Integrity Suite
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Patterns
# ---------------------------------------------------------------------------
_HEADER_RE = re.compile(r"^(#{1,2})\s+(.*)", re.MULTILINE)
_LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")


def _relative(path: Path, root: Path) -> str:
    """Return *path* relative to *root* using forward slashes."""
    return str(path.relative_to(root)).replace("\\", "/")


# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------


def capture(root: Path) -> dict[str, Any]:
    """Walk *root* and return a snapshot dict.

    Keys:
        files   – sorted list of ``.md`` relative paths
        headers – mapping of relative path -> list of header strings
        links   – mapping of relative path -> list of ``[text](path)`` dicts
    """
    files: list[str] = []
    headers: dict[str, list[str]] = {}
    links: dict[str, list[dict[str, str]]] = {}

    for md in sorted(root.rglob("*.md")):
        # Skip hidden dirs, .venv, __pycache__, node_modules
        parts = md.relative_to(root).parts
        if any(p.startswith(".") or p in {"__pycache__", "node_modules", ".venv"} for p in parts):
            continue

        rel = _relative(md, root)
        files.append(rel)

        try:
            text = md.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue

        # Top-level headers (# or ##)
        file_headers: list[str] = []
        for match in _HEADER_RE.finditer(text):
            level = len(match.group(1))
            if level <= 2:
                file_headers.append(f"{'#' * level} {match.group(2)}")
        headers[rel] = file_headers

        # Internal markdown links
        file_links: list[dict[str, str]] = []
        for match in _LINK_RE.finditer(text):
            target = match.group(2)
            # Skip external URLs and anchors-only
            if target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            file_links.append({"text": match.group(1), "path": target})
        links[rel] = file_links

    return {"files": files, "headers": headers, "links": links}


def main() -> None:
    """Entry point — capture and write ``baseline.json``."""
    repo_root = Path(__file__).resolve().parent.parent.parent.parent
    snapshot = capture(repo_root)

    out = Path(__file__).resolve().parent / "baseline.json"
    out.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(snapshot['files'])} files to {out}")


if __name__ == "__main__":
    main()
