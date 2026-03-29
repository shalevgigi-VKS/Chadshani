"""
Schematic Evolution — System Scanner v1.1
Scans ~/.claude/ global system + all projects → outputs data/snapshot.json
"""
import sys, os, json, re, shutil
from pathlib import Path
from datetime import datetime, timezone

sys.stdout.reconfigure(encoding='utf-8')

CLAUDE_DIR   = Path.home() / '.claude'
PROJECTS_DIR = Path("e:\\Claude\\Shalev's_Projects")
OUT_DIR      = Path(__file__).parent.parent / 'data'
OUT_FILE     = OUT_DIR / 'snapshot.json'
HIST_DIR     = OUT_DIR / 'history'


# ── Helpers ────────────────────────────────────────────────────────────────

def read_text(path):
    try:
        return path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return ''

def parse_frontmatter(text):
    """Extract YAML-like frontmatter between --- markers."""
    m = re.match(r'^---\s*\n(.*?)\n---', text, re.DOTALL)
    if not m:
        return {}
    fm = {}
    for line in m.group(1).splitlines():
        if ':' in line:
            k, _, v = line.partition(':')
            fm[k.strip()] = v.strip()
    return fm

def first_non_empty_line(text, skip_frontmatter=True):
    lines = text.splitlines()
    in_fm = False
    for line in lines:
        stripped = line.strip()
        if stripped == '---':
            in_fm = not in_fm
            continue
        if in_fm:
            continue
        if stripped and not stripped.startswith('#'):
            return stripped
        if stripped.startswith('#'):
            return stripped.lstrip('#').strip()
    return ''


# ── Agents ──────────────────────────────────────────────────────────────────

def scan_agents():
    agents_dir = CLAUDE_DIR / 'agents'
    result = []
    if not agents_dir.exists():
        return result
    for f in sorted(agents_dir.glob('*.md')):
        text = read_text(f)
        fm = parse_frontmatter(text)
        name = f.stem
        purpose = fm.get('description', '') or first_non_empty_line(text)
        result.append({'name': name, 'purpose': purpose[:120]})
    print(f'[AGENTS] Found {len(result)}')
    return result


# ── Skills ──────────────────────────────────────────────────────────────────

def scan_skills():
    skills_dir = CLAUDE_DIR / 'skills'
    result = []
    seen = set()
    if not skills_dir.exists():
        return result

    def _add_skill(name, text, status):
        if name in seen or name.lower() in ('readme', 'index'):
            return
        seen.add(name)
        fm = parse_frontmatter(text)
        purpose = fm.get('description', '') or fm.get('purpose', '') or fm.get('title', '') or first_non_empty_line(text)
        result.append({'name': name, 'purpose': purpose[:120], 'status': status})

    # Pattern 1: skills/NAME/SKILL.md (most common)
    for skill_dir in sorted(skills_dir.iterdir()):
        if not skill_dir.is_dir():
            continue
        status = 'active'
        if skill_dir.name in ('active', 'experimental', 'deprecated'):
            # These are status folders — scan inside them
            inner_status = skill_dir.name
            for f in sorted(skill_dir.glob('*.md')):
                _add_skill(f.stem, read_text(f), inner_status)
            for sub in sorted(skill_dir.iterdir()):
                if sub.is_dir():
                    skill_md = sub / 'SKILL.md'
                    if not skill_md.exists():
                        skill_md = next(sub.glob('*.md'), None)
                    if skill_md:
                        _add_skill(sub.name, read_text(skill_md), inner_status)
            continue
        skill_md = skill_dir / 'SKILL.md'
        if not skill_md.exists():
            skill_md = next(skill_dir.glob('*.md'), None)
        if skill_md:
            _add_skill(skill_dir.name, read_text(skill_md), status)

    # Pattern 2: top-level skills/*.md
    for f in sorted(skills_dir.glob('*.md')):
        _add_skill(f.stem, read_text(f), 'active')
    print(f'[SKILLS] Found {len(result)}')
    return result


