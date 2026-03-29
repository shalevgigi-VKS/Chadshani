/**
 * Schematic Evolution — App Logic v5.0
 * In-place expand/collapse D3 tree — dark theme, RTL Hebrew
 */
let snapshotData = null, currentView = 'global';
let collapsedNodes = new Set(); // category IDs currently collapsed

const DATA_URL = (() => {
  const loc = window.location.pathname;
  const base = loc.endsWith('/') ? loc : loc.substring(0, loc.lastIndexOf('/') + 1);
  return base + 'data/snapshot.json?t=' + Date.now();
})();

// ── Hebrew one-liners ──────────────────────────────────────────────────────
const HE_AGENTS = {
  'architect':            'מומחה ארכיטקטורת תוכנה — עיצוב מערכת, ניתוח טכני, החלטות עיצוב',
  'build-error-resolver': 'פותר שגיאות Build ו-TypeScript במינימום שינויים',
  'chief-of-staff':       'ראש מטה תקשורת — מיון מיילים, Slack, LINE, Messenger',
  'code-reviewer':        'מבקר קוד — איכות, אבטחה ותחזוקה אחרי כל כתיבה',
  'cpp-build-resolver':   'פותר שגיאות C++, CMake, linker',
  'cpp-reviewer':         'מבקר C++ — ניהול זיכרון, מקביליות, ביצועים',
  'database-reviewer':    'מומחה PostgreSQL — שאילתות, סכמה, ביצועים, אבטחה',
  'doc-updater':          'מעדכן תיעוד — CLAUDE.md, READMEs, codemaps',
  'e2e-runner':           'מריץ בדיקות E2E עם Playwright על זרימות קריטיות',
  'flutter-reviewer':     'מבקר Flutter/Dart — State Management, ביצועים',
  'general-purpose':      'סוכן כללי לחיפוש, מחקר ומשימות מורכבות',
  'go-build-resolver':    'פותר שגיאות Build ו-Go vet',
  'go-reviewer':          'מבקר Go — פטרנים, concurrency, טיפול שגיאות',
  'harness-optimizer':    'מנתח ומשפר קונפיגורציית harness מקומית',
  'java-build-resolver':  'פותר שגיאות Java/Maven/Gradle',
  'java-reviewer':        'מבקר Java/Spring Boot — ארכיטקטורה, JPA, אבטחה',
  'kotlin-build-resolver':'פותר שגיאות Kotlin/Gradle',
  'kotlin-reviewer':      'מבקר Kotlin/Android — Coroutines, Compose, KMP',
  'loop-operator':        'מפעיל לולאות סוכנים ומתערב כשנתקעות',
  'notice-manager':       'ניהול הודעות חשובות ב-Chadshani עם תאריכי פג תוקף',
  'plan':                 'ארכיטקט תוכנה — תכנון אסטרטגיית יישום',
  'planner':              'מתכנן פיצ׳רים ורפקטורינג — תוכנית יישום מפורטת',
  'project-status':       'דיווח סטטוס פרויקטים — סריקת git, בדיקת התקדמות',
  'python-reviewer':      'מבקר Python — PEP 8, type hints, אבטחה, ביצועים',
  'pytorch-build-resolver':'פותר שגיאות PyTorch, CUDA ואימון מודלים',
  'refactor-cleaner':     'מנקה קוד מת וכפילויות — knip, depcheck, ts-prune',
  'rust-build-resolver':  'פותר שגיאות Rust ו-Cargo',
  'rust-reviewer':        'מבקר Rust — ownership, lifetimes, unsafe code',
  'security-reviewer':    'מזהה פגיעויות — OWASP, הזרקה, XSS, סודות חשופים',
  'tdd-guide':            'מנחה TDD — טסטים קודם לקוד, כיסוי 80%+',
  'typescript-reviewer':  'מבקר TypeScript/JS — type safety, async, אבטחה',
  'claude-code-guide':    'מומחה Claude Code — CLI, hooks, slash commands, MCP',
  'statusline-setup':     'מגדיר שורת סטטוס ב-Claude Code',
  'Explore':              'חוקר קודבייס לעומק — חיפוש קבצים, קוד ותשובות',
  'backup-agent':         'גיבוי חודשי — snapshots של כל הפרויקטים ל-E:\\backup\\',
  'bug-learner':          'לומד מבאגים — שומר פתרונות, מונע חזרה על שגיאות',
  'chadshani-optimizer':  'מבקר ומשפר Chadshani — עלויות, איכות, שדרוגי API',
};

const HE_AGENTS_DETAIL = {
  'architect':         'משמש לפני כתיבת קוד — מונע ארכיטקטורה שבורה. מתאים להחלטות על מבנה שכבות, DB, microservices.',
  'code-reviewer':     'רץ אחרי כל שינוי קוד. עוצר קוד גרוע לפני commit — חוסך שעות debug.',
  'security-reviewer': 'שכבת ההגנה האחרונה. מגלה סודות שנשכחו, הזרקות SQL ופגיעויות OWASP.',
  'tdd-guide':         'מוודא כיסוי 80%+ בדיקות. מפחית באגים בפרודקשן ב-60-80%.',
  'planner':           'מפרק בקשות עמומות לשלבים ברורים. עדיף לפני כתיבת קוד.',
  'database-reviewer': 'מגלה missing indexes, שאילתות איטיות ובעיות RLS לפני פרודקשן.',
};

