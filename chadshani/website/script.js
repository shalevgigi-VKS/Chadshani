/**
 * script.js — חדשני | Hadashni News Desk
 * Modules: Live Clock, Carousel, Looker Studio API, News Card Builder
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   1. LIVE CLOCK & HEBREW DATE
═══════════════════════════════════════════════════════════ */

const HEBREW_DAYS  = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const HEBREW_MONTHS = [
  'ינואר','פברואר','מרץ','אפריל','מאי','יוני',
  'יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'
];

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');

  const clockEl = document.getElementById('live-clock');
  if (clockEl) clockEl.textContent = `${h}:${m}:${s}`;

  // Hebrew date: יום ראשון, 15 במרץ 2026
  const dateEl = document.getElementById('live-date');
  if (dateEl) {
    const day   = HEBREW_DAYS[now.getDay()];
    const date  = now.getDate();
    const month = HEBREW_MONTHS[now.getMonth()];
    const year  = now.getFullYear();
    dateEl.textContent = `יום ${day}, ${date} ב${month} ${year}`;
  }
}

// Initialize clock immediately, then update every second
updateClock();
setInterval(updateClock, 1000);


/* ═══════════════════════════════════════════════════════════
   2. IMAGE CAROUSEL
   Images: ../karusela/1.png, 2.png, 3.png
═══════════════════════════════════════════════════════════ */

const CAROUSEL_CONFIG = {
  images: [
    { src: '../karusela/1.png', caption: '' },
    { src: '../karusela/2.png', caption: '' },
    { src: '../karusela/3.png', caption: '' },
  ],
  autoplayInterval: 4500,   // ms between auto-advance
  transitionDuration: 750,  // ms — must match CSS transition
};

class Carousel {
  constructor(container, config) {
    this.container = container;
    this.images    = config.images;
    this.interval  = config.autoplayInterval;
    this.current   = 0;
    this.timer     = null;
    this.transitioning = false;

    this._build();
    this._start();
  }

  /** Build DOM: track + slides + arrows + dots */
  _build() {
    const track = this.container.querySelector('.carousel-track');
    if (!track) return;

    // Slides
    this.slides = this.images.map((img, i) => {
      const slide = document.createElement('div');
      slide.className = 'carousel-slide' + (i === 0 ? ' active' : '');

      const image = document.createElement('img');
      image.src = img.src;
      image.alt = img.caption || `תמונה ${i + 1}`;
      image.loading = i === 0 ? 'eager' : 'lazy';
      slide.appendChild(image);

      if (img.caption) {
        const cap = document.createElement('div');
        cap.className = 'carousel-caption';
        cap.textContent = img.caption;
        slide.appendChild(cap);
      }

      track.appendChild(slide);
      return slide;
    });

    // Prev / Next buttons
    const prev = this.container.querySelector('.carousel-btn.prev');
    const next = this.container.querySelector('.carousel-btn.next');
    if (prev) prev.addEventListener('click', () => this._go(this.current - 1));
    if (next) next.addEventListener('click', () => this._go(this.current + 1));

    // Dots
    const dotsEl = this.container.querySelector('.carousel-dots');
    if (dotsEl) {
      this.dots = this.images.map((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `תמונה ${i + 1}`);
        dot.addEventListener('click', () => this._go(i));
        dotsEl.appendChild(dot);
        return dot;
      });
    }

    // Pause on hover
    this.container.addEventListener('mouseenter', () => this._stop());
    this.container.addEventListener('mouseleave', () => this._start());

