import { Drawer } from 'expo-router/drawer';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { AREA_LIST } from '../../constants/areas';
import { router } from 'expo-router';

function CustomDrawer(props: any) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={s.drawer}>
      <Text style={s.drawerTitle}>💰 גיגיז</Text>
      <DrawerItemList {...props} />
      <View style={s.divider} />
      <TouchableOpacity style={s.historyBtn} onPress={() => router.push('/(app)/history')}>
        <Text style={s.historyText}>📜 היסטוריה</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#1A1A1A' },
        headerTintColor: '#FFF',
        headerTitleStyle: { fontWeight: '700' },
        drawerActiveTintColor: '#1A1A1A',
        drawerStyle: { width: 280 },
      }}
    >
      <Drawer.Screen name="home" options={{ title: 'בית', drawerLabel: '🏠  בית' }} />
      {AREA_LIST.map((area) => (
        <Drawer.Screen
          key={area.key}
          name={`areas/${area.key}/index`}
          options={{ title: area.label, drawerLabel: `${area.icon}  ${area.label}` }}
        />
      ))}
      <Drawer.Screen name="history" options={{ title: 'היסטוריה', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="add/index" options={{ title: 'הוספה', drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}

const s = StyleSheet.create({
  drawer:      { flex: 1, paddingTop: 8 },
  drawerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', padding: 20, paddingBottom: 12 },
  divider:     { height: 1, backgroundColor: '#EEE', marginVertical: 8 },
  historyBtn:  { padding: 16 },
  historyText: { fontSize: 15, color: '#555', fontWeight: '600' },
});
