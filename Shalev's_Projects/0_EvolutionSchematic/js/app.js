/**
 * Schematic Evolution — App Logic v4.0
 * Drill-down interactive tree — no D3, pure HTML/CSS/JS
 */
let snapshotData = null, currentView = 'global';

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
  'cpp-build-resolver':   'פותר שגיאות C++, CMake, qllinker',
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
  'e2e-runner':           'מריץ בדיקות End-to-End עם Playwright',
};
const HE_AGENTS_DETAIL = {
  'architect':            'משמש לפני כתיבת קוד — מונע ארכיטקטורה שבורה מאוחר יותר. מתאים להחלטות על מבנה שכבות, בסיס נתונים, microservices ו-APIs.',
  'code-reviewer':        'רץ אוטומטית אחרי כל שינוי קוד. עוצר קוד גרוע לפני ש-commit — חוסך שעות debug.',
  'security-reviewer':    'שכבת ההגנה האחרונה. מגלה סודות שנשכחו ב-code, הזרקות SQL ופגיעויות OWASP לפני שהם מגיעים לפרודקשן.',
  'tdd-guide':            'מוודא שהתוצאה הסופית מכוסה ב-80%+ בדיקות. מפחית באגים בפרודקשן ב-60-80% לפי מחקרים.',
  'planner':              'חוסך זמן עצום — מפרק בקשות עמומות לשלבים ברורים. עדיף שלוחצים על "שמור" לפני כתיבת קוד.',
  'database-reviewer':    'מגלה missing indexes, שאילתות איטיות ובעיות RLS לפני שנגיעים לפרודקשן.',
};
const HE_SKILLS = {
  'ai-regression-testing':   'בדיקות רגרסיה לפיתוח מבוסס AI',
  'configure-ecc':            'מתקין אינטראקטיבי לסקילים וכללים',
  'continuous-learning':      'חילוץ פטרנים לשימוש חוזר מסשנים',
  'create-sparc-agent':       'יצירת סוכן SPARC מובנה',
  'debug-loop':               'לולאת דיבוג אוטומטית',
  'init-sparc':               'אתחול פרויקט SPARC',
  'load-rules':               'טעינת קבצי כללים לפרויקט',
  'mcp-setup':                'הגדרת שרתי MCP',
  'prime':                    'הכנת קונטקסט מהיר לפרויקט',
  'review-pr':                'סקירת Pull Request',
  'run-tests':                'הרצת טסטים',
  'sub-task':                 'ניהול משימות-משנה',
  'update-codemaps':          'עדכון מפות קוד ותיעוד',
  'update-docs':              'עדכון תיעוד ו-CLAUDE.md',
  'vcs-github':               'ניהול גרסאות ב-GitHub',
  'worktree':                 'ניהול git worktrees מבודדים',
  'commit':                   'יצירת commit מסוגנן',
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
  'Gmail':                        'Gmail — חיפוש, קריאה, יצירת טיוטות ממש Claude Code',
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
  'docs':              'עדכון תיעוד — CLAUDE.md, READMEs, codemaps',
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
  'setup-pm':          'הגדרת package manager — npm/pnpm/yarn/bun',
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
    errEl.style.display = 'block';
    errEl.textContent = 'שגיאה בטעינת הנתונים — הרץ את הסורק תחילה.';
  }
}