    // Touch / swipe support (RTL-aware)
    let touchStartX = 0;
    this.container.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    this.container.addEventListener('touchend', e => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 40) {
        // RTL: swipe right → next, swipe left → prev
        this._go(diff > 0 ? this.current + 1 : this.current - 1);
      }
    });
  }

  /** Navigate to slide index (wraps around) */
  _go(index) {
    if (this.transitioning || index === this.current) return;
    this.transitioning = true;

    const next = ((index % this.images.length) + this.images.length) % this.images.length;

    // Fade out current
    this.slides[this.current].classList.remove('active');
    if (this.dots) this.dots[this.current].classList.remove('active');

    // Fade in next
    this.slides[next].classList.add('active');
    if (this.dots) this.dots[next].classList.add('active');

    this.current = next;

    // Reset autoplay timer
    this._stop();
    setTimeout(() => {
      this.transitioning = false;
      this._start();
    }, CAROUSEL_CONFIG.transitionDuration);
  }

  _start() {
    if (!this.timer) {
      this.timer = setInterval(() => this._go(this.current + 1), this.interval);
    }
  }

  _stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
}

/** Initialize carousel after DOM ready */
function initCarousel() {
  const container = document.querySelector('.carousel-wrapper');
  if (container && CAROUSEL_CONFIG.images.length > 0) {
    new Carousel(container, CAROUSEL_CONFIG);
  }
}


/* ═══════════════════════════════════════════════════════════
   3. LOOKER STUDIO API INTEGRATION
   ─────────────────────────────────────────────────────────
   INSTRUCTIONS:
   Replace LOOKER_API_URL with your actual Looker Studio
   data connector endpoint (e.g. Apps Script Web App URL,
   or a JSON endpoint that returns market data).

   Expected response format:
   {
     "updated": "2026-03-15 09:30",
     "metrics": [
       { "label": "S&P 500", "value": "5,234", "change": "+1.2%", "sub": "נאסד״ק" },
       ...
     ],
     "text": "optional text block..."
   }
═══════════════════════════════════════════════════════════ */

// ★★★ INSERT YOUR LOOKER STUDIO / GOOGLE APPS SCRIPT URL HERE ★★★
const LOOKER_API_URL = 'YOUR_LOOKER_STUDIO_API_ENDPOINT_HERE';

const LOOKER_CACHE_KEY = 'hadashni_looker_cache';
const LOOKER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms

/**
 * Show skeleton loader inside the Looker body
 */
function showLookerSkeleton() {
  const body = document.getElementById('looker-body');
  if (!body) return;
  body.innerHTML = `
    <div class="skeleton-grid">
      ${[1,2,3,4].map(() => `<div class="skeleton skeleton-card"></div>`).join('')}
    </div>
    <div style="margin-top:1rem">
      <div class="skeleton skeleton-line long"></div>
      <div class="skeleton skeleton-line short"></div>
    </div>
  `;
}

/**
 * Show polite Hebrew error card — no UI collapse
 */
function showLookerError(message, timestamp) {
  const body = document.getElementById('looker-body');
  if (!body) return;
  const ts = timestamp || new Date().toLocaleTimeString('he-IL');
  body.innerHTML = `
    <div class="looker-error">
      <div class="err-icon">📡</div>
      <div class="err-title">לא ניתן לטעון נתוני שוק</div>
      <div class="err-msg">${escHtml(message || 'הנתונים אינם זמינים כרגע. ניתן לרענן ולנסות שוב.')}</div>
      <div class="err-time">ניסיון אחרון: ${ts}</div>
    </div>
  `;
}

/**
 * Render fetched data into metric cards + optional text block
 * @param {Object} data - parsed API response
 */