const HE_SKILLS = {
  'ai-regression-testing':    'בדיקות רגרסיה לפיתוח מבוסס AI',
  'configure-ecc':             'מתקין אינטראקטיבי לסקילים וכללים',
  'continuous-learning':       'חילוץ פטרנים לשימוש חוזר מסשנים',
  'continuous-learning-v2':    'מערכת למידה מבוססת instincts',
  'e2e-testing':               'בדיקות E2E עם Playwright — POM, artifacts',
  'frontend-design':           'עיצוב ממשק משתמש — production-grade, distinctive',
  'tdd-workflow':              'TDD — טסטים קודם לקוד, כיסוי 80%+',
  'update-docs':               'עדכון תיעוד ו-CLAUDE.md',
  'update-codemaps':           'עדכון מפות קוד ותיעוד ארכיטקטורה',
  'commit':                    'יצירת commit מסוגנן',
  'code-review':               'ביקורת קוד — אבטחה, איכות',
  'plan':                      'תכנון יישום — דרישות + סיכונים',
  'learn':                     'למד מה-session — חלץ פטרנים',
  'verify':                    'אימות מקיף — בדיקת מצב הקוד',
  'build-fix':                 'תיקון build שגיאות',
  'checkpoint':                'שמירת נקודת ביקורת ב-workflow',
  'save-session':              'שמירת session לקובץ',
  'resume-session':            'חזרה ל-session מהקובץ האחרון',
  'security-audit':            'סריקת אבטחה מלאה — OWASP, סודות',
  'instinct-status':           'הצגת instincts פעילים',
  'model-route':               'בחירת מודל — Haiku/Sonnet/Opus',
  'docs':                      'תיעוד ספריות עדכני דרך Context7',
  'devfleet':                  'ניהול צוות סוכני פיתוח מקביל',
};

// ── Hebrew: Modes ──────────────────────────────────────────────────────────
const HE_MODES = {
  'architect_mode':            'מצב ברירת מחדל — קרא → בדוק → תכנן → אשר → בצע',
  'audit_mode':                'בדיקה בטוחה בלבד — לא מוחק, לא יוצר, רק מנתח ומדווח',
  'build_mode':                'ביצוע מבוקר — פועל רק לפי תוכנית מאושרת, מעדיף מיזוג',
  'consolidation_mode':        'גיבוש זיכרון — ניקוי כפילויות, זיהוי סתירות, ארכיב',
  'document_ingestion_mode':   'קליטת מסמכים — עיבוד ותיוק ידע חיצוני',
  'evolution_pathways_mode':   'מסלולי אבולוציה — ניתוח נתיבי שדרוג למערכת',
  'external_skill_intake_mode':'קליטת סקיל חיצוני — הערכה ושילוב בטוח',
  'integration_mode':          'שילוב כלים — בדיקה, אימות ורישום MCPs ו-CLIs',
  'knowledge_mode':            'שילוב ידע — 5 שלבי הערכה, ביצוע רק אחרי אישור',
  'monthly_calibration_mode':  'כיול חודשי — בריאות מערכת, עדכון זיכרון, ניקוי',
  'project_closure_mode':      'סגירת פרויקט — תיעוד לקחים, עדכון skills registry',
  'project_status_review_mode':'סקירת סטטוס — בדיקת התקדמות כל הפרויקטים',
  'security_scan_mode':        'סריקת אבטחה — פגיעויות OWASP, סודות חשופים',
  'shadow_agent_mode':         'סוכן צל — רץ אוטומטי, משווה מציאות מול זיכרון',
  'README':                    'מדריך למצבי המערכת',
};

// ── Hebrew: MCP Servers ─────────────────────────────────────────────────────
const HE_MCP = {
  'everything-claude-code (ECC)': 'מערכת הרחבת Claude Code — סוכנים, סקילים, hooks, פקודות',
  'gh — GitHub CLI':              'GitHub CLI — repos, PRs, issues, workflows מהטרמינל',
  'context7':                     'תיעוד עדכני של ספריות — React, Next.js, Prisma ועוד',
  'Context7':                     'תיעוד עדכני של ספריות — API עכשווי תמיד',
  'Playwright':                   'אוטומציית דפדפן — E2E, צילומי מסך, Chrome/Firefox',
  'playwright':                   'אוטומציית דפדפן — E2E, צילומי מסך, Chrome/Firefox',
  'Figma':                        'שרת Figma — קריאת עיצובים, Code Connect, HTML/Tailwind',
  'figma':                        'שרת Figma — קריאת עיצובים, Code Connect',
  'Gmail':                        'Gmail — חיפוש, קריאה, יצירת טיוטות מתוך Claude Code',
  'gmail':                        'Gmail — חיפוש, קריאה, יצירת טיוטות',
  'Google Calendar':              'Google Calendar — אירועים, פנוי/תפוס, תזמון פגישות',
  'Google Stitch MCP':            'Google Labs UI — ממשקים מטקסט, HTML/Tailwind',
  'mcp2cli':                      'ניתוב MCP ל-CLI — חוסך טוקנים, CLI First',
  'claudeusage-mcp':              'מעקב שימוש Claude Pro/Max בזמן אמת',
  'tradingview-mcp':              'נתוני TradingView — פרויקטי פיננסים ומסחר',
  'gsd-build/gsd-2':              'TypeScript meta-prompting — פיתוח מבוסס מפרטים',
};

