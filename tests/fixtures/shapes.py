"""Shape schemas for Deft markdown file categories.

Each schema defines the required ``##``-level section headers that a file
in a given category must contain.  Used by ``tests/content/test_shape.py``
to validate structural conformance.

Author: Phase 2 — Content Integrity Suite
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class ShapeSchema:
    """Describes required sections for a category of markdown files.

    Attributes:
        name:              Human-readable category label.
        required_sections: Headers that *must* appear (matched case-insensitively,
                           ignoring leading emoji).  When ``any_of`` is *True*
                           the file must contain **at least one** of them.
        any_of:            If *True*, only one of ``required_sections`` is needed.
        min_sections:      Minimum count of any ``##`` sections the file must have.
    """

    name: str
    required_sections: tuple[str, ...] = ()
    any_of: bool = False
    min_sections: int = 0


# ---------------------------------------------------------------------------
# Concrete schemas
# ---------------------------------------------------------------------------

LANGUAGE_SHAPE = ShapeSchema(
    name="language",
    required_sections=("Standards", "Commands", "Patterns"),
)

STRATEGY_SHAPE = ShapeSchema(
    name="strategy",
    required_sections=("When to Use", "Workflow"),
    any_of=False,
)

INTERFACE_SHAPE = ShapeSchema(
    name="interface",
    required_sections=("Core Architecture", "Framework Selection"),
    any_of=True,
)

TOOL_SHAPE = ShapeSchema(
    name="tool",
    min_sections=1,
)
