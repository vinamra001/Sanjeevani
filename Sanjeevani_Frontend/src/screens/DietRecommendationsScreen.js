import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Dimensions, Platform, RefreshControl, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { translations } from '../utils/translations';
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNavBar from '../components/BottomNavBar';

const { width } = Dimensions.get('window');

const API_BASE_URL   = 'http://192.168.0.106:8000/api/v1';
const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_LIGHT    = '#4CAF72';
const THEME_SURFACE  = '#EAF4EC';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEALS = ['Breakfast','Lunch','Dinner','Snack'];
const MEAL_ICONS = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snack: '🍵' };

const OFFLINE_PLANS = {
  Vata: {
    Monday:    { Breakfast: 'Warm oatmeal with ghee, dates & cardamom', Lunch: 'Kitchari with mung dal & vegetables', Dinner: 'Rice with warm lentil soup', Snack: 'Warm milk with ashwagandha' },
    Tuesday:   { Breakfast: 'Sesame banana smoothie with warm milk', Lunch: 'Wheat roti with cooked spinach & ghee', Dinner: 'Sweet potato & dal', Snack: 'Soaked almonds & dates' },
    Wednesday: { Breakfast: 'Rice porridge with jaggery & ghee', Lunch: 'Moong dal with rice & roasted cumin', Dinner: 'Vegetable stew with warm chapati', Snack: 'Warm herbal tea with honey' },
    Thursday:  { Breakfast: 'Soft idli with ghee & coconut chutney', Lunch: 'Toor dal with rice & ghee', Dinner: 'Khichdi with roasted vegetables', Snack: 'Warm almond milk' },
    Friday:    { Breakfast: 'Banana pancakes with jaggery syrup', Lunch: 'Rice with dal & cooked carrots', Dinner: 'Warm soup with bread', Snack: 'Fig & walnut mix' },
    Saturday:  { Breakfast: 'Semolina upma with ghee & cashews', Lunch: 'Full meal — rice, dal, sabzi & roti', Dinner: 'Light soup & bread', Snack: 'Coconut ladoo' },
    Sunday:    { Breakfast: 'Sweet pongal with ghee', Lunch: 'Special Vata thali — warm, oily, nourishing', Dinner: 'Khichdi & buttermilk', Snack: 'Warm ginger tea' },
  },
  Pitta: {
    Monday:    { Breakfast: 'Coconut milk oats with sweet fruits', Lunch: 'Basmati rice with cooling dal & coriander', Dinner: 'Cucumber raita with rice & sabzi', Snack: 'Coconut water & pomegranate' },
    Tuesday:   { Breakfast: 'Sweet fruit bowl — mango, pear, grapes', Lunch: 'Wheat roti with mint chutney & dal', Dinner: 'Rice with bottle gourd curry', Snack: 'Rose water milk' },
    Wednesday: { Breakfast: 'Fennel tea & fruit plate', Lunch: 'Cooling rice salad with cucumber', Dinner: 'Moong dal & bread with ghee', Snack: 'Sweet lassi' },
    Thursday:  { Breakfast: 'Barley porridge with raisins', Lunch: 'Toor dal with rice & coconut sambar', Dinner: 'Vegetable biryani — mild spices', Snack: 'Aloe vera juice' },
    Friday:    { Breakfast: 'Banana with coconut milk', Lunch: 'Rice with spinach dal & cooling sabzi', Dinner: 'Cucumber soup & roti', Snack: 'Dates & milk' },
    Saturday:  { Breakfast: 'Coconut dosa with white chutney', Lunch: 'Full Pitta thali — cooling & sweet', Dinner: 'Light khichdi with ghee', Snack: 'Cool herbal tea' },
    Sunday:    { Breakfast: 'Sweet semolina halwa', Lunch: 'Coconut rice with raita & salad', Dinner: 'Rice with pumpkin curry', Snack: 'Mint lassi' },
  },
  Kapha: {
    Monday:    { Breakfast: 'Ginger lemon tea & light poha', Lunch: 'Millet roti with spiced vegetables', Dinner: 'Light lentil soup with barley', Snack: 'Roasted seeds & honey' },
    Tuesday:   { Breakfast: 'Hot ginger tea & fruit (no banana)', Lunch: 'Rajma with small rice portion', Dinner: 'Spiced moong soup & roti', Snack: 'Trikatu churna in warm water' },
    Wednesday: { Breakfast: 'Turmeric milk & dry toast', Lunch: 'Quinoa with steamed vegetables', Dinner: 'Thin dal & vegetable stir-fry', Snack: 'Apple slices with cinnamon' },
    Thursday:  { Breakfast: 'Jowar flatbread with green chutney', Lunch: 'Mixed dal & spinach with roti', Dinner: 'Barley khichdi — light spiced', Snack: 'Warm water with honey & pepper' },
    Friday:    { Breakfast: 'Ragi porridge with small amount of jaggery', Lunch: 'Chickpea salad with lemon', Dinner: 'Vegetable clear soup', Snack: 'Sunflower seeds' },
    Saturday:  { Breakfast: 'Sprout chaat with lemon', Lunch: 'Full Kapha thali — light & spiced', Dinner: 'Broth with roti', Snack: 'Dry roasted nuts' },
    Sunday:    { Breakfast: 'Oats with berries & no added sugar', Lunch: 'Rice with peppery rasam & sabzi', Dinner: 'Light soup — no bread', Snack: 'Warm ginger tea' },
  },
  'Vata-Pitta': {
    Monday:    { Breakfast: 'Warm oats with almonds & dates', Lunch: 'Basmati rice with cooling mung dal', Dinner: 'Sweet potato soup with mild spices', Snack: 'Warm milk with fennel' },
    Tuesday:   { Breakfast: 'Stewed apples and pears', Lunch: 'Quinoa salad with roasted vegetables', Dinner: 'Mildly spiced khichdi', Snack: 'Coconut water' },
    Wednesday: { Breakfast: 'Pancakes with maple syrup', Lunch: 'Wheat roti with zucchini curry', Dinner: 'Lentil soup with a dollop of ghee', Snack: 'Soaked raisins' },
    Thursday:  { Breakfast: 'Rice porridge with cardamom', Lunch: 'Mixed dark leafy greens with rice', Dinner: 'Butternut squash soup', Snack: 'Almond milk' },
    Friday:    { Breakfast: 'Smoothie bowl at room temp', Lunch: 'Dal with cooling herbs like cilantro', Dinner: 'Steamed veggies and rice', Snack: 'Fresh sweet fruit' },
    Saturday:  { Breakfast: 'Warm semolina upma', Lunch: 'Balanced thali with moderate spices', Dinner: 'Light broth with bread', Snack: 'Rose milk' },
    Sunday:    { Breakfast: 'Warm sweet pongal', Lunch: 'Vegetable pulao with cucumber raita', Dinner: 'Thin vegetable soup', Snack: 'Cool herbal tea' },
  },
  'Pitta-Kapha': {
    Monday:    { Breakfast: 'Green juice or smoothie', Lunch: 'Quinoa with steamed broccoli and mild spices', Dinner: 'Clear vegetable soup', Snack: 'Fresh berries' },
    Tuesday:   { Breakfast: 'Oats with chia seeds', Lunch: 'Lentil salad with a squeeze of lemon', Dinner: 'Spiced, dry roasted vegetables', Snack: 'Sunflower seeds' },
    Wednesday: { Breakfast: 'Fresh seasonal fruits', Lunch: 'Millet with bitter greens', Dinner: 'Light mung dal soup', Snack: 'Cooling peppermint tea' },
    Thursday:  { Breakfast: 'Barley porridge', Lunch: 'Chickpea curry with minimal oil', Dinner: 'Cabbage and carrot stir-fry', Snack: 'Apple slices' },
    Friday:    { Breakfast: 'Warm water with lemon', Lunch: 'Brown rice with spinach dal', Dinner: 'Zucchini noodles with light sauce', Snack: 'Pumpkin seeds' },
    Saturday:  { Breakfast: 'Sprouted moong salad', Lunch: 'Balanced dry, light thali', Dinner: 'Thin broth', Snack: 'Astringent fruits like pomegranate' },
    Sunday:    { Breakfast: 'Buckwheat pancakes', Lunch: 'Vegetable stew with coriander', Dinner: 'Sautéed green beans', Snack: 'Cool water' },
  },
  'Vata-Kapha': {
    Monday:    { Breakfast: 'Warm ginger tea & spiced oats', Lunch: 'Millet and roasted root vegetables', Dinner: 'Light lentil soup with black pepper', Snack: 'Warm spiced milk' },
    Tuesday:   { Breakfast: 'Stewed fruits with cinnamon', Lunch: 'Moong dal khichdi cooked with warming spices', Dinner: 'Vegetable broth', Snack: 'Roasted pumpkin seeds' },
    Wednesday: { Breakfast: 'Warm quinoa porridge', Lunch: 'Spiced chickpeas with wheat roti', Dinner: 'Steamed veggies with ginger dressing', Snack: 'Ginger tea' },
    Thursday:  { Breakfast: 'Scrambled eggs or tofu with turmeric', Lunch: 'Rice with spicy dal', Dinner: 'Warm barley soup', Snack: 'A handful of nuts' },
    Friday:    { Breakfast: 'Warm amaranth porridge', Lunch: 'Stir-fried dark leafy greens with mustard seeds', Dinner: 'Light split pea soup', Snack: 'Warm water with honey' },
    Saturday:  { Breakfast: 'Spiced semolina', Lunch: 'Warming balanced thali', Dinner: 'Khichdi with mild heat', Snack: 'Walnuts' },
    Sunday:    { Breakfast: 'Hot spiced apple cider', Lunch: 'Root vegetable curry with quinoa', Dinner: 'Light pumpkin soup', Snack: 'Herbal tea' },
  },
  General: {
    Monday:    { Breakfast: 'Fresh fruits', Lunch: 'Whole grain roti, Mixed veg curry', Dinner: 'Vegetable soup, Steamed rice', Snack: 'Warm water' },
    Tuesday:   { Breakfast: 'Porridge', Lunch: 'Rice, Dal, Salad', Dinner: 'Light Khichdi', Snack: 'Herbal tea' },
    Wednesday: { Breakfast: 'Oatmeal', Lunch: 'Whole grain roti, Spinach', Dinner: 'Clear soup', Snack: 'Nuts' },
    Thursday:  { Breakfast: 'Smoothie', Lunch: 'Rice, Chickpea curry', Dinner: 'Steamed veggies', Snack: 'Fruit' },
    Friday:    { Breakfast: 'Pancakes', Lunch: 'Mixed grain pulao', Dinner: 'Light dal soup', Snack: 'Seeds' },
    Saturday:  { Breakfast: 'Upma', Lunch: 'Balanced thali', Dinner: 'Khichdi', Snack: 'Warm milk' },
    Sunday:    { Breakfast: 'Fruits and toast', Lunch: 'Rice and sambar', Dinner: 'Vegetable broth', Snack: 'Tea' },
  }
};

const DietRecommendationsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState({ username: '', prakriti: 'General' });
  const [plan, setPlan] = useState(null);
  const [source, setSource] = useState('');
  const [activeDay, setActiveDay] = useState('Monday');
  const [lang, setLang] = useState('en');

  const fetchDietData = async () => {
    try {
      const username = await AsyncStorage.getItem('userName');
      const offlinePrakriti = await AsyncStorage.getItem('userPrakriti') || await AsyncStorage.getItem(`prakriti_${username}`);
      const savedLang = await AsyncStorage.getItem('userLang') || 'en';
      setLang(savedLang);

      let currentPrakriti = offlinePrakriti || 'General';
      setProfile({ username: username || 'User', prakriti: currentPrakriti });

      // Profile Backend Sync
      try {
        const response = await axios.get(`${API_BASE_URL}/get-profile/?username=${username}`, { timeout: 8000 });
        if (response.data.prakriti) {
          currentPrakriti = response.data.prakriti;
          setProfile(prev => ({ ...prev, prakriti: currentPrakriti }));
          await AsyncStorage.setItem('userPrakriti', currentPrakriti);
          await AsyncStorage.setItem(`prakriti_${username}`, currentPrakriti);
        }
      } catch (e) {
        /* Offline — stick to async storage */
      }

      // Meal Plan Integration
      const CACHE_KEY = `meal_plan_${currentPrakriti}_${username}`;
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      
      try {
        const planRes = await axios.post(`${API_BASE_URL}/meal-plan/`, { dosha: currentPrakriti, username: username || "User" }, { timeout: 15000 });
        if (planRes.data && planRes.data.plan) {
          setPlan(planRes.data.plan);
          setSource('Online Weekly AI Planner');
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ plan: planRes.data.plan, source: 'ai' }));
        } else throw new Error('empty');
      } catch (err) {
        if (cached) {
          const parsed = JSON.parse(cached);
          setPlan(parsed.plan);
          setSource(parsed.source === 'offline' ? 'Offline Diet Plan' : 'Cached Diet Plan');
        } else {
          const fallbackRoutineKey = ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha'].includes(currentPrakriti) ? currentPrakriti : 'General';
          const offlinePlan = OFFLINE_PLANS[fallbackRoutineKey] || OFFLINE_PLANS.General;
          setPlan(offlinePlan);
          setSource('Offline Diet Planner');
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ plan: offlinePlan, source: 'offline' }));
        }
      }

    } catch (e) {
      console.error('Diet screen error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDietData();
    }, [])
  );

  const diets = useMemo(() => ({
    Vata: {
      icon: '💨', theme: '#E8F0FB',
      beneficial: ['Sweet Fruits', 'Cooked Grains', 'Ghee', 'Warm Milk', 'Avocado', 'Carrots', 'Asparagus', 'Mild Spices'],
      avoid: ['Raw Salads', 'Dry Crackers', 'Beans', 'Cabbage', 'Cold Drinks', 'Iced Water', 'Spicy Peppers'],
      tips: ['Routine is medicine—eat at the same time daily', 'Favor warm, oily, and heavy foods', 'Avoid stimulants like caffeine']
    },
    Pitta: {
      icon: '🔥', theme: THEME_SURFACE,
      beneficial: ['Cucumber', 'Watermelon', 'Leafy Greens', 'Coconut Oil', 'Seeds', 'Basmati Rice', 'Coriander'],
      avoid: ['Sour Fruits', 'Garlic', 'Vinegar', 'Red Meat', 'Hot Chilies', 'Pickles'],
      tips: ['Eat in a calm, cool environment', 'Do not skip meals', 'Favor cooling, refreshing foods']
    },
    Kapha: {
      icon: '💧', theme: '#FFF4E4',
      beneficial: ['Quinoa', 'Millet', 'Spicy Peppers', 'Raw Honey', 'Ginger', 'Green Beans', 'Leafy Greens', 'Pumpkin Seeds'],
      avoid: ['Dairy Products', 'Wheat', 'Iced Desserts', 'Salt', 'Bananas', 'Heavy Oils', 'Fried Foods'],
      tips: ['Eat only when truly hungry', 'Lunch should be the main meal', 'Favor warm, light, and dry foods']
    },
    "Vata-Pitta": {
      icon: '🌬️🔥', theme: '#FFF3EE',
      beneficial: ['Sweet Potatoes', 'Ghee', 'Zucchini', 'Oats', 'Coconut Oil', 'Mild Spices', 'Almonds', 'Dates'],
      avoid: ['Excess Spices', 'Raw Veggies', 'Dry Snacks', 'Ice Cold Drinks', 'Excess Caffeine', 'Sour Foods'],
      tips: ['Eat warm, nourishing meals', 'Favor cooling but cooked foods', 'Do not skip meals as it aggravates both Pitta and Vata']
    },
    "Pitta-Kapha": {
      icon: '🔥🌊', theme: THEME_SURFACE,
      beneficial: ['Bitter Greens', 'Quinoa', 'Coriander', 'Apples', 'Cucumber', 'Mint', 'Lentils', 'Sunflower Seeds'],
      avoid: ['Deep Fried Foods', 'Heavy Sweets', 'Excess Oil or Ghee', 'Red Meat', 'Excess Salt', 'Sour Fruits'],
      tips: ['Enjoy cooling, light meals with mild spices', 'Minimize oils and sugars', 'Green juices are excellent for this constitution']
    },
    "Vata-Kapha": {
      icon: '🌬️🌊', theme: '#EAF4EC',
      beneficial: ['Warm Soups', 'Ginger', 'Cooked Beans', 'Buckwheat', 'Honey', 'Mildly Spiced Teas', 'Cooked Root Veggies'],
      avoid: ['Cold Smoothies', 'Raw Salads', 'Heavy Dairy', 'Excess Sugar', 'Iced Drinks', 'Processed Carbs'],
      tips: ['Stick to warm, spiced, and light foods', 'Ginger tea is highly beneficial', 'Eat at consistent times to anchor Vata without burdening Kapha']
    },
    General: {
      icon: '🌿', theme: THEME_SURFACE,
      beneficial: ['Warm Water', 'Fresh Vegetables', 'Whole Grains', 'Mung Dal'],
      avoid: ['Processed Foods', 'Leftovers', 'Refined Sugar', 'Deep-fried Foods'],
      tips: ['Eat mindfully and chew well', 'Stay hydrated with warm water', 'Eat with the sun']
    }
  }), []);

  const currentPrakriti = profile?.prakriti || 'General';
  const dietKey = Object.keys(diets).includes(currentPrakriti) ? currentPrakriti : 'General';
  const diet = diets[dietKey];

  const DOSHA_ACCENTS = { 
    Vata: '#7B61FF', Pitta: '#E8593C', Kapha: '#0F8CC0', 
    'Vata-Pitta': '#D95C3C', 'Pitta-Kapha': '#D95C3C', 'Vata-Kapha': '#7B68EE', 
    General: THEME_COLOR 
  };
  const accent = DOSHA_ACCENTS[currentPrakriti] || THEME_COLOR;

  const handleExportPDF = async () => {
    if (!plan) return;
    const rows = DAYS.map(day => `
      <div class="day-block">
        <h2>${day}</h2>
        ${MEALS.map(m => `<p><strong>${MEAL_ICONS[m]} ${m}:</strong> ${plan[day]?.[m] || '—'}</p>`).join('')}
      </div>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body { font-family: Georgia, serif; padding: 24px; color: #141F17; }
  h1   { color: #1E5C33; border-bottom: 2px solid #2D7D46; padding-bottom: 8px; }
  .day-block { border-left: 4px solid #2D7D46; background: #F7FAF8; padding: 14px;
               margin: 12px 0; border-radius: 8px; }
  h2 { color: #2D7D46; font-size: 15px; margin: 0 0 8px; }
  p  { font-size: 13px; color: #5A6E60; margin: 4px 0; line-height: 1.6; }
  strong { color: #1E5C33; }
</style></head><body>
<h1>🥗 7-Day ${currentPrakriti} Dosha Meal Plan</h1>
<p style="color:#5A6E60;font-size:13px;">Generated for ${profile.username || 'User'} by Sanjeevani</p>
${rows}
<p style="font-size:11px;color:#aaa;margin-top:20px;">Generated by Sanjeevani App</p>
</body></html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert('Error', 'Could not export PDF.');
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={THEME_COLOR} />
    </View>
  );

  const t = translations[lang] || translations['en'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.diet_plan || 'Dietary Plan'}</Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); fetchDietData(); }} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchDietData} colors={[THEME_COLOR]} />}
      >
        {/* ── DOSHA CARD ── */}
        <View style={styles.doshaCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 22 }}>{diet.icon}</Text>
            </View>
            <View>
              <Text style={styles.doshaLabel}>Your {profile.username} Guide</Text>
              <Text style={styles.userName}>{currentPrakriti}</Text>
            </View>
          </View>
          <Text style={styles.quoteText}>"Let food be thy medicine and medicine be thy food."</Text>
        </View>

        <Text style={styles.sectionTitle}>Daily Choices</Text>

        {/* ── FAVOR / REDUCE GRID ── */}
        <View style={styles.comparisonContainer}>
          <View style={[styles.choiceCard, styles.favorCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.statusIndicator, { backgroundColor: THEME_COLOR }]} />
              <Text style={styles.choiceTitleText}>FAVOR</Text>
              <Text style={styles.choiceEmoji}>🥦</Text>
            </View>
            <View style={styles.itemsWrapper}>
              {diet.beneficial.slice(0, 6).map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.benefitText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.choiceCard, styles.reduceCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.statusIndicator, { backgroundColor: '#E53935' }]} />
              <Text style={styles.choiceTitleText}>REDUCE</Text>
              <Text style={styles.choiceEmoji}>🌶️</Text>
            </View>
            <View style={styles.itemsWrapper}>
              {diet.avoid.slice(0, 6).map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.crossIcon}>✕</Text>
                  <Text style={styles.avoidText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── RECOMMENDED WEEKLY AI MEAL PLAN ── */}
        <View style={styles.plannerHeader}>
             <Text style={styles.sectionTitle}>Daily Diet & AI Planner</Text>
        </View>
        
        {plan && (
          <View style={styles.plannerContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
              {DAYS.map(d => (
                <TouchableOpacity key={d}
                  style={[styles.dayChip, activeDay === d && { backgroundColor: accent, borderColor: accent }]}
                  onPress={() => setActiveDay(d)}>
                  <Text style={[styles.dayChipText, activeDay === d && { color: '#FFF' }]}>{d.slice(0, 3)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.mealsCard}>
              <Text style={styles.mealsDay}>{activeDay}</Text>
              {MEALS.map(meal => (
                <View key={meal} style={styles.mealRow}>
                  <View style={styles.mealIconBox}>
                    <Text style={styles.mealIcon}>{MEAL_ICONS[meal]}</Text>
                  </View>
                  <View style={styles.mealContent}>
                    <Text style={styles.mealType}>{meal}</Text>
                    <Text style={styles.mealText}>{plan[activeDay]?.[meal] || 'Rest day — light foods'}</Text>
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF}>
              <Text style={styles.exportBtnText}>📄 Export Plan as PDF</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── TIPS ── */}
        <View style={styles.tipsWrapper}>
          <View style={styles.tipsHeader}>
            <View style={styles.tipIconCircle}><Text>💡</Text></View>
            <Text style={styles.tipsTitle}>Wellness Guidelines</Text>
          </View>
          {diet.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipBody}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBar navigation={navigation} activeScreen="Diet" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backCircle: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center', elevation: 3,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 5,
  },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: THEME_DARK,
    justifyContent: 'center', alignItems: 'center', elevation: 3,
  },
  refreshText: { fontSize: 22, color: '#FFF', fontWeight: 'bold' },
  backArrow: { fontSize: 22, color: TEXT_PRIMARY },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: TEXT_PRIMARY },

  scrollContent: { paddingHorizontal: 20 },

  doshaCard: {
    borderRadius: 22, padding: 22, marginBottom: 26, backgroundColor: THEME_DARK,
    elevation: 10, shadowColor: THEME_DARK, shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 12 },
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconCircle: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  doshaLabel: { color: '#C8E6C9', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 3 },
  userName:   { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  quoteText:  { color: '#D4EDD7', fontSize: 13, fontStyle: 'italic', opacity: 0.85 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 14, color: TEXT_PRIMARY, marginLeft: 2 },
  plannerHeader: { flexDirection: 'row', alignItems: 'center' },
  sourceText: { fontSize: 13, color: TEXT_SECONDARY, marginBottom: 14, marginLeft: 6, fontStyle: 'italic' },

  comparisonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 26 },
  choiceCard: {
    width: width * 0.44, borderRadius: 18, padding: 15, backgroundColor: '#FFF',
    elevation: 4, shadowColor: THEME_DARK, shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
    borderWidth: 1, borderColor: '#EBEBEB',
  },
  favorCard: { borderTopWidth: 3, borderTopColor: THEME_COLOR },
  reduceCard: { borderTopWidth: 3, borderTopColor: '#E53935' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  statusIndicator: { width: 4, height: 12, borderRadius: 2, marginRight: 6 },
  choiceTitleText: { fontSize: 11, fontWeight: '800', color: TEXT_SECONDARY, letterSpacing: 1, flex: 1 },
  choiceEmoji: { fontSize: 13 },
  itemsWrapper: { marginTop: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  checkIcon: { fontSize: 10, color: THEME_COLOR, fontWeight: 'bold', marginRight: 6 },
  crossIcon: { fontSize: 10, color: '#E53935', fontWeight: 'bold', marginRight: 6 },
  benefitText: { fontSize: 12, color: THEME_DARK, fontWeight: '600' },
  avoidText:   { fontSize: 12, color: '#C62828', fontWeight: '600' },

  plannerContainer: { marginBottom: 20 },
  dayScroll: { marginBottom: 16 },
  dayChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FFF', marginRight: 8 },
  dayChipText: { fontSize: 14, fontWeight: '700', color: TEXT_SECONDARY },
  mealsCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#EBEBEB', elevation: 3, shadowColor: THEME_DARK, shadowOpacity: 0.07, shadowRadius: 8 },
  mealsDay: { fontSize: 18, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 16 },
  mealRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  mealIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: THEME_SURFACE, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  mealIcon: { fontSize: 18 },
  mealContent: { flex: 1 },
  mealType: { fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  mealText: { fontSize: 14, color: TEXT_PRIMARY, lineHeight: 20 },
  exportBtn: { backgroundColor: '#FFF', paddingVertical: 15, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: THEME_COLOR, marginTop: 15 },
  exportBtnText: { color: THEME_COLOR, fontWeight: '700', fontSize: 15 },

  tipsWrapper: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#EBEBEB', marginTop: 10, elevation: 3, shadowColor: THEME_DARK, shadowOpacity: 0.06, shadowRadius: 8 },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  tipIconCircle: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFF4E5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  tipBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME_COLOR, marginTop: 7, marginRight: 12 },
  tipBody: { fontSize: 13, color: TEXT_SECONDARY, flex: 1, lineHeight: 20 },
});

export default DietRecommendationsScreen;