// ── Hebrew: Hooks descriptions ──────────────────────────────────────────────
const HE_HOOKS_KNOWN = [
  ['Block git hook-bypass',    'חוסם --no-verify — מגן על pre-commit ו-pre-push hooks',     'PreToolUse'],
  ['Auto-start dev servers',   'מפעיל dev servers ב-tmux לפי שם תיקייה אוטומטית',          'PreToolUse'],
  ['Reminder to use tmux',     'תזכורת להשתמש ב-tmux לפקודות ממושכות',                     'PreToolUse'],
  ['Reminder before git push', 'תזכורת לסקור שינויים לפני git push',                       'PreToolUse'],
  ['doc-file-warning',         'אזהרה לפני יצירת קובץ תיעוד — מניעת יצירה מיותרת',        'PreToolUse'],
  ['memory-heartbeat',         'עדכון זיכרון אחרי כל כתיבה — שומר פטרנים לשימוש חוזר',   'PostToolUse'],
  ['project-guard',            'Project Isolation — מונע כתיבה מחוץ לתיקיית הפרויקט',     'PostToolUse'],
  ['security-check',           'בדיקת אבטחה לפני Bash — מסנן פקודות מסוכנות',             'PreToolUse'],
  ['ntfy',                     'שליחת התראה ל-iPhone ב-ntfy.sh בסיום session',              'Stop'],
  ['notification',             'התראת iPhone ב-ntfy.sh',                                    'Stop'],
];

function getHookDesc(h) {
  const desc = (h.description || '') + ' ' + (h.script || '');
  for (const [kw, he] of HE_HOOKS_KNOWN) {
    if (desc.toLowerCase().includes(kw.toLowerCase()) ||
        (h.script || '').toLowerCase().includes(kw.toLowerCase())) return he;
  }
  if (h.type === 'Stop') return 'פועל בסיום session';
  if (h.type === 'PreToolUse') return `בדיקה לפני שימוש ב-${h.trigger || 'כלי'}`;
  if (h.type === 'PostToolUse') return `פעולה אחרי שימוש ב-${h.trigger || 'כלי'}`;
  return h.description || h.trigger || '';
}

// ── Hebrew: Memory types ────────────────────────────────────────────────────
const HE_MEMORY_TYPE = {
  'feedback':  'משוב — הנחיות כיצד לעבוד, מה לעשות ומה להימנע ממנו',
  'user':      'פרופיל משתמש — תפקיד, תחומי ידע, העדפות עבודה',
  'project':   'פרויקט — מצב, יעדים, החלטות ותאריכי יעד',
  'reference': 'מקורות — איפה למצוא מידע במערכות חיצוניות',
  'memory':    'זיכרון כללי',
};

// ── Hebrew: Rules ──────────────────────────────────────────────────────────
const HE_RULES = {
  'common':      'כללים אוניברסליים — immutability, error handling, security, testing לכל שפה',
  'typescript':  'TypeScript/JS — type safety, interfaces, async/await, Zod validation',
  'python':      'Python — PEP 8, type annotations, pytest, black/ruff/bandit',
  'golang':      'Go — idiomatic patterns, goroutines, error wrapping',
  'rust':        'Rust — ownership, lifetimes, cargo, unsafe guidelines',
  'swift':       'Swift — iOS/macOS, async/await, SwiftUI patterns',
  'kotlin':      'Kotlin/Android — Coroutines, Compose, KMP patterns',
  'java':        'Java/Spring Boot — layered architecture, JPA, security',
  'cpp':         'C++ — memory safety, templates, CMake, RAII',
  'csharp':      'C# — .NET patterns, async, LINQ, DI',
  'php':         'PHP — Laravel/Symfony patterns, PSR standards',
  'perl':        'Perl — scripting patterns, regex, file handling',
};

