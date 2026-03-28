import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { AREA_LIST, QUICK_ADD_AREAS, AREAS } from '../../constants/areas';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Clock ─────────────────────────────────────────────

function ClockHeader() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={s.clock}>
      <Text style={s.clockTime}>{format(now, 'HH:mm:ss')}</Text>
      <Text style={s.clockDate}>{format(now, 'EEEE, d בMMMM yyyy', { locale: he })}</Text>
    </View>
  );
}

// ── Area tile ─────────────────────────────────────────

function AreaTile({ area }: { area: typeof AREA_LIST[0] }) {
  return (
    <TouchableOpacity
      style={[s.tile, { borderTopColor: area.color }]}
      onPress={() => router.push(`/(app)/areas/${area.key}`)}
    >
      <Text style={s.tileIcon}>{area.icon}</Text>
      <Text style={s.tileLabel}>{area.label}</Text>
      <Text style={s.tileDesc}>{area.description}</Text>
    </TouchableOpacity>
  );
}

// ── Smart FAB sheet ───────────────────────────────────

function SmartAddSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />
      <View style={s.sheet}>
        <Text style={s.sheetTitle}>מה תרצה לעדכן?</Text>
        <FlatList
          data={QUICK_ADD_AREAS}
          keyExtractor={(k) => k}
          numColumns={2}
          renderItem={({ item: key }) => {
            const area = AREAS[key];
            return (
              <TouchableOpacity
                style={[s.sheetItem, { borderColor: area.color }]}
                onPress={() => { onClose(); router.push(`/(app)/add?area=${key}`); }}
              >
                <Text style={s.sheetIcon}>{area.icon}</Text>
                <Text style={s.sheetLabel}>{area.label}</Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          columnWrapperStyle={{ gap: 10 }}
        />
      </View>
    </Modal>
  );
}

// ── Home screen ───────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [showSheet, setShowSheet] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <ClockHeader />
        <Text style={s.sectionTitle}>האזורים שלנו</Text>
        <View style={s.grid}>
          {AREA_LIST.map((area) => <AreaTile key={area.key} area={area} />)}
        </View>
      </ScrollView>

      <TouchableOpacity style={[s.fab, { bottom: (insets.bottom || 0) + 28 }]} onPress={() => setShowSheet(true)}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <SmartAddSheet visible={showSheet} onClose={() => setShowSheet(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F5F5F5' },
  clock:        { backgroundColor: '#1A1A1A', paddingTop: 20, paddingBottom: 20, alignItems: 'center' },
  clockTime:    { color: '#FFF', fontSize: 36, fontWeight: '700', letterSpacing: 2 },
  clockDate:    { color: '#AAA', fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#888', padding: 16, paddingBottom: 8, letterSpacing: 0.5 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12 },
  tile: {
    width: '47%', backgroundColor: '#FFF', borderRadius: 16,
    padding: 16, borderTopWidth: 4, gap: 6,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  tileIcon:  { fontSize: 28 },
  tileLabel: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  tileDesc:  { fontSize: 11, color: '#999', lineHeight: 15 },
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  fabText: { color: '#FFF', fontSize: 32, lineHeight: 36 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingBottom: 40, maxHeight: '60%',
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 4 },
  sheetItem: {
    flex: 1, borderWidth: 2, borderRadius: 14,
    padding: 16, alignItems: 'center', gap: 6,
  },
  sheetIcon:  { fontSize: 28 },
  sheetLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
});
