import { saveSet } from "@/utils/storage";
import { CameraView } from "expo-camera";
import Constants from "expo-constants";
import { router } from "expo-router";
import React, { useState } from "react";
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

export default function qrScan() {
  const [loading, setLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [bricksetData, setBricksetData] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchSetInfo(barcode: string) {
    setLoading(true);
    setLastScanned(barcode);
    setBricksetData(null);

    try {
      const params = encodeURIComponent(JSON.stringify({ query: barcode }));
      const url = `https://brickset.com/api/v3.asmx/getSets?apiKey=${BRICKSET_API_KEY}&userHash=&params=${params}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.status !== "success" || !json.sets || json.sets.length === 0) {
        setBricksetData(null);
        setLoading(false);
        return;
      }

      const matchedSet =
        json.sets.find(
          (set: any) =>
            set.barcode?.EAN === barcode || set.barcode?.UPC === barcode
        ) || json.sets[0];

      setBricksetData(matchedSet);
    } catch (e) {
      console.error("Fehler bei Brickset API:", e);
      setBricksetData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleBarcodeScanned({ data }: { data: string }) {
    if (isScanning && data && data !== lastScanned) {
      setIsScanning(false);
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
      router.replace("/");
    } catch (e) {
      Alert.alert("Fehler", "Set konnte nicht gespeichert werden.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === "android" ? <StatusBar hidden /> : null}

      {isScanning && (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "ean13", "code39", "code128"],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading && <ActivityIndicator size="small" color="#007AFF" />}

        {!loading && bricksetData && (
          <View style={styles.resultContainer}>
            {/* Name fett und groß ganz oben */}
            <Text style={styles.title}>{bricksetData.name}</Text>

            {bricksetData.image?.imageURL && (
              <Image
                source={{ uri: bricksetData.image.imageURL }}
                style={styles.image}
                resizeMode="contain"
              />
            )}

            <Text style={styles.label}>Setnummer:</Text>
            <Text style={styles.value}>
              {bricksetData.setNumber || bricksetData.number}
            </Text>

            <Text style={styles.label}>Thema:</Text>
            <Text style={styles.value}>{bricksetData.theme || "–"}</Text>

            {bricksetData.pieces !== undefined && (
              <>
                <Text style={styles.label}>Teile:</Text>
                <Text style={styles.value}>{bricksetData.pieces}</Text>
              </>
            )}

            {bricksetData.minifigs !== undefined && (
              <>
                <Text style={styles.label}>Minifiguren:</Text>
                <Text style={styles.value}>{bricksetData.minifigs}</Text>
              </>
            )}

            <Pressable
              style={[styles.button, saving && { backgroundColor: "#ccc" }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.buttonText}>
                {saving ? "Speichert..." : "💾 Speichern"}
              </Text>
            </Pressable>
          </View>
        )}

        {!loading && !bricksetData && lastScanned && (
          <Text style={styles.noResultText}>
            ❌ Kein Set gefunden für Barcode: {lastScanned}
          </Text>
        )}

        {!isScanning && (
          <Text onPress={() => setIsScanning(true)} style={styles.rescanButton}>
            🔄 Erneut scannen
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  camera: { width: "100%", height: 300, borderRadius: 8, marginBottom: 20 },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  resultContainer: { alignItems: "center", marginBottom: 20 },
  image: {
    width: 200,
    height: 150,
    borderRadius: 8,
    backgroundColor: "#eee",
    marginBottom: 10,
  },
  label: { fontWeight: "600", fontSize: 16, color: "#555", marginTop: 10 },
  value: { fontSize: 18, marginBottom: 8, textAlign: "center" },
  button: {
    backgroundColor: "#28A745",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    width: "100%",
  },
  buttonText: { color: "#fff", textAlign: "center", fontSize: 18 },
  rescanButton: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
    color: "#007AFF",
  },
  noResultText: {
    textAlign: "center",
    fontSize: 16,
    color: "#900",
    marginVertical: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
});
