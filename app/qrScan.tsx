import { saveSet } from "@/utils/storage";
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView } from "expo-camera";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LightSensor } from "expo-sensors";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";


const { BRICKSET_API_KEY } = Constants.expoConfig?.extra || {};
const TORCH_THRESHOLD = 100;

export default function qrScan() {
  const [loading, setLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [bricksetData, setBricksetData] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(true); // Steuert, ob Kamera aktiv ist und angezeigt wird
  const [saving, setSaving] = useState(false);
  const [illuminance, setIlluminance] = useState(0);
  const [lightSubscription, setLightSubscription] = useState<any>(null);

  useEffect(() => {
    LightSensor.setUpdateInterval(1000);
    const subscription = LightSensor.addListener(({ illuminance }) => {
      setIlluminance(illuminance);
    });
    setLightSubscription(subscription);

    return () => {
      if (subscription) {
        subscription.remove();
      }
      setLightSubscription(null);
    };
  }, []);

  async function fetchSetInfo(barcode: string) {
    setLoading(true);
    setLastScanned(barcode);
    setBricksetData(null); // Ergebnis zurücksetzen, um Ladezustand zu zeigen

    try {
      const params = encodeURIComponent(JSON.stringify({ query: barcode }));
      const url = `https://brickset.com/api/v3.asmx/getSets?apiKey=${BRICKSET_API_KEY}&userHash=&params=${params}`;
      console.log("Brickset API URL:", url);

      const res = await fetch(url);
      const json = await res.json();

      if (json.status !== "success" || !json.sets || json.sets.length === 0) {
        setBricksetData(null);
        setLoading(false);
        // Alert.alert("Kein Set gefunden", "Für diesen Barcode konnte kein LEGO Set auf Brickset gefunden werden.");
        return;
      }

      const matchedSet =
        json.sets.find(
          (set: any) =>
            set.barcode?.EAN === barcode || set.barcode?.UPC === barcode
        ) || json.sets[0];

      setBricksetData(matchedSet);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error("Fehler bei Brickset API:", e);
      setBricksetData(null);
      // Alert.alert("Fehler", "Es gab ein Problem beim Abrufen der Set-Informationen.");
    } finally {
      setLoading(false);
      setIsScanning(false); // Kamera deaktivieren, wenn Ergebnis da ist (oder kein Ergebnis gefunden wurde)
    }
  }

  function handleBarcodeScanned({ data }: { data: string }) {
    if (isScanning && data && data !== lastScanned) { // Nur scannen, wenn isScanning true ist und neuer Barcode
      setIsScanning(false); // Kamera sofort deaktivieren, sobald Barcode erkannt
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      fetchSetInfo(data);
    }
  }

  async function handleSave() {
    if (!bricksetData) {
      Alert.alert("Kein Set zum Speichern ausgewählt");
      return;
    }

    setSaving(true);
    try {
      await saveSet({
        id: bricksetData.number,
        name: bricksetData.name,
        setNumber: bricksetData.number,
        theme: bricksetData.theme,
        imageURL: bricksetData.image?.imageURL,
        pieces: bricksetData.pieces,
        minifigs: bricksetData.minifigs,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Erfolg", `${bricksetData.name} wurde deiner Sammlung hinzugefügt!`);
      router.replace("/");
    } catch (e) {
      Alert.alert("Fehler", "Set konnte nicht gespeichert werden.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const startNewScan = () => {
    setLastScanned(null);
    setBricksetData(null);
    setLoading(false);
    setSaving(false);
    setIsScanning(true); // Kamera wieder aktivieren für neuen Scan
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {Platform.OS === "android" ? <StatusBar hidden /> : null}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.mainTitle}>Barcode scannen</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Hauptinhaltsbereich, der entweder die Kamera oder die Ergebnisse anzeigt */}
      {isScanning ? (
        // Kameraansicht, wenn isScanning true ist
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            enableTorch={illuminance < TORCH_THRESHOLD}
            barcodeScannerSettings={{
              barcodeTypes: [ "ean13", "code39", "code128"],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          >
            <View style={styles.scanOverlay}>
              <View style={styles.scanLine} />
              <Text style={styles.scanInstruction}>Barcode des Sets scannen</Text>
            </View>
          </CameraView>
        </View>
      ) : (
        // ScrollView für Ergebnisse, Ladeanzeige oder Fehlermeldungen, wenn isScanning false ist
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0057A6" />
              <Text style={styles.loadingText}>Set-Informationen werden geladen...</Text>
            </View>
          )}

          {!loading && bricksetData && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>{bricksetData.name}</Text>

              {bricksetData.image?.imageURL && (
                <Image
                  source={{ uri: bricksetData.image.imageURL }}
                  style={styles.resultImage}
                  resizeMode="contain"
                />
              )}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Setnummer:</Text>
                <Text style={styles.infoValue}>
                  {bricksetData.setNumber || bricksetData.number}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Thema:</Text>
                <Text style={styles.infoValue}>{bricksetData.theme || "N/A"}</Text>
              </View>

              {bricksetData.pieces !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Teile:</Text>
                  <Text style={styles.infoValue}>{bricksetData.pieces}</Text>
                </View>
              )}

              {bricksetData.minifigs !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Minifiguren:</Text>
                  <Text style={styles.infoValue}>{bricksetData.minifigs}</Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && { backgroundColor: '#008C00' },
                  saving && { backgroundColor: '#A0A0A0' },
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "Speichert..." : "Set speichern"}
                </Text>
              </Pressable>

              {/* "Weiteres Set scannen" Button nach erfolgreichem Scan */}
              <Pressable onPress={startNewScan} style={styles.scanNextButton}>
                <MaterialIcons name="qr-code-scanner" size={20} color="#0057A6" />
                <Text style={styles.scanNextButtonText}>Weiteres Set scannen</Text>
              </Pressable>

            </View>
          )}

          {/* Kein Ergebnis / Fehlermeldung */}
          {!loading && !bricksetData && lastScanned && ( // lastScanned bedeutet, dass ein Scan versucht wurde, aber nichts gefunden
            <View style={styles.noResultContainer}>
              <MaterialIcons name="sentiment-dissatisfied" size={50} color="#D32F2F" />
              <Text style={styles.noResultText}>
                Kein LEGO Set gefunden für Barcode: {lastScanned}
              </Text>
              <Pressable onPress={startNewScan} style={styles.retryButton}>
                <MaterialIcons name="refresh" size={20} color="#0057A6" />
                <Text style={styles.retryButtonText}>Neuen Scan starten</Text>
              </Pressable>
              <Pressable onPress={() => router.replace('./manuelAdd')} style={styles.manualAddLink}>
                <Text style={styles.manualAddLinkText}>Alternativ manuell hinzufügen</Text>
              </Pressable>
            </View>
          )}

          {/* "Scannen starten" Button - nur anzeigen, wenn isScanning false UND kein Ergebnis da ist */}
          {!loading && !bricksetData && !lastScanned && ( // Initialzustand oder nach Reset ohne Ergebnis
            <Pressable onPress={startNewScan} style={styles.rescanButton}>
              <MaterialIcons name="qr-code-scanner" size={20} color="#FFF" />
              <Text style={styles.rescanButtonText}>Scannen starten</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FDFDFD',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  backButtonPlaceholder: {
    width: 28,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222222',
  },
  cameraContainer: {
    width: '100%',
    height: 300, // Feste Höhe für die Kameraansicht
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  // cameraPlaceholder wurde entfernt, da es nicht mehr als Ersatz für die Kamera benötigt wird
  placeholderText: { // Dieser Style wird nicht mehr direkt verwendet, kann aber bleiben
    fontSize: 18,
    color: '#888',
    marginTop: 10,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 2,
    margin: 30,
    borderRadius: 10,
  },
  scanLine: {
    width: '80%',
    height: 3,
    backgroundColor: '#00BCD4',
    position: 'absolute',
  },
  scanInstruction: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 180,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    justifyContent: 'flex-start',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    marginBottom: 20,
    marginTop: 10,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 15,
    textAlign: 'center',
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
    resizeMode: 'contain',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  infoLabel: {
    fontWeight: '600',
    fontSize: 16,
    color: '#444444',
  },
  infoValue: {
    fontSize: 16,
    color: '#666666',
    flexShrink: 1,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#00A800',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 25,
    width: '80%',
    alignSelf: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  scanNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#EBF6FF',
    borderRadius: 10,
    width: '80%',
    alignSelf: 'center',
  },
  scanNextButtonText: {
    marginLeft: 10,
    color: '#0057A6',
    fontSize: 16,
    fontWeight: '600',
  },
  noResultContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    minHeight: 200,
    marginTop: 20,
  },
  noResultText: {
    textAlign: 'center',
    fontSize: 17,
    color: '#D32F2F',
    marginTop: 15,
    fontWeight: '600',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#EBF6FF',
    borderRadius: 25,
  },
  retryButtonText: {
    marginLeft: 10,
    color: '#0057A6',
    fontSize: 16,
    fontWeight: '600',
  },
  manualAddLink: {
    marginTop: 15,
  },
  manualAddLinkText: {
    color: '#0057A6',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  rescanButton: {
    backgroundColor: '#0057A6',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  rescanButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 18,
    fontWeight: '700',
  },
});