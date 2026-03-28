/**
 * Schematic Evolution — App Logic v1.0
 */
let mindmap = null, snapshotData = null, currentView = 'global';

const DATA_URL = (() => {
  const loc = window.location.pathname;
  const base = loc.endsWith('/') ? loc : loc.substring(0, loc.lastIndexOf('/') + 1);
  return base + 'data/snapshot.json?t=' + Date.now();
})();

async function init() {
  mindmap = new MindMap('canvas');
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
    buildLegend();
    setView(currentView);
  } catch (err) {
    showLoading(false);
    document.getElementById('errorMsg').style.display = 'block';
    document.getElementById('errorMsg').textContent = 'שגיאה בטעינת הנתונים — הרץ את הסורק תחילה.';
  }
}

function updateTimestamp(iso) {
  if (!iso) return;
  const s = new Date(iso).toLocaleString('he-IL', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  document.querySelectorAll('.last-updated').forEach(el => el.textContent = `עודכן: ${s}`);
}

function buildProjectMenu(projects) {
  const list = document.getElementById('projectList');
  if (!list) return;
  list.innerHTML = '';
  (projects || []).forEach(p => {
    const color = COLORS.projectColors[p.id % COLORS.projectColors.length];
    const div = document.createElement('div');
    div.className = 'sidebar-item'; div.dataset.view = `project_${p.id}`;
    div.innerHTML = `<span class="sidebar-badge" style="background:${color}22;color:${color};border:1px solid ${color}40">${p.id}</span><span class="sidebar-label">${p.name}</span>`;
    div.onclick = () => setView(`project_${p.id}`);
    list.appendChild(div);
  });
}

function buildLegend() {
  const legend = document.getElementById('legend');
  if (!legend) return;
  const cats = [['agents','סוכנים'],['skills','סקילים'],['mcp_servers','MCP'],['hooks','Hooks'],['modes','מצבים'],['rules','כללים'],['memory','זיכרון'],['commands','פקודות'],['projects','פרויקטים']];
  legend.innerHTML = cats.map(([cat, label]) => {
    const c = COLORS.getCategory(cat);
    return `<div class="legend-item"><span class="legend-dot" style="background:${c.border};box-shadow:0 0 6px ${c.glow}"></span><span>${label}</span></div>`;
  }).join('');
}

function setView(view) {
  currentView = view;
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  const titleEl = document.getElementById('viewTitle');
  if (view === 'global') {
    if (titleEl) titleEl.textContent = 'מפת המערכת הגלובלית';
    renderGlobalView();
  } else if (view.startsWith('project_')) {
    const id = parseInt(view.replace('project_',''));
    const proj = snapshotData?.projects?.find(p => p.id === id);
    if (titleEl && proj) titleEl.textContent = proj.name;
    renderProjectView(id);
  }
}

function renderGlobalView() {
  if (!snapshotData) return;
  const tree = buildGlobalTree(snapshotData);
  mindmap.collapsed.clear();
  mindmap.collapsed.add('commands'); // collapse commands by default
  mindmap.render(tree);
}

function renderProjectView(projId) {
  if (!snapshotData) return;
  const proj = snapshotData.projects.find(p => p.id === projId);
  if (!proj) return;
  mindmap.collapsed.clear();
  mindmap.render(buildProjectTree(proj));
}

// ── Tree Builders ─────────────────────────────────────────────────────────

function buildGlobalTree(data) {
  const g = data.claude_global;
  function cat(id, name, nameHe, items, mapper) {
    return { id, name, nameHe, category: id, description: `${(items||[]).length} פריטים`, count:(items||[]).length, children:(items||[]).map(mapper) };
  }
  return {
    id:'root', name:'Claude Code System', nameHe:'מערכת Claude Code',
    category:'root', description:'מערכת Claude Code הגלובלית', count:0,
    children: [
      cat('agents','Agents','סוכנים', g.agents, a=>({ id:`ag_${a.name}`, name:a.name, nameHe:a.name, category:'agents', description:a.purpose||'', children:[] })),
      cat('skills','Skills','סקילים', g.skills, s=>({ id:`sk_${s.name}`, name:s.name, nameHe:s.name, category:'skills', description:(s.purpose||'')+(s.status&&s.status!=='active'?` [${s.status}]`:''), status:s.status, children:[] })),
      cat('mcp_servers','MCP','MCP שרתים', g.mcp_servers, m=>({ id:`mcp_${m.name}`, name:m.name, nameHe:m.name, category:'mcp_servers', description:m.purpose||'', children:[] })),
      cat('hooks','Hooks','Hooks', g.hooks, (h,i)=>({ id:`hk_${i}_${h.type}`, name:h.type, nameHe:h.type, category:'hooks', description:h.trigger?`Trigger: ${h.trigger}`:'', children:[] })),
      cat('modes','Modes','מצבים', g.modes, m=>({ id:`mo_${m.name}`, name:m.name.replace('_mode',''), nameHe:m.name.replace('_mode',''), category:'modes', description:m.trigger||'', children:[] })),
      {
        id:'rules', name:'Rules', nameHe:'כללים', category:'rules',
        description:`${g.rules.total||0} קבצי כללים`, count:g.rules.total||0,
        children: [
          {id:'rules_common',name:'Common',nameHe:'משותפים',category:'rules',description:`${g.rules.common_count} כללים`,children:[]},
          ...(g.rules.languages||[]).map(l=>({id:`rl_${l}`,name:l,nameHe:l,category:'rules',description:`כללים ל-${l}`,children:[]}))
        ]
      },
      cat('memory','Memory','זיכרון', g.memory, m=>({ id:`mem_${m.file}`, name:m.name||m.file, nameHe:m.name||m.file, category:'memory', description:m.type?`סוג: ${m.type}`:'', children:[] })),
      cat('commands','Commands','פקודות', g.commands, c=>({ id:`cmd_${c.name}`, name:c.name, nameHe:c.name, category:'commands', description:'', children:[] })),
      cat('projects','Projects','פרויקטים', data.projects, p=>({ id:`pr_${p.id}`, name:p.name, nameHe:p.name, category:'projects', description:p.description, status:p.status, children:[] })),
    ]
  };
}

function buildProjectTree(proj) {
  const tech = (proj.tech_stack||[]).map(t=>({id:`t_${proj.id}_${t}`,name:t,nameHe:t,category:'frontend',description:`טכנולוגיה: ${t}`,children:[]}));
  return {
    id:`pr_root_${proj.id}`, name:proj.name, nameHe:proj.name, category:'projects', description:proj.description,
    children: [
      { id:`tech_${proj.id}`, name:'Tech Stack', nameHe:'ערמת טכנולוגיות', category:'frontend',
        description:(proj.tech_stack||[]).join(', '), count:(proj.tech_stack||[]).length, children:tech },
      { id:`meta_${proj.id}`, name:'Info', nameHe:'מידע', category:'config',
        description:`${proj.files_count||0} קבצים`, count:0,
        children: [
          {id:`mf_${proj.id}`,name:`${proj.files_count||0} Files`,nameHe:`${proj.files_count||0} קבצים`,category:'config',description:'',children:[]},
          {id:`ms_${proj.id}`,name:proj.status||'active',nameHe:proj.status||'פעיל',category:'config',description:'סטטוס',children:[]},
          {id:`mfol_${proj.id}`,name:proj.folder||'',nameHe:proj.folder||'',category:'config',description:'שם ספרייה',children:[]},
        ]
      },
      ...(proj.last_modified?[{id:`upd_${proj.id}`,name:'Last Update',nameHe:'עדכון אחרון',category:'memory',description:new Date(proj.last_modified).toLocaleDateString('he-IL'),children:[]}]:[])
    ]
  };
}

// ── Controls ──────────────────────────────────────────────────────────────
async function refreshData() {
  document.getElementById('btnRefresh')?.classList.add('updating');
  showLoading(true);
  await loadData();
  document.getElementById('btnRefresh')?.classList.remove('updating');
}
function resetZoom()   { mindmap?.resetView(); }
function expandAll()   { mindmap?.expandAll(); }
function collapseAll() { mindmap?.collapseAll(); }
function showLoading(on) { const el=document.getElementById('loadingOverlay'); if(el) el.style.display=on?'flex':'none'; }
function toggleSidebar() { document.getElementById('sidebar')?.classList.toggle('open'); }

document.addEventListener('DOMContentLoaded', init);
