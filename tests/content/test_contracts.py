"""test_contracts.py -- Cross-file link and contract verification.

Covers:
    - REFERENCES.md: every linked file exists on disk.
    - strategies/README.md: every linked strategy file exists.
    - "See also" links resolve to existing targets.
    - strategies/discuss.md is listed in strategies/README.md.

Author: Phase 2 -- Content Integrity Suite
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

_LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")


def _relative(path: Path, root: Path) -> str:
    """Return *path* relative to *root* using forward slashes."""
    return str(path.relative_to(root)).replace("\\", "/")


def _extract_local_links(text: str) -> list[tuple[str, str]]:
    """Extract (display_text, target) pairs for non-external links."""
    results: list[tuple[str, str]] = []
    for match in _LINK_RE.finditer(text):
        target = match.group(2)
        # Strip anchor fragments.
        target = target.split("#")[0]
        if not target:
            continue
        if target.startswith(("http://", "https://", "mailto:")):
            continue
        results.append((match.group(1), target))
    return results


def _resolve_link(source_file: Path, target: str, root: Path) -> Path:
    """Resolve a markdown link target relative to its source file."""
    return (source_file.parent / target).resolve()


# ---------------------------------------------------------------------------
# REFERENCES.md link check
# ---------------------------------------------------------------------------


def test_references_md_links_resolve(deft_root: Path) -> None:
    """Every file linked in REFERENCES.md must exist on disk."""
    refs_file = deft_root / "REFERENCES.md"
    assert refs_file.exists(), "REFERENCES.md not found"

    text = refs_file.read_text(encoding="utf-8")
    links = _extract_local_links(text)
    broken: list[str] = []
    for display, target in links:
        resolved = _resolve_link(refs_file, target, deft_root)
        if not resolved.exists():
            broken.append(f"  [{display}]({target})")

    if broken:
        pytest.fail("Broken links in REFERENCES.md:\n" + "\n".join(broken))


# ---------------------------------------------------------------------------
# Strategy index link check
# ---------------------------------------------------------------------------


_XFAIL_STRATEGIES = {"rapid.md", "enterprise.md"}


def test_strategy_index_links_resolve(deft_root: Path) -> None:
    """Every file linked in strategies/README.md must exist (xfail for future)."""
    readme = deft_root / "strategies" / "README.md"
    assert readme.exists(), "strategies/README.md not found"

    text = readme.read_text(encoding="utf-8")
    links = _extract_local_links(text)
    broken: list[str] = []
    xfail_broken: list[str] = []
    for display, target in links:
        resolved = _resolve_link(readme, target, deft_root)
        if not resolved.exists():
            basename = Path(target).name
            if basename in _XFAIL_STRATEGIES:
                xfail_broken.append(f"  [{display}]({target})")
            else:
                broken.append(f"  [{display}]({target})")

    if broken:
        pytest.fail("Broken links in strategies/README.md:\n" + "\n".join(broken))

    if xfail_broken:
        pytest.xfail("Expected missing future strategy files:\n" + "\n".join(xfail_broken))


# ---------------------------------------------------------------------------
# "See also" link check
# ---------------------------------------------------------------------------

# Known broken "See also" links -- xfail until the files are fixed.
_SEE_ALSO_KNOWN_BROKEN: set[tuple[str, str]] = {
    # PROJECT.md lives at repo root and uses ../ links that escape the repo
    ("PROJECT.md", "../main.md"),
    ("PROJECT.md", "../languages/python.md"),
    # taskfile-migration.md does not exist yet
    ("tools/taskfile.md", "./taskfile-migration.md"),
}


def test_see_also_links_resolve(deft_root: Path) -> None:
    """All 'See also' links across .md files must resolve."""
    broken: list[str] = []
    xfail_broken: list[str] = []
    for md in sorted(deft_root.rglob("*.md")):
        parts = md.relative_to(deft_root).parts
        if any(
            p.startswith(".") or p in {"__pycache__", "node_modules", ".venv", "old"} for p in parts
        ):
            continue

        text = md.read_text(encoding="utf-8", errors="replace")
        rel = _relative(md, deft_root)
        for line in text.splitlines():
            if "see also" not in line.lower():
                continue
            for display, target in _extract_local_links(line):
                resolved = _resolve_link(md, target, deft_root)
                if not resolved.exists():
                    entry = f"  {rel}: [{display}]({target})"
                    if (rel, target) in _SEE_ALSO_KNOWN_BROKEN:
                        xfail_broken.append(entry)
                    else:
                        broken.append(entry)

    if broken:
        pytest.fail("Broken 'See also' links:\n" + "\n".join(broken))

    if xfail_broken:
        pytest.xfail("Known broken 'See also' links:\n" + "\n".join(xfail_broken))


# ---------------------------------------------------------------------------
# discuss.md listed in strategy index
# ---------------------------------------------------------------------------


@pytest.mark.xfail(
    reason="discuss.md is not yet listed in the strategies/README.md table",
    strict=True,
)
def test_discuss_md_listed_in_strategy_index(deft_root: Path) -> None:
    """strategies/discuss.md should be listed in strategies/README.md."""
    readme = deft_root / "strategies" / "README.md"
    assert readme.exists()
    text = readme.read_text(encoding="utf-8")
    assert "discuss.md" in text, "strategies/discuss.md not listed in strategies/README.md"