# ── Hooks ───────────────────────────────────────────────────────────────────

def scan_hooks():
    result = []
    settings_json = CLAUDE_DIR / 'settings.json'
    if settings_json.exists():
        try:
            data = json.loads(read_text(settings_json))
            hooks_section = data.get('hooks', {})
            seen = set()
            for event_type, entries in hooks_section.items():
                if isinstance(entries, list):
                    for entry in entries:
                        if isinstance(entry, dict):
                            matcher = entry.get('matcher', '')
                            description = entry.get('description', '')
                            hooks_list = entry.get('hooks', [entry])
                            for h in hooks_list:
                                cmd = (h.get('command', '') if isinstance(h, dict) else str(h))[:80]
                                key = (event_type, matcher, cmd[:30])
                                if key not in seen:
                                    seen.add(key)
                                    result.append({
                                        'type': event_type,
                                        'trigger': matcher,
                                        'description': description[:120],
                                        'script': cmd
                                    })
        except Exception:
            pass
    # Fallback: hooks.json
    if not result:
        hooks_json = CLAUDE_DIR / 'hooks' / 'hooks.json'
        if hooks_json.exists():
            try:
                data = json.loads(read_text(hooks_json))
                for h in data if isinstance(data, list) else data.get('hooks', []):
                    result.append({
                        'type': h.get('type', h.get('event', '')),
                        'trigger': h.get('trigger', h.get('matcher', '')),
                        'description': h.get('description', '')[:120],
                        'script': h.get('script', h.get('command', ''))[:80]
                    })
            except Exception:
                pass
    print(f'[HOOKS] Found {len(result)}')
    return result


# ── Modes ───────────────────────────────────────────────────────────────────

def scan_modes():
    modes_dir = CLAUDE_DIR / 'modes'
    result = []
    if not modes_dir.exists():
        return result
    for f in sorted(modes_dir.glob('*.md')):
        text = read_text(f)
        fm = parse_frontmatter(text)
        name = f.stem
        version = fm.get('version', fm.get('Version', ''))
        trigger = fm.get('trigger', fm.get('Trigger', ''))
        if not trigger:
            # Find "Triggered by:" line
            m = re.search(r'Triggered by:\s*(.+)', text)
            trigger = m.group(1).strip() if m else ''
        # Extract description: first non-header, non-metadata paragraph
        description = ''
        for line in text.splitlines():
            l = line.strip()
            if l and not l.startswith('#') and not l.startswith('---') \
               and not l.startswith('Version') and not l.startswith('Last Updated') \
               and not l.startswith('Change:') and not l.startswith('Trigger'):
                description = l[:120]
                break
        result.append({'name': name, 'version': version, 'trigger': trigger[:80], 'description': description})
    print(f'[MODES] Found {len(result)}')
    return result


# ── Rules ───────────────────────────────────────────────────────────────────

def scan_rules():
    rules_dir = CLAUDE_DIR / 'rules'
    if not rules_dir.exists():
        return {'languages': [], 'common_count': 0, 'total': 0}
    languages = [d.name for d in sorted(rules_dir.iterdir()) if d.is_dir() and d.name != 'common']
    common_count = len(list((rules_dir / 'common').glob('*.md'))) if (rules_dir / 'common').exists() else 0
    total_files = len(list(rules_dir.rglob('*.md')))
    print(f'[RULES] Languages: {languages}, common: {common_count}')
    return {'languages': languages, 'common_count': common_count, 'total': total_files}


# ── MCP Servers ─────────────────────────────────────────────────────────────

