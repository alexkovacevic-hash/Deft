"""
test_bootstrap.py -- Tests for the ``cmd_bootstrap`` CLI command.

Covers:
    - Happy-path: mocked inputs produce a valid USER.md with expected sections.
    - Output path: file is written to the path returned by ``get_default_paths()['user']``.
    - No crash: command exits without exception given minimal valid inputs.

Author: Scott Adams (msadams) -- 2026-03-27
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from tests.conftest import mock_user_input, run_command

# ---------------------------------------------------------------------------
# Shared helper — set up mocked inputs for cmd_bootstrap
# ---------------------------------------------------------------------------


def _patch_bootstrap_inputs(
    monkeypatch: pytest.MonkeyPatch,
    deft_internal: Any,
    *,
    user_path: str | None = None,
    name: str = "Tester",
    coverage: str = "85",
    lang_selection: str = "1",
    strat_selection: str = "1",
    custom_rules: str = "",
) -> None:
    """Patch all interactive prompts that ``cmd_bootstrap`` issues."""

    input_call_index: list[int] = [0]
    answers = [
        user_path or "",
        name,
        coverage,
        lang_selection,
        strat_selection,
        custom_rules,
    ]

    def fake_input(prompt_text: str, default: str = "") -> str:
        idx = input_call_index[0]
        input_call_index[0] += 1
        if idx < len(answers) and answers[idx]:
            return answers[idx]
        return default

    def fake_confirm(prompt_text: str, default: bool = False) -> bool:
        return False

    mock_user_input(
        monkeypatch,
        deft_internal,
        {
            "ask_input": fake_input,
            "ask_confirm": fake_confirm,
        },
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_bootstrap_happy_path(
    deft_internal: Any,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """cmd_bootstrap with mocked inputs creates USER.md with expected sections."""
    user_md = tmp_path / "USER.md"
    monkeypatch.setenv("DEFT_USER_PATH", str(user_md))

    _patch_bootstrap_inputs(
        monkeypatch,
        deft_internal,
        user_path=str(user_md),
        name="Alice",
    )

    result = run_command(deft_internal, "cmd_bootstrap", [], tmp_path, capsys)
    assert result["return_code"] == 0

    content = user_md.read_text(encoding="utf-8")
    assert "Alice" in content


def test_bootstrap_output_path(
    deft_internal: Any,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """USER.md is written to the path returned by get_default_paths()['user']."""
    expected_path = tmp_path / "custom_dir" / "USER.md"
    monkeypatch.setenv("DEFT_USER_PATH", str(expected_path))

    _patch_bootstrap_inputs(
        monkeypatch,
        deft_internal,
        user_path=str(expected_path),
        name="Bob",
    )

    run_command(deft_internal, "cmd_bootstrap", [], tmp_path, capsys)

    assert expected_path.exists(), f"Expected USER.md at {expected_path}"


def test_bootstrap_no_crash(
    deft_internal: Any,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """cmd_bootstrap completes without raising given minimal valid inputs."""
    user_md = tmp_path / "USER.md"
    monkeypatch.setenv("DEFT_USER_PATH", str(user_md))

    _patch_bootstrap_inputs(
        monkeypatch,
        deft_internal,
        user_path=str(user_md),
    )

    result = run_command(deft_internal, "cmd_bootstrap", ["--force"], tmp_path, capsys)
    assert result["return_code"] == 0
