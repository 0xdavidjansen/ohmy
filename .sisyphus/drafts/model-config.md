# Draft: Model configuration (oh-my-opencode)

## Requirements (confirmed)
- User wants to change the model configuration for “oh my opencode”.
- User wants to change **category default models** (not per-agent models).

## Category Defaults To Change (confirmed)
- visual-engineering
- artistry
- quick
- unspecified-low
- writing

## Technical Decisions
- (pending) Identify where model configuration lives (project config vs env vars vs CLI flags).

## Research Findings
- Found global OpenCode config dir at: `/home/leah/.config/opencode/`
- Found oh-my-opencode model configuration file at: `/home/leah/.config/opencode/oh-my-opencode.json`
  - Contains per-agent model selection (e.g., `agents.prometheus.model`)
  - Contains per-category default models (e.g., `categories.quick.model`)

## Open Questions
- Which agent(s) or category defaults do you want to change?
- What exact model id(s) should each be set to? (e.g., `venice/openai-gpt-52`, `venice/qwen3-4b`)
- Do you want me to *display* the current config here, or do you want *edit instructions* for applying changes yourself?

## Scope Boundaries
- INCLUDE: Finding and opening the relevant config file(s) for editing.
- EXCLUDE: Actually changing code/config until target file is confirmed.
