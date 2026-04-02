# Chadshani Design & Strategy Decisions Log

This document serves as the "Source of Truth" for all aesthetic, logical, and structural decisions made during the Chadshani v3.x development process. Use this for all future updates.

## 🎨 Aesthetic & Branding Rules
- **Color Palette**: 
    - Primary: Blue-600 (`#0050d4`).
    - Success/Live: Emerald-500/600 (Green).
    - Alerts: Red/Rose (High Impact).
- **Typography**: 
    - Headlines: `Space Grotesk`.
    - Body: `Heebo` (Hebrew optimized).
    - Labels: `Inter`.
- **Image Handling**:
    - **Logo**: 1:1 ratio, rounded corners (xl), shadow-sm.
    - **About Photo**: Vertical/Tall orientation, positioned to the **RIGHT** of the bio text (`md:flex-row-reverse`).
    - **Carousel**: Fixed container height (300px-500px), justified layout.
- **Justification**: All analysis paragraphs (`<p>`) must use `text-align: justify; text-justify: inter-word;`.

## 🏗️ Structural Layout
- **Global Sticky Header**:
    - **Primary Row**: Logo (Right), Title, Live Pulse (Center), Market Ticker (Desktop only), Last Update Timestamp (Left).
    - **Secondary Sticky Row (Slider)**: Always occupied by the **Market Index Ticker** (S&P 500, Nasdaq, etc.), never the image gallery.
- **Home (Macro) Page**:
    - Hero Section (Top Headline).
    - **Intelligence Gallery**: Image Carousel with manual navigation (Next/Prev) must live here, below the Hero.
- **Sidebar**:
    - Chief Strategist (אנליסט ראשי) profile widget must be at the bottom.
    - Profiles should be side-by-side (Image Right, Text Left).

## 📊 Logic & Data
- **Update Frequency**: Calculated for **07:00** and **19:00** Jerusalem Time.
- **Crypto Tracking**: Expanded to **8 major assets** (BTC, ETH, SOL, LINK, XRP, ADA, TAO, KAS).
- **Sector Sorting**: Always sort by % Change Descending (**Gainers First**).
- **Market Ticker**: Must include S&P 500, Nasdaq, BTC, Gold, and Silver. Double-populate the ticker for smooth infinite looping.

## 📱 Mobile Responsiveness
- Hero Height: Minimum 450px to prevent text cutoff.
- Sticky Elements: Both Primary Header and Market Slider must remain sticky for quick data access.
- Navigation: Bottom sticky bar for one-tap access to primary pages.

---
*Created on 2026-04-02 by Antigravity AI*
