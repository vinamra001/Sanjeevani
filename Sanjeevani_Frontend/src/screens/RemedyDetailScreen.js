import React from 'react';
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

const RemedyDetailScreen = ({ navigation, route }) => {
  const { remedy } = route.params || {};

  if (!remedy) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor={THEME_DARK} />
        <Text style={styles.errorEmoji}>🍃</Text>
        <Text style={styles.errorText}>Remedy details not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_DARK} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Remedy Guide</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.headerIcon}>❤️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Title Section ── */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>{remedy.title}</Text>
          <Text style={styles.sanskritTitle}>{remedy.sanskrit}</Text>
        </View>

        {/* ── Benefits Overview ── */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.cardIcon}>✨</Text>
            <Text style={styles.cardLabel}>Primary Benefits</Text>
          </View>
          <Text style={styles.cardText}>{remedy.benefit}</Text>
        </View>

        {/* ── Ingredients List ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Required Ingredients</Text>
        </View>
        <View style={styles.ingredientsContainer}>
          {remedy.ingredients.map((item, index) => (
            <View key={index} style={styles.ingredientItem}>
              <View style={styles.greenDot} />
              <Text style={styles.ingredientText}>{item}</Text>
            </View>
          ))}
        </View>

        [Image showing the measurement of raw Ayurvedic ingredients in traditional units]

        {/* ── Preparation Steps ── */}
        <View style={styles.highlightCard}>
          <View style={styles.row}>
            <Text style={styles.cardIcon}>🥣</Text>
            <Text style={[styles.cardLabel, { color: THEME_DARK }]}>Preparation Method</Text>
          </View>
          <Text style={styles.prepText}>{remedy.preparation}</Text>
        </View>

        {/* ── Usage & Dosage ── */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.cardIcon}>🕒</Text>
            <Text style={styles.cardLabel}>Usage Instructions</Text>
          </View>
          <Text style={styles.cardText}>{remedy.usage}</Text>

          <View style={styles.dosageBadge}>
            <Text style={styles.dosageLabel}>RECOMMENDED DOSAGE: </Text>
            <Text style={styles.dosageValue}>{remedy.dose}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.fullBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.fullBackButtonText}>Back to All Remedies</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },

  // ── Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 15,
    backgroundColor: THEME_DARK,          // was flat THEME_COLOR
    elevation: 8,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8,
  },
  backButton:  { padding: 5 },
  backArrow:   { color: '#FFF', fontSize: 26, fontWeight: 'bold' },  // was 30
  headerTitle: { color: '#FFF', fontSize: 19, fontWeight: 'bold' },  // was 20
  headerIcon:  { fontSize: 22, color: '#FFF' },
  iconButton:  { padding: 5 },

  scrollContent: { padding: 20 },

  // ── Title
  titleSection:  { marginBottom: 22 },
  mainTitle:     { fontSize: 28, fontWeight: 'bold', color: THEME_DARK, letterSpacing: -0.5 },  // was #1B5E20 / 30
  sanskritTitle: { fontSize: 16, color: TEXT_SECONDARY, fontStyle: 'italic', marginTop: 4 },    // was #4D7C59 / 18

  // ── Cards
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18, padding: 20, marginBottom: 18,
    elevation: 3,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8,
    borderWidth: 1, borderColor: '#EBEBEB',  // was #F0F0F0
  },
  highlightCard: {
    backgroundColor: THEME_SURFACE,       // was #E8F5E9
    borderRadius: 18, padding: 20, marginBottom: 18,
    borderWidth: 1, borderColor: '#C8E6C9',
    elevation: 2,
  },
  row:       { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIcon:  { fontSize: 20, marginRight: 12 },
  cardLabel: { fontSize: 13, fontWeight: 'bold', color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 1 },
  cardText:  { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 24 },
  prepText:  { fontSize: 14, color: THEME_DARK, lineHeight: 24, fontWeight: '500' },

  // ── Section Header
  sectionHeader: { marginBottom: 14, borderLeftWidth: 5, borderLeftColor: THEME_COLOR, paddingLeft: 12 },
  sectionTitle:  { fontSize: 17, fontWeight: 'bold', color: TEXT_PRIMARY },  // was 18 / #333

  // ── Ingredients
  ingredientsContainer: { marginBottom: 22, paddingLeft: 5 },
  ingredientItem:       { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  greenDot:             { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME_COLOR, marginRight: 15 },
  ingredientText:       { fontSize: 15, color: TEXT_PRIMARY, fontWeight: '600' },  // was #444 / 16

  // ── Dosage Badge
  dosageBadge: {
    marginTop: 16,
    backgroundColor: THEME_SURFACE,       // was #F1F8E9
    padding: 14, borderRadius: 13,        // was 15
    flexDirection: 'row', justifyContent: 'center',
    borderWidth: 1, borderColor: '#C8E6C9',  // was #DCEDC8
  },
  dosageLabel: { fontSize: 12, fontWeight: 'bold', color: TEXT_SECONDARY },  // was #558B2F
  dosageValue: { fontSize: 12, fontWeight: 'bold', color: THEME_COLOR, marginLeft: 5 },

  // ── Back Button
  fullBackButton: {
    backgroundColor: THEME_COLOR, padding: 17,
    borderRadius: 14, alignItems: 'center', marginTop: 10,
    elevation: 5,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22, shadowRadius: 10,
  },
  fullBackButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // ── Error State
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND },
  errorEmoji: { fontSize: 60, marginBottom: 20 },
  errorText:  { fontSize: 17, color: TEXT_SECONDARY, fontWeight: '500' },
  retryBtn:   { marginTop: 20, paddingHorizontal: 30, paddingVertical: 12, backgroundColor: THEME_COLOR, borderRadius: 10 },
  retryBtnText: { color: '#FFF', fontWeight: 'bold' },
});

export default RemedyDetailScreen;
