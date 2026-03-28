import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';
import { UserId } from '../constants/types';

const PIN_KEY  = 'gigiz_pin_ok';
const USER_KEY = 'gigiz_user';
const PIN      = process.env.EXPO_PUBLIC_APP_PIN ?? '';

export async function verifyPin(input: string): Promise<boolean> {
  if (input !== PIN) return false;
  await AsyncStorage.setItem(PIN_KEY, '1');
  return true;
}

export async function isPinVerified(): Promise<boolean> {
  return (await AsyncStorage.getItem(PIN_KEY)) === '1';
}

export async function ensureAuth(): Promise<void> {
  if (process.env.EXPO_PUBLIC_OFFLINE_MODE === 'true') return;
  if (!auth.currentUser) await signInAnonymously(auth);
}

export async function setCurrentUser(id: UserId): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, id);
}

export async function getCurrentUser(): Promise<UserId | null> {
  const v = await AsyncStorage.getItem(USER_KEY);
  return v === 'shalo' || v === 'lee' ? v : null;
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([PIN_KEY, USER_KEY]);
}
