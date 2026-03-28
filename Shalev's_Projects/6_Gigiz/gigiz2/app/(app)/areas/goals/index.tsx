import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { subscribeToArea } from '@/lib/db';
import { GoalItem } from '@/constants/types';

function ProgressBar({ saved, target }: { saved: number; target: number }) {
  const pct = Math.min((saved / target) * 100, 100);
  return (
    <View style={p.track}>
      <View style={[p.fill, { width: `${pct}%` }]} />
    </View>
  );
}
const p = StyleSheet.create({
  track: { height: 8, backgroundColor: '#EEE', borderRadius: 4, overflow: 'hidden' },
  fill:  { height: 8, backgroundColor: '#AB47BC', borderRadius: 4 },
});

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<GoalItem[]>([]);
  useEffect(() => subscribeToArea<GoalItem>('goals', 'createdAt', setItems), []);

  return (
    <View style={s.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<Text style={s.empty}>אין יעדים עדיין 🎯</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => router.push(`/(app)/item/${item.id}?area=goals`)}>
            <View style={s.top}>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.pct}>{Math.round((item.savedAmount / item.targetAmount) * 100)}%</Text>
            </View>
            <ProgressBar saved={item.savedAmount} target={item.targetAmount} />
            <Text style={s.amounts}>
              ₪{item.savedAmount.toLocaleString('he-IL')} מתוך ₪{item.targetAmount.toLocaleString('he-IL')}
            </Text>
            {item.notes && <Text style={s.notes}>{item.notes}</Text>}
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={[s.fab, { bottom: (insets.bottom || 0) + 28 }]} onPress={() => router.push('/(app)/add?area=goals')}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  empty:     { textAlign: 'center', marginTop: 60, color: '#AAA', fontSize: 16 },
  card:      { backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  top:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:     { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  pct:       { fontSize: 16, fontWeight: '800', color: '#AB47BC' },
  amounts:   { fontSize: 13, color: '#666' },
  notes:     { fontSize: 12, color: '#999' },
  fab:       { position: 'absolute', bottom: 28, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#AB47BC', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  fabText:   { color: '#FFF', fontSize: 32, lineHeight: 36 },
});
