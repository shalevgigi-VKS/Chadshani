import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { subscribeToArea } from '@/lib/db';
import { DocumentItem } from '@/constants/types';
import { format } from 'date-fns';

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<DocumentItem[]>([]);
  useEffect(() => subscribeToArea<DocumentItem>('documents', 'createdAt', setItems, 'desc'), []);

  return (
    <View style={s.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<Text style={s.empty}>אין מסמכים שמורים 📄</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => router.push(`/(app)/item/${item.id}?area=documents`)}>
            <View style={s.row}>
              {item.fileType === 'image' ? (
                <Image source={{ uri: item.storageUrl }} style={s.thumb} />
              ) : (
                <View style={[s.thumb, s.pdfThumb]}>
                  <Text style={s.pdfIcon}>PDF</Text>
                </View>
              )}
              <View style={s.info}>
                <Text style={s.title}>{item.title}</Text>
                {item.description && <Text style={s.desc}>{item.description}</Text>}
                {item.expiresAt && (
                  <Text style={s.expiry}>תוקף: {format(item.expiresAt.toDate(), 'dd/MM/yyyy')}</Text>
                )}
                {item.tags && item.tags.length > 0 && (
                  <View style={s.tags}>
                    {item.tags.map((tag) => (
                      <View key={tag} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={[s.fab, { bottom: (insets.bottom || 0) + 28 }]} onPress={() => router.push('/(app)/add?area=documents')}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  empty:     { textAlign: 'center', marginTop: 60, color: '#AAA', fontSize: 16 },
  card:      { backgroundColor: '#FFF', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  row:       { flexDirection: 'row', gap: 14, alignItems: 'center' },
  thumb:     { width: 64, height: 64, borderRadius: 10, backgroundColor: '#F0F0F0' },
  pdfThumb:  { justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFEBEE' },
  pdfIcon:   { fontSize: 13, fontWeight: '800', color: '#E53935' },
  info:      { flex: 1, gap: 4 },
  title:     { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  desc:      { fontSize: 13, color: '#666' },
  expiry:    { fontSize: 12, color: '#E53935' },
  tags:      { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  tag:       { backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  tagText:   { fontSize: 11, color: '#555' },
  fab:       { position: 'absolute', bottom: 28, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#78909C', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  fabText:   { color: '#FFF', fontSize: 32, lineHeight: 36 },
});
