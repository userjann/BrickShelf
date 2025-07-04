import { saveSet } from "@/utils/storage"; // Importiert die Funktion `saveSet` zum Speichern von LEGO-Set-Daten lokal.
import { MaterialIcons } from '@expo/vector-icons'; // Importiert MaterialIcons aus der Expo-Vektor-Icon-Bibliothek für UI-Symbole.
import * as Haptics from "expo-haptics"; // Importiert Expo Haptics für subtiles haptisches Feedback (Vibrationen).
import { router } from "expo-router"; // Importiert den Router von Expo Router für die Navigation zwischen Bildschirmen.
import { useState } from "react"; // Importiert den useState-Hook von React zur Verwaltung des Komponentenstatus.
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"; // Importiert Kern-UI-Komponenten von React Native.

// Ihr persönlicher Brickset API-Schlüssel. Dies ist eine sensible Information und sollte idealerweise
// in einer Produktions-App aus Umgebungsvariablen geladen werden, nicht direkt im Quellcode.
const BRICKSET_API_KEY = "3-3XeJ-Hc4c-PA4YE"

/**
 * Die Komponente `ManualAdd` ermöglicht es Benutzern, LEGO-Sets manuell hinzuzufügen, indem sie
 * nach ihrer Setnummer über die Brickset API suchen und die abgerufenen Details speichern.
 */
