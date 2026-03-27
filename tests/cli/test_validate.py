"""
test_validate.py -- Tests for the ``cmd_validate`` CLI command.

Covers:
    - Valid state: returns 0 when all required files are present.
    - Missing file: returns 1 when a required file is absent.

Author: Scott Adams (msadams) -- 2026-03-27
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from tests.conftest import run_command

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_valid_deft_dir(base: Path) -> Path:
    """Create a minimal directory tree that passes ``cmd_validate``.

    Required by cmd_validate:
        main.md, core/user.md, coding/coding.md, REFERENCES.md,
        and at least one .md in languages/.
    """
    (base / "main.md").write_text("# Main\n")
    (base / "core").mkdir(exist_ok=True)
    (base / "core" / "user.md").write_text("# User\n")
    (base / "coding").mkdir(exist_ok=True)
    (base / "coding" / "coding.md").write_text("# Coding\n")
    (base / "REFERENCES.md").write_text("# References\n")
    (base / "languages").mkdir(exist_ok=True)
    (base / "languages" / "python.md").write_text("# Python\n")
    return base


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_validate_valid_state(
    deft_internal: Any,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """cmd_validate returns 0 when all required framework files exist."""
    _build_valid_deft_dir(tmp_path)

    monkeypatch.setattr(deft_internal, "get_script_dir", lambda: tmp_path)

    result = run_command(deft_internal, "cmd_validate", [], tmp_path, capsys)
    assert result["return_code"] == 0


def test_validate_missing_file(
    deft_internal: Any,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """cmd_validate returns 1 when a required file is missing."""
    _build_valid_deft_dir(tmp_path)

    # Remove a required file to trigger a validation error.
    (tmp_path / "REFERENCES.md").unlink()

    monkeypatch.setattr(deft_internal, "get_script_dir", lambda: tmp_path)

    result = run_command(deft_internal, "cmd_validate", [], tmp_path, capsys)
    assert result["return_code"] == 1
