"""
test_project.py -- Tests for the ``cmd_project`` CLI command.

Covers:
    - Happy-path: mocked inputs produce a valid PROJECT.md.
    - Content check: generated file contains project configuration sections.
    - Strategy selection: selected strategy name appears in output file.

Author: Scott Adams (msadams) -- 2026-03-27
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from tests.conftest import mock_user_input, run_command

# ---------------------------------------------------------------------------
# Shared helper
# ---------------------------------------------------------------------------


def _patch_project_inputs(
    monkeypatch: pytest.MonkeyPatch,
    deft_internal: Any,
    *,
    project_path: str | None = None,
    project_name: str = "TestProject",
    type_selection: str = "1",
    lang_selection: str = "1",
    coverage: str = "85",
    tech_stack: str = "pytest",
    strat_selection: str = "1",
) -> None:
    """Patch interactive prompts for ``cmd_project``."""

    input_call_index: list[int] = [0]
    answers = [
        project_path or "",
        project_name,
        type_selection,
        lang_selection,
        coverage,
        tech_stack,
        strat_selection,
    ]

    def fake_input(prompt_text: str, default: str = "") -> str:
        idx = input_call_index[0]
        input_call_index[0] += 1
        if idx < len(answers) and answers[idx]:
            return answers[idx]
        return default

    def fake_choice(prompt_text: str, choices: list[str], default: str | None = None) -> str:
        """Return the first choice for any ask_choice call."""
        return choices[0] if choices else (default or "")

    def fake_confirm(prompt_text: str, default: bool = False) -> bool:
        return False

    mock_user_input(
        monkeypatch,
        deft_internal,
        {
            "ask_input": fake_input,
            "ask_choice": fake_choice,
            "ask_confirm": fake_confirm,
        },
    )


def _setup_deft_dir(tmp_path: Path) -> None:
    """Create a ``./deft`` directory so ``cmd_project`` doesn't bail out."""
    (tmp_path / "deft").mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_project_happy_path(
    deft_internal: Any,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """cmd_project with mocked inputs produces PROJECT.md at expected path."""
    _setup_deft_dir(tmp_path)
    project_md = tmp_path / "PROJECT.md"
    monkeypatch.setenv("DEFT_PROJECT_PATH", str(project_md))

    _patch_project_inputs(
        monkeypatch,
        deft_internal,
        project_path=str(project_md),
        project_name="MyApp",
    )

    result = run_command(deft_internal, "cmd_project", [], tmp_path, capsys)
    assert result["return_code"] == 0
    assert project_md.exists()


def test_project_content_check(
    deft_internal: Any,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """Generated PROJECT.md contains project configuration content."""
    _setup_deft_dir(tmp_path)
    project_md = tmp_path / "PROJECT.md"
    monkeypatch.setenv("DEFT_PROJECT_PATH", str(project_md))

    _patch_project_inputs(
        monkeypatch,
        deft_internal,
        project_path=str(project_md),
    )

    run_command(deft_internal, "cmd_project", [], tmp_path, capsys)

    content = project_md.read_text(encoding="utf-8")
    # The generated file should have project-related sections.
    assert "##" in content, "PROJECT.md should contain section headers"


def test_project_strategy_selection(
    deft_internal: Any,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """Selected strategy name appears in the generated PROJECT.md."""
    _setup_deft_dir(tmp_path)
    project_md = tmp_path / "PROJECT.md"
    monkeypatch.setenv("DEFT_PROJECT_PATH", str(project_md))

    strategies = deft_internal.get_available_strategies()
    assert len(strategies) > 0, "At least one strategy must be available"

    _patch_project_inputs(
        monkeypatch,
        deft_internal,
        project_path=str(project_md),
        strat_selection="1",
    )

    run_command(deft_internal, "cmd_project", [], tmp_path, capsys)

    content = project_md.read_text(encoding="utf-8")
    # Strategy name or filename should appear somewhere in the output.
    assert "strateg" in content.lower(), "PROJECT.md should reference a strategy"