export default function ManualAdd() {
  // Zustandsvariablen zum Speichern der LEGO-Set-Details und des UI-Zustands.
  const [name, setName] = useState(""); // Speichert den Namen des LEGO-Sets.
  const [setNumber, setSetNumber] = useState(""); // Speichert die vom Benutzer eingegebene Setnummer.
  const [theme, setTheme] = useState(""); // Speichert das Thema des LEGO-Sets.
  const [imageURL, setImageURL] = useState<string | null>(null); // Speichert die URL des Set-Bildes.
  const [loading, setLoading] = useState(false); // Zeigt an, ob Daten gerade geladen oder gespeichert werden.
  const [pieces, setPieces] = useState<number | null>(null); // Speichert die Anzahl der Teile im Set.
  const [minifigs, setMinifigs] = useState<number | null>(null); // Speichert die Anzahl der Minifiguren im Set.
  const [hasSearched, setHasSearched] = useState(false); // Verfolgt, ob eine Suche versucht wurde (nützlich, um "keine Ergebnisse" oder anfängliche Anweisungen anzuzeigen).

  /**
   * Asynchrone Funktion zum Abrufen von LEGO-Set-Details von der Brickset API basierend auf der eingegebenen Setnummer.
   */
  async function fetchSetDetails() {
    // Eingabevalidierung: Prüfen, ob eine Setnummer eingegeben wurde.
    if (!setNumber) {
      Alert.alert("Eingabe fehlt", "Bitte geben Sie eine Setnummer ein.");
      return; // Stoppt die Ausführung, wenn keine Setnummer angegeben ist.
    }

    // Zurücksetzen relevanter Zustandsvariablen, bevor eine neue Suche gestartet wird.
    setLoading(true); // Ladeindikator anzeigen.
    setHasSearched(true); // Markieren, dass eine Suche gestartet wurde.
    setName("");
    setTheme("");
    setImageURL(null);
    setPieces(null);
    setMinifigs(null);

    try {
      // Kodieren der Abfrageparameter für die API-Anfrage.
      const params = encodeURIComponent(JSON.stringify({ query: setNumber }));
      // Erstellen der vollständigen API-URL.
      const url = `https://brickset.com/api/v3.asmx/getSets?apiKey=${BRICKSET_API_KEY}&userHash=&params=${params}`;

      // Daten von der Brickset API abrufen.
      const response = await fetch(url);
      const json = await response.json(); // Die JSON-Antwort parsen.

      const sets = json.sets; // Zugriff auf das 'sets'-Array aus der Antwort.

      // Wenn keine Sets zurückgegeben werden oder das Array leer ist, keine Ergebnisse anzeigen.
      if (!sets || sets.length === 0) {
        setLoading(false); // Ladeindikator ausblenden.
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Haptisches Fehler-Feedback geben.
        return; // Stoppt die Ausführung.
      }

      // Das erste gefundene Set nehmen (Annahme einer exakten Übereinstimmung bei Setnummer-Abfragen).
      const setData = sets[0];

      // Zustand mit den abgerufenen Set-Details aktualisieren. `|| ""` oder `|| null` behandeln potenziell fehlende Daten.
      setName(setData.name || "");
      setTheme(setData.theme || "");
      setImageURL(setData.image?.imageURL || null); // Optional Chaining für imageURL.
      setPieces(setData.pieces || null);
      setMinifigs(setData.minifigs || null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Haptisches Erfolgs-Feedback geben.

    } catch (e) {
      // Fehler während des API-Aufrufs abfangen und protokollieren.
      console.error("Fehler beim Abrufen der Daten:", e);
      Alert.alert("Fehler", "Es gab ein Problem beim Abrufen der Set-Informationen."); // Benutzer informieren.
    } finally {
      setLoading(false); // Ladeindikator immer ausblenden, wenn der Abrufvorgang abgeschlossen ist (Erfolg oder Fehler).
    }
  }

  /**
   * Asynchrone Funktion zum Speichern der abgerufenen LEGO-Set-Details im lokalen Speicher.
   */
  async function handleSave() {
    // Eingabevalidierung: Sicherstellen, dass Set-Name und -Nummer vorhanden sind, bevor gespeichert wird.
    if (!name || !setNumber) {
      Alert.alert("Fehler", "Bitte geben Sie eine gültige Setnummer ein und suchen Sie nach dem Set.");
      return; // Stoppt, wenn benötigte Daten fehlen.
    }

    setLoading(true); // Ladeindikator während des Speichervorgangs anzeigen.
    try {
      // Ruft die Funktion `saveSet` auf und übergibt die gesammelten Set-Daten.
      await saveSet({
        id: setNumber, // Setnummer als eindeutige ID verwenden.
        name,
        setNumber,
        theme,
        imageURL: imageURL ?? undefined, // Nullish Coalescing, um 'undefined' zu verwenden, falls null.
        pieces: pieces ?? undefined,
        minifigs: minifigs ?? undefined,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Haptisches Erfolgs-Feedback.
      Alert.alert("Erfolg", `${name} wurde deiner Sammlung hinzugefügt!`); // Erfolgsmeldung an den Benutzer.
      router.replace("/"); // Navigiert zurück zum Startbildschirm und ersetzt den aktuellen Bildschirm im Stack.
    } catch {
      // Fehler während des Speichervorgangs abfangen.
      Alert.alert("Fehler", "Set konnte nicht gespeichert werden."); // Benutzer über den Speicherfehler informieren.
    } finally {
      setLoading(false); // Ladeindikator ausblenden, wenn der Speichervorgang abgeschlossen ist.
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Kopfzeilenbereich mit Zurück-Button und Titel. */}
      <View style={styles.header}>
        {/* Pressbarer Zurück-Button: Navigiert zum vorherigen Bildschirm. */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#222222" />
        </Pressable>
        {/* Bildschirmtitel. */}
        <Text style={styles.mainTitle}>Set manuell hinzufügen</Text>
        {/* Platzhalter, um den Titel zu zentrieren, wenn kein Element auf der rechten Seite vorhanden ist. */}
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Scrollbarer Inhaltsbereich für das Eingabeformular und die Ergebnisse. */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Container für das Texteingabefeld und den Such-Button. */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Setnummer eingeben (z.B. 75318)" // Platzhaltertext.
            placeholderTextColor="#888" // Farbe für den Platzhalter.
            style={styles.input} // Styling für das Eingabefeld.
            keyboardType="numeric" // Stellt sicher, dass eine numerische Tastatur für Setnummern angezeigt wird.
            value={setNumber} // Bindet den Eingabewert an den `setNumber`-Zustand.
            onChangeText={text => {
              setSetNumber(text); // Aktualisiert den `setNumber`-Zustand bei Textänderung.
              // Wenn der Benutzer nach einer Suche zu tippen beginnt, werden frühere Ergebnisse gelöscht und `hasSearched` zurückgesetzt.
              if (hasSearched) {
                setName("");
                setTheme("");
                setImageURL(null);
                setPieces(null);
                setMinifigs(null);
                setHasSearched(false);
              }
            }}
            onSubmitEditing={fetchSetDetails} // Löst die Suche aus, wenn die 'Enter'-Taste gedrückt wird.
            editable={!loading} // Deaktiviert die Eingabe während des Ladens.
          />
          {/* Such-Button. */}
          <Pressable
            style={({ pressed }) => [
              styles.searchButton,
              pressed && { backgroundColor: '#004A8F' }, // Dunkleres Blau beim Drücken.
              loading && { backgroundColor: '#A0A0A0' } // Grau, wenn geladen wird.
            ]}
            onPress={fetchSetDetails} // Ruft `fetchSetDetails` beim Drücken auf.
            disabled={loading} // Deaktiviert den Button während des Ladens.
          >
            {/* Zeigt `ActivityIndicator` an, wenn geladen wird, ansonsten Suchsymbol und Text. */}
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="search" size={24} color="#FFF" />
                <Text style={styles.searchButtonText}>Suchen</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Ladeindikator und Nachricht, die während des API-Aufrufs angezeigt werden, wenn noch keine Ergebnisse erschienen sind. */}
        {loading && !name && hasSearched && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0057A6" />
            <Text style={styles.loadingText}>Set-Informationen werden geladen...</Text>
          </View>
        )}

        {/* Zeigt die abgerufenen Set-Details in einer Karte an, wenn nicht geladen wird, ein Name gefunden wurde und eine Suche stattgefunden hat. */}
        {!loading && name && hasSearched ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{name}</Text>

            {/* Zeigt Bild an, wenn URL existiert, ansonsten einen Platzhalter. */}
            {imageURL ? (
              <Image source={{ uri: imageURL }} style={styles.resultImage} resizeMode="contain" />
            ) : (
              <View style={styles.resultImagePlaceholder}>
                <MaterialIcons name="image-not-supported" size={60} color="#B0B0B0" />
                <Text style={styles.placeholderText}>Kein Bild verfügbar</Text>
              </View>
            )}

            {/* Anzeigereihen für Set-Informationen. */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Setnummer:</Text>
              <Text style={styles.infoValue}>{setNumber}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Thema:</Text>
              <Text style={styles.infoValue}>{theme || "N/A"}</Text> {/* "N/A", wenn Thema leer ist. */}
            </View>

            {/* Teile und Minifiguren werden bedingt angezeigt, wenn Werte vorhanden sind. */}
            {pieces !== null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teile:</Text>
                <Text style={styles.infoValue}>{pieces}</Text>
              </View>
            )}

            {minifigs !== null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Minifiguren:</Text>
                <Text style={styles.infoValue}>{minifigs}</Text>
              </View>
            )}

            {/* Speichern-Button: Erscheint nach einer erfolgreichen Suche, um das Set zu speichern. */}
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && { backgroundColor: '#008C00' }, // Dunkleres Grün beim Drücken.
                loading && { backgroundColor: '#A0A0A0' } // Grau, wenn geladen/gespeichert wird.
              ]}
              onPress={handleSave} // Ruft die Funktion `handleSave` auf, um das Set zu speichern.
              disabled={loading} // Deaktiviert den Button während des Ladens oder Speicherns.
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Speichert..." : "Set speichern"} {/* Text ändert sich je nach Ladezustand. */}
              </Text>
            </Pressable>
          </View>
        ) : null} {/* Rendert nichts, wenn kein erfolgreiches Suchergebnis angezeigt werden soll. */}

        {/* "Keine Ergebnisse"-Nachricht: Wird angezeigt, wenn nicht geladen wird, kein Name gefunden wurde, aber eine Suche versucht wurde. */}
        {!loading && !name && hasSearched && (
          <View style={styles.noResultContainer}>
            <MaterialIcons name="sentiment-dissatisfied" size={50} color="#D32F2F" /> {/* Trauriges Gesicht-Symbol. */}
            <Text style={styles.noResultText}>
              Kein LEGO Set gefunden für die Nummer: {setNumber} {/* Spezifische Fehlermeldung. */}
            </Text>
            {/* Button zum Löschen der Eingabe und erneutem Versuch. */}
            <Pressable onPress={() => { setSetNumber(''); setHasSearched(false); }} style={styles.clearButton}>
              <MaterialIcons name="backspace" size={20} color="#0057A6" />
              <Text style={styles.clearButtonText}>Eingabe löschen & neu versuchen</Text>
            </Pressable>
          </View>
        )}

        {/* Anfängliche Anweisungsnachricht: Wird angezeigt, wenn die Komponente zum ersten Mal geladen wird und noch keine Suche durchgeführt wurde. */}
        {!loading && !hasSearched && (
          <View style={styles.initialInstructionContainer}>
            <MaterialIcons name="info-outline" size={50} color="#B0B0B0" /> {/* Info-Symbol. */}
            <Text style={styles.initialInstructionText}>
              Geben Sie die LEGO-Setnummer ein und tippen Sie auf "Suchen". {/* Anweisungstext. */}
            </Text>
          </View>
        )}
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
  // Stil für den Inhaltscontainer der ScrollView, der es dem Inhalt ermöglicht zu wachsen und Polsterung hinzuzufügen.
  scrollContent: {
    flexGrow: 1, // Ermöglicht es dem Inhalt, sich auszudehnen und den verfügbaren Platz auszufüllen.
    padding: 20, // Polsterung um den scrollbaren Inhalt herum.
  },
  // Container für das Texteingabefeld und den Such-Button.
  inputContainer: {
    flexDirection: 'row', // Ordnet Eingabe und Button horizontal an.
    alignItems: 'center', // Vertikale Ausrichtung der Elemente.
    marginBottom: 20, // Platz unter dem Eingabebereich.
    marginTop: 10, // Platz über dem Eingabebereich, um ihn von der Kopfzeile zu trennen.
  },
  // Stil für das Texteingabefeld der Setnummer.
  input: {
    flex: 1, // Ermöglicht es der Eingabe, den größten Teil der verfügbaren Breite einzunehmen.
    borderColor: '#E0E0E0', // Heller grauer Rand.
    borderWidth: 1, // Randstärke.
    borderRadius: 10, // Abgerundete Ecken.
    paddingVertical: 12, // Vertikaler Innenabstand in der Eingabe.
    paddingHorizontal: 15, // Horizontaler Innenabstand in der Eingabe.
    fontSize: 16, // Schriftgröße für den Eingabetext.
    marginRight: 10, // Platz zwischen Eingabe und Such-Button.
    backgroundColor: '#FFFFFF', // Weißer Hintergrund.
    shadowColor: '#000', // Schatten für iOS.
    shadowOffset: { width: 0, height: 1 }, // Schattenversatz.
    shadowOpacity: 0.05, // Subtiler Schatten.
    shadowRadius: 2, // Schattenunschärferadius.
    elevation: 1, // Schatten für Android.
  },
  // Stil für den Such-Button.
  searchButton: {
    backgroundColor: '#0057A6', // LEGO-Blauer Hintergrund.
    paddingVertical: 12, // Vertikaler Innenabstand.
    paddingHorizontal: 20, // Horizontaler Innenabstand.
    borderRadius: 10, // Abgerundete Ecken.
    flexDirection: 'row', // Ordnet Symbol und Text horizontal an.
    alignItems: 'center', // Vertikale Ausrichtung von Symbol und Text.
    justifyContent: 'center', // Horizontale Zentrierung von Symbol und Text.
    elevation: 3, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.15, // Moderate Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 2 }, // Schattenversatz.
    shadowRadius: 3, // Schattenunschärferadius.
  },
  // Stil für den Text im Such-Button.
  searchButtonText: {
    color: '#FFF', // Weiße Textfarbe.
    marginLeft: 8, // Platz zwischen Symbol und Text.
    fontSize: 16, // Schriftgröße.
    fontWeight: '600', // Halbfette Schriftstärke.
  },
  // Container für den Ladeindikator und den Text.
  loadingContainer: {
    alignItems: 'center', // Zentriert den Inhalt horizontal.
    justifyContent: 'center', // Zentriert den Inhalt vertikal.
    paddingVertical: 50, // Vertikale Polsterung, um Platz zu schaffen.
  },
  // Stil für den Lade-Text.
  loadingText: {
    marginTop: 15, // Platz über dem Text.
    fontSize: 16, // Schriftgröße.
    color: '#555', // Dunkelgraue Textfarbe.
  },
  // Stil für die Karte, die Suchergebnisse anzeigt.
  resultCard: {
    backgroundColor: '#FFFFFF', // Weißer Hintergrund.
    borderRadius: 12, // Abgerundete Ecken.
    padding: 20, // Innerer Innenabstand.
    alignItems: 'center', // Zentriert den Inhalt horizontal.
    elevation: 6, // Stärkerer Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.15, // Moderate Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 4 }, // Größerer Schattenversatz.
    shadowRadius: 6, // Größerer Schattenunschärferadius.
    marginBottom: 20, // Platz unter der Karte.
    marginTop: 10, // Platz über der Karte.
  },
  // Stil für den Titel des Suchergebnisses.
  resultTitle: {
    fontSize: 24, // Große Schriftgröße.
    fontWeight: '700', // Fette Schriftstärke.
    color: '#222222', // Dunkle Textfarbe.
    marginBottom: 15, // Platz unter dem Titel.
    textAlign: 'center', // Text zentrieren.
  },
  // Stil für das Bild des LEGO-Sets.
  resultImage: {
    width: '100%', // Nimmt die volle Breite seines Containers ein.
    height: 200, // Feste Höhe.
    borderRadius: 8, // Abgerundete Ecken für das Bild.
    backgroundColor: '#E0E0E0', // Platzhalter-Hintergrundfarbe, falls das Bild langsam lädt oder fehlt.
    marginBottom: 20, // Platz unter dem Bild.
    resizeMode: 'contain', // Stellt sicher, dass das gesamte Bild innerhalb der Grenzen sichtbar ist.
  },
  // Stil für den Platzhalter, wenn kein Bild verfügbar ist.
  resultImagePlaceholder: {
    width: '100%', // Nimmt die volle Breite ein.
    height: 200, // Feste Höhe.
    borderRadius: 8, // Abgerundete Ecken.
    backgroundColor: '#E0E0E0', // Grauer Hintergrund.
    marginBottom: 20, // Platz darunter.
    justifyContent: 'center', // Zentriert den Inhalt vertikal.
    alignItems: 'center', // Zentriert den Inhalt horizontal.
  },
  // Stil für den Text im Bildplatzhalter.
  placeholderText: {
    fontSize: 18, // Schriftgröße.
    color: '#888', // Graue Textfarbe.
    marginTop: 10, // Platz über dem Text.
  },
  // Stil für eine Informationszeile (Beschriftung und Wert).
  infoRow: {
    flexDirection: 'row', // Ordnet Elemente horizontal an.
    justifyContent: 'space-between', // Verteilt den Raum zwischen Beschriftung und Wert.
    width: '100%', // Nimmt die volle Breite ein.
    marginBottom: 10, // Platz unter jeder Zeile.
    paddingHorizontal: 5, // Kleiner horizontaler Innenabstand.
  },
  // Stil für die Informationsbeschriftung (z.B. "Setnummer:").
  infoLabel: {
    fontWeight: '600', // Halbfette Schrift.
    fontSize: 16, // Schriftgröße.
    color: '#444444', // Dunkelgrauer Text.
  },
  // Stil für den Informationswert (z.B. "75318").
  infoValue: {
    fontSize: 16, // Schriftgröße.
    color: '#666666', // Heller grauer Text.
    flexShrink: 1, // Erlaubt dem Text, zu schrumpfen, wenn er zu lang ist.
    textAlign: 'right', // Text rechts ausrichten.
  },
  // Stil für den "Set speichern"-Button.
  saveButton: {
    backgroundColor: '#00A800', // Lebhaft grüner Hintergrund.
    paddingVertical: 15, // Vertikaler Innenabstand.
    paddingHorizontal: 25, // Horizontaler Innenabstand.
    borderRadius: 10, // Abgerundete Ecken.
    marginTop: 25, // Platz über dem Button.
    width: '80%', // Nimmt 80% der Breite des Elternteils ein.
    alignSelf: 'center', // Zentriert den Button horizontal.
    elevation: 4, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.2, // Moderate Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 2 }, // Schattenversatz.
    shadowRadius: 3, // Schattenunschärferadius.
  },
  // Stil für den Text im "Set speichern"-Button.
  saveButtonText: {
    color: '#fff', // Weißer Text.
    textAlign: 'center', // Text zentrieren.
    fontSize: 18, // Schriftgröße.
    fontWeight: '700', // Fette Schrift.
  },
  // Container für die Nachricht "Keine Ergebnisse gefunden".
  noResultContainer: {
    backgroundColor: '#FFFFFF', // Weißer Hintergrund.
    borderRadius: 12, // Abgerundete Ecken.
    padding: 30, // Innerer Innenabstand.
    alignItems: 'center', // Zentriert den Inhalt horizontal.
    justifyContent: 'center', // Zentriert den Inhalt vertikal.
    elevation: 4, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.1, // Subtiler Schatten.
    shadowOffset: { width: 0, height: 2 }, // Schattenversatz.
    shadowRadius: 4, // Schattenunschärferadius.
    minHeight: 200, // Minimale Höhe.
    marginTop: 20, // Platz darüber.
  },
  // Stil für den Text "Keine Ergebnisse".
  noResultText: {
    textAlign: 'center', // Text zentrieren.
    fontSize: 17, // Schriftgröße.
    color: '#D32F2F', // Dunkelrot für Fehler/Warnung.
    marginTop: 15, // Platz darüber.
    fontWeight: '600', // Halbfette Schrift.
  },
  // Stil für den "Eingabe löschen & neu versuchen"-Button.
  clearButton: {
    flexDirection: 'row', // Ordnet Symbol und Text horizontal an.
    alignItems: 'center', // Vertikale Ausrichtung von Symbol und Text.
    marginTop: 20, // Platz darüber.
    paddingVertical: 10, // Vertikaler Innenabstand.
    paddingHorizontal: 20, // Horizontaler Innenabstand.
    backgroundColor: '#EBF6FF', // Heller blauer Hintergrund.
    borderRadius: 25, // Stark abgerundete Ecken (Pillenform).
  },
  // Stil für den Text im Löschen-Button.
  clearButtonText: {
    marginLeft: 10, // Platz zwischen Symbol und Text.
    color: '#0057A6', // LEGO-Blauer Text.
    fontSize: 16, // Schriftgröße.
    fontWeight: '600', // Halbfette Schrift.
  },
  // Container für die anfängliche Anweisungsnachricht.
  initialInstructionContainer: {
    backgroundColor: '#FFFFFF', // Weißer Hintergrund.
    borderRadius: 12, // Abgerundete Ecken.
    padding: 30, // Innerer Innenabstand.
    alignItems: 'center', // Zentriert den Inhalt horizontal.
    justifyContent: 'center', // Zentriert den Inhalt vertikal.
    elevation: 4, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.1, // Subtiler Schatten.
    shadowOffset: { width: 0, height: 2 }, // Schattenversatz.
    shadowRadius: 4, // Schattenunschärferadius.
    minHeight: 150, // Minimale Höhe.
    marginTop: 20, // Platz darüber.
  },
  // Stil für den anfänglichen Anweisungstext.
  initialInstructionText: {
    textAlign: 'center', // Text zentrieren.
    fontSize: 17, // Schriftgröße.
    color: '#555', // Dunkelgrauer Text.
    marginTop: 15, // Platz darüber.
    fontWeight: '600', // Halbfette Schrift.
  }
});