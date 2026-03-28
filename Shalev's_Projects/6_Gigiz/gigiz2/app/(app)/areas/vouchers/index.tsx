import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { subscribeToArea, updateEntry } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { VoucherItem } from '@/constants/types';
import { format } from 'date-fns';
import { differenceInDays } from 'date-fns';

function UrgencyBar({ expiresAt }: { expiresAt: Date }) {
  const days = differenceInDays(expiresAt, new Date());
  if (days > 7) return null;
  const color = days <= 1 ? '#E53935' : '#FF6F00';
  const label = days < 0 ? 'פג תוקף' : days === 0 ? 'פג היום!' : days === 1 ? 'נגמר מחר' : `עוד ${days} ימים`;
  return (
    <View style={[u.bar, { backgroundColor: color + '22' }]}>
      <Text style={[u.text, { color }]}>{label}</Text>
    </View>
  );
}
const u = StyleSheet.create({
  bar:  { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '700' },
});

export default function VouchersScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<VoucherItem[]>([]);
  const [user, setUser]   = useState<'shalo' | 'lee' | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
    return subscribeToArea<VoucherItem>('vouchers', 'expiresAt', setItems);
  }, []);

  const active  = items.filter((i) => i.status === 'active');
  const used    = items.filter((i) => i.status === 'used' || i.status === 'expired');

  async function markUsed(item: VoucherItem) {
    if (!user) return;
    await updateEntry('vouchers', item.id, item.title,
      { status: 'used', usedBy: user, usedAt: new Date() },
      user, 'used',
    );
  }

  function renderItem({ item }: { item: VoucherItem }) {
    const expires = item.expiresAt.toDate();
    const isDone  = item.status !== 'active';
    return (
      <TouchableOpacity
        style={[s.card, isDone && s.cardDone]}
        onPress={() => router.push(`/(app)/item/${item.id}?area=vouchers`)}
      >
        <View style={s.top}>
          <Text style={s.title}>{item.title}</Text>
          {!isDone && <UrgencyBar expiresAt={expires} />}
          {isDone && <View style={s.doneBadge}><Text style={s.doneText}>{item.status === 'used' ? '✓ מומש' : '✕ פג תוקף'}</Text></View>}
        </View>

        {item.code && (
          <View style={s.codeBox}>
            <Text style={s.codeLabel}>קוד:</Text>
            <Text style={s.code}>{item.code}</Text>
          </View>
        )}

        {item.description && <Text style={s.desc}>{item.description}</Text>}
        <Text style={s.date}>תוקף עד: {format(expires, 'dd/MM/yyyy')}</Text>

        {!isDone && (
          <TouchableOpacity style={s.useBtn} onPress={() => markUsed(item)}>
            <Text style={s.useBtnText}>✓ מימשתי</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={[...active, ...used]}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={s.empty}>אין שוברים פעילים 🎟</Text>}
      />
      <TouchableOpacity style={[s.fab, { bottom: (insets.bottom || 0) + 28 }]} onPress={() => router.push('/(app)/add?area=vouchers')}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F5F5F5' },
  empty:      { textAlign: 'center', marginTop: 60, color: '#AAA', fontSize: 16 },
  card:       { backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardDone:   { opacity: 0.55 },
  top:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  title:      { fontSize: 16, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  doneBadge:  { backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  doneText:   { fontSize: 12, fontWeight: '700', color: '#888' },
  codeBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF8E1', borderRadius: 10, padding: 10 },
  codeLabel:  { fontSize: 13, color: '#888' },
  code:       { fontSize: 17, fontWeight: '800', color: '#F5A623', letterSpacing: 1, fontFamily: 'monospace' },
  desc:       { fontSize: 13, color: '#666' },
  date:       { fontSize: 12, color: '#999' },
  useBtn:     { backgroundColor: '#F5A623', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 4 },
  useBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  fab:        { position: 'absolute', bottom: 28, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#F5A623', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  fabText:    { color: '#FFF', fontSize: 32, lineHeight: 36 },
});
