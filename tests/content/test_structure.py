"""
test_structure.py -- Verify required directories and files exist in the repo.

Covers:
    - Required top-level directories exist.
    - Required root files exist.
    - Strategy files listed in strategies/README.md exist on disk.

Author: Phase 2 -- Content Integrity Suite
"""

from __future__ import annotations

from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Required directories
# ---------------------------------------------------------------------------

REQUIRED_DIRS = [
    "coding",
    "context",
    "contracts",
    "core",
    "deployments",
    "interfaces",
    "languages",
    "meta",
    "resilience",
    "scm",
    "strategies",
    "swarm",
    "templates",
    "tools",
    "vbrief",
    "verification",
]

REQUIRED_FILES = [
    "main.md",
    "README.md",
    "REFERENCES.md",
    "CHANGELOG.md",
    "LICENSE.md",
    "Taskfile.yml",
    "run",
    "run.bat",
]


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("dirname", REQUIRED_DIRS, ids=REQUIRED_DIRS)
def test_required_directory_exists(deft_root: Path, dirname: str) -> None:
    """Each required top-level directory must exist."""
    assert (deft_root / dirname).is_dir(), f"Missing required directory: {dirname}/"


@pytest.mark.parametrize("filename", REQUIRED_FILES, ids=REQUIRED_FILES)
def test_required_file_exists(deft_root: Path, filename: str) -> None:
    """Each required root file must exist."""
    assert (deft_root / filename).exists(), f"Missing required file: {filename}"


_STRATEGY_FILES_PRESENT = [
    "strategies/default.md",
    "strategies/speckit.md",
    "strategies/brownfield.md",
    "strategies/research.md",
]

_STRATEGY_FILES_MISSING = [
    "strategies/rapid.md",
    "strategies/enterprise.md",
]


@pytest.mark.parametrize("filepath", _STRATEGY_FILES_PRESENT, ids=_STRATEGY_FILES_PRESENT)
def test_listed_strategy_file_exists(deft_root: Path, filepath: str) -> None:
    """Strategy files listed in strategies/README.md must exist on disk."""
    assert (deft_root / filepath).exists(), f"Missing strategy file: {filepath}"


@pytest.mark.parametrize("filepath", _STRATEGY_FILES_MISSING, ids=_STRATEGY_FILES_MISSING)
@pytest.mark.xfail(reason="Strategy file listed as future in strategies/README.md")
def test_future_strategy_file_exists(deft_root: Path, filepath: str) -> None:
    """Future strategy files are expected to be absent (xfail)."""
    assert (deft_root / filepath).exists(), f"Missing future strategy file: {filepath}"