def scan_mcp_servers():
    result = []
    # Try system_integrations_map.md
    sysmap = CLAUDE_DIR / 'docs' / 'system_integrations_map.md'
    if sysmap.exists():
        text = read_text(sysmap)
        # Find MCP sections — look for lines like "## Name" with "MCP" or tier info nearby
        sections = re.split(r'\n#{1,3} ', text)
        for sec in sections:
            lines = sec.splitlines()
            if not lines:
                continue
            name = lines[0].strip().strip('#').strip()
            if not name or len(name) > 60:
                continue
            # Check if this looks like an MCP entry
            sec_text = '\n'.join(lines)
            if 'mcp' not in sec_text.lower() and 'MCP' not in sec_text:
                continue
            tier_m = re.search(r'tier[:\s]+(\d)', sec_text, re.I)
            tier = f'TIER {tier_m.group(1)}' if tier_m else ''
            purpose_m = re.search(r'[Pp]urpose[:\s]+(.+)', sec_text)
            purpose = purpose_m.group(1).strip()[:100] if purpose_m else ''
            status_m = re.search(r'[Ss]tatus[:\s]+(\w+)', sec_text)
            status = status_m.group(1) if status_m else 'active'
            if purpose:  # only add if we found real info
                result.append({'name': name, 'tier': tier, 'purpose': purpose, 'status': status})
    # Also check mcp_servers directory (registry)
    mcp_reg = CLAUDE_DIR / 'mcp' / 'registry'
    if mcp_reg.exists():
        for f in sorted(mcp_reg.glob('*.md')):
            name = f.stem
            if not any(r['name'] == name for r in result):
                text = read_text(f)
                fm = parse_frontmatter(text)
                purpose = fm.get('purpose', fm.get('description', first_non_empty_line(text)))
                result.append({'name': name, 'tier': '', 'purpose': purpose[:100], 'status': 'active'})
    # Fallback: check settings.json mcpServers
    if not result:
        settings_json = CLAUDE_DIR / 'settings.json'
        if settings_json.exists():
            try:
                data = json.loads(read_text(settings_json))
                for name in data.get('mcpServers', {}).keys():
                    result.append({'name': name, 'tier': '', 'purpose': '', 'status': 'active'})
            except Exception:
                pass
    print(f'[MCP] Found {len(result)}')
    return result


# ── Commands ────────────────────────────────────────────────────────────────

def scan_commands():
    result = []
    commands_dir = CLAUDE_DIR / 'commands'
    if not commands_dir.exists():
        commands_dir = Path.home() / '.claude' / 'commands'
    if commands_dir.exists():
        for f in sorted(commands_dir.rglob('*.md')):
            name = f.stem
            category = f.parent.name if f.parent != commands_dir else 'general'
            text = read_text(f)
            fm = parse_frontmatter(text)
            desc = fm.get('description', '') or fm.get('purpose', '') or first_non_empty_line(text)
            result.append({'name': name, 'category': category, 'description': desc[:120]})
    print(f'[COMMANDS] Found {len(result)}')
    return result


# ── Memory ──────────────────────────────────────────────────────────────────

def scan_memory():
    result = []
    memory_dir = CLAUDE_DIR / 'memory'
    if not memory_dir.exists():
        # Try projects/*/memory
        for proj_mem in CLAUDE_DIR.glob('projects/*/memory/*.md'):
            text = read_text(proj_mem)
            fm = parse_frontmatter(text)
            result.append({
                'file': proj_mem.name,
                'name': fm.get('name', proj_mem.stem),
                'type': fm.get('type', 'memory'),
                'description': fm.get('description', '')[:120]
            })
    else:
        for f in sorted(memory_dir.glob('*.md')):
            if f.name == 'MEMORY.md':
                continue
            text = read_text(f)
            fm = parse_frontmatter(text)
            result.append({
                'file': f.name,
                'name': fm.get('name', f.stem),
                'type': fm.get('type', 'memory'),
                'description': fm.get('description', '')[:120]
            })
    print(f'[MEMORY] Found {len(result)}')
    return result


# ── Projects ────────────────────────────────────────────────────────────────

