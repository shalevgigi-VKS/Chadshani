# Module Map — קסם הידיעה

## Module 01 — Character System
- Responsibility: Define child + animal duo, names, personalities, visual description
- Dependencies: none
- Rules: global_rules.md → Characters, Tone
- Edge cases: Child Character Gender, Character Conflict

## Module 02 — Episode Template
- Responsibility: 3-act script structure, timing breakdown, scene count
- Dependencies: Module 01
- Rules: business_rules.md → Episode Structure, Repetition Rule
- Edge cases: Duration Overrun, Topic Too Complex

## Module 03 — Production Pipeline
- Responsibility: Tool selection, workflow steps, file output specs
- Dependencies: none
- Rules: global_rules.md → Format, Visual Rule
- Edge cases: Visual Tool Limitation, Music Unavailable

## Module 04 — Topic Bank
- Responsibility: 20+ episode topics, priority order, brief description per topic
- Dependencies: none
- Rules: business_rules.md → Topic Selection Rule
- Edge cases: Topic Repeat, Topic Too Complex

## Module 05 — Voiceover System
- Responsibility: Hebrew narration rules, pacing guide, casting notes, recording spec
- Dependencies: Module 02
- Rules: global_rules.md → Pacing, Language; business_rules.md → Voiceover Rule
- Edge cases: Voiceover Mismatch

## Module 06 — Visual Style Guide
- Responsibility: Color palette, character visual style, background rules, animation aesthetic
- Dependencies: Module 01
- Rules: global_rules.md → Visual Rule; business_rules.md → Visual Rule
- Edge cases: Visual Tool Limitation

## Module 07 — Episode 01: Teeth Brushing
- Responsibility: Complete first episode — script, scenes, voiceover, production notes
- Dependencies: Modules 01, 02, 03, 05, 06
- Rules: all rules apply
- Edge cases: all edge cases may apply

## Module 08 — Web Interface
- Responsibility: Browser-based tool: topic input → full episode script output
- Dependencies: Anthropic API key only
- Rules: global_rules.md → Language, Pacing; business_rules.md → Episode Structure
- Edge cases: Topic Too Complex, Duration Overrun (handled by AI prompt constraints)