function renderLookerData(data) {
  const body = document.getElementById('looker-body');
  if (!body) return;

  let html = '';

  // Metric cards grid
  if (Array.isArray(data.metrics) && data.metrics.length > 0) {
    html += '<div class="looker-grid">';
    for (const m of data.metrics) {
      const changeClass = m.change
        ? (m.change.startsWith('+') ? 'chg-up' : m.change.startsWith('-') ? 'chg-dn' : '')
        : '';
      html += `
        <div class="looker-data-card">
          <div class="ldc-label">${escHtml(m.label || '')}</div>
          <div class="ldc-value">${escHtml(m.value || '—')}</div>
          ${m.change ? `<div class="ldc-change ${changeClass}">${escHtml(m.change)}</div>` : ''}
          ${m.sub    ? `<div class="ldc-sub">${escHtml(m.sub)}</div>` : ''}
        </div>`;
    }
    html += '</div>';
  }

  // Optional text block
  if (data.text) {
    html += `<div class="looker-text-block" style="margin-top:1rem">${escHtml(data.text)}</div>`;
  }

  // Fallback if empty
  if (!html) {
    html = '<div class="looker-error"><div class="err-icon">📊</div><div class="err-title">אין נתונים להצגה</div></div>';
  }

  body.innerHTML = html;

  // Update "last updated" badge inside looker card
  const luEl = document.getElementById('looker-updated');
  if (luEl && data.updated) {
    luEl.textContent = `עודכן: ${data.updated}`;
  }
}

/**
 * Main fetch function — with caching, skeleton, and error handling
 */
async function fetchLookerData(force = false) {
  const btn = document.getElementById('btn-refresh-looker');
  if (btn) { btn.disabled = true; btn.textContent = 'טוען...'; }

  // Check cache unless forced refresh
  if (!force) {
    try {
      const cached = sessionStorage.getItem(LOOKER_CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < LOOKER_CACHE_TTL) {
          renderLookerData(data);
          if (btn) { btn.disabled = false; btn.textContent = 'רענן ↺'; }
          return;
        }
      }
    } catch (_) { /* ignore storage errors */ }
  }

  showLookerSkeleton();

  // Validate URL before fetching
  if (!LOOKER_API_URL || LOOKER_API_URL.includes('YOUR_LOOKER')) {
    // Demo mode — show placeholder data
    setTimeout(() => {
      const demo = {
        updated: new Date().toLocaleTimeString('he-IL'),
        metrics: [
          { label: 'S&P 500',  value: '—',   change: null, sub: 'ממתין לנתונים' },
          { label: 'NASDAQ',   value: '—',   change: null, sub: 'ממתין לנתונים' },
          { label: 'BTC/USD',  value: '—',   change: null, sub: 'ממתין לנתונים' },
          { label: 'VIX',      value: '—',   change: null, sub: 'מדד תנודתיות' },
        ],
        text: '★ הוסף את כתובת ה-API של Looker Studio ב-script.js (LOOKER_API_URL) להצגת נתונים בזמן אמת.'
      };
      renderLookerData(demo);
      if (btn) { btn.disabled = false; btn.textContent = 'רענן ↺'; }
    }, 800);
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(LOOKER_API_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`שגיאת שרת: HTTP ${response.status}`);
    }

    const data = await response.json();

    // Cache the result
    try {
      sessionStorage.setItem(LOOKER_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch (_) { /* storage might be full */ }

    renderLookerData(data);

    // Update global desk timestamp
    updateDeskTimestamp(data.updated);

  } catch (err) {
    const msg = err.name === 'AbortError'
      ? 'הבקשה נגמרה בזמן — בדוק את חיבור האינטרנט או את כתובת ה-API.'
      : err.message || 'שגיאה לא ידועה.';
    showLookerError(msg);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'רענן ↺'; }
  }
}

/**
 * Update the global "desk last updated" badge in the header
 */
function updateDeskTimestamp(ts) {
  if (!ts) return;
  const el = document.getElementById('ts-badge');
  if (el) el.textContent = `עודכן: ${ts}`;
}


/* ═══════════════════════════════════════════════════════════
   4. NEWS CARD BUILDER (existing pipeline data)
═══════════════════════════════════════════════════════════ */

