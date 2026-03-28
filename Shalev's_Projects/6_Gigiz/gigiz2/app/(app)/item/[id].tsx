import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateEntry, deleteEntry, subscribeToDocLocal } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { AnyItem, AreaKey } from '@/constants/types';
import { AREAS } from '@/constants/areas';
import { format } from 'date-fns';

const OFFLINE = process.env.EXPO_PUBLIC_OFFLINE_MODE === 'true';

export default function ItemScreen() {
  const { id, area: areaParam } = useLocalSearchParams<{ id: string; area: string }>();
  const area = (areaParam ?? 'vouchers') as AreaKey;
  const cfg  = AREAS[area];

  const [item, setItem]     = useState<AnyItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle]   = useState('');
  const [desc, setDesc]     = useState('');

  useEffect(() => {
    if (!id || !area) return;
    if (OFFLINE) {
      return subscribeToDocLocal(area as AreaKey, id, (doc) => {
        if (doc) setItem(doc);
      });
    }
    return onSnapshot(doc(db, area, id), (snap) => {
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() } as AnyItem);
    });
  }, [id, area]);

  if (!item) return null;

  const titleField = (item as any).title ?? (item as any).text ?? '';
  const descField  = (item as any).description ?? (item as any).notes ?? '';

  async function getUser() {
    const u = await getCurrentUser();
    if (!u) { router.replace('/'); return null; }
    return u;
  }

  async function handleSaveEdit() {
    const u = await getUser(); if (!u) return;
    await updateEntry(area, item!.id, title, { title: title.trim(), description: desc.trim() || undefined }, u);
    setEditing(false);
  }

  async function handleDelete() {
    Alert.alert('מחיקה', `למחוק?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק', style: 'destructive',
        onPress: async () => {
          const u = await getUser(); if (!u) return;
          await deleteEntry(area, item!.id, titleField, u);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 24, gap: 16 }}>
      <View style={s.header}>
        <Text style={s.areaIcon}>{cfg.icon}</Text>
        <Text style={s.areaLabel}>{cfg.label}</Text>
      </View>

      {editing ? (
        <>
          <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="שם" />
          <TextInput style={s.input} value={desc}  onChangeText={setDesc}  placeholder="תיאור" multiline />
          <TouchableOpacity style={s.btn} onPress={handleSaveEdit}>
            <Text style={s.btnText}>שמור</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancel} onPress={() => setEditing(false)}>
            <Text style={s.cancelText}>ביטול</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={s.title}>{titleField}</Text>
          {descField ? <Text style={s.desc}>{descField}</Text> : null}

          {(item as any).code && (
            <View style={s.codeBox}>
              <Text style={s.codeLabel}>קוד:</Text>
              <Text style={s.code}>{(item as any).code}</Text>
            </View>
          )}
          {(item as any).amount !== undefined && (
            <Text style={s.amount}>₪{(item as any).amount?.toLocaleString('he-IL')}</Text>
          )}
          {(item as any).expiresAt && (
            <Text style={s.date}>תוקף: {format((item as any).expiresAt.toDate(), 'dd/MM/yyyy')}</Text>
          )}
          {(item as any).nextDueAt && (
            <Text style={s.date}>תשלום הבא: {format((item as any).nextDueAt.toDate(), 'dd/MM/yyyy')}</Text>
          )}

          <TouchableOpacity style={s.btnOutline} onPress={() => { setTitle(titleField); setDesc(descField); setEditing(true); }}>
            <Text style={s.btnOutlineText}>עריכה</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { backgroundColor: '#E53935' }]} onPress={handleDelete}>
            <Text style={s.btnText}>מחיקה</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#FAFAFA' },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  areaIcon:     { fontSize: 28 },
  areaLabel:    { fontSize: 16, fontWeight: '600', color: '#888' },
  title:        { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  desc:         { fontSize: 15, color: '#666' },
  codeBox:      { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12 },
  codeLabel:    { color: '#888', fontSize: 13 },
  code:         { fontSize: 18, fontWeight: '800', color: '#F5A623', fontFamily: 'monospace' },
  amount:       { fontSize: 26, fontWeight: '800', color: '#4CAF50' },
  date:         { fontSize: 14, color: '#888' },
  input:        { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 14, padding: 14, fontSize: 16 },
  btn:          { backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnText:      { color: '#FFF', fontSize: 17, fontWeight: '700' },
  btnOutline:   { borderWidth: 1.5, borderColor: '#1A1A1A', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnOutlineText: { color: '#1A1A1A', fontSize: 17, fontWeight: '700' },
  cancel:       { alignItems: 'center', padding: 12 },
  cancelText:   { color: '#999', fontSize: 15 },
});
