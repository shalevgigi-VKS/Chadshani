import { UserId } from './types';

export interface UserConfig {
  id: UserId;
  displayName: string;
  color: string;
  avatar: string;
}

export const USERS: Record<UserId, UserConfig> = {
  shalo: { id: 'shalo', displayName: 'שלו',  color: '#4F86F7', avatar: '👨' },
  lee:   { id: 'lee',   displayName: 'לי',   color: '#F74F86', avatar: '👩' },
};

export const USER_LIST: UserConfig[] = Object.values(USERS);