/** Section metadata — matches generate_website.py output */
const SECTIONS_META = [
  { num:0,  icon:'📊', label:'מדד פחד וחמדנות',  col:'main',
    bg:'#fffbeb', border:'#fcd34d', color:'#d97706', tc:'#92400e', lb:'#fef3c7' },
  { num:1,  icon:'🌐', label:'תמונת מצב מיידית', col:'main',
    bg:'#f0fdf4', border:'#86efac', color:'#16a34a', tc:'#14532d', lb:'#dcfce7' },
  { num:2,  icon:'📈', label:'שוק ההון הכללי',   col:'main',
    bg:'#eff6ff', border:'#93c5fd', color:'#2563eb', tc:'#1e3a8a', lb:'#dbeafe' },
  { num:3,  icon:'🗺', label:'מפת הסקטורים',     col:'main',
    bg:'#faf5ff', border:'#c4b5fd', color:'#7c3aed', tc:'#4c1d95', lb:'#ede9fe' },
  { num:4,  icon:'₿',  label:'שוק הקריפטו',      col:'main',
    bg:'#fff7ed', border:'#fdba74', color:'#ea580c', tc:'#7c2d12', lb:'#ffedd5' },
  { num:5,  icon:'⚡', label:'סקטור השבבים',     col:'main',
    bg:'#f0f9ff', border:'#7dd3fc', color:'#0284c7', tc:'#0c4a6e', lb:'#e0f2fe' },
  { num:6,  icon:'💻', label:'סקטור התוכנה',     col:'main',
    bg:'#fdf4ff', border:'#e879f9', color:'#c026d3', tc:'#701a75', lb:'#fae8ff' },
  { num:7,  icon:'🤖', label:'תחום ה-AI',         col:'main',
    bg:'#f5f3ff', border:'#a78bfa', color:'#7c3aed', tc:'#4c1d95', lb:'#ede9fe' },
  { num:8,  icon:'🛠', label:'עדכוני כלי AI',     col:'main',
    bg:'#f0fdfa', border:'#5eead4', color:'#0d9488', tc:'#134e4a', lb:'#ccfbf1' },
  { num:9,  icon:'📌', label:'טיקרים למעקב',     col:'main',
    bg:'#fff1f2', border:'#fda4af', color:'#e11d48', tc:'#881337', lb:'#ffe4e6' },
  { num:10, icon:'🧭', label:'סיכום כללי',        col:'main',
    bg:'#f8fafc', border:'#94a3b8', color:'#475569', tc:'#0f172a', lb:'#e2e8f0' },
];

/* ── Gauge helpers ──────────────────────────────────────── */
function fngInfo(val) {
  if (val == null) return { text:'N/A',              bg:'#e2e8f0', fg:'#64748b' };
  if (val <= 24)   return { text:'פחד קיצוני',       bg:'#fee2e2', fg:'#dc2626' };
  if (val <= 44)   return { text:'פחד',               bg:'#fed7aa', fg:'#ea580c' };
  if (val <= 54)   return { text:'ניטרלי',            bg:'#fef9c3', fg:'#ca8a04' };
  if (val <= 74)   return { text:'חמדנות',            bg:'#d1fae5', fg:'#059669' };
                   return { text:'חמדנות קיצונית',   bg:'#bbf7d0', fg:'#16a34a' };
}

function arcColor(val, isVix) {
  if (val == null) return '#cbd5e1';
  if (isVix) return val > 25 ? '#ef4444' : val > 15 ? '#f59e0b' : '#22c55e';
  if (val <= 24) return '#ef4444';
  if (val <= 44) return '#f97316';
  if (val <= 54) return '#eab308';
  if (val <= 74) return '#84cc16';
  return '#22c55e';
}

