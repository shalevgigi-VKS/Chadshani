import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { verifyPin, isPinVerified, ensureAuth, getCurrentUser, setCurrentUser } from '../lib/auth';
import { registerPushToken } from '../lib/notifications';
import { runStartupTasks } from '../lib/startup';
import { USER_LIST } from '../constants/users';
import { UserId } from '../constants/types';

export default function PinScreen() {
  const [pin, setPin]     = useState('');
  const [pinOk, setPinOk] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const verified = await isPinVerified();
      const user     = await getCurrentUser();
      if (verified && user) router.replace('/(app)/home');
      else if (verified) setPinOk(true);
      setLoading(false);
    })();
  }, []);

  async function handlePin() {
    const ok = await verifyPin(pin);
    if (!ok) { Alert.alert('קוד שגוי'); setPin(''); return; }
    await ensureAuth();
    setPinOk(true);
  }

  async function handleUser(id: UserId) {
    await setCurrentUser(id);
    await registerPushToken(id);
    runStartupTasks().catch(() => null);
    router.replace('/(app)/home');
  }

  if (loading) return null;

  return (
    <View style={s.container}>
      <Text style={s.logo}>💰</Text>
      <Text style={s.appName}>גיגיז</Text>

      {!pinOk ? (
        <>
          <TextInput
            style={s.input} value={pin} onChangeText={setPin}
            secureTextEntry keyboardType="numeric"
            placeholder="קוד כניסה" textAlign="center" maxLength={8}
          />
          <TouchableOpacity style={s.btn} onPress={handlePin}>
            <Text style={s.btnText}>כניסה</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={s.subtitle}>מי נכנס?</Text>
          {USER_LIST.map((u) => (
            <TouchableOpacity
              key={u.id}
              style={[s.btn, { backgroundColor: u.color }]}
              onPress={() => handleUser(u.id)}
            >
              <Text style={s.btnText}>{u.avatar} {u.displayName}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32, backgroundColor: '#FAFAFA' },
  logo:      { fontSize: 64 },
  appName:   { fontSize: 36, fontWeight: '800', color: '#1A1A1A', letterSpacing: -1, marginBottom: 8 },
  subtitle:  { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  input:     { width: '100%', borderWidth: 1.5, borderColor: '#DDD', borderRadius: 14, padding: 16, fontSize: 22, backgroundColor: '#FFF' },
  btn:       { width: '100%', backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnText:   { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
