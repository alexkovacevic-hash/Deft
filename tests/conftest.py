"""
conftest.py — Shared pytest fixtures for the Deft Directive testbed.

Import strategy: tests import from `run` (the shim in run.py) which loads
the extension-less `run` CLI file via importlib. See run.py for details.

The shim registers the real CLI module as ``sys.modules['deft_run']``.
All monkeypatching must target that internal module (returned by the
``deft_internal`` fixture) so that intra-module calls are intercepted.

Author: Scott Adams (msadams) — 2026-03-09
"""

import os
import sys
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest


@pytest.fixture(scope="session")
def deft_root() -> Path:
    """Return the absolute path to the deft repo root.

    Used by content tests to locate .md files and other framework assets.
    """
    # conftest.py lives at tests/ — repo root is one level up
    return Path(__file__).parent.parent.resolve()


@pytest.fixture
def tmp_project_dir(tmp_path: Path) -> Path:
    """Create a temporary directory with a minimal deft-like structure.

    Provides an isolated workspace for CLI tests so they don't touch
    the real repo or the user's config files.

    Structure created:
        tmp_path/
        ├── main.md
        ├── core/
        └── languages/
    """
    (tmp_path / "main.md").write_text("# Test main.md\n")
    (tmp_path / "core").mkdir()
    (tmp_path / "languages").mkdir()
    return tmp_path


@pytest.fixture
def mock_user_config(tmp_path: Path) -> Path:
    """Create a temporary USER.md with minimal valid content.

    Used by bootstrap and project command tests to provide a pre-existing
    user config without touching ~/.config/deft/USER.md.
    """
    user_md = tmp_path / "USER.md"
    user_md.write_text(
        "# User Preferences\n\n"
        "## Identity\n\nName: Test User\n\n"
        "## Communication\n\nStyle: concise\n"
    )
    return user_md


@pytest.fixture(scope="session")
def deft_module():
    """Load the deft CLI module via the run.py importlib shim.

    Returns the loaded module so tests can call cmd_* functions directly.
    All CLI tests should use this fixture rather than importing run directly,
    so the import strategy is centralised here.

    Example:
        def test_something(deft_module):
            result = deft_module.get_script_dir()
            assert result.is_dir()
    """
    import importlib.util
    from pathlib import Path

    run_py = Path(__file__).parent.parent / "run.py"
    spec = importlib.util.spec_from_file_location("run", run_py)
    module = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


@pytest.fixture(scope="session")
def deft_internal(deft_module: Any) -> Any:
    """Return the *real* CLI module (``deft_run``) loaded by the shim.

    The run.py shim registers the extension-less ``run`` file as
    ``sys.modules['deft_run']``.  All ``monkeypatch.setattr`` calls
    must target this module so that intra-module function calls (e.g.
    ``cmd_bootstrap`` calling ``read_input``) are intercepted.
    """
    return sys.modules["deft_run"]


@pytest.fixture
def isolated_env(tmp_project_dir: Path, monkeypatch: pytest.MonkeyPatch):
    """Combine tmp_project_dir with env var overrides for CLI isolation.

    Sets DEFT_USER_PATH and DEFT_PROJECT_PATH to temp locations so CLI
    commands don't read/write real config files during tests.
    """
    user_md = tmp_project_dir / "USER.md"
    project_md = tmp_project_dir / "PROJECT.md"
    monkeypatch.setenv("DEFT_USER_PATH", str(user_md))
    monkeypatch.setenv("DEFT_PROJECT_PATH", str(project_md))
    monkeypatch.chdir(tmp_project_dir)
    return tmp_project_dir


# ---------------------------------------------------------------------------
# Phase 3 — CLI test helpers
# ---------------------------------------------------------------------------


def run_command(
    deft_internal: Any,
    cmd_name: str,
    args: list[str],
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
) -> dict[str, Any]:
    """Call a ``cmd_*`` function on *deft_internal* and capture its output.

    Args:
        deft_internal: The real CLI module (``deft_run``).
        cmd_name: Name of the command function, e.g. ``"cmd_bootstrap"``.
        args: Argument list to pass to the command.
        tmp_path: Temporary directory used as the working directory.
        capsys: Pytest capture fixture for stdout/stderr.

    Returns:
        A dict with keys ``return_code``, ``stdout``, and ``stderr``.
    """
    func: Callable[..., int] = getattr(deft_internal, cmd_name)
    prev_cwd = os.getcwd()
    os.chdir(tmp_path)
    try:
        return_code = func(args)
    finally:
        os.chdir(prev_cwd)

    captured = capsys.readouterr()
    return {
        "return_code": return_code,
        "stdout": captured.out,
        "stderr": captured.err,
    }


def mock_user_input(
    monkeypatch: pytest.MonkeyPatch,
    deft_internal: Any,
    responses: dict[str, Callable[..., Any]],
) -> None:
    """Patch interactive input functions on *deft_internal* with predetermined responses.

    *responses* is a dict whose keys are function names (``ask_input``,
    ``ask_choice``, ``ask_confirm``) and whose values are callables that
    will replace the real implementation.  The legacy aliases ``read_input``
    and ``read_yn`` are patched automatically to stay in sync.

    **Important**: patches are applied to the ``deft_run`` module (not the
    run.py wrapper) so that intra-module calls are intercepted.

    Args:
        monkeypatch: Pytest monkeypatch fixture.
        deft_internal: The real CLI module (``deft_run``).
        responses: Mapping of function name to replacement callable.
    """
    for name, replacement in responses.items():
        monkeypatch.setattr(deft_internal, name, replacement)

    # Keep legacy aliases consistent with the canonical names.
    if "ask_input" in responses:
        monkeypatch.setattr(deft_internal, "read_input", responses["ask_input"])
    if "ask_confirm" in responses:
        monkeypatch.setattr(deft_internal, "read_yn", responses["ask_confirm"])