function arcSVG(pct, color) {
  const W=200,H=112,R=82,cx=100,cy=108;
  const a0=Math.PI, a1=2*Math.PI;
  const p  = pct != null ? Math.max(0,Math.min(1,pct)) : 0;
  const a  = a0 + p*(a1-a0);
  const pt = (r,ang) => [cx+r*Math.cos(ang), cy+r*Math.sin(ang)];
  const [x0,y0]=pt(R,a0), [x1,y1]=pt(R,a1), [xF,yF]=pt(R,a);
  const la = p>.5?1:0;
  const ticks = Array.from({length:9},(_,i)=>{
    const ta=a0+((i+1)/10)*(a1-a0);
    const [tx1,ty1]=pt(R+5,ta), [tx2,ty2]=pt(R+(i===4?15:10),ta);
    return `<line x1="${tx1.toFixed(1)}" y1="${ty1.toFixed(1)}" x2="${tx2.toFixed(1)}" y2="${ty2.toFixed(1)}" stroke="#d1d5db" stroke-width="${i===4?2:1.5}" stroke-linecap="round"/>`;
  }).join('');
  const [nX,nY]=pt(R-15,a), [n2X,n2Y]=pt(-8,a);
  const fillArc = p>0 ? `
    <path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 ${la} 1 ${xF.toFixed(1)} ${yF.toFixed(1)}" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" opacity=".18"/>
    <path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 ${la} 1 ${xF.toFixed(1)} ${yF.toFixed(1)}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" style="overflow:visible;width:100%;height:auto">
    <path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 1 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="#e5e7eb" stroke-width="8" stroke-linecap="round"/>
    ${fillArc}
    ${ticks}
    <line x1="${n2X.toFixed(1)}" y1="${n2Y.toFixed(1)}" x2="${nX.toFixed(1)}" y2="${nY.toFixed(1)}" stroke="#374151" stroke-width="2" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="6" fill="${color}" stroke="white" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy}" r="2" fill="white"/>
  </svg>`;
}

function vixInfo(v) {
  if (v == null) return { text:'N/A',        bg:'#e2e8f0', fg:'#64748b' };
  if (v > 25)    return { text:'סיכון גבוה', bg:'#fee2e2', fg:'#dc2626' };
  if (v > 15)    return { text:'מתון',        bg:'#fef9c3', fg:'#ca8a04' };
                 return { text:'נמוך',         bg:'#d1fae5', fg:'#059669' };
}

function cnnGaugeSVG(val) {
  const W=200, H=112, R=82, cx=100, cy=108;
  const zones = [
    { from:0,  to:25,  color:'#dc2626' },
    { from:25, to:45,  color:'#ea580c' },
    { from:45, to:55,  color:'#ca8a04' },
    { from:55, to:75,  color:'#65a30d' },
    { from:75, to:100, color:'#16a34a' },
  ];
  const pt     = (r,a) => [cx + r*Math.cos(a), cy + r*Math.sin(a)];
  const toAng  = v => Math.PI + (v/100)*Math.PI;
  const zonePath = (from, to, color) => {
    const a0=toAng(from), a1=toAng(to);
    const [x0,y0]=pt(R,a0), [x1,y1]=pt(R,a1);
    const la=(a1-a0)>Math.PI?1:0;
    return `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 ${la} 1 ${x1.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="butt"/>`;
  };
  const gaps = [25,45,55,75].map(v => {
    const a=toAng(v);
    const [x1,y1]=pt(R-10,a), [x2,y2]=pt(R+2,a);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="white" stroke-width="2"/>`;
  });
  const zLabels = [
    { v:12.5, text:'FEAR\nEXTREME', size:'.38rem' },
    { v:35,   text:'FEAR',          size:'.44rem' },
    { v:50,   text:'NEUTRAL',       size:'.42rem' },
    { v:65,   text:'GREED',         size:'.44rem' },
    { v:87.5, text:'GREED\nEXTREME',size:'.38rem' },
  ];
  const labelSvg = zLabels.map(z => {
    const a=toAng(z.v);
    const [lx,ly]=pt(R-26, a);
    const lines = z.text.split('\n');
    const dy = lines.length > 1 ? -5 : 0;
    return lines.map((line,i) =>
      `<text x="${lx.toFixed(1)}" y="${(ly+dy+i*8).toFixed(1)}" text-anchor="middle" fill="white" font-size="${z.size}" font-weight="800" font-family="Heebo,sans-serif" opacity=".9">${line}</text>`
    ).join('');
  }).join('');
  const ticks = Array.from({length:9},(_,i)=>{
    const ta=toAng((i+1)*10);
    const [tx1,ty1]=pt(R+6,ta), [tx2,ty2]=pt(R+(i%2===0?12:8),ta);
    return `<line x1="${tx1.toFixed(1)}" y1="${ty1.toFixed(1)}" x2="${tx2.toFixed(1)}" y2="${ty2.toFixed(1)}" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round"/>`;
  }).join('');
  const needleAng = toAng(val != null ? Math.max(0,Math.min(100,val)) : 50);
  const [nX,nY]=pt(R-14,needleAng), [n2X,n2Y]=pt(-8,needleAng);
  const parts = [
    `<path d="M${pt(R,Math.PI)[0].toFixed(1)},${pt(R,Math.PI)[1].toFixed(1)} A${R},${R} 0 0 1 ${pt(R,2*Math.PI)[0].toFixed(1)},${pt(R,2*Math.PI)[1].toFixed(1)}" fill="none" stroke="#e5e7eb" stroke-width="14"/>`,
    ...zones.map(z=>zonePath(z.from,z.to,z.color)),
    ...gaps, ticks, labelSvg,
    `<line x1="${n2X.toFixed(1)}" y1="${n2Y.toFixed(1)}" x2="${nX.toFixed(1)}" y2="${nY.toFixed(1)}" stroke="#374151" stroke-width="2.5" stroke-linecap="round"/>`,
    `<circle cx="${cx}" cy="${cy}" r="6" fill="#374151" stroke="white" stroke-width="2.5"/>`,
    `<circle cx="${cx}" cy="${cy}" r="2" fill="white"/>`,
  ];
  return `<svg viewBox="0 0 ${W} ${H}" style="overflow:visible;width:100%;height:auto">${parts.join('')}</svg>`;
}

