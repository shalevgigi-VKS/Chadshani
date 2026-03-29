const COLORS = {
  bg: '#0A0F1E', surface: '#111827', surface2: '#1E293B',
  border: '#1E3A5F', text: '#F1F5F9', textMuted: '#94A3B8',
  categories: {
    root:        { bg:'#0D1B2A', border:'#38BDF8', text:'#E0F2FE', glow:'#38BDF8', icon:'⬡', label:'Claude Code System' },
    agents:      { bg:'#1C1F26', border:'#8B93A8', text:'#D1D5DB', glow:'#A8B2C8', icon:'◈', label:'סוכנים' },
    skills:      { bg:'#2A0A0A', border:'#EF4444', text:'#FCA5A5', glow:'#F87171', icon:'◆', label:'סקילים' },
    mcp_servers: { bg:'#0E2040', border:'#60A5FA', text:'#BFDBFE', glow:'#93C5FD', icon:'⬡', label:'MCP שרתים' },
    hooks:       { bg:'#1F1500', border:'#FBBF24', text:'#FDE68A', glow:'#FCD34D', icon:'◉', label:'Hooks' },
    modes:       { bg:'#1A0A2E', border:'#F472B6', text:'#FBCFE8', glow:'#F9A8D4', icon:'◈', label:'מצבים' },
    rules:       { bg:'#161200', border:'#EAB308', text:'#FEF08A', glow:'#FDE047', icon:'◇', label:'כללים' },
    memory:      { bg:'#041F14', border:'#34D399', text:'#A7F3D0', glow:'#6EE7B7', icon:'◎', label:'זיכרון' },
    commands:    { bg:'#1A0A00', border:'#FB923C', text:'#FED7AA', glow:'#FDBA74', icon:'▶', label:'פקודות' },
    projects:    { bg:'#041828', border:'#0EA5E9', text:'#BAE6FD', glow:'#38BDF8', icon:'◱', label:'פרויקטים' },
    frontend:    { bg:'#130E2E', border:'#A78BFA', text:'#EDE9FE', glow:'#C4B5FD', icon:'◻', label:'Frontend' },
    backend:     { bg:'#0A1830', border:'#60A5FA', text:'#DBEAFE', glow:'#93C5FD', icon:'◻', label:'Backend' },
    automation:  { bg:'#041A12', border:'#34D399', text:'#D1FAE5', glow:'#6EE7B7', icon:'◻', label:'Automation' },
    config:      { bg:'#161000', border:'#FBBF24', text:'#FEF3C7', glow:'#FDE68A', icon:'◻', label:'Config' },
    database:    { bg:'#140A2E', border:'#C084FC', text:'#F3E8FF', glow:'#D8B4FE', icon:'◻', label:'Database' },
  },
  projectColors: ['#0EA5E9','#EF4444','#10B981','#F59E0B','#EC4899','#8B5CF6','#FB923C','#06B6D4'],
  getCategory(cat) { return this.categories[cat] || this.categories.root; }
};
