const COLORS = {
  bg: '#0A0F1E', surface: '#111827', surface2: '#1E293B',
  border: '#1E3A5F', text: '#F1F5F9', textMuted: '#94A3B8',
  categories: {
    root:        { bg:'#0D1B2A', border:'#38BDF8', text:'#E0F2FE', glow:'#38BDF8', icon:'⬡', label:'Claude Code System' },
    agents:      { bg:'#1C1F26', border:'#6B7280', text:'#D1D5DB', glow:'#9CA3AF', icon:'◈', label:'סוכנים' },
    skills:      { bg:'#1A1040', border:'#8B5CF6', text:'#C4B5FD', glow:'#A78BFA', icon:'◆', label:'סקילים' },
    mcp_servers: { bg:'#0E2040', border:'#3B82F6', text:'#BFDBFE', glow:'#60A5FA', icon:'⬡', label:'MCP שרתים' },
    hooks:       { bg:'#1F1500', border:'#F59E0B', text:'#FDE68A', glow:'#FBBF24', icon:'◉', label:'Hooks' },
    modes:       { bg:'#1A0A2E', border:'#EC4899', text:'#FBCFE8', glow:'#F472B6', icon:'◈', label:'מצבים' },
    rules:       { bg:'#161200', border:'#CA8A04', text:'#FEF08A', glow:'#EAB308', icon:'◇', label:'כללים' },
    memory:      { bg:'#041F14', border:'#10B981', text:'#A7F3D0', glow:'#34D399', icon:'◎', label:'זיכרון' },
    commands:    { bg:'#1A0A00', border:'#F97316', text:'#FED7AA', glow:'#FB923C', icon:'▶', label:'פקודות' },
    projects:    { bg:'#041828', border:'#0EA5E9', text:'#BAE6FD', glow:'#38BDF8', icon:'◱', label:'פרויקטים' },
    frontend:    { bg:'#130E2E', border:'#A78BFA', text:'#EDE9FE', glow:'#C4B5FD', icon:'◻', label:'Frontend' },
    backend:     { bg:'#0A1830', border:'#60A5FA', text:'#DBEAFE', glow:'#93C5FD', icon:'◻', label:'Backend' },
    automation:  { bg:'#041A12', border:'#34D399', text:'#D1FAE5', glow:'#6EE7B7', icon:'◻', label:'Automation' },
    config:      { bg:'#161000', border:'#FBBF24', text:'#FEF3C7', glow:'#FDE68A', icon:'◻', label:'Config' },
    database:    { bg:'#140A2E', border:'#C084FC', text:'#F3E8FF', glow:'#D8B4FE', icon:'◻', label:'Database' },
  },
  projectColors: ['#0EA5E9','#8B5CF6','#10B981','#F59E0B','#EC4899','#3B82F6','#F97316','#06B6D4'],
  getCategory(cat) { return this.categories[cat] || this.categories.root; }
};
