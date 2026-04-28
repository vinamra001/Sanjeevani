import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Modal,
  Animated,
  PanResponder,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBar from '../components/BottomNavBar';
import { queryOfflineRemedies } from '../utils/DatabaseInit';
import { API_BASE_URL } from '../constants';

const { width, height } = Dimensions.get('window');

const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_LIGHT    = '#4CAF72';
const THEME_SURFACE  = '#EAF4EC';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';

const DOSHA_COLORS = {
  'Vata':        { bg: '#EDE7F6', text: '#4527A0', border: '#B39DDB' },
  'Pitta':       { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' },
  'Kapha':       { bg: '#E3F2FD', text: '#0D47A1', border: '#90CAF9' },
  'Vata-Pitta':  { bg: '#FCE4EC', text: '#880E4F', border: '#F48FB1' },
  'Pitta-Kapha': { bg: '#F3E5F5', text: '#6A1B9A', border: '#CE93D8' },
  'Vata-Kapha':  { bg: '#E8F5E9', text: '#1B5E20', border: '#A5D6A7' },
  'General':     { bg: THEME_SURFACE, text: THEME_DARK, border: '#A5D6A7' },
  'Kapha-Vata':  { bg: '#E8F5E9', text: '#1B5E20', border: '#A5D6A7' },
};
const getDoshaStyle = (d) => DOSHA_COLORS[d] || DOSHA_COLORS['General'];

// ── Normalise backend response → always an array ─────────────────────────────
const normalisePredictions = (data) => {
  if (!data) return [];

  const enrich = (p) => ({
    ...p,
    // description may come as 'description' or 'detail' or 'about' from different serializers
    description:           p.description || p.detail || p.about || '',
    foods_to_take:         p.foods_to_take         || '',
    foods_to_avoid:        p.foods_to_avoid        || '',
    lifestyle_routine:     p.lifestyle_routine     || '',
    recommended_exercises: p.recommended_exercises || '',
  });

  if (Array.isArray(data.predictions)) return data.predictions.map(enrich);
  if (Array.isArray(data)) return data.map(enrich);
  if (data.disease_name || data.name) {
    return [enrich({
      name:          data.name          || data.disease_name || 'Unknown',
      sanskrit_name: data.sanskrit_name || '',
      dosha_type:    data.dosha_type    || 'General',
      confidence:    data.confidence    || 90,
      match_count:   data.match_count   || 1,
      diet_plan:     data.diet_plan     || '',
      remedies:      data.remedies      || (data.remedy ? [data.remedy] : []),
      description:   data.description   || data.detail || data.about || '',
      foods_to_take:         data.foods_to_take         || '',
      foods_to_avoid:        data.foods_to_avoid        || '',
      lifestyle_routine:     data.lifestyle_routine     || '',
      recommended_exercises: data.recommended_exercises || '',
    })];
  }
  return [];
};

// ── Ayurvedic Insights Bottom Sheet ──────────────────────────────────────────
const TABS = [
  { key: 'overview',  icon: '🌿', label: 'Overview',  color: '#2D7D46', bg: '#EAF4EC' },
  { key: 'foods',     icon: '🥗', label: 'Foods',     color: '#F57C00', bg: '#FFF8F0' },
  { key: 'lifestyle', icon: '🌅', label: 'Lifestyle', color: '#6A1B9A', bg: '#F5F0FF' },
  { key: 'yoga',      icon: '🧘', label: 'Yoga',      color: '#0277BD', bg: '#EEF6FF' },
];

const InsightsModal = ({ visible, onClose, item }) => {
  const slideAnim   = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (visible) {
      setActiveTab('overview');
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: height, duration: 260, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!item) return null;

  const activeTabObj = TABS.find(t => t.key === activeTab) || TABS[0];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return item.description ? (
          <>
            <View style={mS.descCard}>
              <Text style={mS.descLabel}>ABOUT THIS CONDITION</Text>
              <Text style={mS.descText}>{item.description}</Text>
            </View>
          </>
        ) : <EmptyNote />;

      case 'foods':
        return (
          <>
            {item.foods_to_take ? (
              <FoodCard
                title="Recommended Foods"
                content={item.foods_to_take}
                icon="✅"
                color="#2D7D46"
                bg="#F0FAF3"
                borderColor="#A5D6A7"
              />
            ) : null}
            {item.foods_to_avoid ? (
              <FoodCard
                title="Foods to Avoid"
                content={item.foods_to_avoid}
                icon="🚫"
                color="#C62828"
                bg="#FFF3F3"
                borderColor="#EF9A9A"
              />
            ) : null}
            {!item.foods_to_take && !item.foods_to_avoid && <EmptyNote />}
          </>
        );

      case 'lifestyle':
        return item.lifestyle_routine ? (
          <RoutineCard content={item.lifestyle_routine} />
        ) : <EmptyNote />;

      case 'yoga':
        return item.recommended_exercises ? (
          <YogaCard content={item.recommended_exercises} />
        ) : <EmptyNote />;

      default:
        return null;
    }
  };

  return (
    <Modal transparent visible={visible} statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[mS.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[mS.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={mS.handle} />

        {/* Header */}
        <View style={mS.header}>
          <View style={[mS.headerIcon, { backgroundColor: activeTabObj.bg }]}>
            <Text style={{ fontSize: 20 }}>{activeTabObj.icon}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={mS.headerTitle}>Ayurvedic Insights</Text>
            <Text style={mS.headerSub} numberOfLines={1}>
              {item.name}{item.sanskrit_name ? `  ·  ${item.sanskrit_name}` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={mS.closeBtn}>
            <Text style={mS.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tab bar */}
        <View style={mS.tabBar}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[mS.tabItem, isActive && { borderBottomWidth: 2.5, borderBottomColor: tab.color }]}
                activeOpacity={0.7}
              >
                <Text style={mS.tabIcon}>{tab.icon}</Text>
                <Text style={[mS.tabLabel, isActive && { color: tab.color, fontWeight: '700' }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 18, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

// Sub-components for each tab
const EmptyNote = () => (
  <View style={mS.emptyWrap}>
    <Text style={{ fontSize: 36 }}>🍃</Text>
    <Text style={mS.emptyText}>No information available</Text>
  </View>
);

const FoodCard = ({ title, content, icon, color, bg, borderColor }) => {
  const items = content.split(',').map(s => s.trim()).filter(Boolean);
  return (
    <View style={[mS.foodCard, { backgroundColor: bg, borderColor }]}>
      <View style={mS.foodCardHeader}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
        <Text style={[mS.foodCardTitle, { color }]}>{title}</Text>
      </View>
      <View style={mS.chipWrap}>
        {items.map((item, i) => (
          <View key={i} style={[mS.chip, { borderColor, backgroundColor: '#fff' }]}>
            <Text style={[mS.chipText, { color }]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const RoutineCard = ({ content }) => {
  const steps = content.split(';').map(s => s.trim()).filter(Boolean);
  return (
    <View>
      {steps.map((step, i) => (
        <View key={i} style={mS.routineRow}>
          <View style={mS.routineDot}>
            <Text style={mS.routineDotText}>{i + 1}</Text>
          </View>
          <Text style={mS.routineText}>{step}</Text>
        </View>
      ))}
    </View>
  );
};

const YOGA_EMOJIS = ['🧘', '🌬️', '🙏', '⚡', '🌿', '🔥', '💫', '🌙', '☀️', '🍃'];

const YogaCard = ({ content }) => {
  // Split by semicolon first, then comma — handles both separator styles
  const raw = content.split(/;|,/).map(s => s.trim()).filter(Boolean);
  return (
    <View>
      <View style={mS.yogaBanner}>
        <Text style={mS.yogaBannerText}>🧘 Yoga & Pranayama</Text>
        <Text style={mS.yogaBannerSub}>{raw.length} practice{raw.length !== 1 ? 's' : ''} recommended</Text>
      </View>
      {raw.map((pose, i) => (
        <View key={i} style={mS.yogaRow}>
          <View style={mS.yogaIconBox}>
            <Text style={{ fontSize: 18 }}>{YOGA_EMOJIS[i % YOGA_EMOJIS.length]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={mS.yogaPoseText}>{pose}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const ResultsScreen = ({ route, navigation }) => {
  const { symptoms, dosha, userName, isGuest } = route.params || {
    symptoms: [],
    dosha: 'Unknown',
    userName: '',
    isGuest: false,
  };

  const [loading, setLoading]             = useState(true);
  const [predictions, setPredictions]     = useState([]);
  const [resolvedDosha, setResolvedDosha] = useState(dosha || 'Unknown');
  const [insightsItem, setInsightsItem]   = useState(null);
  const [insightsVisible, setInsightsVisible] = useState(false);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    let activeDosha = dosha;
    if (!activeDosha || activeDosha === 'Unknown' || activeDosha === 'Not Analyzed') {
      const saved = await AsyncStorage.getItem('userDosha')
                 || await AsyncStorage.getItem('userPrakriti');
      if (saved && saved !== 'Unknown') {
        activeDosha = saved;
        setResolvedDosha(saved);
      }
    }

    const symptomArray = Array.isArray(symptoms)
      ? symptoms
      : String(symptoms).split(',').map(s => s.trim()).filter(Boolean);

    try {
      const response = await axios.post(`${API_BASE_URL}/predict/`, {
        symptom_names: symptomArray,
        username: userName,
        dosha: activeDosha,
      }, { timeout: 15000 });

      const parsed = normalisePredictions(response.data);
      setPredictions(parsed);

    } catch (error) {
      console.warn("Prediction API Error (falling back to offline DB):", error.message);
      try {
        const offlineMatches = await queryOfflineRemedies(symptomArray);
        if (offlineMatches && offlineMatches.length > 0) {
          setPredictions(offlineMatches);
        } else {
          Alert.alert("Offline Mode", "Sanjeevani could not find a match in the offline database. Try different symptoms.");
        }
      } catch (offlineErr) {
        Alert.alert(
          "Connection Issue",
          "Sanjeevani could not reach the diagnosis engine or the local database. Please try again later."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewRemedies = async (item) => {
    try {
      if (!isGuest) {
        const historyData = {
          name:     item.name,
          remedies: item.remedies || [],
          diet:     item.diet_plan,
        };
        await AsyncStorage.setItem('last_diagnosis', JSON.stringify(historyData));
      }
      navigation.navigate('AyurvedicRemedies', {
        remedies:    item.remedies || [],
        diseaseName: item.name,
      });
    } catch (e) {
      console.error("History Save Error:", e);
    }
  };

  const handleOpenInsights = (item) => {
    setInsightsItem(item);
    setInsightsVisible(true);
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  };

  const confLabel = (v) =>
    v >= 85 ? 'Strong Match' : v >= 65 ? 'Good Match' : 'Possible Match';
  const confColor = (v) =>
    v >= 85 ? '#2D7D46' : v >= 65 ? '#F57C00' : '#C62828';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_DARK} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>
            {isGuest ? 'Family Diagnosis' : 'Diagnosis Results'}
          </Text>
          {Array.isArray(symptoms) && symptoms.length > 0 && (
            <Text style={styles.headerSub}>
              {symptoms.length} symptom{symptoms.length > 1 ? 's' : ''} analysed
            </Text>
          )}
        </View>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <View style={styles.loaderCard}>
            <Text style={styles.loaderEmoji}>🌿</Text>
            <ActivityIndicator size="large" color={THEME_COLOR} style={{ marginVertical: 16 }} />
            <Text style={styles.loaderText}>Consulting Vedic Records...</Text>
            <Text style={styles.loaderSub}>Matching symptoms with Ayurvedic knowledge base</Text>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── PREDICTION CARDS ── */}
          {predictions.map((item, index) => {
            const ds = getDoshaStyle(item.dosha_type);
            return (
              <View key={index} style={styles.conditionCard}>

                {/* Rank pill */}
                <View style={styles.rankPill}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>

                {/* Card top */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.conditionMainTitle}>{item.name}</Text>
                    {item.sanskrit_name ? (
                      <Text style={styles.conditionSanskrit}>{item.sanskrit_name}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.badge, { backgroundColor: ds.bg, borderColor: ds.border }]}>
                    <Text style={[styles.badgeText, { color: ds.text }]}>
                      {item.dosha_type || 'General'}
                    </Text>
                  </View>
                </View>

                {/* Confidence row */}
                <View style={styles.confRow}>
                  <View style={[styles.confDot, { backgroundColor: confColor(item.confidence) }]} />
                  <Text style={[styles.confBadge, { color: confColor(item.confidence) }]}>
                    {confLabel(item.confidence)}
                  </Text>
                  <View style={styles.confBarWrap}>
                    <View style={[styles.confBarFill, {
                      width: `${item.confidence}%`,
                      backgroundColor: confColor(item.confidence),
                    }]} />
                  </View>
                </View>

                {/* Meta chip */}
                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>
                      📍 {item.match_count} symptom{item.match_count !== 1 ? 's' : ''} matched
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Diet card */}
                {item.diet_plan ? (
                  <InfoBlock
                    emoji="🥗"
                    label="Dietary Recommendation"
                    value={item.diet_plan}
                    accentColor={THEME_COLOR}
                    bgColor={THEME_SURFACE}
                  />
                ) : null}

                {/* Remedies button */}
                <TouchableOpacity
                  style={styles.detailsButton}
                  activeOpacity={0.82}
                  onPress={() => handleViewRemedies(item)}
                >
                  <Text style={styles.detailsButtonIcon}>🌿</Text>
                  <Text style={styles.detailsButtonText}>View Natural Remedies</Text>
                  <Text style={styles.detailsButtonArrow}>→</Text>
                </TouchableOpacity>

                {/* ── Ayurvedic Insights Button ── */}
                <TouchableOpacity
                  style={styles.insightsButton}
                  activeOpacity={0.80}
                  onPress={() => handleOpenInsights(item)}
                >
                  <View style={styles.insightsButtonLeft}>
                    <Text style={styles.insightsButtonIcon}>📚</Text>
                    <View>
                      <Text style={styles.insightsButtonTitle}>Ayurvedic Insights</Text>
                      <Text style={styles.insightsButtonSub}>Foods · Lifestyle · Yoga & more</Text>
                    </View>
                  </View>
                  <View style={styles.insightsChevron}>
                    <Text style={styles.insightsChevronText}>↑</Text>
                  </View>
                </TouchableOpacity>

              </View>
            );
          })}

          {/* ── EMPTY STATE ── */}
          {predictions.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🍃</Text>
              <Text style={styles.emptyTitle}>No Matches Found</Text>
              <Text style={styles.emptyText}>
                No specific Ayurvedic conditions matched these symptoms.
                Try selecting different or additional symptoms.
              </Text>
              <TouchableOpacity onPress={handleGoBack} style={styles.retryBtn}>
                <Text style={styles.retryText}>← Refine Symptoms</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* ── INSIGHTS BOTTOM SHEET ── */}
      <InsightsModal
        visible={insightsVisible}
        onClose={() => setInsightsVisible(false)}
        item={insightsItem}
      />

      <BottomNavBar navigation={navigation} activeScreen={isGuest ? 'Family' : ''} />
    </View>
  );
};

const InfoBlock = ({ emoji, label, value, accentColor, bgColor }) => (
  <View style={[infoS.wrap, { backgroundColor: bgColor, borderLeftColor: accentColor }]}>
    <View style={infoS.header}>
      <Text style={infoS.emoji}>{emoji}</Text>
      <Text style={[infoS.label, { color: accentColor }]}>{label}</Text>
    </View>
    <Text style={infoS.value}>{value}</Text>
  </View>
);

const infoS = StyleSheet.create({
  wrap:   { borderLeftWidth: 3, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, borderRadius: 10 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  emoji:  { fontSize: 16, marginRight: 7 },
  label:  { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  value:  { fontSize: 13, color: TEXT_SECONDARY, lineHeight: 20 },
});

// ── Modal Styles (mS) ─────────────────────────────────────────────────────────
const mS = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: height * 0.75,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    overflow: 'hidden',
  },
  handle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: '#D8D8D8',
    alignSelf: 'center',
    marginTop: 10, marginBottom: 2,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
    backgroundColor: '#fff',
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: THEME_DARK },
  headerSub:   { fontSize: 11, color: TEXT_SECONDARY, fontStyle: 'italic', marginTop: 1 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#EFEFEF',
    justifyContent: 'center', alignItems: 'center',
  },
  closeBtnText: { fontSize: 12, color: '#666', fontWeight: '700' },

  // Tab bar — fixed row, no scroll, equal width
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabIcon:  { fontSize: 16 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: '#9E9E9E', marginTop: 3 },

  // Overview / Description card
  descCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: THEME_COLOR,
  },
  descLabel: {
    fontSize: 10, fontWeight: '800', color: THEME_COLOR,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
  },
  descText: {
    fontSize: 14, color: TEXT_PRIMARY, lineHeight: 22,
  },

  // Food cards
  foodCard: {
    borderRadius: 14, padding: 14, marginBottom: 14,
    borderWidth: 1,
  },
  foodCardHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
  },
  foodCardTitle: {
    fontSize: 13, fontWeight: '700', marginLeft: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 4,
  },
  chipText: { fontSize: 12, fontWeight: '500' },

  // Routine steps
  routineRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: 14, backgroundColor: '#fff',
    borderRadius: 12, padding: 12,
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  routineDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#6A1B9A',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12, marginTop: 1,
    flexShrink: 0,
  },
  routineDotText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  routineText: { flex: 1, fontSize: 13, color: TEXT_PRIMARY, lineHeight: 20 },

  // Yoga — beautiful row cards
  yogaBanner: {
    backgroundColor: '#EEF6FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  yogaBannerText: { fontSize: 14, fontWeight: '800', color: '#0277BD' },
  yogaBannerSub:  { fontSize: 11, color: '#5C9FD4', fontWeight: '500' },
  yogaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#0277BD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#64B5F6',
  },
  yogaIconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  yogaPoseText: { fontSize: 13, color: TEXT_PRIMARY, fontWeight: '600', lineHeight: 19 },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { color: TEXT_SECONDARY, fontSize: 14, marginTop: 10 },
});

// ── Main Screen Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 16,
    backgroundColor: THEME_DARK, elevation: 8,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8,
  },
  backButton:  { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  backArrow:   { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  headerSub:   { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loaderCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%',
    elevation: 4, shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
  },
  loaderEmoji: { fontSize: 44 },
  loaderText:  { fontSize: 16, fontWeight: 'bold', color: THEME_DARK, textAlign: 'center' },
  loaderSub:   { fontSize: 12, color: TEXT_SECONDARY, marginTop: 6, textAlign: 'center' },

  scrollContent: { padding: 18, paddingTop: 20 },

  conditionCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16,
    elevation: 4, shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, borderWidth: 1, borderColor: '#EBEBEB', overflow: 'hidden',
  },
  rankPill: {
    alignSelf: 'flex-start', backgroundColor: THEME_SURFACE,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
    marginBottom: 12, borderWidth: 1, borderColor: '#C8E6C9',
  },
  rankText:           { fontSize: 11, fontWeight: '700', color: THEME_COLOR },
  cardHeader:         { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  conditionMainTitle: { fontSize: 20, fontWeight: 'bold', color: THEME_DARK, lineHeight: 26 },
  conditionSanskrit:  { fontSize: 12, color: TEXT_SECONDARY, fontStyle: 'italic', marginTop: 3 },
  badge:              { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText:          { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },

  confRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  confDot:     { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  confBadge:   { fontSize: 12, fontWeight: '700', marginRight: 10, minWidth: 90 },
  confBarWrap: { flex: 1, height: 6, backgroundColor: THEME_SURFACE, borderRadius: 3, overflow: 'hidden' },
  confBarFill: { height: '100%', borderRadius: 3 },

  metaRow: { flexDirection: 'row', marginBottom: 14 },
  metaChip: {
    backgroundColor: THEME_SURFACE, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#C8E6C9',
  },
  metaChipText: { fontSize: 12, color: THEME_DARK, fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 14 },

  detailsButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: THEME_DARK,
    paddingVertical: 15, paddingHorizontal: 20, borderRadius: 14, marginTop: 6,
    elevation: 4, shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 8,
  },
  detailsButtonIcon:  { fontSize: 18, marginRight: 10 },
  detailsButtonText:  { flex: 1, color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  detailsButtonArrow: { color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: 'bold' },

  // ── Ayurvedic Insights button ──
  insightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    backgroundColor: THEME_SURFACE,
  },
  insightsButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightsButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  insightsButtonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME_DARK,
  },
  insightsButtonSub: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    marginTop: 1,
  },
  insightsChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightsChevronText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyEmoji:     { fontSize: 56, marginBottom: 16 },
  emptyTitle:     { fontSize: 18, fontWeight: 'bold', color: THEME_DARK, marginBottom: 10 },
  emptyText:      { color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 22, fontSize: 14, marginBottom: 28 },
  retryBtn:       { paddingVertical: 14, paddingHorizontal: 28, backgroundColor: THEME_COLOR, borderRadius: 12 },
  retryText:      { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});

export default ResultsScreen;