// ── Hebrew: Commands ───────────────────────────────────────────────────────
const HE_COMMANDS = {
  'plan':              'תכנון יישום — דרישות + סיכונים לפני כתיבת קוד',
  'code-review':       'ביקורת קוד — אבטחה, איכות, סטנדרטים לפני commit',
  'tdd':               'TDD — טסטים קודם, יישום אחר כך, כיסוי 80%+',
  'learn':             'למד מה-session — חלץ פטרנים לשימוש חוזר',
  'checkpoint':        'נקודת ביקורת — שמירת מצב workflow',
  'build-fix':         'תיקון build — שגיאות TypeScript/Webpack במינימום',
  'e2e':               'בדיקות E2E — Playwright על זרימות קריטיות',
  'docs':              'תיעוד עדכני ספריות דרך Context7',
  'refactor-clean':    'ניקוי קוד מת — knip, depcheck, הסרה בטוחה',
  'verify':            'אימות מקיף — בדיקת מצב הקוד הנוכחי',
  'orchestrate':       'אורקסטרציה — ניהול זרימת עבודה רב-סוכני',
  'multi-plan':        'תכנון רב-מודלי — Claude + Codex + Gemini',
  'multi-execute':     'ביצוע רב-מודלי — פרוטוטייפ → Claude → audit',
  'multi-workflow':    'workflow שלם — מחקר → תכנון → ביצוע → אופטימיזציה',
  'multi-frontend':    'Frontend workflow — Gemini מוביל, React/Next.js',
  'multi-backend':     'Backend workflow — Codex מוביל, API/DB',
  'model-route':       'בחירת מודל — Haiku/Sonnet/Opus לפי מורכבות',
  'loop-start':        'לולאה אוטונומית — הפעלה עם ברירות בטוחות',
  'loop-status':       'סטטוס לולאה — התקדמות ואיתותי כשל',
  'save-session':      'שמירת session — state לקובץ ~/.claude/sessions/',
  'resume-session':    'חזרה ל-session — טעינת context מהקובץ האחרון',
  'sessions':          'ניהול sessions — היסטוריה, aliases, metadata',
  'quality-gate':      'quality pipeline — ECC על קובץ או פרויקט',
  'evolve':            'אבולוציה — הצעות שדרוג למערכת Claude הנוכחית',
  'harness-audit':     'audit תשתית — scorecard עדיפויות ממוין',
  'pm2':               'PM2 — ניהול תהליכי Node.js ב-production',
  'python-review':     'ביקורת Python — PEP 8, type hints, אבטחה',
  'rust-review':       'ביקורת Rust — ownership, lifetimes, unsafe',
  'rust-build':        'תיקון Rust — borrow checker, Cargo',
  'rust-test':         'TDD ל-Rust — cargo-llvm-cov, 80%+',
  'cpp-review':        'ביקורת C++ — memory safety, concurrency',
  'cpp-build':         'תיקון C++ — CMake, linker',
  'cpp-test':          'בדיקות C++ — Google Test',
  'go-review':         'ביקורת Go — idiomatic, goroutines',
  'go-build':          'תיקון Go — go vet, לינקר',
  'go-test':           'בדיקות Go — testify, coverage',
  'kotlin-review':     'ביקורת Kotlin — coroutines, Compose',
  'kotlin-build':      'תיקון Kotlin/Gradle',
  'kotlin-test':       'בדיקות Kotlin — JUnit, MockK',
  'gradle-build':      'תיקון Gradle — dependencies, build scripts',
  'instinct-export':   'ייצוא instincts — שמירת תובנות session',
  'instinct-import':   'ייבוא instincts — טעינת תובנות קודמות',
  'instinct-status':   'סטטוס instincts — רשימת תובנות פעילות',
  'learn-eval':        'הערכת למידה — איכות הסקילים שנוצרו',
  'aside':             'הצדה — שמירת מחשבה לצד session הנוכחי',
  'context-budget':    'ניהול context — תקציב טוקנים ומצב דחיסה',
  'eval':              'הרצת evals — מדידת ביצועי מודל על benchmark',
  'prompt-optimize':   'אופטימיזציית prompt — ניתוח ושיפור ללא ביצוע',
  'prune':             'גיזום — קבצים/תלויות מיותרים',
  'projects':          'סקירת פרויקטים — סטטוס כל הפרויקטים',
  'promote':           'קידום — העברת code/config בין סביבות',
  'rules-distill':     'חילוץ כללים — מ-skills לעקרונות כלליים',
  'skill-create':      'יצירת סקיל — תיעוד פטרן חדש עם frontmatter',
  'skill-health':      'בריאות סקילים — בדיקה ועדכון status',
  'test-coverage':     'כיסוי טסטים — ניתוח gap, ייצור טסטים חסרים',
  'update-codemaps':   'עדכון codemaps — תיעוד ארכיטקטורה lean',
  'update-docs':       'עדכון docs — סנכרון תיעוד עם קוד',
  'devfleet':          'DevFleet — ניהול צוות סוכני פיתוח',
  'claw':              'CLAW — מצב Claude Agent מתקדם',
};

// ── Init & Data ────────────────────────────────────────────────────────────
async function init() {
  showLoading(true);
  await loadData();
}

async function loadData() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    snapshotData = await res.json();
    showLoading(false);
    updateTimestamp(snapshotData.generated_at);
    buildProjectMenu(snapshotData.projects);
    setView(currentView);
  } catch (err) {
    showLoading(false);
    const errEl = document.getElementById('errorMsg');
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = 'שגיאה בטעינת הנתונים — הרץ את הסורק תחילה.';
    }
  }
}