function gaugesHTML(gauges) {
  if (!gauges) return '';
  const vix    = gauges.vix != null ? Math.round(gauges.vix) : null;
  const vixPct = vix != null ? Math.min(1, vix/50) : null;
  const vixCol = arcColor(vix, true);
  const vixLbl = vixInfo(vix);
  const vixGauge = `<div class="gauge-wrap">
    <div class="gauge-label">VIX</div>
    <div class="gauge-arc-wrap">${arcSVG(vixPct, vixCol)}</div>
    <div class="gauge-value-text" style="color:${vixCol}">${vix!=null?vix:'—'}</div>
    <span class="gauge-sentiment" style="background:${vixLbl.bg};color:${vixLbl.fg}">${vixLbl.text}</span>
  </div>`;
  const fng    = gauges.fng != null ? Math.round(gauges.fng) : null;
  const fngCol = arcColor(fng, false);
  const fngLbl = fngInfo(fng);
  const cnnGauge = `<div class="gauge-wrap">
    <div class="gauge-label">CNN F&amp;G</div>
    <div class="gauge-arc-wrap">${cnnGaugeSVG(fng)}</div>
    <div class="gauge-value-text" style="color:${fngCol}">${fng!=null?fng:'—'}</div>
    <span class="gauge-sentiment" style="background:${fngLbl.bg};color:${fngLbl.fg}">${fngLbl.text}</span>
  </div>`;
  return `<div class="gauges-row">${vixGauge}${cnnGauge}</div>`;
}

/* ── Content renderers ──────────────────────────────────── */
const TABLE_SECTIONS = new Set([2, 3, 4, 5, 6, 7, 8, 9]);

function escHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderMarkdown(s) {
  s = (s || '').replace(/סעיף\s+\d+[.:)]*\s*/g, ''); // strip injected labels
  return escHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\+(\d[\d.]*%)/g, '<span class="chg-up">+$1</span>')
    .replace(/(?<![A-Za-z\d])-(\d[\d.]*%)/g, '<span class="chg-dn">-$1</span>')
    .replace(/^---$/mg, '<hr class="content-divider">');
}

