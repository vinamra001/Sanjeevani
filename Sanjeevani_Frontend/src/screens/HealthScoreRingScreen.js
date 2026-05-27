import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { API_BASE_URL } from '../constants';

const { width } = Dimensions.get('window');
const THEME_COLOR   = '#2D7D46';
const THEME_DARK    = '#1E5C33';
const THEME_SURFACE = '#EAF4EC';
const BACKGROUND    = '#F7FAF8';
const TEXT_PRIMARY  = '#141F17';
const TEXT_SECONDARY= '#5A6E60';

// Score colour thresholds
const scoreColor = (s) => s >= 75 ? '#2D7D46' : s >= 50 ? '#FF9800' : '#E53935';
const scoreLabel = (s) => s >= 75 ? 'Excellent' : s >= 50 ? 'Good' : s >= 30 ? 'Fair' : 'Needs Care';

// ── Animated Ring ─────────────────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
  const R = 88, cx = 110, cy = 110;
  const circumference = 2 * Math.PI * R;
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animVal, { toValue: score, duration: 1200, useNativeDriver: false }).start();
  }, [score]);

  const strokeDashoffset = animVal.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, circumference - (circumference * score) / 100],
  });

  const color = scoreColor(score);

  return (
    <View style={styles.ringContainer}>
      <Svg width={220} height={220} viewBox="0 0 220 220">
        {/* Background ring */}
        <Circle cx={cx} cy={cy} r={R} fill="none" stroke="#E8EEE8" strokeWidth={16} />
        {/* Score ring — we approximate using a static value for the SVG */}
        <Circle
          cx={cx} cy={cy} r={R} fill="none"
          stroke={color} strokeWidth={16}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * score) / 100}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <SvgText x={cx} y={cy - 10} textAnchor="middle" fontSize="38" fontWeight="bold" fill={color}>
          {score}
        </SvgText>
        <SvgText x={cx} y={cy + 18} textAnchor="middle" fontSize="13" fill="#5A6E60">
          {scoreLabel(score)}
        </SvgText>
        <SvgText x={cx} y={cy + 36} textAnchor="middle" fontSize="11" fill="#AAA">
          out of 100
        </SvgText>
      </Svg>
    </View>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