function updateTimestamp(iso) {
  if (!iso) return;
  const s = new Date(iso).toLocaleString('he-IL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  document.querySelectorAll('.last-updated').forEach(el => el.textContent = `עודכן: ${s}`);
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
let navStack = []; // [{data, title}]
let currentD3Data = null;
let currentD3Title = '';

function navigateBack() {
  if (navStack.length === 0) return;
  const prev = navStack.pop();
  _renderD3(prev.data, prev.title);
}

function navigateTo(data, title) {
  if (currentD3Data) navStack.push({ data: currentD3Data, title: currentD3Title });
  _renderD3(data, title);
}

// ── Data builders ──────────────────────────────────────────────────────────

function buildGlobalData() {
  const g = snapshotData.claude_global;
  const total = [g.agents, g.skills, g.mcp_servers, g.hooks, g.modes, g.memory, g.commands]
    .reduce((s, a) => s + (a || []).length, 0) + (snapshotData.projects || []).length;

  const mcpClean = g.mcp_servers.filter(m => m.name && m.name !== '[Integration Name]' && (m.purpose||'').length > 3);
  const rulesItems = buildRulesItems(g.rules);

  return {
    id: 'root', icon: '🧠', label: 'מערכת Claude Code', count: total, color: '#4F6EF7',
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
        p => {
          const updated = p.last_modified ? new Date(p.last_modified).toLocaleDateString('he-IL') : '—';
          return { name: p.name, he: `${p.description||''} · ${p.tech_stack?.join(', ')||''} · ${updated}`, tag: p.status, isProject: p.id };
        }),
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
    children: (items||[]).map((item, i) => ({ leaf: true, ...mapper(item, i) }))
  };
}

// ── D3 Tree Renderer ───────────────────────────────────────────────────────

function _renderD3(data, title) {
  currentD3Data = data;
  currentD3Title = title;

  const area = document.getElementById('contentArea');
  area.innerHTML = '';

  // Nav bar with back button + breadcrumbs
  if (navStack.length > 0) {
    const bar = document.createElement('div');
    bar.className = 'nav-bar';
    const crumbs = navStack.map(s => `<span class="crumb">${s.title}</span>`).join(' › ');
    bar.innerHTML = `<button class="btn-back-nav" onclick="navigateBack()">← חזרה</button><span class="crumb-trail">${crumbs} › <b>${title}</b></span>`;
    area.appendChild(bar);
  }

  const svgWrap = document.createElement('div');
  svgWrap.className = 'svg-wrap';
  area.appendChild(svgWrap);

  const isLeafView = data.children && data.children[0]?.leaf;
  const nodeSpacingV = isLeafView ? 52 : 56;
  const nodeW = isLeafView ? 260 : 200;
  const nodeH = 38;
  const colW  = isLeafView ? 320 : 280;

  const hierarchy = d3.hierarchy(data);
  const treeLayout = d3.tree().nodeSize([nodeSpacingV, colW]);
  treeLayout(hierarchy);

  const descs = hierarchy.descendants();
  const minX = d3.min(descs, d => d.x);
  const maxX = d3.max(descs, d => d.x);
  const maxY = d3.max(descs, d => d.y);
  const svgW = Math.max(500, maxY + nodeW + 60);
  const svgH = Math.max(300, maxX - minX + nodeSpacingV * 2);
  const offsetY = -minX + nodeSpacingV;

  const svg = d3.select(svgWrap).append('svg')
    .attr('width', svgW)
    .attr('height', svgH)
    .attr('viewBox', `0 0 ${svgW} ${svgH}`)
    .style('display', 'block')
    .style('max-width', '100%');

  const zoom = d3.zoom().scaleExtent([0.25, 4]).on('zoom', e => g.attr('transform', e.transform));
  svg.call(zoom);

  const g = svg.append('g').attr('transform', `translate(30, ${offsetY})`);

  // Links — curved Bezier
  g.selectAll('.d3lnk')
    .data(hierarchy.links())
    .enter().append('path')
    .attr('class', 'd3lnk')
    .attr('fill', 'none')
    .attr('stroke', d => (d.target.data.color || '#4F6EF7') + '55')
    .attr('stroke-width', 2)
    .attr('d', d3.linkHorizontal().x(d => d.y).y(d => d.x));

  // Nodes
  const node = g.selectAll('.d3nd')
    .data(descs)
    .enter().append('g')
    .attr('class', d => `d3nd${d.data.leaf ? ' d3lf' : ''}`)
    .attr('transform', d => `translate(${d.y},${d.x})`)
    .style('cursor', d => (!d.data.leaf || d.data.isProject) ? 'pointer' : 'default');

  // Shadow filter
  const defs = svg.append('defs');
  const filter = defs.append('filter').attr('id', 'd3shadow').attr('x', '-20%').attr('y', '-30%').attr('width', '140%').attr('height', '160%');
  filter.append('feDropShadow').attr('dx', 0).attr('dy', 3).attr('stdDeviation', 6).attr('flood-color', '#0F172A').attr('flood-opacity', 0.12);

  // Node rect
  node.append('rect')
    .attr('x', -nodeH/2).attr('y', -nodeH/2)
    .attr('width', d => d.data.leaf ? nodeW : (d.depth === 0 ? 180 : 160))
    .attr('height', nodeH)
    .attr('rx', 10)
    .attr('fill', d => (d.data.color || '#4F6EF7') + (d.depth === 0 ? '25' : '15'))
    .attr('stroke', d => d.data.color || '#4F6EF7')
    .attr('stroke-width', d => d.depth === 0 ? 3 : 1.5)
    .attr('filter', 'url(#d3shadow)');

  // Count badge (category nodes)
  node.filter(d => d.data.count !== undefined && !d.data.leaf)
    .append('g')
    .call(g2 => {
      g2.append('circle').attr('cx', d => d.depth===0 ? 70 : 62).attr('cy', 0).attr('r', 14)
        .attr('fill', d => d.data.color || '#4F6EF7');
      g2.append('text').attr('x', d => d.depth===0 ? 70 : 62).attr('y', 5)
        .attr('text-anchor', 'middle').attr('fill', 'white').attr('font-size', 11).attr('font-weight', '700')
        .attr('font-family', 'Heebo, sans-serif')
        .text(d => d.data.count);
    });

  // Icon
  node.filter(d => d.data.icon)
    .append('text')
    .attr('x', -nodeH/2 + 18).attr('y', 5)
    .attr('text-anchor', 'middle').attr('font-size', 14)
    .text(d => d.data.icon || '');

  // Main label
  node.append('text')
    .attr('x', d => d.data.icon ? -nodeH/2 + 34 : -nodeH/2 + 8)
    .attr('y', d => (d.data.leaf && d.data.he) ? -4 : 5)
    .attr('font-size', d => d.depth === 0 ? 14 : 12)
    .attr('font-weight', d => d.depth <= 1 ? '700' : '500')
    .attr('fill', '#1E293B')
    .attr('font-family', 'Heebo, sans-serif')
    .text(d => {
      const raw = d.data.label || d.data.name || '';
      const isEn = /^[/a-z0-9\-\._]+$/i.test(raw) && !/[\u0590-\u05FF]/.test(raw);
      return isEn ? raw.toUpperCase() : raw;
    });

  // Hebrew description for leaf nodes
  node.filter(d => d.data.leaf && d.data.he)
    .append('text')
    .attr('x', d => d.data.icon ? -nodeH/2 + 34 : -nodeH/2 + 8)
    .attr('y', 13)
    .attr('font-size', 10)
    .attr('fill', '#64748B')
    .attr('font-family', 'Heebo, sans-serif')
    .text(d => (d.data.he || '').substring(0, 45) + ((d.data.he||'').length > 45 ? '…' : ''));

  // Tag badge for leaf
  node.filter(d => d.data.leaf && d.data.tag)
    .append('text')
    .attr('x', d => nodeW - nodeH/2 - 4)
    .attr('y', 5)
    .attr('text-anchor', 'end')
    .attr('font-size', 9)
    .attr('fill', d => d.data.color || '#94A3B8')
    .attr('font-family', 'Heebo, sans-serif')
    .text(d => d.data.tag || '');

  // Click handlers
  node.on('click', (event, d) => {
    event.stopPropagation();
    if (d.data.isProject !== undefined) {
      // Navigate to project view
      navStack.push({ data: currentD3Data, title: currentD3Title });
      setViewProject(d.data.isProject);
      return;
    }
    if (!d.data.leaf && d.children && d.children.length > 0 && d.depth > 0) {
      navigateTo(d.data, d.data.label || d.data.name);
    }
  });
}

function renderGlobalTree() {
  if (!snapshotData) return;
  navStack = [];
  const data = buildGlobalData();
  _renderD3(data, 'מפת המערכת הגלובלית');
}

function setViewProject(projId) {
  if (!snapshotData) return;
  const proj = snapshotData.projects.find(p => p.id === projId);
  if (!proj) return;
  const updated = proj.last_modified ? new Date(proj.last_modified).toLocaleDateString('he-IL') : '—';
  const color = COLORS.projectColors[proj.id % COLORS.projectColors.length];
  const techChildren = (proj.tech_stack||[]).map(t => ({ leaf: true, name: t, he: null, color: '#6B7280' }));
  const data = {
    id: `proj_${proj.id}`, icon: '📁', label: proj.name, color, count: proj.files_count || 0,
    children: [
      { leaf: true, name: 'תיאור', he: proj.description || '—', color },
      techChildren.length ? { id: 'tech', icon: '⚙️', label: 'Tech Stack', color: '#6B7280', count: techChildren.length, children: techChildren } : null,
      { leaf: true, name: 'סטטוס', he: proj.status || 'active', color },
      { leaf: true, name: 'ספרייה', he: proj.folder, color },
      { leaf: true, name: 'קבצים', he: `${proj.files_count||0} קבצים · עודכן: ${updated}`, color },
    ].filter(Boolean)
  };
  _renderD3(data, proj.name);
}

function renderProjectTree(projId) {
  navStack = [{ data: buildGlobalData(), title: 'מפת המערכת הגלובלית' }];
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
  // Full page reload — picks up latest snapshot.json, JS, and CSS
  window.location.reload(true);
  return;
  // (dead code below kept for fallback reference)
  showLoading(true);
  document.getElementById('contentArea').innerHTML = '';
  try {
    const res = await fetch('data/snapshot.json?t=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    snapshotData = await res.json();
    showLoading(false);
    updateTimestamp(snapshotData.generated_at);
    buildProjectMenu(snapshotData.projects);
    setView(currentView);
  } catch (err) {
    showLoading(false);
    document.getElementById('errorMsg').style.display = 'block';
    document.getElementById('errorMsg').textContent = 'שגיאה בטעינת הנתונים.';
  }
  if (btn) btn.classList.remove('updating');
}

function showLoading(on) {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = on ? 'flex' : 'none';
}

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', init);