function colorizeChanges(s) {
  return s.replace(/([-+][0-9]+\.?[0-9]*\s*%?)/g, m => {
    const cls = m.trimStart().startsWith('+') ? 'chg-up' : 'chg-dn';
    return `<span class="${cls}">${m}</span>`;
  });
}

function buildConsoleContent(content) {
  const chunks = content
    .split(/\n{2,}|(?<=[\.\!\?])\s+(?=[^\s])/)
    .map(c => c.trim()).filter(Boolean);
  const prompts = ['▶','●','◆','▶','●','◆','▶','●','◆','▶'];
  return `<div class="console-wrap">` +
    chunks.map((chunk, i) => `
      <div class="console-line">
        <span class="console-prompt">${prompts[i % prompts.length]}</span>
        <span class="console-text">${renderMarkdown(chunk)}</span>
      </div>`).join('') +
    `</div>`;
}

function buildTickersContent(content) {
  const lines = content.split('\n');
  let html = '<div class="ticker-list">';
  for (const line of lines) {
    const t = line.trim();
    if (!t) { html += '<div class="ticker-spacer"></div>'; continue; }
    const m = t.match(/^\*\*([A-Z0-9.]+)\*\*\s*[—\-–]\s*(.+?)\s*[—\-–]\s*(.+)$/);
    if (m) {
      html += `<div class="ticker-row"><span class="ticker-badge">${escHtml(m[1])}</span><span class="ticker-name">${escHtml(m[2])}</span><span class="ticker-sep">—</span><span class="ticker-desc">${renderMarkdown(m[3])}</span></div>`;
    } else if (t.startsWith('**') && (t.endsWith('**') || t.endsWith(':**'))) {
      html += `<div class="ticker-header">${renderMarkdown(t)}</div>`;
    } else {
      html += `<div class="ticker-other">${renderMarkdown(t)}</div>`;
    }
  }
  return html + '</div>';
}

function buildSoftwareTable(content) {
  const lines = content.split('\n');
  const tableRows = [], otherLines = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (/^\|[\s\-:|]+\|$/.test(t)) continue;
    const cols = t.split('|').map(c => c.trim()).filter(c => c !== '');
    if (cols.length >= 2) {
      tableRows.push(`<tr>${cols.map(c => `<td>${colorizeChanges(renderMarkdown(c))}</td>`).join('')}</tr>`);
    } else {
      otherLines.push(t);
    }
  }
  let html = '';
  if (tableRows.length) {
    html += `<table class="stocks-table"><tbody>${tableRows.join('')}</tbody></table>`;
  }
  if (otherLines.length) {
    html += `<div class="section-content" style="margin-top:.6rem">${colorizeChanges(renderMarkdown(otherLines.join('\n')))}</div>`;
  }
  return html;
}

function buildCard(sec, cfg, gauges) {
  const g = sec.num === 0 ? gaugesHTML(gauges) : '';
  let body;
  if (TABLE_SECTIONS.has(sec.num))  body = buildSoftwareTable(sec.content);
  else if (sec.num === 10)          body = buildConsoleContent(sec.content);
  else                              body = `<div class="section-content">${colorizeChanges(renderMarkdown(sec.content))}</div>`;

  return `
<article class="section-card" id="section-${sec.num}"
  style="border-top:3px solid ${cfg.border};background:${cfg.bg}">
  <div class="card-header">
    <div class="card-icon" style="background:${cfg.lb};color:${cfg.color}">${cfg.icon}</div>
    <div class="card-meta">
      <div class="card-title" style="color:${cfg.tc}">${sec.title || cfg.label}</div>
    </div>
    <button class="btn-copy" onclick="copySection(${sec.num},this)">העתק</button>
  </div>
  <div class="card-body">
    ${g}
    ${body}
  </div>
</article>`;
}

