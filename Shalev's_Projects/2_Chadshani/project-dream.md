# Project Dream — Chadshani
# Template version: 1.0
# Created by: project-documenter
# Updated by: gap-analyzer (weekly), project-documenter (each session)

project: 2_Chadshani
status: evolution
last_updated: 2026-04-05

---

dream_state:
  uptime: 100% — both daily runs succeed every day
  cost: < ₪0.015 per run, total < ₪20/month
  content_freshness: all sections updated with news < 24h old
  performance: page load < 2s on mobile (LCP)
  ai_coverage: all major AI products tracked with per-product dedicated feeds
  on_demand: any trigger method (Telegram, schedule, manual) works reliably
  reliability: zero stale deploys (exit 2 catches all Gemini failures)
  design: premium visual — 3D tilt + spotlight on cards working on all devices

current_state:
  uptime: good — Task Scheduler 06:45 + 18:45, Telegram bot at logon
  cost: ~₪6.28 / ₪20 (April 2026), ~₪0.013/run
  content_freshness: RSS feeds updated each run, MAX_NEWS_AGE_DAYS=2
  performance: Google Fonts now non-render-blocking; profile images lazy-loaded
  ai_coverage: 14 per-product entries (Anthropic×4, OpenAI×3, Google×3, Others×4)
  on_demand: Telegram bot live (newsdesgSG_bot), tested, connected
  reliability: exit 2 guard active, json_repair active, Gemini fallback chain active
  design: v4.0.0 Liquid Glass + teal theme live; 3D tilt confirmed working on cards

gaps:
  - 3D tilt + spotlight radial gradient effect: not visually verified on all screen sizes
  - SHALEV.PNG still 2.7MB — should be converted to WebP for further mobile perf gain
  - OG image caching: CHADSHANI_LOGO_v4.png deployed but users may see stale cache
  - section_7_ai "Others" grid: only 4 entries — could expand to 6+ products over time
  - No error alerting if Telegram bot crashes between restarts

evolution_suggestions:
  # To be filled by gap-analyzer
  - Convert profile images to WebP (SHALEV.PNG 2.7MB → target < 200KB)
  - Add Telegram bot crash recovery (watchdog or healthcheck endpoint)
  - Expand Others group: add Mistral, Cohere, Stability AI cards
  - Add per-product RSS feed health monitoring (alert if feed returns 0 items)

upgrade_queue:
  - item: v4 3D tilt + spotlight radial gradient on small glass cards
    priority: HIGH
    status: working in v4.0.0 on big cards; small card visual not confirmed
  - item: profile image WebP conversion (performance)
    priority: MEDIUM
    status: pending
  - item: Telegram bot crash watchdog
    priority: MEDIUM
    status: pending

next_gap_review: 2026-04-12
