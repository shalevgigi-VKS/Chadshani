import { AreaKey } from './types';

export interface AreaConfig {
  key: AreaKey;
  label: string;
  icon: string;
  color: string;
  description: string;
  hasDueDate: boolean;
  hasAmount: boolean;
  isChecklist: boolean;
}

export const AREAS: Record<AreaKey, AreaConfig> = {
  tasks: {
    key: 'tasks',
    label: 'דברים לעשות',
    icon: '✅',
    color: '#5C6BC0',
    description: 'רשימת משימות משותפת',
    hasDueDate: false,
    hasAmount: false,
    isChecklist: true,
  },
  shopping: {
    key: 'shopping',
    label: 'קניות',
    icon: '🛒',
    color: '#26A69A',
    description: 'רשימת קניות משותפת',
    hasDueDate: false,
    hasAmount: false,
    isChecklist: true,
  },
  vouchers: {
    key: 'vouchers',
    label: 'שוברים',
    icon: '🎟',
    color: '#F5A623',
    description: 'שוברים וקודי הנחה עם תוקף',
    hasDueDate: true,
    hasAmount: false,
    isChecklist: false,
  },
  money: {
    key: 'money',
    label: 'כסף צפוי',
    icon: '💰',
    color: '#4CAF50',
    description: 'החזרים, קרן סיוע, כסף שמגיע',
    hasDueDate: true,
    hasAmount: true,
    isChecklist: false,
  },
  bills: {
    key: 'bills',
    label: 'חשבונות',
    icon: '📋',
    color: '#EF5350',
    description: 'שכירות, חשמל, מים — תשלומים קבועים',
    hasDueDate: true,
    hasAmount: true,
    isChecklist: false,
  },
  goals: {
    key: 'goals',
    label: 'יעדים',
    icon: '🎯',
    color: '#AB47BC',
    description: 'חסכונות ויעדים כספיים',
    hasDueDate: false,
    hasAmount: true,
    isChecklist: false,
  },
  documents: {
    key: 'documents',
    label: 'מסמכים',
    icon: '📄',
    color: '#78909C',
    description: 'תעודות, חוזים, מסמכים חשובים',
    hasDueDate: false,
    hasAmount: false,
    isChecklist: false,
  },
};

export const AREA_LIST: AreaConfig[] = Object.values(AREAS);

// Areas shown in smart "+" sheet, ordered by frequency of use
export const QUICK_ADD_AREAS: AreaKey[] = [
  'tasks', 'shopping', 'vouchers', 'money', 'bills', 'goals', 'documents',
];
