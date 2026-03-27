"""test_shape.py -- Content shape validation for categorized .md files.

Verifies that files in each category (languages, strategies, interfaces,
tools) contain the required section headers defined in shapes.py.

Author: Phase 2 -- Content Integrity Suite
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from tests.fixtures.shapes import (
    INTERFACE_SHAPE,
    LANGUAGE_SHAPE,
    STRATEGY_SHAPE,
    TOOL_SHAPE,
    ShapeSchema,
)

_SECTION_RE = re.compile(r"^##\s+(.*)", re.MULTILINE)


def _extract_sections(text: str) -> list[str]:
    """Extract all ## section titles from markdown text."""
    return [m.group(1).strip() for m in _SECTION_RE.finditer(text)]


def _normalize(s: str) -> str:
    """Normalize a section title for comparison (lowercase, strip emoji)."""
    cleaned = re.sub(
        r"^[\U0001F300-\U0001FAFF\u2600-\u27BF\u2700-\u27BF]+\s*", "", s
    )
    return cleaned.lower().strip()


def _section_matches(normalized_title: str, required: str) -> bool:
    """Check if *normalized_title* starts with *required* (case-insensitive).

    This allows ``workflow overview`` to match a requirement of ``workflow``.
    """
    return normalized_title.startswith(required.lower())


def _check_shape(file_path: Path, schema: ShapeSchema) -> str | None:
    """Check if *file_path* conforms to *schema*. Returns error message or None."""
    text = file_path.read_text(encoding="utf-8", errors="replace")
    sections = _extract_sections(text)
    normalized = [_normalize(s) for s in sections]

    if schema.min_sections > 0 and len(sections) < schema.min_sections:
        return (
            f"Expected at least {schema.min_sections} ## section(s), "
            f"found {len(sections)}"
        )

    if schema.required_sections:
        if schema.any_of:
            if not any(
                any(_section_matches(n, req) for n in normalized)
                for req in schema.required_sections
            ):
                return (
                    f"Expected at least one of: {schema.required_sections}; "
                    f"found sections: {sections}"
                )
        else:
            missing = [
                req
                for req in schema.required_sections
                if not any(_section_matches(n, req) for n in normalized)
            ]
            if missing:
                return (
                    f"Missing required sections: {missing}; "
                    f"found sections: {sections}"
                )

    return None


def _collect(root: Path, subdir: str) -> list[tuple[str, Path]]:
    """Collect .md files in subdir, excluding README.md."""
    d = root / subdir
    if not d.is_dir():
        return []
    return [
        (str(p.relative_to(root)).replace("\\", "/"), p)
        for p in sorted(d.glob("*.md"))
        if p.name != "README.md"
    ]


# ---------------------------------------------------------------------------
# Build parametrize lists at module load time.
# ---------------------------------------------------------------------------

_ROOT = Path(__file__).resolve().parent.parent.parent


def _ids(pairs: list[tuple[str, Path]]) -> list[str]:
    """Return id strings for parametrize."""
    return [rel for rel, _ in pairs]


_LANG_FILES = _collect(_ROOT, "languages")
_STRATEGY_FILES = _collect(_ROOT, "strategies")
_INTERFACE_FILES = _collect(_ROOT, "interfaces")
_TOOL_FILES = _collect(_ROOT, "tools")

# Known files that do not conform to their category shape.
_LANGUAGE_SHAPE_XFAIL: set[str] = {
    "languages/6502-DASM.md",
    "languages/commands.md",
    "languages/markdown.md",
    "languages/mermaid.md",
}

_STRATEGY_SHAPE_XFAIL: set[str] = {
    "strategies/discuss.md",   # alignment strategy, no Workflow section
    "strategies/research.md",  # research strategy, uses Output not Workflow
}

_INTERFACE_SHAPE_XFAIL: set[str] = {
    "interfaces/cli.md",   # uses ## Framework, not Core Architecture/Framework Selection
    "interfaces/rest.md",  # API design guide, no architecture section
    "interfaces/web.md",   # component-oriented, uses ## Stack
}


# ===================================================================
# Tests
# ===================================================================


@pytest.mark.parametrize("rel,filepath", _LANG_FILES, ids=_ids(_LANG_FILES))
def test_language_file_shape(rel: str, filepath: Path) -> None:
    """Language files must contain ## Standards, ## Commands, ## Patterns."""
    if rel in _LANGUAGE_SHAPE_XFAIL:
        pytest.xfail(f"{rel} is a known non-conforming language file")
    err = _check_shape(filepath, LANGUAGE_SHAPE)
    if err:
        pytest.fail(f"{rel}: {err}")


@pytest.mark.parametrize("rel,filepath", _STRATEGY_FILES, ids=_ids(_STRATEGY_FILES))
def test_strategy_file_shape(rel: str, filepath: Path) -> None:
    """Strategy files must contain ## When to Use, ## Workflow."""
    if rel in _STRATEGY_SHAPE_XFAIL:
        pytest.xfail(f"{rel} is a known non-conforming strategy file")
    err = _check_shape(filepath, STRATEGY_SHAPE)
    if err:
        pytest.fail(f"{rel}: {err}")


@pytest.mark.parametrize("rel,filepath", _INTERFACE_FILES, ids=_ids(_INTERFACE_FILES))
def test_interface_file_shape(rel: str, filepath: Path) -> None:
    """Interface files must contain ## Core Architecture or ## Framework Selection."""
    if rel in _INTERFACE_SHAPE_XFAIL:
        pytest.xfail(f"{rel} is a known non-conforming interface file")
    err = _check_shape(filepath, INTERFACE_SHAPE)
    if err:
        pytest.fail(f"{rel}: {err}")


@pytest.mark.parametrize("rel,filepath", _TOOL_FILES, ids=_ids(_TOOL_FILES))
def test_tool_file_shape(rel: str, filepath: Path) -> None:
    """Tool files must contain at least one ## section."""
    err = _check_shape(filepath, TOOL_SHAPE)
    if err:
        pytest.fail(f"{rel}: {err}")
