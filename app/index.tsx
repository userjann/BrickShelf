import { getSavedSets, LegoSet } from '@/utils/storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

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
        pressed && { backgroundColor: '#EBF6FF' },
      ]}
      onPress={() => router.push(`/setDetail?id=${item.id}`)}
    >
      <View style={styles.setItemContent}>
        <Text style={styles.setTitle}>{item.name}</Text>
        <Text style={styles.setInfo}>
          {item.setNumber} – {item.theme}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.mainText}>Deine LEGO Sammlung</Text>
      </View>

      <FlatList
        data={scannedSets}
        keyExtractor={item => item.id}
        renderItem={renderSetItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="box-open" size={60} color="#B0B0B0" />
            <Text style={styles.emptyText}>Noch keine Sets in deiner Sammlung.</Text>
            <Text style={styles.emptyTextSub}>Scanne dein erstes Set!</Text>
          </View>
        }
        contentContainerStyle={[
          scannedSets.length === 0 ? styles.emptyListContent : {},
          { paddingBottom: 100 }
        ]}
        style={{ width: '100%', flex: 1, marginTop: 20 }}
      />

      {!isPermissionGranted && (
        <Pressable
          style={({ pressed }) => [
            styles.permissionButton,
            pressed && { backgroundColor: '#008C00' },
          ]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Kamera erlauben</Text>
        </Pressable>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          pressed && { backgroundColor: '#004A8C' },
          !isPermissionGranted && { backgroundColor: '#A0A0A0' },
        ]}
        onPress={() => router.replace('./addSet')}
        disabled={!isPermissionGranted}
      >
        {/* Hier wurde das MaterialIcons-Kamera-Icon durch ein Text-Plus ersetzt */}
        <Text style={styles.addButtonText}>＋</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.statsButton,
          pressed && { backgroundColor: '#CC6600' },
        ]}
        onPress={() => router.push('/stats')}
      >
        <FontAwesome5 name="chart-bar" size={28} color="#FFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  mainText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#222222',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyTextSub: {
    fontSize: 16,
    color: '#A0A0A0',
    marginTop: 5,
    textAlign: 'center',
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 7,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    width: '100%',
  },
  setItemContent: {
    // Nimmt gesamten Platz ein, da kein Bild
  },
  setTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#333333',
  },
  setInfo: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#0057A6',
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
  // Der Text-Stil für das Plus-Symbol wurde angepasst
  addButtonText: { 
    fontSize: 40, // Größere Schriftgröße für das Plus
    color: '#fff',
    lineHeight: 40, // Anpassen für vertikale Zentrierung des Plus
  },
  permissionButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: '#00A800',
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
    backgroundColor: '#FF8800',
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
});