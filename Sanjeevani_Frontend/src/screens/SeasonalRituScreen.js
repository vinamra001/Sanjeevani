import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = 'http://192.168.0.106:8000/api/v1';

const SeasonalRituScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [rituData, setRituData] = useState(null);

  useEffect(() => {
    fetchRituData();
  }, []);

  const fetchRituData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/seasonal-guide/`, { timeout: 8000 });
      setRituData(response.data);
    } catch (e) {
      // Offline fallback
      let dosha = 'Vata';
      try { dosha = await AsyncStorage.getItem('userPrakriti') || 'Vata'; } catch(err){}
      
      const currentMonth = new Date().getMonth();
      let rituName = "Vasant (Spring)";
      let rituTheme = "#1E5C33";
      
      if (currentMonth === 4 || currentMonth === 5) { rituName = "Grishma (Summer)"; rituTheme = "#F57C00"; }
      if (currentMonth === 6 || currentMonth === 7) { rituName = "Varsha (Monsoon)"; rituTheme = "#1976D2"; }
      if (currentMonth === 8 || currentMonth === 9) { rituName = "Sharad (Autumn)"; rituTheme = "#FBC02D"; }
      if (currentMonth === 10 || currentMonth === 11) { rituName = "Hemant (Pre-winter)"; rituTheme = "#5D4037"; }
      if (currentMonth === 0 || currentMonth === 1) { rituName = "Shishir (Winter)"; rituTheme = "#455A64"; }

      setRituData({
          ritu: rituName,
          theme_color: rituTheme,
          dosha_status: `Dosha Detected: ${dosha}`,
          diet_to_eat: ["Warm, locally sourced foods", "Seasonal fruits and vegetables", "Herbal teas and warm water"],
          diet_to_avoid: ["Cold, frozen, or processed foods", "Excessive caffeine", "Extremely spicy or heavy combinations"],
          lifestyle: ["Daily oil massage (Abhyanga)", "Mild to moderate evening exercise", "Mindful breathing and sleep routines"]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E5C33" />
      </View>
    );
  }

  const themeColor = rituData?.theme_color || '#1E5C33';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAF8' }]}>
      <StatusBar barStyle="light-content" backgroundColor={themeColor} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seasonal Guide</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea}>
        {/* Title Banner */}
        <View style={[styles.heroCard, { backgroundColor: themeColor }]}>
          <Text style={styles.seasonLabel}>Current Ayurvedic Season</Text>
          <Text style={styles.seasonTitle}>{rituData?.ritu}</Text>
          
          <View style={styles.doshaBox}>
            <Text style={styles.doshaText}>{rituData?.dosha_status}</Text>
          </View>
        </View>

        {/* Diet Guidelines */}
        <Text style={[styles.sectionHeading, { color: themeColor }]}>🌿 Diet Recommendations</Text>
        <View style={styles.card}>
          <Text style={styles.cardSubTitle}>Favor Eating:</Text>
          {rituData?.diet_to_eat.map((item, index) => (
            <View key={index} style={styles.listItemRow}>
              <Text style={styles.bullet}>✓</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
          
          <Text style={[styles.cardSubTitle, { marginTop: 15, color: '#D32F2F' }]}>Strictly Avoid:</Text>
          {rituData?.diet_to_avoid.map((item, index) => (
            <View key={index} style={styles.listItemRow}>
              <Text style={[styles.bullet, { color: '#D32F2F' }]}>✗</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Lifestyle */}
        <Text style={[styles.sectionHeading, { color: themeColor }]}>🧘 Lifestyle Changes</Text>
        <View style={styles.card}>
          {rituData?.lifestyle.map((item, index) => (
            <View key={index} style={styles.listItemRow}>
              <Text style={[styles.bullet, { color: themeColor }]}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  backArrow:   { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scrollArea: { padding: 20 },
  heroCard: {
    borderRadius: 20, padding: 25, marginBottom: 25,
    alignItems: 'center', elevation: 6, shadowColor: '#000',
    shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 },
  },
  seasonLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  seasonTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', marginBottom: 15 },
  doshaBox: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12 },
  doshaText: { color: '#FFF', fontWeight: '600', fontSize: 12, textAlign: 'center' },
  
  sectionHeading: { fontSize: 18, fontWeight: '800', marginBottom: 12, marginLeft: 5 },
  card: {
    backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 25,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8
  },
  cardSubTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E5C33', marginBottom: 10 },
  listItemRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'center' },
  bullet: { fontSize: 16, color: '#4CAF72', marginRight: 10, fontWeight: 'bold' },
  listText: { fontSize: 15, color: '#333', flex: 1, lineHeight: 22 }
});

export default SeasonalRituScreen;
