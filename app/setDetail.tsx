// app/setDetail.tsx
import { deleteSet, getSavedSets, LegoSet } from "@/utils/storage"; // Importiert Funktionen zum Löschen und Abrufen gespeicherter Sets sowie den Typ `LegoSet`.
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons'; // Importiert Icon-Sets von FontAwesome5 und MaterialIcons.
import { router, useLocalSearchParams } from "expo-router"; // Importiert den Router für die Navigation und `useLocalSearchParams` zum Abrufen von URL-Parametern.
import { useEffect, useState } from "react"; // Importiert React Hooks für Seiten-Effekte und Zustandsverwaltung.
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native"; // Importiert grundlegende React Native UI-Komponenten.

/**
 * Die Komponente `SetDetail` zeigt die detaillierten Informationen eines einzelnen LEGO-Sets an.
 * Sie ermöglicht auch das Löschen des Sets aus der Sammlung.
 */
export default function SetDetail() {
  // Holt die lokalen Suchparameter aus der URL, in diesem Fall die `id` des Sets.
  const { id } = useLocalSearchParams();
  // Zustandsvariable für das anzuzeigende LEGO-Set. Initialisiert mit `null`.
  const [set, setSet] = useState<LegoSet | null>(null);
  // Zustandsvariable, die anzeigt, ob Daten geladen werden. Initialisiert mit `true`.
  const [loading, setLoading] = useState(true);

  /**
   * `useEffect`-Hook zum Laden der Set-Details, sobald die Komponente gemountet wird
   * oder sich die `id` (Setnummer) in den URL-Parametern ändert.
   */
  useEffect(() => {
    /**
     * Asynchrone Funktion zum Laden eines spezifischen LEGO-Sets aus dem lokalen Speicher.
     */
    async function loadSet() {
      setLoading(true); // Ladezustand aktivieren.
      // Wenn keine ID vorhanden ist, kann kein Set geladen werden.
      if (!id) {
        setLoading(false); // Ladezustand deaktivieren.
        return; // Funktion beenden.
      }

      try {
        const sets = await getSavedSets(); // Alle gespeicherten Sets abrufen.
        // Das gesuchte Set anhand der ID finden.
        const found = sets.find((s) => s.id === id);

        // Wenn das Set nicht gefunden wurde, eine Fehlermeldung anzeigen und zur Startseite navigieren.
        if (!found) {
          Alert.alert("Fehler", "Set nicht gefunden. Es wurde möglicherweise bereits gelöscht oder existiert nicht.");
          router.replace("/"); // Zurück zur Startseite navigieren (ersetzt den aktuellen Screen im Stack).
          return; // Funktion beenden.
        }
        setSet(found); // Das gefundene Set im Zustand speichern.
      } catch (error) {
        // Fehler beim Laden abfangen und protokollieren.
        console.error("Fehler beim Laden des Sets:", error);
        Alert.alert("Fehler", "Set konnte nicht geladen werden."); // Fehlermeldung für den Benutzer.
        router.replace("/"); // Bei Fehler zur Startseite navigieren.
      } finally {
        setLoading(false); // Ladezustand immer deaktivieren, wenn der Ladevorgang abgeschlossen ist.
      }
    }
    loadSet(); // Die Ladefunktion aufrufen.
  }, [id]); // Abhängigkeit von `id`: Der Effekt wird erneut ausgeführt, wenn sich die ID ändert.

  /**
   * Asynchrone Funktion zum Löschen des aktuell angezeigten Sets.
   * Zeigt einen Bestätigungsdialog an, bevor das Set tatsächlich gelöscht wird.
   */
  async function handleDelete() {
    // Wenn kein Set geladen ist, Funktion beenden.
    if (!set) return;

    // Bestätigungsdialog anzeigen.
    Alert.alert("Set löschen", `Willst du "${set.name}" wirklich aus deiner Sammlung entfernen?`, [
      { text: "Abbrechen", style: "cancel" }, // "Abbrechen"-Button.
      {
        text: "Löschen", // "Löschen"-Button.
        style: "destructive", // Stil für eine destruktive Aktion (oft rot).
        onPress: async () => { // Callback-Funktion, wenn "Löschen" gedrückt wird.
          try {
            await deleteSet(set.id); // Set aus dem Speicher löschen.
            router.replace("/"); // Zurück zur Startseite navigieren.
          } catch (error) {
            console.error("Fehler beim Löschen des Sets:", error); // Fehler protokollieren.
            Alert.alert("Fehler", "Set konnte nicht gelöscht werden."); // Fehlermeldung für den Benutzer.
          }
        },
      },
    ]);
  }

  // Bedingtes Rendern: Ladezustand anzeigen.
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0057A6" /> {/* Großer Ladeindikator. */}
        <Text style={styles.loadingText}>Set-Details werden geladen...</Text> {/* Lade-Text. */}
      </SafeAreaView>
    );
  }

  // Bedingtes Rendern: Falls Set nach dem Laden nicht gefunden wurde (z.B. ID war da, aber Set nicht in Storage).
  if (!set) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push("/")} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#222222" />
          </Pressable>
          <Text style={styles.mainTitle}>Set-Details</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>
        <View style={styles.noSetFoundContainer}>
          <MaterialIcons name="error-outline" size={60} color="#D32F2F" /> {/* Fehler-Symbol. */}
          <Text style={styles.noSetFoundText}>Das angefragte Set wurde nicht gefunden.</Text> {/* Fehlermeldung. */}
          <Pressable onPress={() => router.replace('/')} style={styles.homeButton}>
            <Text style={styles.homeButtonText}>Zurück zur Sammlung</Text> {/* Button zur Startseite. */}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Haupt-Rendering, wenn das Set erfolgreich geladen wurde.
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bereich */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/")} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.mainTitle}>Set-Details</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Scrollbarer Inhaltsbereich für die Set-Details. */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.detailCard}>
          <Text style={styles.title}>{set.name}</Text> {/* Set-Name als Titel. */}

          {/* Bild des Sets anzeigen oder Platzhalter, wenn kein Bild verfügbar ist. */}
          {set.imageURL ? (
            <Image source={{ uri: set.imageURL }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="image-not-supported" size={60} color="#B0B0B0" />
              <Text style={styles.imagePlaceholderText}>Kein Bild verfügbar</Text>
            </View>
          )}

          {/* Informationszeile für die Setnummer. */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Setnummer:</Text>
            <Text style={styles.value}>{set.setNumber}</Text>
          </View>
          {/* Informationszeile für das Thema. */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Thema:</Text>
            <Text style={styles.value}>{set.theme || "Keine Angabe"}</Text> {/* "Keine Angabe", wenn Thema leer ist. */}
          </View>

          {/* Informationszeile für die Anzahl der Teile (nur anzeigen, wenn definiert). */}
          {set.pieces !== undefined && (
            <View style={styles.infoRow}>
              <View style={styles.iconLabelContainer}>
                <FontAwesome5 name="cube" size={18} color="#444444" style={styles.icon} /> {/* Würfel-Icon. */}
                <Text style={styles.label}>Teile:</Text>
              </View>
              <Text style={styles.value}>{set.pieces}</Text>
            </View>
          )}
          {/* Informationszeile für die Anzahl der Minifiguren (nur anzeigen, wenn definiert). */}
          {set.minifigs !== undefined && (
            <View style={styles.infoRow}>
              <View style={styles.iconLabelContainer}>
                <FontAwesome5 name="users" size={18} color="#444444" style={styles.icon} /> {/* Benutzer-Icon. */}
                <Text style={styles.label}>Minifiguren:</Text>
              </View>
              <Text style={styles.value}>{set.minifigs}</Text>
            </View>
          )}

          {/* Button zum Löschen des Sets. */}
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <MaterialIcons name="delete" size={24} color="#fff" /> {/* Löschen-Icon. */}
            <Text style={styles.deleteButtonText}>Set löschen</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  // Platzhalteransicht, um sicherzustellen, dass der Haupttitel zentriert bleibt.
  backButtonPlaceholder: {
    width: 28, // Gleiche Breite wie das Icon für die Zentrierung.
  },
  // Stil für den Haupttiteltext in der Kopfzeile.
  mainTitle: {
    fontSize: 28, // Große Schriftgröße.
    fontWeight: '800', // Extra fette Schriftstärke.
    color: '#222222', // Dunkle Textfarbe.
  },
  // Container für den Ladezustand, der den gesamten Bildschirm einnimmt.
  loadingContainer: {
    flex: 1, // Nimmt den gesamten verfügbaren Platz ein.
    justifyContent: 'center', // Zentriert den Inhalt vertikal.
    alignItems: 'center', // Zentriert den Inhalt horizontal.
    backgroundColor: '#FDFDFD', // Hintergrundfarbe.
  },
  // Stil für den Text, der während des Ladens angezeigt wird.
  loadingText: {
    marginTop: 15, // Abstand nach oben.
    fontSize: 18, // Schriftgröße.
    color: '#555', // Dunkelgraue Textfarbe.
  },
  // Stil für den Inhaltscontainer der ScrollView.
  scrollContent: {
    flexGrow: 1, // Ermöglicht es dem Inhalt zu wachsen.
    padding: 20, // Innenabstand.
    alignItems: 'center', // Zentriert den Inhalt horizontal.
  },
  // Stil für die Detailkarte, die die Set-Informationen enthält.
  detailCard: {
    backgroundColor: '#FFFFFF', // Weißer Hintergrund.
    borderRadius: 12, // Abgerundete Ecken.
    padding: 20, // Innerer Innenabstand.
    alignItems: 'center', // Zentriert den Inhalt horizontal.
    elevation: 6, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.15, // Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 4 }, // Schattenversatz.
    shadowRadius: 6, // Schattenunschärferadius.
    width: '100%', // Volle Breite.
    maxWidth: 400, // Maximale Breite für größere Bildschirme.
    marginTop: 20, // Abstand nach oben.
  },
  // Stil für den Titel des Sets auf der Detailseite.
  title: {
    fontSize: 26, // Große Schriftgröße.
    fontWeight: "800", // Sehr fette Schriftstärke.
    color: '#222222', // Dunkle Textfarbe.
    marginBottom: 20, // Abstand nach unten.
    textAlign: "center", // Text zentrieren.
  },
  // Stil für das Set-Bild.
  image: {
    width: '100%', // Volle Breite.
    height: 200, // Feste Höhe.
    borderRadius: 8, // Abgerundete Ecken.
    backgroundColor: '#E0E0E0', // Grauer Hintergrund (Platzhalter).
    marginBottom: 20, // Abstand nach unten.
    resizeMode: 'contain', // Bild wird skaliert, um vollständig sichtbar zu sein.
  },
  // Stil für den Bildplatzhalter, wenn kein Bild verfügbar ist.
  imagePlaceholder: {
    width: '100%', // Volle Breite.
    height: 200, // Feste Höhe.
    borderRadius: 8, // Abgerundete Ecken.
    backgroundColor: '#E0E0E0', // Grauer Hintergrund.
    marginBottom: 20, // Abstand nach unten.
    justifyContent: 'center', // Inhalt vertikal zentrieren.
    alignItems: 'center', // Inhalt horizontal zentrieren.
  },
  // Stil für den Text im Bildplatzhalter.
  imagePlaceholderText: {
    fontSize: 18, // Schriftgröße.
    color: '#888', // Graue Textfarbe.
    marginTop: 10, // Abstand nach oben.
  },
  // Stil für eine Informationszeile (Label und Wert).
  infoRow: {
    flexDirection: "row", // Elemente horizontal anordnen.
    justifyContent: "space-between", // Platz zwischen den Elementen verteilen.
    width: "100%", // Volle Breite.
    marginBottom: 10, // Abstand nach unten.
    paddingHorizontal: 5, // Horizontaler Innenabstand.
  },
  // Neuer Container für Icon und Label, um sie horizontal auszurichten.
  iconLabelContainer: {
    flexDirection: 'row', // Elemente horizontal anordnen.
    alignItems: 'center', // Elemente vertikal zentrieren.
  },
  // Stil für die Icons neben den Labels.
  icon: {
    marginRight: 8, // Abstand zwischen Icon und Text.
  },
  // Stil für die Labels (z.B. "Setnummer:").
  label: {
    fontWeight: "700", // Fette Schriftstärke.
    fontSize: 17, // Schriftgröße.
    color: '#444444', // Dunkelgraue Textfarbe.
  },
  // Stil für die Werte (z.B. die Setnummer).
  value: {
    fontSize: 17, // Schriftgröße.
    color: '#666666', // Hellgraue Textfarbe.
    flexShrink: 1, // Erlaubt Textumbruch bei langen Werten.
    textAlign: 'right', // Text rechts ausrichten.
  },
  // Stil für den "Set löschen"-Button.
  deleteButton: {
    flexDirection: 'row', // Elemente horizontal anordnen.
    alignItems: 'center', // Elemente vertikal zentrieren.
    backgroundColor: "#D32F2F", // Ein klares Rot für destruktive Aktionen.
    paddingVertical: 15, // Vertikaler Innenabstand.
    paddingHorizontal: 25, // Horizontaler Innenabstand.
    borderRadius: 10, // Abgerundete Ecken.
    marginTop: 30, // Abstand nach oben.
    width: '80%', // 80% der Breite des Elternteils.
    justifyContent: 'center', // Inhalt horizontal zentrieren.
    elevation: 4, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.2, // Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 2 }, // Schattenversatz.
    shadowRadius: 3, // Schattenunschärferadius.
  },
  // Stil für den Text im "Set löschen"-Button.
  deleteButtonText: {
    color: "#fff", // Weißer Text.
    fontWeight: "700", // Fette Schriftstärke.
    fontSize: 18, // Schriftgröße.
    marginLeft: 10, // Abstand zwischen Icon und Text.
  },
  // Container, wenn das Set nicht gefunden wurde.
  noSetFoundContainer: {
    flex: 1, // Nimmt den gesamten verfügbaren Platz ein.
    justifyContent: 'center', // Inhalt vertikal zentrieren.
    alignItems: 'center', // Inhalt horizontal zentrieren.
    padding: 20, // Innenabstand.
    backgroundColor: '#FDFDFD', // Gleicher Hintergrund wie `safeArea`.
  },
  // Stil für den Text, wenn das Set nicht gefunden wurde.
  noSetFoundText: {
    fontSize: 18, // Schriftgröße.
    color: '#D32F2F', // Dunkelrote Farbe für Fehlermeldungen.
    marginTop: 15, // Abstand nach oben.
    textAlign: 'center', // Text zentrieren.
    fontWeight: '600', // Halbfette Schriftstärke.
  },
  // Stil für den "Zurück zur Sammlung"-Button.
  homeButton: {
    backgroundColor: '#0057A6', // LEGO-Blauer Hintergrund.
    paddingVertical: 12, // Vertikaler Innenabstand.
    paddingHorizontal: 20, // Horizontaler Innenabstand.
    borderRadius: 10, // Abgerundete Ecken.
    marginTop: 20, // Abstand nach oben.
    elevation: 2, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.1, // Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 1 }, // Schattenversatz.
    shadowRadius: 2, // Schattenunschärferadius.
  },
  // Stil für den Text im "Zurück zur Sammlung"-Button.
  homeButtonText: {
    color: '#fff', // Weißer Text.
    fontSize: 16, // Schriftgröße.
    fontWeight: '600', // Halbfette Schriftstärke.
  },
});