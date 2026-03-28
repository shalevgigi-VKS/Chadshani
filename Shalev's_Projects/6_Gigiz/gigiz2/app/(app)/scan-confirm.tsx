import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { createEntry } from '../../lib/db';
import { getCurrentUser } from '../../lib/auth';
import { uploadDocument } from '../../lib/storage';
import { compressForStorage } from '../../lib/imageCompress';
import { ScanResult } from '../../lib/gemini';
import { AREAS } from '../../constants/areas';
import { AreaKey } from '../../constants/types';

function parseDate(str: string | null): Timestamp | null {
  if (!str) return null;
  const [d, m, y] = str.split('/').map(Number);
  if (!d || !m || !y) return null;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : Timestamp.fromDate(dt);
}

export default function ScanConfirmScreen() {
  const { originalUri, result: resultParam } = useLocalSearchParams<{
    originalUri: string;
    result: string;
  }>();

  const scanResult: ScanResult = JSON.parse(resultParam ?? '{}');

  const [title, setTitle]       = useState(scanResult.title ?? '');
  const [area, setArea]         = useState<AreaKey>(scanResult.suggestedArea as AreaKey ?? 'documents');
  const [saving, setSaving]     = useState(false);

  async function handleSave(saveImage: boolean) {
    const user = await getCurrentUser();
    if (!user) { router.replace('/'); return; }

    setSaving(true);
    try {
      let storageUrl: string | undefined;

      if (saveImage) {
        const compressed = await compressForStorage(originalUri);
        storageUrl = await uploadDocument(compressed, user, 'image');
      }

      // Build entry based on destination area
      if (area === 'bills') {
        await createEntry('bills', {
          title: title.trim(),
          amount: scanResult.amount ?? undefined,
          recurringDayOfMonth: parseDate(scanResult.dueDate)?.toDate().getDate() ?? 1,
          nextDueAt: parseDate(scanResult.dueDate) ?? Timestamp.now(),
          status: 'active',
          createdBy: user, updatedBy: user,
        } as any, user);
      } else if (area === 'vouchers') {
        await createEntry('vouchers', {
          title: title.trim(),
          code: scanResult.code ?? undefined,
          expiresAt: parseDate(scanResult.dueDate) ?? Timestamp.now(),
          status: 'active',
          createdBy: user, updatedBy: user,
        } as any, user);
      } else if (area === 'money') {
        await createEntry('money', {
          title: title.trim(),
          amount: scanResult.amount ?? 0,
          source: scanResult.vendor ?? '',
          expectedAt: parseDate(scanResult.dueDate) ?? Timestamp.now(),
          status: 'pending',
          createdBy: user, updatedBy: user,
        } as any, user);
      } else {
        // documents (default)
        await createEntry('documents', {
          title: title.trim(),
          fileType: 'image',
          storageUrl: storageUrl ?? '',
          expiresAt: parseDate(scanResult.dueDate) ?? undefined,
          createdBy: user, updatedBy: user,
        } as any, user);
      }

      router.replace(`/(app)/areas/${area}`);
    } catch (e) {
      Alert.alert('שגיאה', 'השמירה נכשלה');
    } finally {
      setSaving(false);
    }
  }

  const areaCfg = AREAS[area];

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={s.heading}>✅ זוהה בהצלחה</Text>

      <Image source={{ uri: originalUri }} style={s.thumb} />

      {/* Detected fields */}
      <View style={s.card}>
        <Row label="סוג" value={scanResult.type} />
        {scanResult.vendor   && <Row label="ספק"    value={scanResult.vendor} />}
        {scanResult.amount   && <Row label="סכום"   value={`₪${scanResult.amount}`} />}
        {scanResult.date     && <Row label="תאריך"  value={scanResult.date} />}
        {scanResult.dueDate  && <Row label="לתשלום" value={scanResult.dueDate} />}
        {scanResult.code     && <Row label="קוד"    value={scanResult.code} />}
      </View>

      {/* Title */}
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="כותרת לשמירה" />

      {/* Area selector */}
      <Text style={s.label}>שמור ב:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={s.areaRow}>
          {(['bills', 'vouchers', 'money', 'documents'] as AreaKey[]).map((k) => (
            <TouchableOpacity
              key={k}
              style={[s.areaChip, area === k && { backgroundColor: AREAS[k].color }]}
              onPress={() => setArea(k)}
            >
              <Text style={[s.areaChipText, area === k && { color: '#FFF' }]}>
                {AREAS[k].icon} {AREAS[k].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Save options */}
      <TouchableOpacity
        style={[s.btn, saving && { opacity: 0.5 }]}
        onPress={() => handleSave(true)}
        disabled={saving}
      >
        <Text style={s.btnText}>💾 שמור + שמור תמונה מכווצת</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.btn, { backgroundColor: '#555' }, saving && { opacity: 0.5 }]}
        onPress={() => handleSave(false)}
        disabled={saving}
      >
        <Text style={s.btnText}>📝 שמור נתונים בלבד (מחק תמונה)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.cancel} onPress={() => router.back()}>
        <Text style={s.cancelText}>ביטול</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={r.row}>
      <Text style={r.label}>{label}</Text>
      <Text style={r.value}>{value}</Text>
    </View>
  );
}

const r = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  label: { fontSize: 14, color: '#888' },
  value: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', flex: 1, textAlign: 'left', marginLeft: 16 },
});

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#FAFAFA' },
  heading:      { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  thumb:        { width: '100%', height: 180, borderRadius: 14, resizeMode: 'cover' },
  card:         { backgroundColor: '#FFF', borderRadius: 14, padding: 16, gap: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  input:        { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 14, padding: 14, fontSize: 16 },
  label:        { fontSize: 14, fontWeight: '600', color: '#555' },
  areaRow:      { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  areaChip:     { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#EEE' },
  areaChipText: { fontSize: 14, fontWeight: '600', color: '#555' },
  btn:          { backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnText:      { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancel:       { alignItems: 'center', padding: 12 },
  cancelText:   { color: '#999', fontSize: 15 },
});
