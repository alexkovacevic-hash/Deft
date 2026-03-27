"""
test_doctor.py -- Tests for the ``cmd_doctor`` CLI command.

Covers:
    - Runs without crash: ``cmd_doctor`` completes without raising.
    - Output contains checks: stdout includes at least one check-result symbol.

Author: Scott Adams (msadams) -- 2026-03-27
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from tests.conftest import run_command


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_doctor_runs_without_crash(
    deft_internal: Any,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """cmd_doctor completes without raising an exception."""
    monkeypatch.setattr(deft_internal, "get_script_dir", lambda: tmp_path)

    result = run_command(deft_internal, "cmd_doctor", [], tmp_path, capsys)
    assert result["return_code"] == 0


def test_doctor_output_contains_checks(
    deft_internal: Any,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """cmd_doctor stdout includes at least one check-result symbol."""
    monkeypatch.setattr(deft_internal, "get_script_dir", lambda: tmp_path)

    result = run_command(deft_internal, "cmd_doctor", [], tmp_path, capsys)
    stdout = result["stdout"]

    has_check_symbol = any(sym in stdout for sym in ("\u2713", "\u26A0", "\u2717"))
    assert has_check_symbol, (
        "Expected at least one check-result symbol in doctor output"
    )
