import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Dimensions, StatusBar, ActivityIndicator, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from '../context/LanguageContext';
import BottomNavBar from '../components/BottomNavBar';


const { width } = Dimensions.get('window');

const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_LIGHT    = '#4CAF72';
const THEME_SURFACE  = '#EAF4EC';
const SECONDARY_COLOR = '#8AB971';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';

// Language cycle order: en → hi → mr → en
const LANG_CYCLE = ['en', 'hi', 'mr'];
const LANG_LABELS = { en: 'EN', hi: 'हिन्दी', mr: 'मराठी' };
// What to show on the toggle button (shows the NEXT language)
const LANG_NEXT_LABEL = { en: 'हिन्दी', hi: 'मराठी', mr: 'EN' };

const HomeScreen = ({ navigation }) => {
  const { lang, changeLanguage, t } = useLanguage();
  const [displayName, setDisplayName] = useState('User');
  const [dosha, setDosha] = useState('Unknown');
  const [loading, setLoading] = useState(true);
  const [lastDiagnosis, setLastDiagnosis] = useState({ name: "General", remedies: [] });
  const [pulseChecked, setPulseChecked] = useState(false);

  const fetchUserData = async () => {
    try {
      await AsyncStorage.removeItem('isGuest');
      const name         = await AsyncStorage.getItem('userName');
      const savedHistory = await AsyncStorage.getItem('last_diagnosis');
      const savedDosha   = await AsyncStorage.getItem('userPrakriti');

      // Check if pulse already done today
      const lastPulseDate = await AsyncStorage.getItem('lastPulseDate');
      const today = new Date().toDateString();
      setPulseChecked(lastPulseDate === today);

      if (savedHistory) setLastDiagnosis(JSON.parse(savedHistory));
      if (savedDosha) setDosha(savedDosha);

      if (name) {
        setDisplayName(name);
        try {
          const response = await axios.get(
            `http://192.168.0.106:8000/api/v1/get-profile/?username=${name}`,
            { timeout: 8000 }
          );
          if (response.data.prakriti && response.data.prakriti !== 'Not Analyzed') {
            setDosha(response.data.prakriti);
            await AsyncStorage.setItem('userPrakriti', response.data.prakriti);
          }
        } catch (_) {}
      }
    } catch (error) {
      console.error('Home Data Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    const unsubscribe = navigation.addListener('focus', fetchUserData);
    return unsubscribe;
  }, [navigation]);

  // Cycle language en → hi → mr → en
  const cycleLanguage = () => {
    const currentIndex = LANG_CYCLE.indexOf(lang);
    const nextLang = LANG_CYCLE[(currentIndex + 1) % LANG_CYCLE.length];
    changeLanguage(nextLang);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.namasteText}>{t.namaste} ✨</Text>
            <Text style={styles.userName}>{displayName}</Text>
          </View>
          {/* 3-language cycle toggle */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.langToggle}
            onPress={cycleLanguage}
          >
            <Text style={styles.langText}>{LANG_NEXT_LABEL[lang]}</Text>
          </TouchableOpacity>
        </View>

        {/* ── WELLNESS CARD ── */}
        <View style={[styles.wellnessCard,
          dosha !== 'Unknown' ? styles.wellnessActive : styles.wellnessInactive]}>
          <View style={styles.wellnessHeader}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 20 }}>🌿</Text>
            </View>
            <Text style={styles.wellnessTitle}>{t.wellness_profile}</Text>
          </View>
          <View style={styles.doshaBadge}>
            <Text style={styles.doshaLabel}>{t.dominant_dosha}</Text>
            <Text style={styles.doshaValue}>{dosha}</Text>
          </View>
          <Text style={styles.doshaQuote}>
            {dosha === 'Unknown'
              ? t.prakriti_desc
              : `Your ${dosha} energy is the foundation of your vitality. Keep it in harmony!`}
          </Text>
        </View>

        {/* ── ANALYZE BANNER ── */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.quizActionCard}
          onPress={() => navigation.navigate('DoshaQuiz')}
        >
          <Text style={styles.quizEmoji}>🧭</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.quizTitle}>{t.analyze_prakriti}</Text>
            <Text style={styles.quizSubtitle}>{t.prakriti_desc}</Text>
          </View>
          <Text style={styles.arrowIcon}>→</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t.quick_actions}</Text>

        {/* ── GRID ── */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <ActionCard icon="🔍" label={t.diagnosis}  bgColor="#E8F5EC"
              onPress={() => navigation.navigate('Input')} />
            <ActionCard icon="🥗" label={t.diet_plan}  bgColor="#FFF4E4"
              onPress={() => navigation.navigate('DietRecommendations')} />
          </View>
          <View style={styles.gridRow}>
            <ActionCard icon="🧘" label={t.routine}    bgColor="#E8F0FB"
              onPress={() => navigation.navigate('MorningRoutine')} />
            <ActionCard icon="🌿"
              label={lastDiagnosis.name === 'General' ? t.remedies : lastDiagnosis.name}
              bgColor="#F3EEF9"
              onPress={() => navigation.navigate('AyurvedicRemedies', {
                remedies: lastDiagnosis.remedies, diseaseName: lastDiagnosis.name
              })} />
          </View>
        </View>

        {/* ══════════════════════════════════════════════
            TODAY'S WELLNESS — horizontal list cards
        ══════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionPill} />
          <Text style={styles.sectionTitle}>{t.title_today}</Text>
        </View>

        {/* 1. Daily AI Pulse Check */}
        <TouchableOpacity
          style={styles.wCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('DailyPulseCheck', { dosha, userName: displayName, lang })}
        >
          <View style={[styles.wCardIcon, { backgroundColor: '#E3F5E9' }]}>
            <Text style={styles.wCardIconText}>💚</Text>
          </View>
          <View style={styles.wCardBody}>
            <Text style={styles.wCardTitle}>{t.pulse_title}</Text>
            <Text style={styles.wCardSub}>{t.pulse_subtitle}</Text>
          </View>
          {pulseChecked
            ? <View style={styles.wCardDone}><Text style={styles.wCardDoneText}>✓</Text></View>
            : <View style={styles.wCardArrow}><Text style={styles.wCardArrowText}>›</Text></View>
          }
        </TouchableOpacity>

        {/* 2. Smart Push Notifications */}
        <TouchableOpacity
          style={styles.wCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('SmartNotifications', { dosha, lang })}
        >
          <View style={[styles.wCardIcon, { backgroundColor: '#FFF0DC' }]}>
            <Text style={styles.wCardIconText}>🔔</Text>
          </View>
          <View style={styles.wCardBody}>
            <Text style={styles.wCardTitle}>{t.notif_title}</Text>
            <Text style={styles.wCardSub}>{t.notif_subtitle}</Text>
          </View>
          <View style={styles.wCardArrow}><Text style={styles.wCardArrowText}>›</Text></View>
        </TouchableOpacity>

        {/* 3. Panchakarma Planner */}
        <TouchableOpacity
          style={styles.wCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('PanchakarmaPlanner', { dosha, lang })}
        >
          <View style={[styles.wCardIcon, { backgroundColor: '#E3F2EA' }]}>
            <Text style={styles.wCardIconText}>🌱</Text>
          </View>
          <View style={styles.wCardBody}>
            <Text style={styles.wCardTitle}>{t.pancha_title}</Text>
            <Text style={styles.wCardSub}>{t.pancha_subtitle}</Text>
          </View>
          <View style={styles.wCardArrow}><Text style={styles.wCardArrowText}>›</Text></View>
        </TouchableOpacity>

        {/* ══════════════════════════════════════════════
            ADVANCED AI — 2-column tile grid
        ══════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionPill, { backgroundColor: '#7B5EA7' }]} />
          <Text style={styles.sectionTitle}>{t.title_adv}</Text>
        </View>

        {/* Row 1 — Health Score + Community Forum */}
<View style={styles.aiRow}>
  <AITile
    icon="💯"
    label={t.title_health}
    sub={t.sub_health}
    iconBg="#FFF3E0"
    footerBg="#FFF3E0"
    footerColor="#F57C00"
    onPress={() => navigation.navigate('HealthScoreRing', { userName: displayName, dosha })}
  />
  <AITile
    icon="💬"
    label={t.title_forum}
    sub={t.sub_forum}
    iconBg="#F3E5F5"
    footerBg="#F3E5F5"
    footerColor="#8E24AA"
    onPress={() => navigation.navigate('CommunityForum', { userName: displayName, dosha })}
  />
</View>

       {/* Row 3 — Wearable Integration + Seasonal Ritu */}
<View style={styles.aiRow}>

  {/* Wearable Integration */}
  <TouchableOpacity
    activeOpacity={0.85}
    style={styles.aiTile}
    onPress={() => navigation.navigate('WearableIntegration', { dosha, userName: displayName })}
  >
    <View style={[styles.aiTileIconWrap, { backgroundColor: '#E8F5EC' }]}>
      <Text style={styles.aiTileIcon}>⌚</Text>
    </View>
    <Text style={styles.aiTileLabel}>Wearable Integration</Text>
    <Text style={styles.aiTileSub}>Google Fit / Apple Health</Text>
    <View style={[styles.aiTileFooter, { backgroundColor: '#E8F5EC' }]}>
      <Text style={[styles.aiTileFooterText, { color: THEME_COLOR }]}>Open  ›</Text>
    </View>
  </TouchableOpacity>

  {/* Seasonal Ritu */}
  <TouchableOpacity
    activeOpacity={0.85}
    style={styles.aiTile}
    onPress={() => navigation.navigate('SeasonalRitu')}
  >
    <View style={[styles.aiTileIconWrap, { backgroundColor: '#E3F2FD' }]}>
      <Text style={styles.aiTileIcon}>🌦️</Text>
    </View>
    <Text style={styles.aiTileLabel}>{t.title_ritu}</Text>
    <Text style={styles.aiTileSub}>{t.sub_ritu}</Text>
    <View style={[styles.aiTileFooter, { backgroundColor: '#E3F2FD' }]}>
      <Text style={[styles.aiTileFooterText, { color: '#1976D2' }]}>Open  ›</Text>
    </View>
  </TouchableOpacity>

</View>
        {/* Row 4 — Advanced Scanning & Clinics */}

        <View style={styles.aiRow}>
  
  {/* Tongue / Face Scanner */}
  <TouchableOpacity 
    activeOpacity={0.85} 
    style={styles.aiTile}
    onPress={() => navigation.navigate('FaceScanner')}
  >
    <View style={[styles.aiTileIconWrap, { backgroundColor: '#FBE9E7' }]}>
      <Text style={styles.aiTileIcon}>🧠</Text>
    </View>

    <Text style={styles.aiTileLabel}>Tongue/Face Scanner</Text>
    <Text style={styles.aiTileSub}>Photo → Dosha analysis</Text>

    <View style={[styles.aiTileFooter, { backgroundColor: '#FBE9E7' }]}>
      <Text style={[styles.aiTileFooterText, { color: '#D84315' }]}>
        Open  ›
      </Text>
    </View>
  </TouchableOpacity>

  {/* Nearby Ayurvedic Doctors */}
  <TouchableOpacity 
    activeOpacity={0.85} 
    style={styles.aiTile}
    onPress={() => navigation.navigate('ClinicFinder')}
  >
    <View style={[styles.aiTileIconWrap, { backgroundColor: '#FFF3E0' }]}>
      <Text style={styles.aiTileIcon}>📍</Text>
    </View>

    <Text style={styles.aiTileLabel}>Nearby Ayurvedic Docs</Text>
    <Text style={styles.aiTileSub}>GPS-based clinic finder</Text>

    <View style={[styles.aiTileFooter, { backgroundColor: '#FFF3E0' }]}>
      <Text style={[styles.aiTileFooterText, { color: '#F57C00' }]}>
        Open  ›
      </Text>
    </View>
  </TouchableOpacity>

</View>
        {/* <View style={styles.aiRow}>
          <TouchableOpacity 
            activeOpacity={0.85} 
            style={[styles.aiTile, { backgroundColor: '#873E23', justifyContent: 'center', borderColor: '#A65335', borderWidth: 2 }]} 
            onPress={() => navigation.navigate('FaceScanner')}
          >
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6, textAlign: 'center' }}>Tongue/face scanner</Text>
            <Text style={{ fontSize: 12, color: '#E5A58E', textAlign: 'center', fontWeight: '500' }}>photo → dosha analysis</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.85} 
            style={[styles.aiTile, { backgroundColor: '#704214', justifyContent: 'center', borderColor: '#8C5723', borderWidth: 2 }]} 
            onPress={() => navigation.navigate('ClinicFinder')}
          >
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6, textAlign: 'center' }}>Nearby Ayurvedic docs</Text>
            <Text style={{ fontSize: 12, color: '#E8BC91', textAlign: 'center', fontWeight: '500' }}>GPS-based clinic finder</Text>
          </TouchableOpacity>
        </View> */}

        {/* Row 4 — Vedic Astro (single, full-width banner) 
        <TouchableOpacity
          style={styles.aiBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('VedicAstro', { dosha })}
        >
          <View style={[styles.aiBannerIcon, { backgroundColor: '#EDE7F6' }]}>
            <Text style={{ fontSize: 28 }}>✨</Text>
          </View>
          <View style={styles.aiBannerBody}>
            <Text style={styles.aiBannerTitle}>{t.title_astro}</Text>
            <Text style={styles.aiBannerSub}>{t.sub_astro}</Text>
          </View>
          <View style={styles.aiBannerChevron}>
            <Text style={styles.aiBannerChevronText}>›</Text>
          </View>
        </TouchableOpacity>*/}

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBar navigation={navigation} activeScreen="Home" />
    </SafeAreaView>
  );
};