/* ── Sidebar navigation ─────────────────────────────────── */
function buildNav(sections) {
  const sb = document.getElementById('sidebar-inner');
  if (!sb) return;
  sections.forEach(sec => {
    const cfg = SECTIONS_META.find(c => c.num === sec.num);
    if (!cfg) return;
    const a = document.createElement('a');
    a.className = 'nav-item';
    a.href = `#section-${sec.num}`;
    a.dataset.num = sec.num;
    a.innerHTML = `<span class="nav-dot" style="background:${cfg.border}"></span>${cfg.icon} ${cfg.label}`;
    a.dataset.lb = cfg.lb;
    a.dataset.tc = cfg.tc;
    sb.appendChild(a);
  });
}

/* ── Scroll spy ─────────────────────────────────────────── */
function initScrollSpy() {
  const cards = document.querySelectorAll('.section-card');
  const items = document.querySelectorAll('.nav-item');
  if (!cards.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const num = e.target.id.replace('section-', '');
      items.forEach(x => {
        const on = x.dataset.num === num;
        x.classList.toggle('active', on);
        x.style.background = on ? (x.dataset.lb || '#f8fafc') : '';
        x.style.color = on ? (x.dataset.tc || '#1e293b') : '';
      });
    });
  }, { rootMargin: '-25% 0px -65% 0px' });
  cards.forEach(c => obs.observe(c));
}


/* ═══════════════════════════════════════════════════════════
   5. COPY & EXPORT UTILITIES
═══════════════════════════════════════════════════════════ */

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function copySection(num, btn) {
  const card = document.getElementById(`section-${num}`);
  if (!card) return;
  const title   = card.querySelector('.card-title')?.textContent || '';
  const content = card.querySelector('.section-content')?.textContent || '';
  navigator.clipboard.writeText(`${title}\n\n${content}`).then(() => {
    btn.textContent = '✓ הועתק';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'העתק'; btn.classList.remove('copied'); }, 2000);
    showToast('הסעיף הועתק ללוח');
  });
}

function exportAll() {
  const ts    = document.getElementById('ts-badge')?.textContent || '';
  const parts = [`חדשני — מעדכן החדשות\n${ts}\n${'═'.repeat(50)}`];
  document.querySelectorAll('.section-card').forEach(card => {
    const title   = card.querySelector('.card-title')?.textContent || '';
    const content = card.querySelector('.section-content')?.textContent || '';
    parts.push(`\n${title}\n${'-'.repeat(30)}\n${content}`);
  });
  navigator.clipboard.writeText(parts.join('\n')).then(() => showToast('כל הדסק הועתק ✓'));
}

// Expose to HTML onclick handlers
window.copySection = copySection;
window.exportAll   = exportAll;


/* ═══════════════════════════════════════════════════════════
   6. MAIN INIT
═══════════════════════════════════════════════════════════ */

function initNewsCards() {
  const dataEl  = document.getElementById('news-data');
  const gaugeEl = document.getElementById('gauges-data');
  let sections = [], gauges = {};

  try { sections = JSON.parse(dataEl?.textContent || '[]'); }  catch (_) {}
  try { gauges   = JSON.parse(gaugeEl?.textContent || '{}'); } catch (_) {}

  // Update header timestamp from embedded data
  const ts = dataEl?.dataset.updated || '';
  const badge = document.getElementById('ts-badge');
  if (badge) badge.textContent = ts ? `עודכן: ${ts}` : 'טרם עודכן';
  if (ts) document.title = `חדשני | ${ts}`;

  if (!sections.length) return;

  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('news-cols').style.display   = 'block';

  const colMain = document.getElementById('col-main');
  sections.forEach(sec => {
    const cfg = SECTIONS_META.find(c => c.num === sec.num);
    if (!cfg) return;
    colMain.insertAdjacentHTML('beforeend', buildCard(sec, cfg, gauges));
  });

  buildNav(sections);
  initScrollSpy();
}

document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
  initNewsCards();

  // Fetch Looker data (no forced refresh on first load)
  fetchLookerData(false);

  // Wire up refresh button
  const refreshBtn = document.getElementById('btn-refresh-looker');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => fetchLookerData(true));
  }
});
