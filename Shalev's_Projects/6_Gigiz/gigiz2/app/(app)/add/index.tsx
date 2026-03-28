import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Timestamp } from 'firebase/firestore';
import { createEntry } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { uploadDocument } from '@/lib/storage';
import { calcNextDueDate } from '@/lib/recurring';
import { AREAS } from '@/constants/areas';
import { AreaKey } from '@/constants/types';

function parseDate(str: string): Timestamp | null {
  const [d, m, y] = str.split('/').map(Number);
  if (!d || !m || !y) return null;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : Timestamp.fromDate(dt);
}

export default function AddScreen() {
  const { area: areaParam } = useLocalSearchParams<{ area: string }>();
  const area = (areaParam ?? 'tasks') as AreaKey;
  const cfg  = AREAS[area];

  const [title, setTitle]         = useState('');
  const [description, setDesc]    = useState('');
  const [code, setCode]           = useState('');
  const [amount, setAmount]       = useState('');
  const [source, setSource]       = useState('');
  const [dueDate, setDueDate]     = useState('');
  const [recurDay, setRecurDay]   = useState('1');
  const [isRecur, setIsRecur]     = useState(area === 'bills');
  const [targetAmt, setTargetAmt] = useState('');
  const [savedAmt, setSavedAmt]   = useState('0');
  const [tags, setTags]           = useState('');
  const [fileUri, setFileUri]     = useState<string | null>(null);
  const [fileType, setFileType]   = useState<'image' | 'pdf'>('image');
  const [saving, setSaving]       = useState(false);

  async function pickImage() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!r.canceled) { setFileUri(r.assets[0].uri); setFileType('image'); }
  }
  async function pickPDF() {
    const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!r.canceled) { setFileUri(r.assets[0].uri); setFileType('pdf'); }
  }

  async function handleSave() {
    const user = await getCurrentUser();
    if (!user) { router.replace('/'); return; }

    // Validation
    if (area !== 'tasks' && area !== 'shopping' && !title.trim()) {
      Alert.alert('שגיאה', 'שם חובה'); return;
    }
    if (area === 'documents' && !fileUri) {
      Alert.alert('שגיאה', 'יש לבחור קובץ'); return;
    }

    setSaving(true);
    try {
      if (area === 'documents') {
        const storageUrl = await uploadDocument(fileUri!, user, fileType);
        await createEntry('documents', {
          title: title.trim(), description: description.trim() || undefined,
          fileType, storageUrl,
          expiresAt: dueDate ? parseDate(dueDate) ?? undefined : undefined,
          tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
          createdBy: user, updatedBy: user,
        } as any, user);
      } else if (area === 'bills') {
        const day = parseInt(recurDay, 10);
        await createEntry('bills', {
          title: title.trim(), description: description.trim() || undefined,
          amount: amount ? parseFloat(amount) : undefined,
          recurringDayOfMonth: day,
          nextDueAt: calcNextDueDate(day),
          status: 'active', createdBy: user, updatedBy: user,
        } as any, user);
      } else if (area === 'money') {
        const due = parseDate(dueDate);
        if (!due) { Alert.alert('שגיאה', 'תאריך לא תקין'); setSaving(false); return; }
        await createEntry('money', {
          title: title.trim(), source: source.trim(),
          amount: parseFloat(amount) || 0,
          expectedAt: due, status: 'pending', notes: description.trim() || undefined,
          createdBy: user, updatedBy: user,
        } as any, user);
      } else if (area === 'vouchers') {
        const due = parseDate(dueDate);
        if (!due) { Alert.alert('שגיאה', 'תאריך לא תקין'); setSaving(false); return; }
        await createEntry('vouchers', {
          title: title.trim(), code: code.trim() || undefined,
          description: description.trim() || undefined,
          expiresAt: due, status: 'active',
          createdBy: user, updatedBy: user,
        } as any, user);
      } else if (area === 'goals') {
        await createEntry('goals', {
          title: title.trim(), notes: description.trim() || undefined,
          targetAmount: parseFloat(targetAmt) || 0,
          savedAmount: parseFloat(savedAmt) || 0,
          targetDate: dueDate ? parseDate(dueDate) ?? undefined : undefined,
          createdBy: user, updatedBy: user,
        } as any, user);
      }
      router.back();
    } catch (e) {
      Alert.alert('שגיאה', 'שמירה נכשלה');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 24, gap: 14 }}>
      <Text style={s.heading}>{cfg.icon} {cfg.label}</Text>

      {area !== 'tasks' && area !== 'shopping' && (
        <TextInput style={s.input} placeholder="שם *" value={title} onChangeText={setTitle} />
      )}

      {(area === 'vouchers' || area === 'money' || area === 'bills' || area === 'goals' || area === 'documents') && (
        <TextInput style={s.input} placeholder="תיאור (אופציונלי)" value={description} onChangeText={setDesc} multiline />
      )}

      {area === 'vouchers' && (
        <TextInput style={s.input} placeholder="קוד שובר" value={code} onChangeText={setCode} autoCapitalize="characters" />
      )}

      {area === 'money' && (
        <>
          <TextInput style={s.input} placeholder="מקור (קרן סיוע, מיסים...)" value={source} onChangeText={setSource} />
          <TextInput style={s.input} placeholder="סכום ב-₪" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        </>
      )}

      {area === 'goals' && (
        <>
          <TextInput style={s.input} placeholder="יעד כסף ב-₪" value={targetAmt} onChangeText={setTargetAmt} keyboardType="numeric" />
          <TextInput style={s.input} placeholder="כבר חסכנו ₪" value={savedAmt} onChangeText={setSavedAmt} keyboardType="numeric" />
        </>
      )}

      {area === 'bills' && (
        <>
          <TextInput style={s.input} placeholder="סכום משוער ₪ (אופציונלי)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
          <View style={s.row}>
            <Text style={s.label}>חוזר כל חודש</Text>
            <Switch value={isRecur} onValueChange={setIsRecur} />
          </View>
          <TextInput style={s.input} placeholder="יום בחודש (1–28)" value={recurDay} onChangeText={setRecurDay} keyboardType="numeric" maxLength={2} />
        </>
      )}

      {(area === 'vouchers' || area === 'money' || area === 'goals') && (
        <TextInput style={s.input} placeholder="תאריך — dd/MM/yyyy" value={dueDate} onChangeText={setDueDate} keyboardType="numeric" />
      )}

      {area === 'documents' && (
        <>
          <View style={s.row}>
            <TouchableOpacity style={[s.fileBtn, { backgroundColor: '#E3F2FD' }]} onPress={pickImage}>
              <Text style={s.fileBtnText}>📷 בחר תמונה</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.fileBtn, { backgroundColor: '#FFEBEE' }]} onPress={pickPDF}>
              <Text style={s.fileBtnText}>📎 בחר PDF</Text>
            </TouchableOpacity>
          </View>
          {fileUri && <Text style={s.fileOk}>✓ קובץ נבחר ({fileType})</Text>}
          <TextInput style={s.input} placeholder="תוקף תעודה (אופציונלי) dd/MM/yyyy" value={dueDate} onChangeText={setDueDate} keyboardType="numeric" />
          <TextInput style={s.input} placeholder="תגיות מופרדות בפסיק (תעודה, חוזה...)" value={tags} onChangeText={setTags} />
        </>
      )}

      <TouchableOpacity style={[s.btn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
        <Text style={s.btnText}>{saving ? 'שומר...' : 'שמור'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.cancel} onPress={() => router.back()}>
        <Text style={s.cancelText}>ביטול</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#FAFAFA' },
  heading:    { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  input:      { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 14, padding: 14, fontSize: 16 },
  row:        { flexDirection: 'row', gap: 12, alignItems: 'center' },
  label:      { flex: 1, fontSize: 16, color: '#1A1A1A' },
  fileBtn:    { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  fileBtnText: { fontWeight: '700', fontSize: 15 },
  fileOk:     { color: '#4CAF50', fontSize: 14, fontWeight: '600' },
  btn:        { backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnText:    { color: '#FFF', fontSize: 17, fontWeight: '700' },
  cancel:     { alignItems: 'center', padding: 12 },
  cancelText: { color: '#999', fontSize: 15 },
});
