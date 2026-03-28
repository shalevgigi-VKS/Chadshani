import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { serverTimestamp } from 'firebase/firestore';
import { subscribeToArea, createEntry, updateEntry, deleteEntry } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { TaskItem } from '@/constants/types';
import { USERS } from '@/constants/users';

export default function TasksScreen() {
  const [items, setItems]   = useState<TaskItem[]>([]);
  const [text, setText]     = useState('');
  const [user, setUser]     = useState<'shalo' | 'lee' | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
    return subscribeToArea<TaskItem>('tasks', 'createdAt', setItems);
  }, []);

  async function addTask() {
    if (!text.trim() || !user) return;
    await createEntry('tasks', { text: text.trim(), done: false, createdBy: user, updatedBy: user } as any, user, 'text');
    setText('');
  }

  async function toggleDone(item: TaskItem) {
    if (!user) return;
    await updateEntry(
      'tasks', item.id, item.text,
      { done: !item.done, doneBy: !item.done ? user : null, doneAt: !item.done ? serverTimestamp() : null },
      user, item.done ? 'uncompleted' : 'completed',
    );
  }

  async function removeTask(item: TaskItem) {
    if (!user) return;
    await deleteEntry('tasks', item.id, item.text, user);
  }

  const pending  = items.filter((i) => !i.done);
  const done     = items.filter((i) => i.done);

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={[...pending, ...done]}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={<Text style={s.empty}>אין משימות — כל הכבוד! 🎉</Text>}
        renderItem={({ item }) => (
          <View style={[s.row, item.done && s.rowDone]}>
            <TouchableOpacity style={[s.check, item.done && s.checked]} onPress={() => toggleDone(item)}>
              {item.done && <Text style={s.checkMark}>✓</Text>}
            </TouchableOpacity>
            <View style={s.rowText}>
              <Text style={[s.taskText, item.done && s.taskDone]}>{item.text}</Text>
              {item.done && item.doneBy && (
                <Text style={s.byText}>בוצע ע"י {USERS[item.doneBy]?.displayName}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => removeTask(item)}>
              <Text style={s.del}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={s.inputRow}>
        <TextInput
          style={s.input} value={text} onChangeText={setText}
          placeholder="משימה חדשה..." onSubmitEditing={addTask} returnKeyType="done"
        />
        <TouchableOpacity style={s.addBtn} onPress={addTask}>
          <Text style={s.addBtnText}>הוסף</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  empty:     { textAlign: 'center', marginTop: 60, color: '#AAA', fontSize: 16 },
  row:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  rowDone:   { opacity: 0.55 },
  check:     { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#5C6BC0', justifyContent: 'center', alignItems: 'center' },
  checked:   { backgroundColor: '#5C6BC0', borderColor: '#5C6BC0' },
  checkMark: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  rowText:   { flex: 1 },
  taskText:  { fontSize: 16, color: '#1A1A1A' },
  taskDone:  { textDecorationLine: 'line-through', color: '#AAA' },
  byText:    { fontSize: 11, color: '#AAA', marginTop: 2 },
  del:       { fontSize: 16, color: '#CCC', padding: 4 },
  inputRow:  { flexDirection: 'row', padding: 16, gap: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  input:     { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, fontSize: 16 },
  addBtn:    { backgroundColor: '#5C6BC0', borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
