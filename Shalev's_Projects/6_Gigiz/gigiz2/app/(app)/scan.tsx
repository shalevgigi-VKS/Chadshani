import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { scanDocument } from '../../lib/gemini';
import { compressForScan } from '../../lib/imageCompress';

export default function ScanScreen() {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview]   = useState<string | null>(null);

  async function pickAndScan(fromCamera: boolean) {
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setPreview(uri);
    setScanning(true);

    try {
      const compressed  = await compressForScan(uri);
      const scanResult  = await scanDocument(compressed);
      router.push({
        pathname: '/(app)/scan-confirm',
        params: {
          originalUri: uri,
          result: JSON.stringify(scanResult),
        },
      });
    } catch (e) {
      Alert.alert('שגיאה', 'הסריקה נכשלה. נסה שוב או צלם בתאורה טובה יותר.');
    } finally {
      setScanning(false);
      setPreview(null);
    }
  }

  return (
    <View style={s.container}>
      {scanning ? (
        <View style={s.loadingBox}>
          {preview && <Image source={{ uri: preview }} style={s.preview} />}
          <ActivityIndicator size="large" color="#1A1A1A" style={{ marginTop: 20 }} />
          <Text style={s.loadingText}>מנתח מסמך...</Text>
        </View>
      ) : (
        <>
          <Text style={s.title}>📄 סריקת מסמך</Text>
          <Text style={s.subtitle}>בחר מקור התמונה</Text>

          <TouchableOpacity style={s.btn} onPress={() => pickAndScan(true)}>
            <Text style={s.btnIcon}>📷</Text>
            <Text style={s.btnText}>צלם עכשיו</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={() => pickAndScan(false)}>
            <Text style={s.btnIcon}>🖼</Text>
            <Text style={[s.btnText, { color: '#1A1A1A' }]}>בחר מהגלריה</Text>
          </TouchableOpacity>

          <Text style={s.hint}>
            ניתן לשתף תמונה מוואצאפ ישירות לגיגיז דרך כפתור השיתוף
          </Text>

          <TouchableOpacity style={s.cancel} onPress={() => router.back()}>
            <Text style={s.cancelText}>ביטול</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#FAFAFA', padding: 24, justifyContent: 'center', gap: 16 },
  title:       { fontSize: 26, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  subtitle:    { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 8 },
  btn:         { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  btnSecondary: { backgroundColor: '#F0F0F0' },
  btnIcon:     { fontSize: 28 },
  btnText:     { fontSize: 18, fontWeight: '700', color: '#FFF' },
  hint:        { fontSize: 13, color: '#AAA', textAlign: 'center', marginTop: 8 },
  cancel:      { alignItems: 'center', padding: 12 },
  cancelText:  { color: '#999', fontSize: 15 },
  loadingBox:  { alignItems: 'center' },
  preview:     { width: 260, height: 200, borderRadius: 14, resizeMode: 'cover' },
  loadingText: { fontSize: 16, color: '#555', marginTop: 12 },
});
