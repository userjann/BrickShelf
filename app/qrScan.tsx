import { saveSet } from "@/utils/storage"; // Importiert die Funktion `saveSet` zum Speichern von LEGO-Set-Daten lokal.
import { MaterialIcons } from '@expo/vector-icons'; // Importiert MaterialIcons für UI-Symbole.
import { CameraView } from "expo-camera"; // Importiert `CameraView` von Expo Camera für die Kameravorschau und Barcode-Erkennung.
import * as Haptics from "expo-haptics"; // Importiert Expo Haptics für subtiles haptisches Feedback.
import { router } from "expo-router"; // Importiert den Router von Expo Router für die Navigation.
import { LightSensor } from "expo-sensors"; // Importiert `LightSensor` von Expo Sensors zur Messung der Umgebungshelligkeit.
import React, { useEffect, useState } from "react"; // Importiert React-Hooks für Zustandsverwaltung und Lebenszyklus.
import {
  ActivityIndicator, // Ladeindikator.
  Alert, // Für native Alarmdialoge.
  Image, // Zum Anzeigen von Bildern.
  Platform, // Zum Erkennen der Plattform (iOS/Android).
  Pressable, // Ein Wrapper, der auf verschiedene Press-Interaktionen reagiert.
  SafeAreaView, // Rendert Inhalte innerhalb des sicheren Bereichs eines Geräts.
  ScrollView, // Eine scrollbare Ansicht.
  StatusBar, // Zum Steuern der Statusleiste.
  StyleSheet, // Zum Erstellen von Stylesheets.
  Text, // Zum Anzeigen von Text.
  View, // Der grundlegendste Baustein für die UI.
} from "react-native";


// Ihr persönlicher Brickset API-Schlüssel. Dies ist sensible Information und sollte in einer Produktion
// idealerweise über Umgebungsvariablen geladen werden.
const BRICKSET_API_KEY = "3-3XeJ-Hc4c-PA4YE"
// Schwellenwert für die Umgebungshelligkeit: Wenn die Beleuchtungsstärke darunter liegt, wird der Blitz der Kamera aktiviert.
const TORCH_THRESHOLD = 100;

/**
 * Die Komponente `qrScan` ermöglicht das Scannen von Barcodes (EAN, Code39, Code128) von LEGO-Sets
 * und das Abrufen zugehöriger Informationen von der Brickset API.
 */
