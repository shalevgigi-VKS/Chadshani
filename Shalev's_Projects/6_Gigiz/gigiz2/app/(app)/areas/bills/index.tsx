import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { subscribeToArea, updateEntry } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { BillItem } from '@/constants/types';
import { recurringLabel } from '@/lib/recurring';
import { format, differenceInDays } from 'date-fns';
import { USERS } from '@/constants/users';

export default function BillsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems]         = useState<BillItem[]>([]);
  const [user, setUser]           = useState<'shalo' | 'lee' | null>(null);
  const [payModal, setPayModal]   = useState<BillItem | null>(null);
  const [amountPaid, setAmountPaid] = useState('');

  useEffect(() => {
    getCurrentUser().then(setUser);
    return subscribeToArea<BillItem>('bills', 'nextDueAt', setItems);
  }, []);

  async function confirmPay() {
    if (!payModal || !user) return;
    await updateEntry('bills', payModal.id, payModal.title,
      { status: 'handled', handledBy: user, handledAt: new Date(), amountPaid: amountPaid ? parseFloat(amountPaid) : undefined },
      user, 'handled',
    );
    setPayModal(null);
    setAmountPaid('');
  }

  const unpaid = items.filter((i) => i.status === 'active');
  const paid   = items.filter((i) => i.status === 'handled');
  const totalUnpaid = unpaid.reduce((s, i) => s + (i.amount ?? 0), 0);

  function renderItem({ item }: { item: BillItem }) {
    const due     = item.nextDueAt.toDate();
    const days    = differenceInDays(due, new Date());
    const isPaid  = item.status === 'handled';
    const urgent  = !isPaid && days <= 3;

    return (
      <TouchableOpacity
        style={[s.card, isPaid && s.cardPaid, urgent && s.cardUrgent]}
        onPress={() => router.push(`/(app)/item/${item.id}?area=bills`)}
      >
        <View style={s.top}>
          <Text style={s.title}>{item.title}</Text>
          {item.amount && (
            <Text style={[s.amount, isPaid && { color: '#AAA' }]}>
              ₪{item.amount.toLocaleString('he-IL')}
            </Text>
          )}
        </View>

        <Text style={s.recur}>🔄 {recurringLabel(item.recurringDayOfMonth)}</Text>
        <Text style={s.date}>
          {isPaid
            ? `✓ שולם ב-${format(item.handledAt!.toDate(), 'dd/MM')} ע"י ${USERS[item.handledBy!]?.displayName}${item.amountPaid ? ` — ₪${item.amountPaid.toLocaleString('he-IL')}` : ''}`
            : `לתשלום: ${format(due, 'dd/MM/yyyy')}${days >= 0 ? ` (עוד ${days} ימים)` : ' (עבר!)'}`
          }
        </Text>

        {!isPaid && (
          <TouchableOpacity style={[s.payBtn, urgent && { backgroundColor: '#E53935' }]} onPress={() => { setPayModal(item); setAmountPaid(String(item.amount ?? '')); }}>
            <Text style={s.payBtnText}>✓ שילמתי</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.container}>
      {totalUnpaid > 0 && (
        <View style={s.summary}>
          <Text style={s.summaryLabel}>סה״כ לתשלום החודש</Text>
          <Text style={s.summaryAmount}>₪{totalUnpaid.toLocaleString('he-IL')}</Text>
        </View>
      )}

      <FlatList
        data={[...unpaid, ...paid]}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={s.empty}>אין חשבונות קבועים 📋</Text>}
      />

      <TouchableOpacity style={[s.fab, { bottom: (insets.bottom || 0) + 28 }]} onPress={() => router.push('/(app)/add?area=bills')}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      {/* Payment modal */}
      <Modal visible={!!payModal} transparent animationType="slide" onRequestClose={() => setPayModal(null)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setPayModal(null)} />
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>✓ שילמתי — {payModal?.title}</Text>
          <TextInput
            style={s.input}
            value={amountPaid}
            onChangeText={setAmountPaid}
            placeholder="סכום ששולם בפועל ₪"
            keyboardType="numeric"
          />
          <TouchableOpacity style={s.confirmBtn} onPress={confirmPay}>
            <Text style={s.confirmText}>אשר תשלום</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={() => setPayModal(null)}>
            <Text style={s.cancelText}>ביטול</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F5F5F5' },
  empty:          { textAlign: 'center', marginTop: 60, color: '#AAA', fontSize: 16 },
  summary:        { margin: 16, marginBottom: 0, backgroundColor: '#FFEBEE', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel:   { fontSize: 14, color: '#C62828', fontWeight: '600' },
  summaryAmount:  { fontSize: 22, color: '#C62828', fontWeight: '800' },
  card:           { backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardPaid:       { opacity: 0.55 },
  cardUrgent:     { borderWidth: 2, borderColor: '#E53935' },
  top:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:          { fontSize: 16, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  amount:         { fontSize: 20, fontWeight: '800', color: '#EF5350' },
  recur:          { fontSize: 13, color: '#2196F3' },
  date:           { fontSize: 12, color: '#888' },
  payBtn:         { backgroundColor: '#EF5350', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 4 },
  payBtnText:     { color: '#FFF', fontWeight: '700', fontSize: 15 },
  fab:            { position: 'absolute', bottom: 28, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#EF5350', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  fabText:        { color: '#FFF', fontSize: 32, lineHeight: 36 },
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:          { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  sheetTitle:     { fontSize: 18, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  input:          { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, fontSize: 16 },
  confirmBtn:     { backgroundColor: '#EF5350', borderRadius: 12, padding: 16, alignItems: 'center' },
  confirmText:    { color: '#FFF', fontWeight: '700', fontSize: 16 },
  cancelBtn:      { alignItems: 'center', padding: 10 },
  cancelText:     { color: '#999', fontSize: 15 },
});