KNOWN_PROJECTS = {
    '0_EvolutionSchematic': {'name': 'אבולוציה סכמטית', 'description': 'מפת מערכת שבועית — Claude Code ויזואלי'},
    '1_EmotionWheel':       {'name': 'גלגל הרגשות', 'description': 'ויזואליזציה אינטראקטיבית של גלגל הרגשות'},
    '2_Chadshani':          {'name': 'חדשני', 'description': 'אתר ניתוח שוק הון ישראלי'},
    '3_Notifications':      {'name': 'התראות', 'description': 'מערכת ניהול התראות ntfy.sh'},
    '4_RemoteAccess':       {'name': 'שליטה מרחוק', 'description': 'גישה ושליטה מרחוק'},
    '5_StickerBot':         {'name': 'סטיקר בוט', 'description': 'בוט WhatsApp ליצירת מדבקות'},
    '6_Gigiz':              {'name': 'גיגיז', 'description': 'פלטפורמת גיג עבודה'},
    '7_WhaleWatcher':       {'name': 'WhaleWatcher', 'description': 'מעקב עסקאות לווייתנים בשוק ההון'},
}

PROJECT_AGENTS = {
    '0_EvolutionSchematic': ['plan', 'code-reviewer', 'doc-updater'],
    '1_EmotionWheel':       ['plan', 'code-reviewer'],
    '2_Chadshani':          ['notice-manager', 'code-reviewer', 'database-reviewer', 'security-reviewer'],
    '3_Notifications':      ['notice-manager', 'code-reviewer'],
    '4_RemoteAccess':       ['security-reviewer', 'code-reviewer'],
    '5_StickerBot':         ['code-reviewer', 'general-purpose'],
    '6_Gigiz':              ['architect', 'code-reviewer', 'database-reviewer'],
    '7_WhaleWatcher':       ['architect', 'code-reviewer', 'security-reviewer'],
}

PROJECT_SKILLS = {
    '0_EvolutionSchematic': ['frontend-design', 'e2e-testing', 'update-docs'],
    '1_EmotionWheel':       ['frontend-design', 'e2e-testing'],
    '2_Chadshani':          ['frontend-design', 'e2e-testing', 'tdd-workflow'],
    '3_Notifications':      ['update-docs', 'configure-ecc'],
    '4_RemoteAccess':       ['update-docs'],
    '5_StickerBot':         ['e2e-testing', 'update-docs'],
    '6_Gigiz':              ['frontend-design', 'tdd-workflow', 'e2e-testing'],
    '7_WhaleWatcher':       ['frontend-design', 'tdd-workflow'],
}

def detect_tech_stack(folder):
    stack = set()
    if (folder / 'package.json').exists():
        try:
            pkg = json.loads(read_text(folder / 'package.json'))
            deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
            if 'next' in deps: stack.add('Next.js')
            elif 'react' in deps: stack.add('React')
            if 'typescript' in deps or (folder / 'tsconfig.json').exists(): stack.add('TypeScript')
            if 'tailwindcss' in deps: stack.add('Tailwind')
            if 'express' in deps: stack.add('Express')
            if 'node' not in str(stack).lower(): stack.add('Node.js')
        except Exception:
            stack.add('Node.js')
    if list(folder.rglob('*.py')):
        stack.add('Python')
        if list(folder.rglob('requirements.txt')):
            try:
                reqs = read_text(list(folder.rglob('requirements.txt'))[0]).lower()
                if 'flask' in reqs: stack.add('Flask')
                if 'fastapi' in reqs: stack.add('FastAPI')
                if 'django' in reqs: stack.add('Django')
            except Exception:
                pass
    if list(folder.rglob('*.html')) and not stack:
        stack.add('HTML/JS')
    if (folder / 'go.mod').exists():
        stack.add('Go')
    return sorted(stack)

