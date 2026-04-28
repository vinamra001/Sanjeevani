import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Alert, Share
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { translations } from '../utils/translations';

const THEME_COLOR   = '#2D7D46';
const THEME_DARK    = '#1E5C33';
const THEME_SURFACE = '#EAF4EC';
const BACKGROUND    = '#F7FAF8';
const TEXT_PRIMARY  = '#141F17';
const TEXT_SECONDARY= '#5A6E60';

// ── 7-day Panchakarma plan (dosha-specific) ──────────────────────────────────
const PANCHAKARMA_PLANS = {
  Vata: [
    { day: 1, title: 'Purvakarma — Preparation',      task: 'Begin sesame oil Abhyanga full-body massage. Drink warm herbal teas all day. Eat light khichdi only.', herb: 'Ashwagandha' },
    { day: 2, title: 'Snehana — Internal Oleation',    task: 'Take 1 tsp of warm ghee on empty stomach at sunrise. Eat light warm food. Rest well.', herb: 'Shatavari' },
    { day: 3, title: 'Snehana — Day 2',                task: 'Increase ghee to 2 tsp. Continue oil massage. Avoid cold foods completely.', herb: 'Bala' },
    { day: 4, title: 'Swedana — Herbal Steam',         task: 'Take a warm herbal steam bath for 15 minutes. Massage warm sesame oil before steam.', herb: 'Dashmool' },
    { day: 5, title: 'Virechana — Gentle Cleanse',     task: 'Take Triphala churna with warm water at night. Eat light soups and broths only.', herb: 'Triphala' },
    { day: 6, title: 'Basti — Nourishing Enema',       task: 'Practice Matra Basti: warm sesame oil retention. Rest completely. Light diet.', herb: 'Licorice' },
    { day: 7, title: 'Paschatkarma — Restoration',     task: 'Gentle yoga and pranayama for 30 minutes. Light nutritious meals. Celebrate your discipline!', herb: 'Chyawanprash' },
  ],
  Pitta: [
    { day: 1, title: 'Purvakarma — Preparation',      task: 'Start with coconut oil full-body massage. Drink room-temperature water. Avoid spicy food.', herb: 'Brahmi' },
    { day: 2, title: 'Snehana — Cooling Oleation',    task: 'Take 1 tsp of coconut oil on empty stomach. Eat sweet, bitter, astringent foods only.', herb: 'Amalaki' },
    { day: 3, title: 'Snehana — Day 2',               task: 'Increase coconut oil to 2 tsp. Continue massage. Drink cooling herbal teas (mint, coriander).', herb: 'Guduchi' },
    { day: 4, title: 'Swedana — Mild Steam',          task: 'Take mild warm (not hot) herbal steam for 10 minutes. Use cooling herbs like neem leaves.', herb: 'Neem' },
    { day: 5, title: 'Virechana — Purgation',         task: 'Take Castor oil 15ml with warm milk at bedtime. Rest at home. Eat light cooling foods.', herb: 'Senna' },
    { day: 6, title: 'Cooling Rest Day',              task: 'Complete rest. Eat soft rice and moong dal. Apply sandalwood paste on forehead.', herb: 'Shatavari' },
    { day: 7, title: 'Paschatkarma — Restoration',   task: 'Practice Sheetali pranayama for 15 minutes. Eat fresh fruits. Drink rose water.', herb: 'Chyawanprash' },
  ],
  Kapha: [
    { day: 1, title: 'Purvakarma — Stimulation',     task: 'Dry powder massage (Udwartana) with chickpea flour and mustard oil. Vigorous 30-min walk.', herb: 'Trikatu' },
    { day: 2, title: 'Snehana — Light Oleation',     task: 'Take 1 tsp mustard oil on empty stomach. Eat only light, spicy, warm food.', herb: 'Guggul' },
    { day: 3, title: 'Snehana — Day 2',              task: 'Continue dry massage. Increase mustard oil to 1.5 tsp. Skip breakfast if not hungry.', herb: 'Punarnava' },
    { day: 4, title: 'Swedana — Vigorous Steam',     task: 'Hot herbal steam bath for 20 minutes with ginger and camphor. Sweat thoroughly.', herb: 'Ginger' },
    { day: 5, title: 'Vamana — Emesis Therapy',      task: 'Drink warm salt water with neem tea. Light yoga twists to support detox. Eat minimal.', herb: 'Tulsi' },
    { day: 6, title: 'Nasya — Nasal Cleanse',        task: 'Apply 2 drops of warm sesame oil in each nostril morning and evening. Do Jal Neti.', herb: 'Triphala' },
    { day: 7, title: 'Paschatkarma — Restoration',   task: 'Energising yoga session for 45 minutes. Eat light spiced food. Celebrate your effort!', herb: 'Chyawanprash' },
  ],
  'Vata-Pitta': [
    { day: 1, title: 'Preparation',                   task: 'Massage with cooling coconut oil or neutral almond oil. Drink warm rose water.', herb: 'Shatavari' },
    { day: 2, title: 'Gentle Oleation',               task: 'Take 1 tsp of warm ghee on an empty stomach. Eat sweet, heavy, cooling foods.', herb: 'Brahmi' },
    { day: 3, title: 'Oleation Day 2',                task: 'Increase ghee to 2 tsp. Rest well and avoid over-exertion.', herb: 'Ashwagandha' },
    { day: 4, title: 'Mild Steam',                    task: 'Warm (not hot) steam bath for 10 minutes. Use calming herbs like chamomile.', herb: 'Licorice' },
    { day: 5, title: 'Virechana — Gentle Purgation',  task: 'Take a mild dose of Triphala with warm milk at bedtime. Soft diet.', herb: 'Triphala' },
    { day: 6, title: 'Rest & Recover',                task: 'Total rest. Eat simple moong dal khichdi. No spicy foods.', herb: 'Amalaki' },
    { day: 7, title: 'Restoration',                   task: 'Pranayama and light walk. Eat nourishing sweet fruits.', herb: 'Chyawanprash' },
  ],
  'Pitta-Kapha': [
    { day: 1, title: 'Preparation',                   task: 'Brisk dry massage. Drink room-temperature coriander water.', herb: 'Punarnava' },
    { day: 2, title: 'Cooling Oleation',              task: '1 tsp coconut oil. Focus on bitter and astringent foods. Avoid heavy sweets.', herb: 'Neem' },
    { day: 3, title: 'Oleation Day 2',                task: 'Increase coconut oil to 1.5 tsp. Stay active but don\'t overheat.', herb: 'Guduchi' },
    { day: 4, title: 'Vigorous Steam',                task: 'Warm herbal steam for 15 minutes to clear Kapha channels without aggravating Pitta.', herb: 'Tulsi' },
    { day: 5, title: 'Virechana — Purgation',         task: 'Castor oil with warm water at bedtime. Fast or eat very light.', herb: 'Senna' },
    { day: 6, title: 'Nasal Cleanse',                 task: 'Jal Neti in the morning. Rest in a cool environment.', herb: 'Brahmi' },
    { day: 7, title: 'Restoration',                   task: 'Swimming or brisk walking. Light, spice-balanced food.', herb: 'Chyawanprash' },
  ],
  'Vata-Kapha': [
    { day: 1, title: 'Preparation',                   task: 'Warm sesame oil massage. Drink hot ginger tea throughout the day.', herb: 'Ashwagandha' },
    { day: 2, title: 'Warm Oleation',                 task: '1 tsp warm ghee with black pepper. Eat light, warm, spiced foods.', herb: 'Trikatu' },
    { day: 3, title: 'Oleation Day 2',                task: 'Increase ghee to 2 tsp. Gentle but continuous movement. No naps.', herb: 'Bala' },
    { day: 4, title: 'Swedana — Hot Steam',           task: 'Hot steam bath for 15-20 minutes to liquefy toxins and warm Vata.', herb: 'Dashmool' },
    { day: 5, title: 'Gentle Emesis/Purgation',       task: 'Mild herbal laxative at night. Very warm, fluid diet.', herb: 'Triphala' },
    { day: 6, title: 'Nourishing Enema',              task: 'Matra Basti (warm oil retention) to pacify Vata safely.', herb: 'Ginger' },
    { day: 7, title: 'Restoration',                   task: 'Sun salutations and warm breakfast. Celebrate your balance!', herb: 'Chyawanprash' },
  ],
};

