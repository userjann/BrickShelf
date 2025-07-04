import { getSavedSets } from "@/utils/storage";
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { PieChart } from 'react-native-svg-charts';

interface LegoSet {
  id: string;
  name: string;
  setNumber: string;
  theme: string;
  imageURL?: string;
  pieces?: number;
  minifigs?: number;
}

export default function Stats() {
  const [sets, setSets] = useState<LegoSet[]>([]);
  const [totalSets, setTotalSets] = useState(0);
  const [totalPieces, setTotalPieces] = useState(0);
  const [totalMinifigs, setTotalMinifigs] = useState(0);
  const [themeDistribution, setThemeDistribution] = useState<{[theme: string]: number}>({});

  useEffect(() => {
    async function loadSets() {
      const savedSets = await getSavedSets();
      setSets(savedSets);

      setTotalSets(savedSets.length);

      const piecesSum = savedSets.reduce((sum, s) => sum + (s.pieces || 0), 0);
      const minifigsSum = savedSets.reduce((sum, s) => sum + (s.minifigs || 0), 0);
      setTotalPieces(piecesSum);
      setTotalMinifigs(minifigsSum);

      const themeCount: {[key: string]: number} = {};
      savedSets.forEach(s => {
        const theme = s.theme || "Unbekannt";
        themeCount[theme] = (themeCount[theme] || 0) + 1;
      });
      setThemeDistribution(themeCount);
    }

    loadSets();
  }, []);

  const legoChartColors = [
    '#DD1C1A', '#005C9D', '#FFD700', '#009E00', '#FF8800', '#60B731',
    '#8A2BE2', '#00CED1', '#9966FF', '#FF6384', '#A0522D', '#4682B4',
  ];

  const pieData = Object.entries(themeDistribution).map(([theme, count], index) => ({
    key: theme,
    value: count,
    svg: { fill: legoChartColors[index % legoChartColors.length] },
    arc: { outerRadius: '100%', cornerRadius: 5 },
  }));

  function renderLegend() {
    return pieData.map(item => (
      <View key={item.key} style={styles.legendItem}>
        <View style={[styles.legendColorBox, { backgroundColor: item.svg.fill }]} />
        <Text style={styles.legendText}>{item.key} ({((item.value / totalSets) * 100).toFixed(1)}%)</Text>
      </View>
    ));
  }

  function renderThemeStats() {
    return Object.entries(themeDistribution)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([theme, count]) => {
        const percent = totalSets > 0 ? ((count / totalSets) * 100).toFixed(1) : "0";
        const colorIndex = Object.keys(themeDistribution).indexOf(theme);
        return (
          <View key={theme} style={styles.themeRow}>
            <View style={[styles.themeColorIndicator, { backgroundColor: legoChartColors[colorIndex % legoChartColors.length] }]} />
            <Text style={styles.themeName}>{theme}</Text>
            <Text style={styles.themeCount}>{count} Sets ({percent}%)</Text>
          </View>
        );
      });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.mainTitle}>Deine Statistik</Text>
        {/* Platzhalter für Zentrierung */}
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Sammlungs-Übersicht</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <FontAwesome5 name="cubes" size={30} color="#0057A6" />
            <Text style={styles.statLabel}>Gesamte Sets</Text>
            <Text style={styles.statValue}>{totalSets}</Text>
          </View>

          <View style={styles.statCard}>
            <FontAwesome5 name="puzzle-piece" size={30} color="#DD1C1A" />
            <Text style={styles.statLabel}>Gesamte Teile</Text>
            <Text style={styles.statValue}>{totalPieces}</Text>
          </View>

          <View style={styles.statCard}>
            <FontAwesome5 name="user-ninja" size={30} color="#009E00" />
            <Text style={styles.statLabel}>Gesamte Minifiguren</Text>
            <Text style={styles.statValue}>{totalMinifigs}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Verteilung nach Themen</Text>
        
        {totalSets === 0 ? (
          <View style={styles.emptyChartContainer}>
            <FontAwesome5 name="chart-pie" size={60} color="#B0B0B0" />
            <Text style={styles.emptyChartText}>Füge Sets hinzu, um Statistiken zu sehen!</Text>
          </View>
        ) : (
          <>
            <View style={styles.chartAndLegendContainer}>
              <View style={styles.pieChartContainer}>
                <PieChart
                  style={{ flex: 1 }}
                  data={pieData}
                  innerRadius={50}
                  outerRadius={'95%'}
                  padAngle={0.01}
                />
              </View>
              <View style={styles.legendContainer}>
                {renderLegend()}
              </View>
            </View>

            <Text style={[styles.sectionSubtitle, { marginTop: 20 }]}>Detaillierte Themenübersicht</Text>
            <View style={styles.themeListContainer}>
              {renderThemeStats()}
            </View>
          </>
        )}
      </ScrollView>
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
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    minHeight: 120,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 10,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222222',
    marginTop: 5,
  },
  chartAndLegendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pieChartContainer: {
    height: 200,
    width: '50%',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    padding: 10,
  },
  legendContainer: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendColorBox: {
    width: 18,
    height: 18,
    marginRight: 10,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: '#333333',
    flexShrink: 1,
  },
  themeListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  themeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  themeColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  themeName: {
    fontWeight: "600",
    fontSize: 15,
    color: "#333333",
    flex: 1,
  },
  themeCount: {
    fontSize: 15,
    color: "#555555",
  },
  emptyChartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  emptyChartText: {
    fontSize: 18,
    color: '#888',
    marginTop: 20,
    textAlign: 'center',
  },
});