const HealthScoreRingScreen = ({ navigation, route }) => {
  const { userName = '' } = route.params || {};
  const [dosha,    setDosha]    = useState(route.params?.dosha || 'General');
  const [score,    setScore]    = useState(0);
  const [factors,  setFactors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [lastPulse, setLastPulse] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchGlobal = async () => {
        const p = await AsyncStorage.getItem('userPrakriti');
        if (p && p !== 'Unknown' && p !== 'Not Analyzed') setDosha(p);
        await computeScore(p || dosha);
      };
      fetchGlobal();
    }, [])
  );

  const computeScore = async (activeDosha) => {
    setLoading(true);
    let totalScore = 50; // base
    const factorList = [];

    try {
      // ── Factor 1: Dosha quiz completed ──────────────────────────────────
      const savedDosha = await AsyncStorage.getItem('userPrakriti');
      if (savedDosha && savedDosha !== 'Unknown' && savedDosha !== 'Not Analyzed') {
        totalScore += 10;
        factorList.push({ label: 'Dosha Quiz Completed', points: +10, icon: '🧭', status: 'done' });
      } else {
        factorList.push({ label: 'Dosha Quiz Pending', points: 0, icon: '🧭', status: 'pending', action: 'DoshaQuiz' });
      }

      // ── Factor 2: Daily pulse check ──────────────────────────────────────
      const lastPulseDate = await AsyncStorage.getItem('lastPulseDate');
      const today = new Date().toDateString();
      if (lastPulseDate === today) {
        totalScore += 15;
        factorList.push({ label: 'Daily Pulse Checked', points: +15, icon: '💚', status: 'done' });
      } else {
        totalScore -= 5;
        factorList.push({ label: 'Daily Pulse Not Checked', points: -5, icon: '💚', status: 'pending', action: 'DailyPulseCheck' });
      }

      // ── Factor 3: Last pulse answers quality ─────────────────────────────
      const lastTip = await AsyncStorage.getItem('lastPulseTip');
      if (lastTip) {
        setLastPulse(lastTip);
        totalScore += 5;
        factorList.push({ label: 'Health Tip Received', points: +5, icon: '🌿', status: 'done' });
      }

      // ── Factor 4: Notification schedule set ──────────────────────────────
      const notifSettings = await AsyncStorage.getItem('notifSettings');
      if (notifSettings) {
        const ns = JSON.parse(notifSettings);
        if (ns.enabled) {
          totalScore += 10;
          factorList.push({ label: 'Reminders Active', points: +10, icon: '🔔', status: 'done' });
        }
      } else {
        factorList.push({ label: 'Set Daily Reminders', points: 0, icon: '🔔', status: 'pending', action: 'SmartNotifications' });
      }

      // ── Factor 5: Panchakarma plan progress ──────────────────────────────
      const panchaKey = `panchakarma_${activeDosha}`;
      const panchaData = await AsyncStorage.getItem(panchaKey);
      if (panchaData) {
        const pd = JSON.parse(panchaData);
        const daysCompleted = Object.keys(pd.completed || {}).length;
        const bonus = Math.round((daysCompleted / 7) * 10);
        totalScore += bonus;
        factorList.push({ label: `Panchakarma: ${daysCompleted}/7 days`, points: +bonus, icon: '🌱', status: daysCompleted > 0 ? 'done' : 'pending', action: 'PanchakarmaPlanner' });
      } else {
        factorList.push({ label: 'Panchakarma Not Started', points: 0, icon: '🌱', status: 'pending', action: 'PanchakarmaPlanner' });
      }

      // ── Factor 6: Diagnosis history (from backend) ────────────────────────
      try {
        const res = await axios.get(`${API_BASE_URL}/health-history/?username=${userName}`, { timeout: 6000 });
        if (res.data && res.data.total_records > 0) {
          const bonus = Math.min(res.data.total_records * 2, 10);
          totalScore += bonus;
          factorList.push({ label: `${res.data.total_records} Diagnosis Records`, points: +bonus, icon: '📋', status: 'done' });
        }
      } catch (_) {
        const cached = await AsyncStorage.getItem('last_diagnosis');
        if (cached) {
          totalScore += 5;
          factorList.push({ label: 'Diagnosis History Found', points: +5, icon: '📋', status: 'done' });
        }
      }

    } catch (e) {
      console.error('Score compute error:', e);
    }

    const finalScore = Math.max(0, Math.min(100, totalScore));
    setScore(finalScore);
    setFactors(factorList);
    setLoading(false);

    // Save score to AsyncStorage + sync backend
    await AsyncStorage.setItem('healthScore', String(finalScore));
    try {
      await axios.post(`${API_BASE_URL}/health-score/`, { username: userName, score: finalScore }, { timeout: 5000 });
    } catch (_) {}
  };

  const TIPS = {
    done:    { border: '#C8E6C9', bg: '#EAF4EC' },
    pending: { border: '#FFE0B2', bg: '#FFF8F0' },
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_DARK} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Score</Text>
        <TouchableOpacity onPress={computeScore} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Ring */}
        <View style={styles.ringCard}>
          <ScoreRing score={loading ? 0 : score} />
          <Text style={styles.ringSubtitle}>Wellness Index</Text>
          <Text style={styles.ringDosha}>🌿 {dosha} Dosha Profile</Text>
        </View>

        {/* Last tip */}
        {lastPulse && (
          <View style={styles.tipCard}>
            <Text style={styles.tipLabel}>Today's Ayurvedic Tip</Text>
            <Text style={styles.tipText}>{lastPulse}</Text>
          </View>
        )}

        {/* Factors */}
        <Text style={styles.sectionTitle}>Score Breakdown</Text>
        {factors.map((f, i) => {
          const style = TIPS[f.status];
          return (
            <TouchableOpacity
              key={i}
              style={[styles.factorCard, { backgroundColor: style.bg, borderColor: style.border }]}
              onPress={() => f.action && navigation.navigate(f.action, { dosha, userName })}
              activeOpacity={f.action ? 0.75 : 1}
            >
              <Text style={styles.factorIcon}>{f.icon}</Text>
              <Text style={styles.factorLabel}>{f.label}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.factorPoints, { color: f.points > 0 ? THEME_COLOR : f.points < 0 ? '#E53935' : TEXT_SECONDARY }]}>
                {f.points > 0 ? `+${f.points}` : f.points === 0 ? '—' : f.points}
              </Text>
              {f.action && <Text style={styles.factorArrow}>→</Text>}
            </TouchableOpacity>
          );
        })}

        {/* How to improve */}
        <View style={styles.improveCard}>
          <Text style={styles.improveTitle}>How to Improve Your Score</Text>
          {[
            { icon: '💚', text: 'Complete Daily Pulse Check every day' },
            { icon: '🌱', text: 'Finish the 7-day Panchakarma plan' },
            { icon: '🔔', text: 'Enable all 3 daily reminders' },
            { icon: '🔍', text: 'Log your symptoms regularly' },
          ].map((tip, i) => (
            <View key={i} style={styles.improveRow}>
              <Text style={styles.improveIcon}>{tip.icon}</Text>
              <Text style={styles.improveText}>{tip.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 14, backgroundColor: THEME_DARK, elevation: 6,
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backBtn:     { padding: 4 },
  backArrow:   { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  refreshBtn:  { padding: 4 },
  refreshText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  scroll:      { padding: 20 },

  ringCard:     { alignItems: 'center', backgroundColor: '#FFF', borderRadius: 24, padding: 24,
                   marginBottom: 20, borderWidth: 1, borderColor: '#EBEBEB', elevation: 4,
                   shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12 },
  ringContainer:{ alignItems: 'center' },
  ringSubtitle: { fontSize: 16, fontWeight: 'bold', color: TEXT_PRIMARY, marginTop: 4 },
  ringDosha:    { fontSize: 13, color: TEXT_SECONDARY, marginTop: 4 },

  tipCard: { backgroundColor: THEME_DARK, borderRadius: 16, padding: 18, marginBottom: 20,
              elevation: 4, shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  tipLabel:{ color: '#C8E6C9', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  tipText: { color: '#FFF', fontSize: 14, lineHeight: 22, fontStyle: 'italic' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 12 },
  factorCard:   { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14,
                   marginBottom: 10, borderWidth: 1 },
  factorIcon:   { fontSize: 20, marginRight: 12 },
  factorLabel:  { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  factorPoints: { fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  factorArrow:  { color: TEXT_SECONDARY, fontSize: 14 },

  improveCard:  { backgroundColor: '#FFF', borderRadius: 18, padding: 20, marginTop: 8,
                   borderWidth: 1, borderColor: '#EBEBEB', elevation: 2 },
  improveTitle: { fontSize: 15, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 14 },
  improveRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  improveIcon:  { fontSize: 18, marginRight: 12 },
  improveText:  { fontSize: 13, color: TEXT_SECONDARY, flex: 1, lineHeight: 19 },
});

export default HealthScoreRingScreen;
