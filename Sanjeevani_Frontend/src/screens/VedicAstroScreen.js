import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = 'http://192.168.0.106:8000/api/v1';
const THEME_COLOR = '#4B0082'; // Indigo for Astrology

const VedicAstroScreen = ({ route, navigation }) => {
  const { dosha = 'Unknown' } = route.params || {};
  const [dob, setDob] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generateChart = async () => {
    if (!dob || !time || !location) {
      Alert.alert('Missing Details', 'Please fill in your Date of Birth, Time, and Location.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/vedic-astro/`, {
        dob, time, location, dosha
      }, { timeout: 20000 });
      setResult(response.data);
    } catch (e) {
      Alert.alert('Error', 'Could not connect to the cosmic grid. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vedic Astro + Ayurveda</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea}>
        {!result ? (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Enter Birth Details</Text>
            <Text style={styles.formSubtitle}>We use Gemini AI to align your cosmic chart with your Ayurvedic Dosha ({dosha}).</Text>

            <Text style={styles.label}>Date of Birth (DD/MM/YYYY)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 15/08/1990"
              value={dob}
              onChangeText={setDob}
            />

            <Text style={styles.label}>Time of Birth (HH:MM AM/PM)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 06:30 AM"
              value={time}
              onChangeText={setTime}
            />

            <Text style={styles.label}>City of Birth</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mumbai, India"
              value={location}
              onChangeText={setLocation}
            />

            <TouchableOpacity style={styles.generateBtn} onPress={generateChart} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Generate Cosmic Remedies</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            {/* Cosmic Profile */}
            <View style={styles.resultCard}>
              <Text style={styles.cardHeader}>✨ Cosmic Profile</Text>
              <View style={styles.row}>
                <Text style={styles.key}>Astrological Sign:</Text>
                <Text style={styles.val}>{result.astrological_sign}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.key}>Ruling Planet:</Text>
                <Text style={styles.val}>{result.ruling_planet}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.key}>Element:</Text>
                <Text style={styles.val}>{result.element}</Text>
              </View>
            </View>

            {/* Ayurvedic Remedies */}
            <View style={[styles.resultCard, { borderLeftColor: '#4CAF72', borderLeftWidth: 4 }]}>
              <Text style={styles.cardHeader}>🌿 Ayurvedic Integration</Text>
              <Text style={styles.summaryText}>{result.summary}</Text>
              {result.ayurvedic_remedies?.map((rem, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{rem}</Text>
                </View>
              ))}
            </View>

            {/* Gem Therapy */}
            <View style={[styles.resultCard, { borderLeftColor: '#00BCD4', borderLeftWidth: 4 }]}>
              <Text style={styles.cardHeader}>💎 Recommend Gemstones</Text>
              {result.recommended_gems?.map((gem, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>♦</Text>
                  <Text style={styles.bulletText}>{gem}</Text>
                </View>
              ))}
            </View>

            {/* Mantra */}
            <View style={[styles.resultCard, { borderLeftColor: '#F44336', borderLeftWidth: 4 }]}>
              <Text style={styles.cardHeader}>📿 Healing Mantra</Text>
              <Text style={styles.mantraText}>{result.mantra}</Text>
            </View>

            <TouchableOpacity style={styles.resetBtn} onPress={() => setResult(null)}>
              <Text style={styles.resetBtnText}>Calculate Another Chart</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F0F5' }, // Very light indigo tint
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: THEME_COLOR
  },
  backArrow:   { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scrollArea: { padding: 20 },

  formContainer: { backgroundColor: '#FFF', padding: 25, borderRadius: 16, elevation: 4 },
  formTitle: { fontSize: 22, fontWeight: 'bold', color: THEME_COLOR, marginBottom: 8 },
  formSubtitle: { fontSize: 13, color: '#666', marginBottom: 25, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: {
    backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#DDD', borderRadius: 8,
    padding: 12, marginBottom: 20, fontSize: 15, color: '#333'
  },
  generateBtn: {
    backgroundColor: THEME_COLOR, paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    marginTop: 10, elevation: 2
  },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  resultsContainer: { paddingBottom: 20 },
  resultCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 15, elevation: 3
  },
  cardHeader: { fontSize: 18, fontWeight: 'bold', color: THEME_COLOR, marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 8 },
  key: { fontSize: 15, color: '#555', fontWeight: '500' },
  val: { fontSize: 15, color: THEME_COLOR, fontWeight: 'bold' },
  summaryText: { fontSize: 14, color: '#333', fontStyle: 'italic', marginBottom: 15, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  bullet: { fontSize: 18, color: THEME_COLOR, marginRight: 10, lineHeight: 22 },
  bulletText: { fontSize: 15, color: '#444', flex: 1, lineHeight: 22 },
  mantraText: { fontSize: 18, fontWeight: 'bold', color: '#D32F2F', textAlign: 'center', marginVertical: 10 },
  resetBtn: {
    backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME_COLOR, paddingVertical: 15,
    borderRadius: 12, alignItems: 'center', marginTop: 10
  },
  resetBtnText: { color: THEME_COLOR, fontSize: 16, fontWeight: 'bold' },
});

export default VedicAstroScreen;
