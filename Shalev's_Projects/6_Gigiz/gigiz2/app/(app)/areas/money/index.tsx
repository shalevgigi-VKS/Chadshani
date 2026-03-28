import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { subscribeToArea, updateEntry } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { MoneyItem } from '@/constants/types';
import { format } from 'date-fns';
import { USERS } from '@/constants/users';

export default function MoneyScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<MoneyItem[]>([]);
  const [user, setUser]   = useState<'shalo' | 'lee' | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
    return subscribeToArea<MoneyItem>('money', 'expectedAt', setItems);
  }, []);

  async function markReceived(item: MoneyItem) {
    if (!user) return;
    await updateEntry('money', item.id, item.title,
      { status: 'received', receivedBy: user, receivedAt: new Date() },
      user, 'received',
    );
  }

  const pending  = items.filter((i) => i.status === 'pending');
  const received = items.filter((i) => i.status === 'received');

  const totalPending = pending.reduce((sum, i) => sum + (i.amount ?? 0), 0);

  function renderItem({ item }: { item: MoneyItem }) {
    const isDone = item.status === 'received';
    return (
      <TouchableOpacity
        style={[s.card, isDone && s.cardDone]}
        onPress={() => router.push(`/(app)/item/${item.id}?area=money`)}
      >
        <View style={s.top}>
          <Text style={s.title}>{item.title}</Text>
          <Text style={[s.amount, isDone && { color: '#AAA' }]}>
            ₪{item.amount.toLocaleString('he-IL')}
          </Text>
        </View>

        <Text style={s.source}>מקור: {item.source}</Text>
        <Text style={s.date}>
          {isDone ? `התקבל ב-${format(item.receivedAt!.toDate(), 'dd/MM/yyyy')} ע"י ${USERS[item.receivedBy!]?.displayName}` : `צפוי ב-${format(item.expectedAt.toDate(), 'dd/MM/yyyy')}`}
        </Text>

        {item.notes && <Text style={s.notes}>{item.notes}</Text>}

        {!isDone && (
          <TouchableOpacity style={s.receivedBtn} onPress={() => markReceived(item)}>
            <Text style={s.receivedBtnText}>✓ התקבל</Text>
          </TouchableOpacity>
        )}
        {isDone && (
          <View style={s.doneBadge}><Text style={s.doneText}>✓ התקבל</Text></View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.container}>
      {totalPending > 0 && (
        <View style={s.summary}>
          <Text style={s.summaryLabel}>סה״כ צפוי להגיע</Text>
          <Text style={s.summaryAmount}>₪{totalPending.toLocaleString('he-IL')}</Text>
        </View>
      )}
      <FlatList
        data={[...pending, ...received]}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={s.empty}>אין כסף צפוי כרגע 💰</Text>}
      />
      <TouchableOpacity style={[s.fab, { bottom: (insets.bottom || 0) + 28 }]} onPress={() => router.push('/(app)/add?area=money')}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F5F5F5' },
  empty:          { textAlign: 'center', marginTop: 60, color: '#AAA', fontSize: 16 },
  summary:        { margin: 16, marginBottom: 0, backgroundColor: '#E8F5E9', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel:   { fontSize: 14, color: '#2A7A2A', fontWeight: '600' },
  summaryAmount:  { fontSize: 22, color: '#2A7A2A', fontWeight: '800' },
  card:           { backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardDone:       { opacity: 0.55 },
  top:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:          { fontSize: 16, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  amount:         { fontSize: 20, fontWeight: '800', color: '#4CAF50' },
  source:         { fontSize: 13, color: '#666' },
  date:           { fontSize: 12, color: '#999' },
  notes:          { fontSize: 13, color: '#888', fontStyle: 'italic' },
  receivedBtn:    { backgroundColor: '#4CAF50', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 4 },
  receivedBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  doneBadge:      { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 10, alignItems: 'center' },
  doneText:       { color: '#2A7A2A', fontWeight: '700', fontSize: 14 },
  fab:            { position: 'absolute', bottom: 28, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  fabText:        { color: '#FFF', fontSize: 32, lineHeight: 36 },
});
