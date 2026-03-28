import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { subscribeToArea, createEntry, updateEntry, deleteEntry } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ShoppingItem } from '@/constants/types';
import { USERS } from '@/constants/users';

export default function ShoppingScreen() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [text, setText]   = useState('');
  const [qty, setQty]     = useState('');
  const [user, setUser]   = useState<'shalo' | 'lee' | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
    return subscribeToArea<ShoppingItem>('shopping', 'createdAt', setItems);
  }, []);

  async function addItem() {
    if (!text.trim() || !user) return;
    await createEntry('shopping', { text: text.trim(), quantity: qty.trim() || undefined, checked: false, createdBy: user, updatedBy: user } as any, user, 'text');
    setText(''); setQty('');
  }

  async function toggle(item: ShoppingItem) {
    if (!user) return;
    await updateEntry('shopping', item.id, item.text, { checked: !item.checked, checkedBy: !item.checked ? user : null }, user, item.checked ? 'uncompleted' : 'completed');
  }

  async function remove(item: ShoppingItem) {
    if (!user) return;
    await deleteEntry('shopping', item.id, item.text, user);
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked   = items.filter((i) => i.checked);

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={[...unchecked, ...checked]}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={<Text style={s.empty}>הרשימה ריקה 🛒</Text>}
        renderItem={({ item }) => (
          <View style={[s.row, item.checked && s.rowChecked]}>
            <TouchableOpacity style={[s.check, item.checked && s.checkDone]} onPress={() => toggle(item)}>
              {item.checked && <Text style={s.checkMark}>✓</Text>}
            </TouchableOpacity>
            <Text style={[s.itemText, item.checked && s.textDone]}>
              {item.text}{item.quantity ? `  ×${item.quantity}` : ''}
            </Text>
            <TouchableOpacity onPress={() => remove(item)}>
              <Text style={s.del}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {checked.length > 0 && (
        <TouchableOpacity style={s.clearBtn} onPress={async () => {
          if (!user) return;
          for (const item of checked) await deleteEntry('shopping', item.id, item.text, user);
        }}>
          <Text style={s.clearText}>🗑 נקה סומנו ({checked.length})</Text>
        </TouchableOpacity>
      )}

      <View style={s.inputRow}>
        <TextInput style={[s.input, { flex: 2 }]} value={text} onChangeText={setText} placeholder="פריט..." />
        <TextInput style={[s.input, { flex: 1 }]} value={qty}  onChangeText={setQty}  placeholder="כמות" keyboardType="numeric" />
        <TouchableOpacity style={s.addBtn} onPress={addItem}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F5F5F5' },
  empty:      { textAlign: 'center', marginTop: 60, color: '#AAA', fontSize: 16 },
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  rowChecked: { opacity: 0.5 },
  check:      { width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: '#26A69A', justifyContent: 'center', alignItems: 'center' },
  checkDone:  { backgroundColor: '#26A69A', borderColor: '#26A69A' },
  checkMark:  { color: '#FFF', fontSize: 14, fontWeight: '700' },
  itemText:   { flex: 1, fontSize: 16, color: '#1A1A1A' },
  textDone:   { textDecorationLine: 'line-through', color: '#AAA' },
  del:        { fontSize: 16, color: '#CCC', padding: 4 },
  clearBtn:   { margin: 16, backgroundColor: '#FFF', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  clearText:  { color: '#E53935', fontWeight: '600' },
  inputRow:   { flexDirection: 'row', padding: 16, gap: 8, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  input:      { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, fontSize: 15 },
  addBtn:     { backgroundColor: '#26A69A', borderRadius: 12, width: 48, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 24 },
});