const DEFAULT_PLAN = PANCHAKARMA_PLANS.Vata; // fallback

// ── Component ─────────────────────────────────────────────────────────────────
const PanchakarmaPlanner = ({ navigation, route }) => {
  const [dosha, setDosha] = useState(route.params?.dosha || 'Vata');
  const [lang, setLang] = useState(route.params?.lang || 'en');
  const t = translations[lang] || translations['en'];

  useFocusEffect(
    useCallback(() => {
      const fetchGlobal = async () => {
        const p = await AsyncStorage.getItem('userPrakriti');
        const l = await AsyncStorage.getItem('userLang');
        if (p && p !== 'Unknown' && p !== 'Not Analyzed') setDosha(p);
        if (l) setLang(l);
      };
      fetchGlobal();
    }, [])
  );

  const plan = PANCHAKARMA_PLANS[dosha] || DEFAULT_PLAN;

  const [completed, setCompleted] = useState({}); // { 1: true, 2: true, ... }
  const [started,   setStarted]   = useState(false);
  const [startDate, setStartDate] = useState(null);

  const STORAGE_KEY = `panchakarma_${dosha}`;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) {
        const parsed = JSON.parse(val);
        setCompleted(parsed.completed || {});
        setStarted(parsed.started || false);
        setStartDate(parsed.startDate || null);
      }
    });
  }, []);

  const saveState = async (newCompleted, newStarted, newStartDate) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      completed: newCompleted,
      started:   newStarted,
      startDate: newStartDate,
    }));
  };

  const handleStart = async () => {
    const today = new Date().toISOString();
    setStarted(true);
    setStartDate(today);
    await saveState({}, true, today);
  };

  const handleToggleDay = async (dayNum) => {
    if (!started) return;
    // Can only complete current or previous days (no skipping ahead)
    const completedCount = Object.keys(completed).length;
    if (dayNum > completedCount + 1) {
      Alert.alert('Complete previous days first', `Please complete Day ${completedCount + 1} before marking this.`);
      return;
    }
    const newCompleted = { ...completed, [dayNum]: !completed[dayNum] };
    // Remove if unchecking
    if (!newCompleted[dayNum]) delete newCompleted[dayNum];
    setCompleted(newCompleted);
    await saveState(newCompleted, started, startDate);

    if (Object.keys(newCompleted).length === 7) {
      setTimeout(() => Alert.alert('🎉', t.pancha_congrats), 300);
    }
  };

  const handleReset = async () => {
    Alert.alert(t.pancha_reset, 'This will clear all progress.', [
      { text: t.cancel, style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          setCompleted({}); setStarted(false); setStartDate(null);
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      },
    ]);
  };

  const handleSharePDF = async () => {
    const completedDays = Object.keys(completed).length;
    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body { font-family: Georgia, serif; padding: 24px; color: #141F17; }
  h1   { color: #1E5C33; font-size: 22px; border-bottom: 2px solid #2D7D46; padding-bottom: 8px; }
  h2   { font-size: 14px; color: #2D7D46; margin: 0 0 4px; }
  .day { border-left: 4px solid #2D7D46; background: #F7FAF8; border-radius: 8px;
          padding: 14px; margin-bottom: 12px; }
  .done{ border-left-color: #4CAF72; background: #EAF4EC; }
  .task{ font-size: 13px; color: #5A6E60; margin: 6px 0; line-height: 1.6; }
  .herb{ font-size: 12px; color: #2D7D46; font-weight: bold; }
  .prog{ text-align: center; font-size: 18px; color: #1E5C33; margin: 16px 0; }
</style></head><body>
<h1>🌱 Panchakarma Detox Plan — ${dosha} Dosha</h1>
<p class="prog">Progress: ${completedDays}/7 days completed</p>
${plan.map(d => `
  <div class="day ${completed[d.day] ? 'done' : ''}">
    <h2>${completed[d.day] ? '✅' : '⬜'} Day ${d.day}: ${d.title}</h2>
    <p class="task">${d.task}</p>
    <p class="herb">🌿 Herb of the day: ${d.herb}</p>
  </div>`).join('')}
<p style="font-size:11px;color:#aaa;margin-top:20px;">Generated by Sanjeevani App</p>
</body></html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert('Error', 'Could not generate PDF.');
    }
  };

  const completedCount = Object.keys(completed).length;
  const progressPct    = Math.round((completedCount / 7) * 100);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_DARK} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.pancha_title}</Text>
        {started && (
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
        {!started && <View style={{ width: 50 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Progress card */}
        {started && (
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>{t.pancha_progress}</Text>
            <Text style={styles.progressFraction}>{completedCount}/7</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.progressPct}>{progressPct}% Complete</Text>

            {completedCount === 7 && (
              <Text style={styles.congratsText}>{t.pancha_congrats}</Text>
            )}
          </View>
        )}

        {/* Dosha badge */}
        <View style={styles.doshaBadge}>
          <Text style={styles.doshaBadgeText}>🌿 {dosha} Panchakarma Plan</Text>
          <Text style={styles.doshaSubText}>{t.pancha_subtitle}</Text>
        </View>

        {/* Start button or day list */}
        {!started ? (
          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startBtnText}>{t.pancha_start}</Text>
          </TouchableOpacity>
        ) : (
          <>
            {plan.map((item) => {
              const isDone    = !!completed[item.day];
              const isUnlocked = item.day <= completedCount + 1;
              return (
                <View key={item.day} style={[styles.dayCard, isDone && styles.dayCardDone, !isUnlocked && styles.dayCardLocked]}>
                  <View style={styles.dayHeader}>
                    <View style={[styles.dayBadge, isDone && styles.dayBadgeDone]}>
                      <Text style={styles.dayBadgeText}>{t.pancha_day} {item.day}</Text>
                    </View>
                    <Text style={styles.dayTitle} numberOfLines={1}>{item.title}</Text>
                  </View>

                  <Text style={styles.dayTask}>{item.task}</Text>

                  <View style={styles.dayFooter}>
                    <Text style={styles.herbText}>🌿 {item.herb}</Text>
                    <TouchableOpacity
                      style={[styles.completeBtn, isDone && styles.completeBtnDone, !isUnlocked && styles.completeBtnLocked]}
                      onPress={() => handleToggleDay(item.day)}
                      disabled={!isUnlocked}
                    >
                      <Text style={[styles.completeBtnText, isDone && { color: THEME_COLOR }]}>
                        {isDone ? t.pancha_completed : (isUnlocked ? t.pancha_complete : '🔒')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity style={styles.shareBtn} onPress={handleSharePDF}>
              <Text style={styles.shareBtnText}>📄 {t.pancha_share}</Text>
            </TouchableOpacity>
          </>
        )}

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
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  backBtn:     { padding: 4 },
  backArrow:   { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  resetText:   { color: '#FFB3B3', fontSize: 13, fontWeight: '600' },
  scroll:      { padding: 20 },

  progressCard: {
    backgroundColor: THEME_DARK, borderRadius: 18, padding: 20, marginBottom: 16,
    elevation: 6, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 12,
  },
  progressLabel:   { color: '#C8E6C9', fontSize: 11, textTransform: 'uppercase',
                      letterSpacing: 1, marginBottom: 6 },
  progressFraction:{ color: '#FFF', fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  progressBar:     { height: 8, backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill:    { height: 8, backgroundColor: '#4CAF72', borderRadius: 4 },
  progressPct:     { color: '#C8E6C9', fontSize: 12 },
  congratsText:    { color: '#FFD700', fontSize: 15, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },

  doshaBadge:     { backgroundColor: THEME_SURFACE, borderRadius: 14, padding: 16,
                     marginBottom: 18, borderWidth: 1, borderColor: '#C8E6C9' },
  doshaBadgeText: { color: THEME_DARK, fontSize: 15, fontWeight: '700' },
  doshaSubText:   { color: TEXT_SECONDARY, fontSize: 12, marginTop: 4 },

  startBtn: {
    backgroundColor: THEME_COLOR, paddingVertical: 18, borderRadius: 14,
    alignItems: 'center', elevation: 5, marginBottom: 20,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 8,
  },
  startBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  dayCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#EBEBEB', elevation: 2,
    borderLeftWidth: 4, borderLeftColor: TEXT_SECONDARY,
  },
  dayCardDone:   { borderLeftColor: THEME_COLOR, backgroundColor: '#FAFFF9' },
  dayCardLocked: { opacity: 0.5 },

  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dayBadge:  { backgroundColor: THEME_SURFACE, paddingHorizontal: 10, paddingVertical: 4,
                borderRadius: 20, marginRight: 10 },
  dayBadgeDone: { backgroundColor: THEME_COLOR },
  dayBadgeText: { color: THEME_DARK, fontSize: 11, fontWeight: '700' },
  dayTitle:     { flex: 1, fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
  dayTask:      { fontSize: 13, color: TEXT_SECONDARY, lineHeight: 20, marginBottom: 12 },

  dayFooter:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  herbText:     { fontSize: 12, color: THEME_COLOR, fontWeight: '600' },

  completeBtn: {
    backgroundColor: THEME_SURFACE, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: '#C8E6C9',
  },
  completeBtnDone:   { backgroundColor: '#FFF', borderColor: THEME_COLOR },
  completeBtnLocked: { backgroundColor: '#F5F5F5', borderColor: '#DDD' },
  completeBtnText:   { fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY },

  shareBtn: {
    backgroundColor: '#FFF', paddingVertical: 15, borderRadius: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: THEME_COLOR, marginTop: 10,
  },
  shareBtnText: { color: THEME_COLOR, fontSize: 15, fontWeight: '700' },
});

export default PanchakarmaPlanner;
