# Build Order — קסם הידיעה

## Phase 1 — Foundation (build once, reuse forever)
1. Module 01 — Character System
   Defines the duo. Everything depends on this.

2. Module 06 — Visual Style Guide
   Depends on: Module 01
   Defines color palette, aesthetic, animation rules.

3. Module 02 — Episode Template
   Depends on: Module 01
   Defines the 3-act script structure, scene breakdown, timing.

4. Module 05 — Voiceover System
   Depends on: Module 02
   Defines Hebrew narration rules, pacing, voice casting guidance.

## Phase 2 — Production Infrastructure (build once)
5. Module 03 — Production Pipeline
   Independent. Defines tools, workflow, file naming, output specs.

6. Module 04 — Topic Bank
   Independent. List of 20+ topics in priority order.

## Phase 3 — First Episode (proof of concept)
7. Module 07 — Episode 01: Teeth Brushing
   Depends on: 01 + 02 + 05 + 06 + 03
   Full episode: script, scenes, production instructions.

## Phase 4 — Web Interface (parallel track)
8. Module 08 — Web Interface
   Independent. Requires only Anthropic API key.
   Can be set up and used during any phase to generate scripts instantly.

## Phase 5 — Series Expansion
- Each new episode follows Module 02 template
- Use web interface (Module 08) to generate script draft per topic
- Reference Module 04 for next topic
- No new foundation work needed