def detect_status(folder):
    # Check CLAUDE.md for status hint
    claude_md = folder / 'CLAUDE.md'
    if claude_md.exists():
        text = read_text(claude_md).lower()
        if 'complete' in text or 'done' in text: return 'complete'
        if 'pause' in text or 'hold' in text: return 'paused'
    return 'active'

def count_files(folder):
    total = 0
    skip = {'.git', 'node_modules', '__pycache__', '.next', 'dist', 'build', '.venv', 'venv'}
    for item in folder.rglob('*'):
        if item.is_file() and not any(p in item.parts for p in skip):
            total += 1
    return total

def scan_projects():
    result = []
    if not PROJECTS_DIR.exists():
        print(f'[PROJECTS] Dir not found: {PROJECTS_DIR}')
        return result
    for folder in sorted(PROJECTS_DIR.iterdir()):
        if not folder.is_dir():
            continue
        # Match numbered folders: N_Name pattern
        m = re.match(r'^(\d+)_(.+)$', folder.name)
        if not m:
            continue
        proj_id = int(m.group(1))
        known = KNOWN_PROJECTS.get(folder.name, {})
        name = known.get('name', folder.name)
        description = known.get('description', '')
        # Try CLAUDE.md for description
        claude_md = folder / 'CLAUDE.md'
        if claude_md.exists() and not description:
            text = read_text(claude_md)
            for line in text.splitlines():
                line = line.strip()
                if line and not line.startswith('#') and not line.startswith('---'):
                    description = line[:100]
                    break
        tech_stack = detect_tech_stack(folder)
        status = detect_status(folder)
        files_count = count_files(folder)
        # Last modified
        try:
            mtime = max(
                (p.stat().st_mtime for p in folder.rglob('*') if p.is_file()
                 and '.git' not in str(p) and 'node_modules' not in str(p)),
                default=folder.stat().st_mtime
            )
            last_modified = datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()
        except Exception:
            last_modified = None
        result.append({
            'id': proj_id,
            'name': name,
            'folder': folder.name,
            'description': description,
            'tech_stack': tech_stack,
            'status': status,
            'last_modified': last_modified,
            'project_agents': PROJECT_AGENTS.get(folder.name, []),
            'project_skills': PROJECT_SKILLS.get(folder.name, []),
        })
    result.sort(key=lambda p: p['id'])
    print(f'[PROJECTS] Found {len(result)}')
    return result


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    print('[SCAN] Starting system scan...')
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    HIST_DIR.mkdir(parents=True, exist_ok=True)

    snapshot = {
        'generated_at': datetime.now(tz=timezone.utc).isoformat(),
        'version': '1.1',
        'claude_global': {
            'agents':      scan_agents(),
            'skills':      scan_skills(),
            'hooks':       scan_hooks(),
            'modes':       scan_modes(),
            'rules':       scan_rules(),
            'mcp_servers': scan_mcp_servers(),
            'commands':    scan_commands(),
            'memory':      scan_memory(),
        },
        'projects': scan_projects(),
    }

    OUT_FILE.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'[OK] Snapshot written to {OUT_FILE}')

    # History copy
    date_str = datetime.now().strftime('%Y-%m-%d')
    hist_file = HIST_DIR / f'snapshot_{date_str}.json'
    shutil.copy2(OUT_FILE, hist_file)
    print(f'[HIST] History saved: {hist_file.name}')

    # Summary
    g = snapshot['claude_global']
    print(f'\n--- Summary ---')
    print(f'Agents:   {len(g["agents"])}')
    print(f'Skills:   {len(g["skills"])}')
    print(f'Hooks:    {len(g["hooks"])}')
    print(f'Modes:    {len(g["modes"])}')
    print(f'MCPs:     {len(g["mcp_servers"])}')
    print(f'Commands: {len(g["commands"])}')
    print(f'Memory:   {len(g["memory"])}')
    print(f'Projects: {len(snapshot["projects"])}')
    print('---------------\n[SCAN] Complete!')

if __name__ == '__main__':
    main()
