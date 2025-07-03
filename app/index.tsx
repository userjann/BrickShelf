import { getSavedSets, LegoSet } from '@/utils/storage';
import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text } from 'react-native';

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const isPermissionGranted = Boolean(permission?.granted);

  const [scannedSets, setScannedSets] = useState<LegoSet[]>([]);

  useEffect(() => {
    async function loadSets() {
      const saved = await getSavedSets();
      setScannedSets(saved);
    }
    loadSets();
  }, []);

  const renderSetItem = ({ item }: { item: LegoSet }) => (
    <Pressable
      style={({ pressed }) => [
        styles.setItem,
        pressed && { backgroundColor: '#e6f0ff' },
      ]}
      onPress={() => router.push(`/setDetail?id=${item.id}`)}
    >
      <Text style={styles.setTitle}>{item.name}</Text>
      <Text style={styles.setInfo}>
        {item.setNumber} – {item.theme}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.mainText}>Gespeicherte LEGO Sets</Text>

      <FlatList
        data={scannedSets}
        keyExtractor={item => item.id}
        renderItem={renderSetItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Keine gespeicherten Sets.</Text>}
        contentContainerStyle={scannedSets.length === 0 && { flex: 1, justifyContent: 'center', alignItems: 'center' }}
        style={{ width: '100%', flex: 1, marginTop: 20 }}
      />

      {!isPermissionGranted && (
        <Pressable
          style={({ pressed }) => [
            styles.permissionButton,
            pressed && { backgroundColor: '#0aa742' },
          ]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Kamera erlauben</Text>
        </Pressable>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          pressed && { backgroundColor: '#005bbb' },
          !isPermissionGranted && { backgroundColor: '#999' },
        ]}
        onPress={() => router.replace('./addSet')}
        disabled={!isPermissionGranted}
      >
        <Text style={styles.addButtonText}>＋</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.statsButton,
          pressed && { backgroundColor: '#cc7a00' },
        ]}
        onPress={() => router.push('/stats')}
      >
        <Text style={styles.statsButtonText}>📊</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  mainText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  setItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  setTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  setInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  addButtonText: {
    fontSize: 36,
    color: '#fff',
    lineHeight: 38,
  },
  permissionButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: '#0BCD4C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  statsButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#FF9500',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  statsButtonText: {
    fontSize: 30,
    color: '#fff',
  },
});
