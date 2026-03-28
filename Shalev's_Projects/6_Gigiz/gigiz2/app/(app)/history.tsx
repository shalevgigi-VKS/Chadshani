import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { subscribeToHistory } from '../../lib/db';
import { HistoryEntry, UserId, AreaKey } from '../../constants/types';
import { USERS, USER_LIST } from '../../constants/users';
import { AREAS, AREA_LIST } from '../../constants/areas';
import { format } from 'date-fns';

const ACTION_LABEL: Record<string, string> = {
  created: 'הוסיף', edited: 'ערך', deleted: 'מחק',
  completed: 'סיים', uncompleted: 'ביטל סימון',
  handled: 'טיפל', received: 'קיבל', used: 'מימש',
  archived: 'הועבר לארכיון', renewed: 'חידש',
};

export default function HistoryScreen() {
  const [entries, setEntries]   = useState<HistoryEntry[]>([]);
  const [userFilter, setUser]   = useState<UserId | null>(null);
  const [areaFilter, setArea]   = useState<AreaKey | null>(null);

  useEffect(() => {
    return subscribeToHistory(setEntries, userFilter ?? undefined, areaFilter ?? undefined);
  }, [userFilter, areaFilter]);

  return (
    <View style={s.container}>
      {/* User filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar}>
        <TouchableOpacity style={[s.chip, !userFilter && s.chipActive]} onPress={() => setUser(null)}>
          <Text style={[s.chipText, !userFilter && s.chipTextActive]}>הכל</Text>
        </TouchableOpacity>
        {USER_LIST.map((u) => (
          <TouchableOpacity key={u.id} style={[s.chip, userFilter === u.id && { backgroundColor: u.color }]} onPress={() => setUser(userFilter === u.id ? null : u.id)}>
            <Text style={[s.chipText, userFilter === u.id && s.chipTextActive]}>{u.avatar} {u.displayName}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Area filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar}>
        <TouchableOpacity style={[s.chip, !areaFilter && s.chipActive]} onPress={() => setArea(null)}>
          <Text style={[s.chipText, !areaFilter && s.chipTextActive]}>כל האזורים</Text>
        </TouchableOpacity>
        {AREA_LIST.map((a) => (
          <TouchableOpacity key={a.key} style={[s.chip, areaFilter === a.key && { backgroundColor: a.color }]} onPress={() => setArea(areaFilter === a.key ? null : a.key)}>
            <Text style={[s.chipText, areaFilter === a.key && s.chipTextActive]}>{a.icon} {a.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={s.empty}>אין היסטוריה עדיין</Text>}
        renderItem={({ item }) => {
          const userName = item.performedBy === 'system' ? 'מערכת' : USERS[item.performedBy as UserId]?.displayName ?? item.performedBy;
          const action   = ACTION_LABEL[item.action] ?? item.action;
          const area     = AREAS[item.area];
          const time     = item.timestamp?.toDate ? format(item.timestamp.toDate(), 'dd/MM HH:mm') : '';
          return (
            <View style={s.row}>
              <Text style={s.areaIcon}>{area?.icon}</Text>
              <View style={s.info}>
                <Text style={s.main}><Text style={s.bold}>{userName}</Text> {action} את <Text style={s.bold}>{item.itemTitle}</Text></Text>
                <Text style={s.meta}>{area?.label} · {time}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#FAFAFA' },
  filterBar:       { paddingHorizontal: 12, paddingVertical: 10, flexGrow: 0 },
  chip:            { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE', marginRight: 8 },
  chipActive:      { backgroundColor: '#1A1A1A' },
  chipText:        { fontSize: 13, fontWeight: '600', color: '#555' },
  chipTextActive:  { color: '#FFF' },
  empty:           { textAlign: 'center', marginTop: 60, color: '#AAA', fontSize: 16 },
  row:             { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  areaIcon:        { fontSize: 22, marginTop: 2 },
  info:            { flex: 1 },
  main:            { fontSize: 14, color: '#333', lineHeight: 20 },
  bold:            { fontWeight: '700' },
  meta:            { fontSize: 12, color: '#AAA', marginTop: 2 },
});
