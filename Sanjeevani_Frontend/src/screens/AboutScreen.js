import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBar from '../components/BottomNavBar';

const { width } = Dimensions.get('window');

// ─── Refined Green Palette (matches HomeScreen) ───────────────────────────────
const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_LIGHT    = '#4CAF72';
const THEME_SURFACE  = '#EAF4EC';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';
// ─────────────────────────────────────────────────────────────────────────────

const AboutScreen = ({ navigation }) => {
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    const checkGuestStatus = async () => {
      const guestFlag = await AsyncStorage.getItem('isGuest');
      if (guestFlag === 'true') {
        setIsGuestMode(true);
      }
    };
    checkGuestStatus();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_DARK} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Sanjeevani</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.section}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🌿</Text>
          </View>
          <Text style={styles.brandName}>Sanjeevani AI</Text>
          <Text style={styles.version}>Version 1.0.2 • 2026 Build</Text>
          <Text style={styles.description}>
            Sanjeevani is an intelligent health companion that bridges
            ancient Vedic wisdom with modern Generative Artificial Intelligence.
            By analyzing your unique Prakriti, we provide personalized guidance
            for a balanced, holistic life.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Core Features</Text>
          <BulletPoint text="Prakriti Analysis: Real-time assessment of Vata, Pitta, and Kapha balance." />
          <BulletPoint text="AI Health Chat: Intelligent Ayurvedic consultations via Gemini 1.5." />
          <BulletPoint text="Symptom Mapping: Diagnosis of 30+ classical Ayurvedic conditions." />
          <BulletPoint text="Digital Dinacharya: Lifestyle routines tailored to your body clock." />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>API Infrastructure & Engine</Text>
          <BulletPoint text="Predictive ML API: Uses an advanced custom model to intelligently map dynamic multi-symptom inputs to accurate classical Ayurvedic conditions." />
          <BulletPoint text="Generative AI API: Integrates Gemini 1.5 with extensive Ayurvedic literature to provide context-aware, real-time wellness consultations." />
          <BulletPoint text="Prakriti Classification API: Dynamically calculates your unique mind-body constitution (Vata, Pitta, Kapha) based on physical and psychological profiles." />
          <BulletPoint text="Offline-First Strategy: All API responses, including AI responses and symptom mappings, gracefully fallback to a dedicated local SQLite database for uninterrupted usage on the go." />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Technical Stack</Text>
          <View style={styles.techGrid}>
            <TechTag label="React Native" />
            <TechTag label="Django REST" />
            <TechTag label="Google Gemini" />
            <TechTag label="MongoDB" />
            <TechTag label="Axios" />
            <TechTag label="Expo Print" />
          </View>
        </View>

        <View style={styles.disclaimerCard}>
          <View style={styles.disclaimerHeader}>
            <Text style={styles.disclaimerEmoji}>⚠️</Text>
            <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
          </View>
          <Text style={styles.disclaimerText}>
            The insights provided by Sanjeevani AI are for educational and wellness
            purposes only. This application does not provide clinical medical diagnosis.
            {"\n\n"}
            Please consult with a qualified Ayurvedic practitioner or medical doctor
            before starting any new health regimen.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Developed for Final Year Project 2026</Text>
          <Text style={styles.footerText}>Built with ❤️ by Team Sanjeevani</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavBar navigation={navigation} activeScreen={isGuestMode ? "Family" : ""} />
    </View>
  );
};

const BulletPoint = ({ text }) => (
  <View style={styles.bulletRow}>
    <View style={styles.bulletDot} />
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

const TechTag = ({ label }) => (
  <View style={styles.techTag}>
    <Text style={styles.techTagText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,              // was 15
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 15,
    backgroundColor: THEME_DARK,       // was flat THEME_COLOR
    elevation: 8,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  backButton: { padding: 5 },
  backArrow:   { color: '#FFF', fontSize: 26, fontWeight: 'bold' },  // was 30
  headerTitle: { fontSize: 19, fontWeight: 'bold', color: '#FFF' },  // was 20

  scrollContent: { padding: 20, paddingBottom: 50 },

  // ── Logo Section
  section: { alignItems: 'center', marginBottom: 28 },  // was 30
  logoCircle: {
    width: 90, height: 90,
    borderRadius: 26,                  // squircle — was 45
    backgroundColor: THEME_SURFACE,   // was #E8F5E9
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 15,
    elevation: 4,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 10,
  },
  logoEmoji:   { fontSize: 45 },
  brandName:   { fontSize: 27, fontWeight: 'bold', color: THEME_DARK },   // was 28 / THEME_COLOR
  version:     { fontSize: 12, color: '#AAA', marginBottom: 14, fontWeight: '600' },
  description: { textAlign: 'center', color: TEXT_SECONDARY, lineHeight: 22, fontSize: 14, paddingHorizontal: 10 },  // was #555 / 15

  // ── Cards
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,                  // was 20
    padding: 20, marginBottom: 18,    // was 20
    elevation: 3,
    shadowColor: THEME_DARK,          // was no shadow color
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8,
    borderWidth: 1, borderColor: '#EBEBEB',  // was #F0F0F0
  },
  cardTitle:  { fontSize: 17, fontWeight: 'bold', color: THEME_DARK, marginBottom: 16 },  // was 18 / #1B5E20
  bulletRow:  { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' },
  bulletDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME_COLOR, marginTop: 6, marginRight: 12 },
  bulletText: { flex: 1, color: TEXT_SECONDARY, fontSize: 13, lineHeight: 21 },  // was #444 / 14

  // ── Tech Tags
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  techTag: {
    backgroundColor: THEME_SURFACE,   // was #F1F8E9
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1, borderColor: '#C8E6C9',  // was #DCEDC8
  },
  techTagText: { color: THEME_DARK, fontSize: 12, fontWeight: 'bold' },  // was THEME_COLOR

  // ── Disclaimer
  disclaimerCard: {
    backgroundColor: '#FFF1F0',
    borderRadius: 18,                  // was 20
    padding: 20,
    borderWidth: 1, borderColor: '#FFA39E',
  },
  disclaimerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  disclaimerEmoji:  { fontSize: 20, marginRight: 10 },
  disclaimerTitle:  { color: '#CF1322', fontWeight: 'bold', fontSize: 15 },  // was 16
  disclaimerText:   { color: '#5C0011', fontSize: 13, lineHeight: 20 },

  // ── Footer
  footer:     { marginTop: 24, alignItems: 'center' },
  footerText: { textAlign: 'center', color: '#CCC', fontSize: 11, marginBottom: 5, fontWeight: '600' },
});

export default AboutScreen;
