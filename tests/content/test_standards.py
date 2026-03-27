"""
test_standards.py -- RFC2119 notation and deprecated reference checks.

Covers:
    - RFC2119 legend presence in content directories.
    - Deprecated ``core/user.md`` path references.
    - Deprecated ``warping`` name references outside ``old/``.

Author: Phase 2 -- Content Integrity Suite
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

# Directories whose .md files must contain the RFC2119 legend.
_RFC2119_DIRS = [
    "languages",
    "interfaces",
    "tools",
    "strategies",
    "context",
    "verification",
    "resilience",
]

_KNOWN_FAILURES_PATH = Path(__file__).parent / "snapshots" / "known_failures.json"


def _load_known_failures() -> dict[str, Any]:
    """Load known_failures.json if it exists."""
    if _KNOWN_FAILURES_PATH.exists():
        return json.loads(_KNOWN_FAILURES_PATH.read_text(encoding="utf-8"))
    return {}


_KNOWN = _load_known_failures()
_DEPRECATED_PATH_FILES = set(_KNOWN.get("deprecated_path_references", {}).get("files", []))
_WARPING_FILES = set(_KNOWN.get("warping_references", {}).get("files", []))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


# Index / meta files that are not normative standard documents.
_RFC2119_EXCLUDED_NAMES = {"README.md", "commands.md"}


def _collect_md_files(root: Path, subdir: str) -> list[Path]:
    """Collect all .md files in *root/subdir*, excluding index/meta files."""
    d = root / subdir
    if not d.is_dir():
        return []
    return sorted(p for p in d.rglob("*.md") if p.name not in _RFC2119_EXCLUDED_NAMES)


def _relative(path: Path, root: Path) -> str:
    """Return *path* relative to *root* using forward slashes."""
    return str(path.relative_to(root)).replace("\\", "/")


def _all_md_files(root: Path) -> list[tuple[str, Path]]:
    """Collect all .md files in the repo, excluding old/ and hidden dirs."""
    results = []
    for md in sorted(root.rglob("*.md")):
        parts = md.relative_to(root).parts
        if any(
            p.startswith(".") or p in {"__pycache__", "node_modules", ".venv", "old"} for p in parts
        ):
            continue
        results.append((_relative(md, root), md))
    return results


# ---------------------------------------------------------------------------
# RFC2119 legend check
# ---------------------------------------------------------------------------


def _rfc2119_params(root: Path) -> list[tuple[str, Path]]:
    """Build (id, path) pairs for parametrize."""
    params = []
    for subdir in _RFC2119_DIRS:
        for md in _collect_md_files(root, subdir):
            params.append((_relative(md, root), md))
    return params


def test_rfc2119_legend_present(deft_root: Path) -> None:
    """Every .md in content directories must contain the RFC2119 legend."""
    params = _rfc2119_params(deft_root)
    missing = []
    for rel, md in params:
        text = md.read_text(encoding="utf-8", errors="replace")
        # Two legend formats in the repo:
        #   "!=MUST, ~=SHOULD"  (original)
        #   "`!` = MUST ... `~` = SHOULD"  (newer context/ files)
        has_legend = (
            "!=MUST" in text
            or "!= MUST" in text
            or ("`!` = MUST" in text and "`~` = SHOULD" in text)
        )
        if not has_legend:
            missing.append(rel)
    if missing:
        pytest.fail(f"RFC2119 legend missing in: {', '.join(missing)}")


# ---------------------------------------------------------------------------
# Deprecated core/user.md path check
# ---------------------------------------------------------------------------


def test_no_deprecated_user_path(deft_root: Path) -> None:
    """No .md file should reference the deprecated core/user.md path.

    Known exceptions are listed in known_failures.json.
    """
    violations = []
    for rel, md in _all_md_files(deft_root):
        text = md.read_text(encoding="utf-8", errors="replace")
        if "core/user.md" in text and rel not in _DEPRECATED_PATH_FILES:
            violations.append(rel)

    if violations:
        pytest.fail(f"Unexpected deprecated core/user.md references in: {', '.join(violations)}")


# ---------------------------------------------------------------------------
# Deprecated 'warping' name check
# ---------------------------------------------------------------------------


def test_no_warping_references(deft_root: Path) -> None:
    """Files outside old/ should not contain 'warping' (case-insensitive).

    Known exceptions from known_failures.json are tolerated.
    """
    violations = []
    for rel, md in _all_md_files(deft_root):
        text = md.read_text(encoding="utf-8", errors="replace")
        if "warping" in text.lower() and rel not in _WARPING_FILES:
            violations.append(rel)

    if violations:
        pytest.fail(f"Unexpected 'warping' references in: {', '.join(violations)}")