function updateTimestamp(iso) {
  if (!iso) return;
  const s = new Date(iso).toLocaleString('he-IL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  const el = document.getElementById('lastUpdated');
  if (el) el.textContent = `עודכן: ${s}`;
  document.querySelectorAll('.last-updated').forEach(e => e.textContent = `עודכן: ${s}`);
}

function buildProjectMenu(projects) {
  const list = document.getElementById('projectList');
  if (!list) return;
  list.innerHTML = '';
  (projects || []).forEach(p => {
    const color = COLORS.projectColors[p.id % COLORS.projectColors.length];
    const div = document.createElement('div');
    div.className = 'sidebar-item';
    div.dataset.view = `project_${p.id}`;
    div.innerHTML = `
      <span class="sidebar-badge" style="background:${color}22;color:${color};border:1px solid ${color}40">${p.id}</span>
      <span class="sidebar-label">${esc(p.name)}</span>`;
    div.onclick = () => setView(`project_${p.id}`);
    list.appendChild(div);
  });
}

function setView(view) {
  currentView = view;
  document.querySelectorAll('.sidebar-item').forEach(el =>
    el.classList.toggle('active', el.dataset.view === view));
  const titleEl = document.getElementById('viewTitle');
  if (view === 'global') {
    if (titleEl) titleEl.textContent = 'מפת המערכת הגלובלית';
    renderGlobalTree();
  } else if (view.startsWith('project_')) {
    const id = parseInt(view.replace('project_', ''));
    const proj = snapshotData?.projects?.find(p => p.id === id);
    if (titleEl && proj) titleEl.textContent = proj.name;
    renderProjectTree(id);
  }
}

// ── Navigation Stack ───────────────────────────────────────────────────────
let navStack = [];
let currentD3Data = null;
let currentD3Title = '';

function navigateBack() {
  if (navStack.length === 0) return;
  const prev = navStack.pop();
  _renderD3(prev.data, prev.title);
}

// ── Data builders ──────────────────────────────────────────────────────────

function buildGlobalData() {
  const g = snapshotData.claude_global;
  const total = [g.agents, g.skills, g.mcp_servers, g.hooks, g.modes, g.memory, g.commands]
    .reduce((s, a) => s + (a || []).length, 0) + (snapshotData.projects || []).length;

  const mcpClean = g.mcp_servers.filter(m => m.name && m.name !== '[Integration Name]' && (m.purpose||'').length > 3);
  const rulesItems = buildRulesItems(g.rules);

  return {
    id: 'root', icon: '🧠', label: 'מערכת Claude Code', count: total, color: '#38BDF8',
    children: [
      catData('agents',     'סוכנים',    g.agents,     a => ({ name: a.name, he: HE_AGENTS[a.name] || a.purpose, detail: HE_AGENTS_DETAIL[a.name] })),
      catData('skills',     'סקילים',    g.skills,     s => ({ name: s.name, he: HE_SKILLS[s.name] || s.purpose, tag: s.status !== 'active' ? s.status : null })),
      catData('mcp_servers','MCP שרתים', mcpClean,     m => ({ name: m.name, he: HE_MCP[m.name] || m.purpose, tag: m.tier || null })),
      catData('modes',      'מצבים',     g.modes,      m => ({ name: m.name.replace(/_mode$/,''), he: HE_MODES[m.name] || m.description || m.trigger, tag: m.version ? `v${m.version}` : null })),
      catData('hooks',      'Hooks',     g.hooks,      (h,i) => ({ name: h.description ? h.description.substring(0,30) : (h.trigger||`Hook ${i+1}`), he: getHookDesc(h), tag: h.type })),
      catData('rules',      'כללים',     rulesItems,   r => ({ name: r.name, he: r.he, tag: r.tag })),
      catData('memory',     'זיכרון',    g.memory,     m => ({ name: m.name || m.file, he: HE_MEMORY_TYPE[m.type] || m.description, tag: m.type })),
      catData('commands',   'פקודות',    g.commands,   c => ({ name: `/${c.name}`, he: HE_COMMANDS[c.name] || c.description, tag: c.category !== 'general' ? c.category : null })),
      catData('projects',   'פרויקטים',  snapshotData.projects || [],
        p => ({
          name: p.name,
          he: p.description || '',
          tag: p.status,
          isProject: p.id
        })),
    ]
  };
}

function buildRulesItems(rules) {
  if (!rules) return [];
  const items = [{ name: 'common', he: HE_RULES['common'], tag: `${rules.common_count||0} קבצים` }];
  (rules.languages || []).forEach(l => items.push({ name: l, he: HE_RULES[l] || `כללים ל-${l}`, tag: '' }));
  return items;
}

function catData(cat, label, items, mapper) {
  const c = COLORS.getCategory(cat);
  const icon = CAT_ICONS[cat];
  return {
    id: cat, icon, label, count: (items||[]).length, color: c.border, cat,
    children: (items||[]).map((item, i) => ({ leaf: true, cat, ...mapper(item, i) }))
  };
}

// ── D3 Tree Renderer ───────────────────────────────────────────────────────

function _renderD3(data, title) {
  currentD3Data = data;
  currentD3Title = title;

  const area = document.getElementById('contentArea');
  area.innerHTML = '';

  // Nav bar with back button
  if (navStack.length > 0) {
    const bar = document.createElement('div');
    bar.className = 'nav-bar';
    bar.innerHTML = `<button class="btn-back-nav" onclick="navigateBack()">← חזרה</button>
      <span class="crumb-trail">${esc(navStack.map(s=>s.title).join(' › '))} › <b>${esc(title)}</b></span>`;
    area.appendChild(bar);
  }

  const svgWrap = document.createElement('div');
  svgWrap.className = 'svg-wrap';
  area.appendChild(svgWrap);

  // Use children accessor that respects collapsed state
  const isLeafView = data.children && data.children[0]?.leaf;
  const nodeSpacingV = isLeafView ? 54 : 62;
  const nodeW = isLeafView ? 270 : 200;
  const nodeH = 40;
  const colW  = isLeafView ? 330 : 290;

  const hierarchy = d3.hierarchy(data, d => {
    if (collapsedNodes.has(d.id)) return null;
    return d.children?.length ? d.children : null;
  });

  const treeLayout = d3.tree().nodeSize([nodeSpacingV, colW]);
  treeLayout(hierarchy);

  const descs = hierarchy.descendants();
  const minX = d3.min(descs, d => d.x);
  const maxX = d3.max(descs, d => d.x);
  const maxY = d3.max(descs, d => d.y);
  const svgW = Math.max(600, maxY + nodeW + 80);
  const svgH = Math.max(400, maxX - minX + nodeSpacingV * 2 + 40);
  const offsetY = -minX + nodeSpacingV;

  const svg = d3.select(svgWrap).append('svg')
    .attr('width', svgW)
    .attr('height', svgH)
    .attr('viewBox', `0 0 ${svgW} ${svgH}`)
    .style('display', 'block')
    .style('background', '#0A0F1E');

  const zoom = d3.zoom().scaleExtent([0.15, 4]).on('zoom', e => g.attr('transform', e.transform));
  svg.call(zoom);

  const g = svg.append('g').attr('transform', `translate(30, ${offsetY})`);

  // SVG defs — shadow filter + per-category gradients
  const defs = svg.append('defs');
  const shadowFilter = defs.append('filter').attr('id', 'd3shadow')
    .attr('x', '-20%').attr('y', '-30%').attr('width', '150%').attr('height', '180%');
  shadowFilter.append('feDropShadow')
    .attr('dx', 0).attr('dy', 4).attr('stdDeviation', 7)
    .attr('flood-color', '#000').attr('flood-opacity', 0.45);

  // Per-category gradient fills
  (currentD3Data?.children || []).forEach(cat => {
    const c = cat.color || '#38BDF8';
    const gid = `grad-${cat.id || 'x'}`;
    const grad = defs.append('linearGradient').attr('id', gid)
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', c).attr('stop-opacity', 0.28);
    grad.append('stop').attr('offset', '100%').attr('stop-color', c).attr('stop-opacity', 0.08);

    // Glow filter per category
    const gf = defs.append('filter').attr('id', `glow-cat-${cat.id}`)
      .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%');
    gf.append('feGaussianBlur').attr('stdDeviation', '5').attr('in', 'SourceGraphic').attr('result', 'blur');
    const fm = gf.append('feMerge');
    fm.append('feMergeNode').attr('in', 'blur');
    fm.append('feMergeNode').attr('in', 'SourceGraphic');
  });

  // Links — curved Bezier
  g.selectAll('.d3lnk')
    .data(hierarchy.links())
    .enter().append('path')
    .attr('class', 'd3lnk')
    .attr('fill', 'none')
    .attr('stroke', d => (d.target.data.color || '#38BDF8') + '44')
    .attr('stroke-width', d => d.target.depth === 1 ? 2.2 : 1.5)
    .attr('stroke-dasharray', d => d.target.depth > 2 ? '4,3' : 'none')
    .attr('d', d3.linkHorizontal().x(d => d.y).y(d => d.x));

  // Nodes
  const node = g.selectAll('.d3nd')
    .data(descs)
    .enter().append('g')
    .attr('class', d => `d3nd${d.data.leaf ? ' d3lf' : ''}`)
    .attr('transform', d => `translate(${d.y},${d.x})`)
    .style('cursor', d => (!d.data.leaf || d.data.isProject !== undefined) ? 'pointer' : 'default');

  // Node rect background
  node.append('rect')
    .attr('x', -nodeH/2).attr('y', -nodeH/2)
    .attr('width', d => {
      if (d.data.leaf) return nodeW;
      if (d.depth === 0) return 190;
      return 170;
    })
    .attr('height', nodeH)
    .attr('rx', d => d.depth === 0 ? 14 : 10)
    .attr('fill', d => {
      if (d.depth === 1 && d.data.id && !d.data.leaf) return `url(#grad-${d.data.id})`;
      const cat = d.data.cat || (d.depth === 0 ? 'root' : null);
      const catColor = d.data.color || '#38BDF8';
      return catColor + (d.depth === 0 ? '20' : '12');
    })
    .attr('stroke', d => {
      if (d.data.leaf) {
        const catColor = d.data.color || '#38BDF8';
        return catColor + '55';
      }
      return d.data.color || '#38BDF8';
    })
    .attr('stroke-width', d => d.depth === 0 ? 3 : d.depth === 1 ? 2.5 : 1.5)
    .attr('filter', d => d.depth <= 1 ? `url(#glow-cat-${d.data.id || 'x'})` : 'url(#d3shadow)');

  // Count badge (category nodes)
  node.filter(d => d.data.count !== undefined && !d.data.leaf)
    .each(function(d) {
      const g2 = d3.select(this);
      const cx = d.depth === 0 ? 76 : 68;
      g2.append('circle').attr('cx', cx).attr('cy', 0).attr('r', 15)
        .attr('fill', d.data.color || '#38BDF8').attr('opacity', 0.90);
      g2.append('text').attr('x', cx).attr('y', 5)
        .attr('text-anchor', 'middle').attr('fill', '#0A0F1E')
        .attr('font-size', 11).attr('font-weight', '800')
        .attr('font-family', 'Heebo, sans-serif')
        .text(d.data.count);
    });

  // Expand/Collapse arrow (depth-1 category nodes)
  node.filter(d => d.depth === 1 && d.data.children?.length > 0)
    .append('text')
    .attr('x', -nodeH/2 + 12).attr('y', 6)
    .attr('font-size', 12)
    .attr('fill', d => d.data.color || '#38BDF8')
    .attr('opacity', 0.9)
    .text(d => collapsedNodes.has(d.data.id) ? '▶' : '▾');

  // Icon (root + category)
  node.filter(d => d.data.icon && !d.data.leaf)
    .append('text')
    .attr('x', -nodeH/2 + (d => d.depth===1 ? 30 : 22))
    .attr('y', 5)
    .attr('text-anchor', 'middle')
    .attr('font-size', d => d.depth === 0 ? 16 : 14)
    .text(d => d.data.icon || '');

  // Main label — English uppercase, Hebrew as-is
  node.append('text')
    .attr('x', d => {
      if (d.data.leaf) return -nodeH/2 + 8;
      if (d.data.icon && d.depth === 0) return -nodeH/2 + 38;
      if (d.data.icon && d.depth === 1) return -nodeH/2 + 46;
      return -nodeH/2 + 10;
    })
    .attr('y', d => (d.data.leaf && d.data.he) ? -5 : 5)
    .attr('font-size', d => d.depth === 0 ? 15 : d.depth === 1 ? 13 : 12)
    .attr('font-weight', d => d.depth <= 1 ? '700' : '500')
    .attr('fill', d => {
      if (d.depth === 0) return '#E0F2FE';
      if (d.depth === 1) return d.data.color || '#38BDF8';
      return '#D1D5DB';
    })
    .attr('font-family', 'Heebo, sans-serif')
    .text(d => {
      const raw = d.data.label || d.data.name || '';
      const isEn = /^[/a-z0-9\-\._\s]+$/i.test(raw) && !/[\u0590-\u05FF]/.test(raw);
      return isEn ? raw.toUpperCase() : raw;
    });

  // Hebrew description for leaf nodes
  node.filter(d => d.data.leaf && d.data.he)
    .append('text')
    .attr('x', -nodeH/2 + 8)
    .attr('y', 13)
    .attr('font-size', 10)
    .attr('fill', '#94A3B8')
    .attr('font-family', 'Heebo, sans-serif')
    .text(d => (d.data.he || '').substring(0, 48) + ((d.data.he||'').length > 48 ? '…' : ''));

  // Tag badge
  node.filter(d => d.data.leaf && d.data.tag)
    .append('text')
    .attr('x', nodeW - nodeH/2 - 4)
    .attr('y', 5)
    .attr('text-anchor', 'end')
    .attr('font-size', 9)
    .attr('fill', d => d.data.color || '#94A3B8')
    .attr('opacity', 0.75)
    .attr('font-family', 'Heebo, sans-serif')
    .text(d => d.data.tag || '');

  // Accent right bar on category nodes
  node.filter(d => d.depth === 1)
    .append('rect')
    .attr('x', 165)
    .attr('y', -nodeH/2 + 6)
    .attr('width', 4)
    .attr('height', nodeH - 12)
    .attr('rx', 2)
    .attr('fill', d => d.data.color || '#38BDF8')
    .attr('opacity', 0.7);

  // Click handlers
  node.on('click', (event, d) => {
    event.stopPropagation();
    // Project leaf → navigate into project view
    if (d.data.isProject !== undefined) {
      navStack.push({ data: currentD3Data, title: currentD3Title });
      setViewProject(d.data.isProject);
      return;
    }
    // Category node (has id + children) → toggle expand/collapse in-place
    if (d.data.id && !d.data.leaf && d.data.children?.length > 0) {
      collapsedNodes.has(d.data.id)
        ? collapsedNodes.delete(d.data.id)
        : collapsedNodes.add(d.data.id);
      _renderD3(currentD3Data, currentD3Title);
      return;
    }
    // Leaf node → show tooltip detail
    if (d.data.leaf) {
      showLeafDetail(event, d.data);
    }
  });

  updateExpandBtn();
}

// ── Leaf Detail Tooltip ────────────────────────────────────────────────────
function showLeafDetail(event, data) {
  const tt = document.getElementById('tooltip');
  if (!tt) return;
  const nameDisplay = (/^[/a-z0-9\-\._\s]+$/i.test(data.name) && !/[\u0590-\u05FF]/.test(data.name))
    ? data.name.toUpperCase() : data.name;
  const detail = data.detail || data.he || '';
  tt.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px;font-size:14px;color:${data.color||'#38BDF8'}">${esc(nameDisplay)}</div>
    <div style="color:#CBD5E1;font-size:12px;line-height:1.6">${esc(detail)}</div>
    ${data.tag ? `<div style="margin-top:8px;font-size:10px;color:${data.color||'#94A3B8'};opacity:0.8">${esc(data.tag)}</div>` : ''}
  `;
  tt.style.display = 'block';
  const tw = 260;
  const left = (event.clientX + 14 > window.innerWidth - tw - 10)
    ? event.clientX - tw - 14
    : event.clientX + 14;
  const top = (event.clientY + 120 > window.innerHeight)
    ? event.clientY - 120
    : event.clientY - 10;
  tt.style.left = left + 'px';
  tt.style.top  = top + 'px';
  // Auto-hide after 5s
  clearTimeout(tt._hideTimer);
  tt._hideTimer = setTimeout(() => { tt.style.display = 'none'; }, 5000);
}

// Hide tooltip on outside click
document.addEventListener('click', () => {
  const tt = document.getElementById('tooltip');
  if (tt) tt.style.display = 'none';
});

// ── Expand / Collapse All ─────────────────────────────────────────────────
function expandAll() {
  collapsedNodes.clear();
  _renderD3(currentD3Data, currentD3Title);
}

function collapseAll() {
  (currentD3Data?.children || []).forEach(c => c.id && collapsedNodes.add(c.id));
  _renderD3(currentD3Data, currentD3Title);
}

function toggleExpandAll() {
  const allCollapsed = currentD3Data?.children?.every(c => !c.id || collapsedNodes.has(c.id));
  allCollapsed ? expandAll() : collapseAll();
}

function updateExpandBtn() {
  const btn = document.getElementById('btn-expand-all');
  if (!btn) return;
  const allCollapsed = currentD3Data?.children?.every(c => !c.id || collapsedNodes.has(c.id));
  btn.textContent = allCollapsed ? 'הרחב הכל' : 'כווץ הכל';
}

// ── Tree Renderers ─────────────────────────────────────────────────────────

function renderGlobalTree() {
  if (!snapshotData) return;
  navStack = [];
  const data = buildGlobalData();
  // On first load: start with all categories collapsed
  if (collapsedNodes.size === 0) {
    data.children.forEach(c => c.id && collapsedNodes.add(c.id));
  }
  _renderD3(data, 'מפת המערכת הגלובלית');
}

function setViewProject(projId) {
  if (!snapshotData) return;
  const proj = snapshotData.projects.find(p => p.id === projId);
  if (!proj) return;
  const color = COLORS.projectColors[proj.id % COLORS.projectColors.length];

  const techChildren = (proj.tech_stack || []).map(t => ({
    leaf: true, name: t, he: null, color: '#6B7280'
  }));

  const agentItems = (proj.project_agents || []).map(a => ({
    leaf: true, name: a,
    he: HE_AGENTS[a] || '',
    detail: HE_AGENTS_DETAIL[a] || HE_AGENTS[a] || '',
    color: COLORS.getCategory('agents').border,
    cat: 'agents'
  }));

  const skillItems = (proj.project_skills || []).map(s => ({
    leaf: true, name: s,
    he: HE_SKILLS[s] || '',
    color: COLORS.getCategory('skills').border,
    cat: 'skills'
  }));

  const data = {
    id: `proj_${proj.id}`, icon: '📁',
    label: proj.name, color,
    description: proj.description || '',
    count: agentItems.length + skillItems.length,
    children: [
      proj.description ? { leaf: true, name: 'תיאור', he: proj.description, color } : null,
      techChildren.length ? {
        id: 'tech', icon: '⚙️', label: 'Tech Stack',
        color: '#6B7280', count: techChildren.length, children: techChildren
      } : null,
      { leaf: true, name: 'סטטוס', he: proj.status || 'active', color },
      agentItems.length ? {
        id: `proj_agents_${proj.id}`, icon: '🤖', label: 'סוכנים',
        color: COLORS.getCategory('agents').border,
        cat: 'agents',
        count: agentItems.length,
        children: agentItems
      } : null,
      skillItems.length ? {
        id: `proj_skills_${proj.id}`, icon: '✨', label: 'סקילים',
        color: COLORS.getCategory('skills').border,
        cat: 'skills',
        count: skillItems.length,
        children: skillItems
      } : null,
    ].filter(Boolean)
  };
  _renderD3(data, proj.name);
}

function renderProjectTree(projId) {
  navStack = [{ data: buildGlobalData(), title: 'מפת המערכת הגלובלית' }];
  // Reset collapsed state for project view
  collapsedNodes.clear();
  setViewProject(projId);
}

// ── Helpers ────────────────────────────────────────────────────────────────

const CAT_ICONS = {
  agents: '🤖', skills: '✨', mcp_servers: '🔌', hooks: '🪝',
  modes: '🎭', rules: '📋', memory: '💾', commands: '⚡', projects: '📁',
};

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function refreshData() {
  const btn = document.getElementById('btnRefresh');
  if (btn) btn.classList.add('updating');
  window.location.reload(true);
}

function showLoading(on) {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = on ? 'flex' : 'none';
}

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', init);