// ── Quick-action grid card (unchanged logic & props) ──────────────────────────
const ActionCard = ({ icon, label, bgColor, onPress }) => (
  <TouchableOpacity activeOpacity={0.8} style={styles.actionCard} onPress={onPress}>
    <View style={[styles.actionIconCircle, { backgroundColor: bgColor }]}>
      <Text style={{ fontSize: 26 }}>{icon}</Text>
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

// ── Advanced AI 2-col tile ─────────────────────────────────────────────────────
const AITile = ({ icon, label, sub, iconBg, footerBg, footerColor, onPress }) => (
  <TouchableOpacity activeOpacity={0.85} style={styles.aiTile} onPress={onPress}>
    <View style={[styles.aiTileIconWrap, { backgroundColor: iconBg }]}>
      <Text style={styles.aiTileIcon}>{icon}</Text>
    </View>
    <Text style={styles.aiTileLabel} numberOfLines={1}>{label}</Text>
    <Text style={styles.aiTileSub} numberOfLines={2}>{sub}</Text>
    <View style={[styles.aiTileFooter, { backgroundColor: footerBg }]}>
      <Text style={[styles.aiTileFooterText, { color: footerColor }]}>Open  ›</Text>
    </View>
  </TouchableOpacity>
);

const TILE_W = (width - 52) / 2;   // 20 + 12 gap + 20 = 52

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: BACKGROUND },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND },
  scrollContent:    { paddingHorizontal: 20, paddingTop: 10 },

  // ── Header ──────────────────────────────────────────────────────────────────
  headerContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 22,
  },
  namasteText: { fontSize: 13, color: TEXT_SECONDARY, letterSpacing: 0.4 },
  userName:    { fontSize: 28, fontWeight: 'bold', color: TEXT_PRIMARY, marginTop: 1 },
  langToggle: {
    backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 100, borderWidth: 1.5, borderColor: THEME_SURFACE,
    shadowColor: THEME_COLOR, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  langText: { color: THEME_COLOR, fontWeight: '700', fontSize: 12 },

  // ── Wellness Card ────────────────────────────────────────────────────────────
  wellnessCard: {
    borderRadius: 22, padding: 22, marginBottom: 20, elevation: 10,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28, shadowRadius: 18,
  },
  wellnessActive:   { backgroundColor: THEME_DARK },
  wellnessInactive: { backgroundColor: '#4A5E52' },
  wellnessHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  iconCircle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  wellnessTitle: { color: '#fff', fontSize: 17, fontWeight: '600', opacity: 0.92 },
  doshaBadge: {
    backgroundColor: 'rgba(255,255,255,0.13)', padding: 14,
    borderRadius: 16, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  doshaLabel: {
    color: '#C8E6C9', fontSize: 11, textTransform: 'uppercase',
    letterSpacing: 1.2, marginBottom: 4,
  },
  doshaValue: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  doshaQuote: { color: '#D4EDD7', fontSize: 13, fontStyle: 'italic', opacity: 0.85 },

  // ── Quiz Banner ──────────────────────────────────────────────────────────────
  quizActionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 16, borderRadius: 16, marginBottom: 22,
    borderWidth: 1, borderColor: THEME_SURFACE,
    shadowColor: THEME_COLOR, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
  },
  quizEmoji:    { fontSize: 30 },
  quizTitle:    { fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
  quizSubtitle: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  arrowIcon:    { fontSize: 20, color: THEME_LIGHT, fontWeight: 'bold' },

  // ── Section heading with pill accent ────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14, marginTop: 8,
  },
  sectionPill: {
    width: 4, height: 20, borderRadius: 2,
    backgroundColor: THEME_COLOR, marginRight: 10,
  },
  sectionTitle: {
    fontSize: 17, fontWeight: 'bold', color: TEXT_PRIMARY,
    marginBottom: 14, marginLeft: 2, marginTop: 8,
  },

  // ── Quick-action 2×2 grid ────────────────────────────────────────────────────
  gridContainer: {},
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  actionCard: {
    width: width * 0.43, borderRadius: 20, paddingVertical: 18,
    alignItems: 'center', backgroundColor: '#FFFFFF', elevation: 5,
    shadowColor: '#1E5C33', shadowOpacity: 0.08,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  actionIconCircle: {
    width: 60, height: 60, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  actionLabel: {
    fontSize: 13, fontWeight: '600', color: TEXT_PRIMARY,
    textAlign: 'center', paddingHorizontal: 4,
  },

  // ── Today's Wellness — horizontal cards ─────────────────────────────────────
  wCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  wCardIcon: {
    width: 50, height: 50, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  wCardIconText: { fontSize: 24 },
  wCardBody:     { flex: 1 },
  wCardTitle: {
    fontSize: 14, fontWeight: '700',
    color: TEXT_PRIMARY, marginBottom: 3,
  },
  wCardSub: {
    fontSize: 12, color: TEXT_SECONDARY, lineHeight: 17,
  },
  wCardArrow: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: THEME_SURFACE,
    justifyContent: 'center', alignItems: 'center',
  },
  wCardArrowText: {
    fontSize: 22, color: THEME_COLOR,
    fontWeight: '700', lineHeight: 26,
  },
  wCardDone: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: THEME_COLOR,
    justifyContent: 'center', alignItems: 'center',
  },
  wCardDoneText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // ── Advanced AI 2-col tiles ──────────────────────────────────────────────────
  aiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  aiTile: {
    width: TILE_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    elevation: 4,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  aiTileIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  aiTileIcon:  { fontSize: 26 },
  aiTileLabel: {
    fontSize: 13, fontWeight: '700',
    color: TEXT_PRIMARY, marginBottom: 4,
  },
  aiTileSub: {
    fontSize: 11, color: TEXT_SECONDARY,
    lineHeight: 16, marginBottom: 14,
    minHeight: 32,
  },
  aiTileFooter: {
    borderRadius: 8, paddingVertical: 7,
    alignItems: 'center',
  },
  aiTileFooterText: { fontSize: 12, fontWeight: '700' },

  // ── Vedic Astro full-width banner ────────────────────────────────────────────
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  aiBannerIcon: {
    width: 52, height: 52, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  aiBannerBody:  { flex: 1 },
  aiBannerTitle: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 3 },
  aiBannerSub:   { fontSize: 12, color: TEXT_SECONDARY, lineHeight: 17 },
  aiBannerChevron: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center', alignItems: 'center',
  },
  aiBannerChevronText: {
    fontSize: 22, color: '#4B0082',
    fontWeight: '700', lineHeight: 26,
  },

  // Legacy keys retained so nothing breaks if referenced elsewhere
  featureCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderLeftWidth: 4, borderWidth: 1, borderColor: '#EBEBEB',
    elevation: 3, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8,
  },
  featureIconBox:  { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  featureIcon:     { fontSize: 24 },
  featureTextBox:  { flex: 1 },
  featureTitle:    { fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
  featureSubtitle: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  featureArrow:    { fontSize: 18, color: TEXT_SECONDARY, fontWeight: 'bold' },
  doneChip:        { backgroundColor: THEME_COLOR, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  doneChipText:    { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});

export default HomeScreen;