export default function qrScan() {
  // Zustandsvariablen zur Verwaltung des UI-Zustands und der Daten.
  const [loading, setLoading] = useState(false); // Zeigt an, ob Daten von der API geladen werden.
  const [lastScanned, setLastScanned] = useState<string | null>(null); // Speichert den zuletzt gescannten Barcode.
  const [bricksetData, setBricksetData] = useState<any | null>(null); // Speichert die von Brickset abgerufenen Set-Daten.
  const [isScanning, setIsScanning] = useState(true); // Steuert, ob die Kamera aktiv ist und angezeigt wird (Standard: true).
  const [saving, setSaving] = useState(false); // Zeigt an, ob das Set gerade gespeichert wird.
  const [illuminance, setIlluminance] = useState(0); // Speichert den aktuellen Helligkeitswert (Lux).
  const [lightSubscription, setLightSubscription] = useState<any>(null); // Speichert das Abonnement des Lichtsensors.

  /**
   * `useEffect`-Hook für den Lichtsensor.
   * Wird beim Mounten der Komponente ausgeführt und räumt beim Unmounten auf.
   * Abonniert den Lichtsensor, um die Umgebungshelligkeit zu messen und den Blitz der Kamera bei Bedarf zu steuern.
   */
  useEffect(() => {
    LightSensor.setUpdateInterval(1000); // Setzt das Aktualisierungsintervall des Sensors auf 1000 ms (1 Sekunde).
    const subscription = LightSensor.addListener(({ illuminance }) => {
      setIlluminance(illuminance); // Aktualisiert den Beleuchtungsstärke-Zustand.
    });
    setLightSubscription(subscription); // Speichert das Abonnement.

    // Cleanup-Funktion: Wird beim Unmounten der Komponente aufgerufen, um das Sensor-Abonnement zu entfernen.
    return () => {
      if (subscription) {
        subscription.remove(); // Entfernt den Listener, um Speicherlecks zu vermeiden.
      }
      setLightSubscription(null); // Setzt das Abonnement zurück.
    };
  }, []); // Leeres Abhängigkeits-Array bedeutet, dass der Effekt nur einmal beim Mounten ausgeführt wird.

  /**
   * Asynchrone Funktion zum Abrufen von Set-Informationen von der Brickset API unter Verwendung eines Barcodes.
   * @param barcode Der zu suchende Barcode.
   */
  async function fetchSetInfo(barcode: string) {
    setLoading(true); // Ladeindikator aktivieren.
    setLastScanned(barcode); // Den zuletzt gescannten Barcode speichern.
    setBricksetData(null); // Vorheriges Ergebnis zurücksetzen, um den Ladezustand zu zeigen.

    try {
      // Parameter für die API-Anfrage kodieren.
      const params = encodeURIComponent(JSON.stringify({ query: barcode }));
      // Die vollständige API-URL konstruieren.
      const url = `https://brickset.com/api/v3.asmx/getSets?apiKey=${BRICKSET_API_KEY}&userHash=&params=${params}`;
      console.log("Brickset API URL:", url); // Die generierte URL zu Debugging-Zwecken protokollieren.

      const res = await fetch(url); // API-Aufruf durchführen.
      const json = await res.json(); // JSON-Antwort parsen.

      // Prüfen, ob die API-Anfrage erfolgreich war und Sets zurückgegeben wurden.
      if (json.status !== "success" || !json.sets || json.sets.length === 0) {
        setBricksetData(null); // Keine Daten gefunden.
        setLoading(false); // Ladeindikator deaktivieren.
        // Alert.alert("Kein Set gefunden", "Für diesen Barcode konnte kein LEGO Set auf Brickset gefunden werden."); // Optional: Benachrichtigung anzeigen.
        return; // Funktion beenden.
      }

      // Das passende Set finden, indem nach EAN oder UPC des Barcodes gesucht wird, oder das erste Set nehmen.
      const matchedSet =
        json.sets.find(
          (set: any) =>
            set.barcode?.EAN === barcode || set.barcode?.UPC === barcode
        ) || json.sets[0];

      setBricksetData(matchedSet); // Gefundene Set-Daten speichern.
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Haptisches Feedback bei Erfolg.
    } catch (e) {
      console.error("Fehler bei Brickset API:", e); // Fehler protokollieren.
      setBricksetData(null); // Daten zurücksetzen.
      // Alert.alert("Fehler", "Es gab ein Problem beim Abrufen der Set-Informationen."); // Optional: Benachrichtigung anzeigen.
    } finally {
      setLoading(false); // Ladeindikator immer deaktivieren.
      setIsScanning(false); // Kamera deaktivieren, wenn das Ergebnis da ist (oder kein Ergebnis gefunden wurde).
    }
  }

  /**
   * Callback-Funktion, die aufgerufen wird, wenn ein Barcode von der Kamera erkannt wird.
   * @param data Der gescannte Barcode-Wert.
   */
  function handleBarcodeScanned({ data }: { data: string }) {
    // Nur scannen, wenn die Kamera aktiv ist (`isScanning`) und ein neuer Barcode erkannt wurde.
    if (isScanning && data && data !== lastScanned) {
      setIsScanning(false); // Kamera sofort deaktivieren, sobald ein Barcode erkannt wurde, um Mehrfachscans zu verhindern.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // Starkes haptisches Feedback geben.
      fetchSetInfo(data); // Set-Informationen für den gescannten Barcode abrufen.
    }
  }

  /**
   * Asynchrone Funktion zum Speichern des abgerufenen LEGO-Sets in der lokalen Sammlung.
   */
  async function handleSave() {
    // Prüfen, ob Set-Daten zum Speichern vorhanden sind.
    if (!bricksetData) {
      Alert.alert("Kein Set zum Speichern ausgewählt");
      return;
    }

    setSaving(true); // Speichern-Ladeindikator aktivieren.
    try {
      // Speichern des Sets mit den abgerufenen Daten.
      await saveSet({
        id: bricksetData.number, // Setnummer als eindeutige ID verwenden.
        name: bricksetData.name,
        setNumber: bricksetData.number,
        theme: bricksetData.theme,
        imageURL: bricksetData.image?.imageURL,
        pieces: bricksetData.pieces,
        minifigs: bricksetData.minifigs,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Haptisches Feedback bei Erfolg.
      Alert.alert("Erfolg", `${bricksetData.name} wurde deiner Sammlung hinzugefügt!`); // Erfolgsmeldung.
      router.replace("/"); // Zurück zum Startbildschirm navigieren.
    } catch (e) {
      Alert.alert("Fehler", "Set konnte nicht gespeichert werden."); // Fehlermeldung.
      console.error(e); // Fehler protokollieren.
    } finally {
      setSaving(false); // Speichern-Ladeindikator deaktivieren.
    }
  }

  /**
   * Setzt den Zustand zurück, um einen neuen Scan-Vorgang zu starten.
   */
  const startNewScan = () => {
    setLastScanned(null); // Zuletzt gescannten Barcode zurücksetzen.
    setBricksetData(null); // Abgerufene Set-Daten zurücksetzen.
    setLoading(false); // Ladezustand zurücksetzen.
    setSaving(false); // Speicherzustand zurücksetzen.
    setIsScanning(true); // Kamera wieder aktivieren für einen neuen Scan.
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Versteckt die Statusleiste auf Android für ein immersiveres Kameraerlebnis. */}
      {Platform.OS === "android" ? <StatusBar hidden /> : null}

      {/* Kopfzeile der Ansicht */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.mainTitle}>Barcode scannen</Text>
        <View style={styles.backButtonPlaceholder} /> {/* Platzhalter für mittigen Titel */}
      </View>

      {/* Hauptinhaltsbereich, der entweder die Kamera oder die Ergebnisse anzeigt */}
      {isScanning ? (
        // Kameraansicht, wenn `isScanning` true ist
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back" // Nutzt die Rückkamera.
            enableTorch={illuminance < TORCH_THRESHOLD} // Aktiviert den Kamerablitz, wenn die Umgebungshelligkeit unter dem Schwellenwert liegt.
            barcodeScannerSettings={{
              // Definiert, welche Barcode-Typen erkannt werden sollen.
              barcodeTypes: ["ean13", "code39", "code128"],
            }}
            onBarcodeScanned={handleBarcodeScanned} // Callback, wenn ein Barcode erkannt wird.
          >
            {/* Überlagerung für den Scan-Bereich und Anweisungen. */}
            <View style={styles.scanOverlay}>
              <View style={styles.scanLine} /> {/* Animierte Scan-Linie (nicht animiert im Code, aber visuell vorhanden) */}
              <Text style={styles.scanInstruction}>Barcode des Sets scannen</Text>
            </View>
          </CameraView>
        </View>
      ) : (
        // ScrollView für Ergebnisse, Ladeanzeige oder Fehlermeldungen, wenn `isScanning` false ist
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Ladeindikator: Wird angezeigt, wenn `loading` true ist. */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0057A6" />
              <Text style={styles.loadingText}>Set-Informationen werden geladen...</Text>
            </View>
          )}

          {/* Ergebnis-Karte: Wird angezeigt, wenn nicht geladen wird und `bricksetData` vorhanden ist. */}
          {!loading && bricksetData && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>{bricksetData.name}</Text>

              {/* Set-Bild anzeigen, wenn eine URL vorhanden ist. */}
              {bricksetData.image?.imageURL && (
                <Image
                  source={{ uri: bricksetData.image.imageURL }}
                  style={styles.resultImage}
                  resizeMode="contain"
                />
              )}

              {/* Informationszeile für die Setnummer. */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Setnummer:</Text>
                <Text style={styles.infoValue}>
                  {bricksetData.setNumber || bricksetData.number} {/* Nutzt entweder `setNumber` oder `number` */}
                </Text>
              </View>

              {/* Informationszeile für das Thema. */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Thema:</Text>
                <Text style={styles.infoValue}>{bricksetData.theme || "N/A"}</Text> {/* "N/A", wenn kein Thema. */}
              </View>

              {/* Informationszeile für die Anzahl der Teile (nur anzeigen, wenn definiert). */}
              {bricksetData.pieces !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Teile:</Text>
                  <Text style={styles.infoValue}>{bricksetData.pieces}</Text>
                </View>
              )}

              {/* Informationszeile für die Anzahl der Minifiguren (nur anzeigen, wenn definiert). */}
              {bricksetData.minifigs !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Minifiguren:</Text>
                  <Text style={styles.infoValue}>{bricksetData.minifigs}</Text>
                </View>
              )}

              {/* Button zum Speichern des Sets. */}
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && { backgroundColor: '#008C00' }, // Dunkleres Grün beim Drücken.
                  saving && { backgroundColor: '#A0A0A0' }, // Grau, wenn gespeichert wird.
                ]}
                onPress={handleSave} // Funktion zum Speichern aufrufen.
                disabled={saving} // Deaktivieren während des Speichervorgangs.
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "Speichert..." : "Set speichern"} {/* Text je nach Zustand. */}
                </Text>
              </Pressable>

              {/* "Weiteres Set scannen"-Button nach erfolgreichem Scan. */}
              <Pressable onPress={startNewScan} style={styles.scanNextButton}>
                <MaterialIcons name="qr-code-scanner" size={20} color="#0057A6" />
                <Text style={styles.scanNextButtonText}>Weiteres Set scannen</Text>
              </Pressable>

            </View>
          )}

          {/* Kein Ergebnis / Fehlermeldung: Wird angezeigt, wenn nicht geladen wird, keine Daten gefunden wurden, aber ein Scan versucht wurde. */}
          {!loading && !bricksetData && lastScanned && (
            <View style={styles.noResultContainer}>
              <MaterialIcons name="sentiment-dissatisfied" size={50} color="#D32F2F" />
              <Text style={styles.noResultText}>
                Kein LEGO Set gefunden für Barcode: {lastScanned}
              </Text>
              <Pressable onPress={startNewScan} style={styles.retryButton}>
                <MaterialIcons name="refresh" size={20} color="#0057A6" />
                <Text style={styles.retryButtonText}>Neuen Scan starten</Text>
              </Pressable>
              {/* Link zur manuellen Hinzufügen-Seite. */}
              <Pressable onPress={() => router.replace('./manuelAdd')} style={styles.manualAddLink}>
                <Text style={styles.manualAddLinkText}>Alternativ manuell hinzufügen</Text>
              </Pressable>
            </View>
          )}

          {/* "Scannen starten"-Button: Nur anzeigen, wenn `isScanning` false ist UND noch kein Ergebnis da ist (Initialzustand oder nach Reset ohne Ergebnis). */}
          {!loading && !bricksetData && !lastScanned && (
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
  // Hauptcontainer-Stil, der den gesamten Bildschirm und die Hintergrundfarbe sicherstellt.
  safeArea: {
    flex: 1, // Nimmt den gesamten verfügbaren Platz ein.
    backgroundColor: '#FDFDFD', // Helle Hintergrundfarbe.
  },
  // Stil der Kopfzeile.
  header: {
    flexDirection: 'row', // Ordnet die Kinder horizontal an.
    alignItems: 'center', // Vertikale Ausrichtung der Elemente in der Mitte.
    justifyContent: 'space-between', // Verteilt den Raum gleichmäßig zwischen den Elementen.
    paddingHorizontal: 20, // Horizontaler Innenabstand.
    paddingVertical: 15, // Vertikaler Innenabstand.
    backgroundColor: '#FDFDFD', // Hintergrundfarbe der Kopfzeile.
    borderBottomWidth: 1, // Unterer Rand zur Trennung.
    borderBottomColor: '#EEEEEE', // Farbe des unteren Rands.
  },
  // Stil für den Berührungsbereich des Zurück-Buttons.
  backButton: {
    padding: 5, // Fügt Polsterung um das Symbol herum hinzu, um das Tippen zu erleichtern.
  },
  // Platzhalteransicht, um sicherzustellen, dass der Haupttitel zentriert bleibt, wenn kein Element auf der rechten Seite vorhanden ist.
  backButtonPlaceholder: {
    width: 28, // Passt die Breite an die des Zurück-Symbols an, um das Layout auszugleichen.
  },
  // Stil für den Haupttiteltext in der Kopfzeile.
  mainTitle: {
    fontSize: 28, // Große Schriftgröße.
    fontWeight: '800', // Extra fette Schriftstärke.
    color: '#222222', // Dunkle Textfarbe.
  },
  // Container für die Kameraansicht, definiert feste Größe und Aussehen.
  cameraContainer: {
    width: '100%', // Nimmt die gesamte Breite ein.
    height: 300, // Feste Höhe für die Kameraansicht.
    marginBottom: 20, // Abstand nach unten.
    overflow: 'hidden', // Schneidet Inhalte ab, die über die Grenzen hinausragen.
    backgroundColor: '#000', // Schwarzer Hintergrund für den Bereich außerhalb der Kameraansicht.
    justifyContent: 'center', // Zentriert den Inhalt vertikal.
    alignItems: 'center', // Zentriert den Inhalt horizontal.
    borderRadius: 12, // Abgerundete Ecken.
  },
  // Stil für die tatsächliche Kameraansicht, füllt den `cameraContainer` aus.
  camera: {
    ...StyleSheet.absoluteFillObject, // Füllt das Elternelement vollständig aus (position: 'absolute', top, bottom, left, right: 0).
  },
  // Dieser Stil wird nicht mehr direkt im aktuellen Code verwendet, könnte aber für Platzhalter-Texte in anderen Kontexten gedacht sein.
  placeholderText: {
    fontSize: 18,
    color: '#888',
    marginTop: 10,
  },
  // Überlagerung über der Kameraansicht, die den Scanbereich visualisiert.
  scanOverlay: {
    ...StyleSheet.absoluteFillObject, // Füllt das Elternelement vollständig aus.
    justifyContent: 'center', // Zentriert den Inhalt (Scan-Linie und -Anweisung) vertikal.
    alignItems: 'center', // Zentriert den Inhalt horizontal.
    borderColor: 'rgba(255,255,255,0.3)', // Semi-transparenter weißer Rand.
    borderWidth: 2, // Randstärke.
    margin: 30, // Innenabstand vom Rand des `cameraContainer`, um den Scanbereich zu definieren.
    borderRadius: 10, // Abgerundete Ecken.
  },
  // Visuelle Scan-Linie innerhalb des Overlays.
  scanLine: {
    width: '80%', // Breite der Linie.
    height: 3, // Höhe der Linie.
    backgroundColor: '#00BCD4', // Türkisfarbene Linie.
    position: 'absolute', // Positioniert relativ zum `scanOverlay`.
    // Hinweis: Für eine tatsächliche Animation müsste hier noch `Animated.View` oder ähnliches verwendet werden.
  },
  // Anweisungstext innerhalb des Scan-Overlays.
  scanInstruction: {
    color: '#FFF', // Weißer Text.
    fontSize: 18, // Schriftgröße.
    fontWeight: '600', // Halbfette Schriftstärke.
    marginTop: 180, // Positioniert den Text weiter unten im Overlay.
    backgroundColor: 'rgba(0,0,0,0.6)', // Semi-transparenter schwarzer Hintergrund für bessere Lesbarkeit.
    paddingHorizontal: 15, // Horizontaler Innenabstand.
    paddingVertical: 8, // Vertikaler Innenabstand.
    borderRadius: 8, // Abgerundete Ecken.
  },
  // Stil für den ScrollView-Inhaltscontainer, wenn die Kamera nicht aktiv ist.
  scrollContent: {
    flexGrow: 1, // Ermöglicht es dem Inhalt zu wachsen und den verfügbaren Platz auszufüllen.
    paddingHorizontal: 20, // Horizontaler Innenabstand.
    paddingBottom: 40, // Zusätzlicher Innenabstand am unteren Rand für besseres Scrollen.
    justifyContent: 'flex-start', // Startet den Inhalt oben.
  },
  // Container für den Ladeindikator.
  loadingContainer: {
    alignItems: 'center', // Zentriert den Inhalt horizontal.
    justifyContent: 'center', // Zentriert den Inhalt vertikal.
    paddingVertical: 50, // Vertikaler Innenabstand.
  },
  // Stil für den Lade-Text.
  loadingText: {
    marginTop: 15, // Abstand über dem Text.
    fontSize: 16, // Schriftgröße.
    color: '#555', // Dunkelgraue Textfarbe.
  },
  // Stil für die Ergebnis-Karte, die nach einem erfolgreichen Scan angezeigt wird.
  resultCard: {
    backgroundColor: '#FFFFFF', // Weißer Hintergrund.
    borderRadius: 12, // Abgerundete Ecken.
    padding: 20, // Innerer Innenabstand.
    alignItems: 'center', // Zentriert den Inhalt horizontal.
    elevation: 6, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.15, // Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 4 }, // Schattenversatz.
    shadowRadius: 6, // Schattenunschärferadius.
    marginBottom: 20, // Abstand nach unten.
    marginTop: 10, // Abstand nach oben.
  },
  // Stil für den Titel des gefundenen Sets.
  resultTitle: {
    fontSize: 24, // Schriftgröße.
    fontWeight: '700', // Fette Schriftstärke.
    color: '#222222', // Dunkle Textfarbe.
    marginBottom: 15, // Abstand nach unten.
    textAlign: 'center', // Text zentrieren.
  },
  // Stil für das Bild des gefundenen Sets.
  resultImage: {
    width: '100%', // Volle Breite.
    height: 200, // Feste Höhe.
    borderRadius: 8, // Abgerundete Ecken.
    backgroundColor: '#E0E0E0', // Grauer Hintergrund (Platzhalter/Fallback).
    marginBottom: 20, // Abstand nach unten.
    resizeMode: 'contain', // Bild wird skaliert, um vollständig sichtbar zu sein.
  },
  // Stil für eine Informationszeile (Label und Wert).
  infoRow: {
    flexDirection: 'row', // Elemente horizontal anordnen.
    justifyContent: 'space-between', // Platz zwischen den Elementen verteilen.
    width: '100%', // Volle Breite.
    marginBottom: 10, // Abstand nach unten.
    paddingHorizontal: 5, // Horizontaler Innenabstand.
  },
  // Stil für die Beschriftung in einer Informationszeile.
  infoLabel: {
    fontWeight: '600', // Halbfette Schrift.
    fontSize: 16, // Schriftgröße.
    color: '#444444', // Dunkelgraue Textfarbe.
  },
  // Stil für den Wert in einer Informationszeile.
  infoValue: {
    fontSize: 16, // Schriftgröße.
    color: '#666666', // Hellgraue Textfarbe.
    flexShrink: 1, // Ermöglicht Textumbruch bei langen Werten.
    textAlign: 'right', // Text rechts ausrichten.
  },
  // Stil für den "Set speichern"-Button.
  saveButton: {
    backgroundColor: '#00A800', // Grüner Hintergrund.
    paddingVertical: 15, // Vertikaler Innenabstand.
    paddingHorizontal: 25, // Horizontaler Innenabstand.
    borderRadius: 10, // Abgerundete Ecken.
    marginTop: 25, // Abstand nach oben.
    width: '80%', // 80% der Breite des Elternteils.
    alignSelf: 'center', // Horizontal zentrieren.
    elevation: 4, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.2, // Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 2 }, // Schattenversatz.
    shadowRadius: 3, // Schattenunschärferadius.
  },
  // Stil für den Text im "Set speichern"-Button.
  saveButtonText: {
    color: '#fff', // Weißer Text.
    textAlign: 'center', // Text zentrieren.
    fontSize: 18, // Schriftgröße.
    fontWeight: '700', // Fette Schriftstärke.
  },
  // Stil für den "Weiteres Set scannen"-Button.
  scanNextButton: {
    flexDirection: 'row', // Elemente horizontal anordnen.
    alignItems: 'center', // Elemente vertikal zentrieren.
    justifyContent: 'center', // Elemente horizontal zentrieren.
    marginTop: 15, // Abstand nach oben.
    paddingVertical: 12, // Vertikaler Innenabstand.
    paddingHorizontal: 20, // Horizontaler Innenabstand.
    backgroundColor: '#EBF6FF', // Heller blauer Hintergrund.
    borderRadius: 10, // Abgerundete Ecken.
    width: '80%', // 80% der Breite.
    alignSelf: 'center', // Horizontal zentrieren.
  },
  // Stil für den Text im "Weiteres Set scannen"-Button.
  scanNextButtonText: {
    marginLeft: 10, // Abstand links vom Text.
    color: '#0057A6', // LEGO-Blauer Text.
    fontSize: 16, // Schriftgröße.
    fontWeight: '600', // Halbfette Schriftstärke.
  },
  // Container für die "Kein Ergebnis"-Meldung.
  noResultContainer: {
    backgroundColor: '#FFFFFF', // Weißer Hintergrund.
    borderRadius: 12, // Abgerundete Ecken.
    padding: 30, // Innerer Innenabstand.
    alignItems: 'center', // Inhalt horizontal zentrieren.
    justifyContent: 'center', // Inhalt vertikal zentrieren.
    elevation: 4, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.1, // Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 2 }, // Schattenversatz.
    shadowRadius: 4, // Schattenunschärferadius.
    minHeight: 200, // Minimale Höhe.
    marginTop: 20, // Abstand nach oben.
  },
  // Stil für den "Kein Ergebnis"-Text.
  noResultText: {
    textAlign: 'center', // Text zentrieren.
    fontSize: 17, // Schriftgröße.
    color: '#D32F2F', // Dunkelrote Warnfarbe.
    marginTop: 15, // Abstand nach oben.
    fontWeight: '600', // Halbfette Schriftstärke.
  },
  // Stil für den "Neuen Scan starten"-Button nach einem fehlgeschlagenen Scan.
  retryButton: {
    flexDirection: 'row', // Elemente horizontal anordnen.
    alignItems: 'center', // Elemente vertikal zentrieren.
    marginTop: 20, // Abstand nach oben.
    paddingVertical: 10, // Vertikaler Innenabstand.
    paddingHorizontal: 20, // Horizontaler Innenabstand.
    backgroundColor: '#EBF6FF', // Heller blauer Hintergrund.
    borderRadius: 25, // Stark abgerundete Ecken (Pillenform).
  },
  // Stil für den Text im "Neuen Scan starten"-Button.
  retryButtonText: {
    marginLeft: 10, // Abstand links vom Text.
    color: '#0057A6', // LEGO-Blauer Text.
    fontSize: 16, // Schriftgröße.
    fontWeight: '600', // Halbfette Schriftstärke.
  },
  // Stil für den Link zum manuellen Hinzufügen.
  manualAddLink: {
    marginTop: 15, // Abstand nach oben.
  },
  // Stil für den Text des manuellen Hinzufügen-Links.
  manualAddLinkText: {
    color: '#0057A6', // LEGO-Blauer Text.
    fontSize: 16, // Schriftgröße.
    textDecorationLine: 'underline', // Unterstrichener Text.
  },
  // Stil für den "Scannen starten"-Button im Initialzustand.
  rescanButton: {
    backgroundColor: '#0057A6', // LEGO-Blauer Hintergrund.
    paddingVertical: 15, // Vertikaler Innenabstand.
    paddingHorizontal: 25, // Horizontaler Innenabstand.
    borderRadius: 10, // Abgerundete Ecken.
    marginTop: 20, // Abstand nach oben.
    alignSelf: 'center', // Horizontal zentrieren.
    flexDirection: 'row', // Elemente horizontal anordnen.
    alignItems: 'center', // Elemente vertikal zentrieren.
    justifyContent: 'center', // Elemente horizontal zentrieren.
    elevation: 4, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.2, // Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 2 }, // Schattenversatz.
    shadowRadius: 3, // Schattenunschärferadius.
  },
  // Stil für den Text im "Scannen starten"-Button.
  rescanButtonText: {
    color: '#fff', // Weißer Text.
    marginLeft: 10, // Abstand links vom Text.
    fontSize: 18, // Schriftgröße.
    fontWeight: '700', // Fette Schriftstärke.
  },
});