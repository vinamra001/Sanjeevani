import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import axios from 'axios';

// ─── Refined Green Palette (matches HomeScreen) ───────────────────────────────
const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_LIGHT    = '#4CAF72';
const THEME_SURFACE  = '#EAF4EC';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';
// ─────────────────────────────────────────────────────────────────────────────

const AdminDashboardScreen = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://192.168.0.106:8000/api/v1/admin-stats/');
      setStats(response.data);
    } catch (e) {
      console.error("Admin Stats Fetch Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={THEME_COLOR} />
      <Text style={{ marginTop: 10, color: THEME_COLOR }}>Loading Analytics...</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME_COLOR]} />}
    >
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />
      <Text style={styles.header}>System Analytics</Text>

      {/* Main Stats Card */}
      <View style={styles.statCard}>
        <View>
          <Text style={styles.label}>Total Users Registered</Text>
          <Text style={styles.mainValue}>{stats?.total_users || 0}</Text>
        </View>
        <Text style={styles.statEmoji}>👥</Text>
      </View>

      <View style={styles.whiteBox}>
        <Text style={styles.sectionTitle}>Constitution (Prakriti) Distribution</Text>

        {stats?.dosha_distribution && stats.dosha_distribution.length > 0 ? (
          stats.dosha_distribution.map((item, index) => {
            const percentage = stats.total_users > 0
              ? ((item.count / stats.total_users) * 100).toFixed(0)
              : 0;

            return (
              <View key={index} style={styles.barRow}>
                <View style={styles.barHeader}>
                  <Text style={styles.barLabel}>{item.prakriti || 'Pending'}</Text>
                  <Text style={styles.barValue}>{item.count} users ({percentage}%)</Text>
                </View>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${percentage}%` },
                      { backgroundColor: index === 0 ? THEME_DARK : index === 1 ? THEME_COLOR : THEME_LIGHT }
                    ]}
                  />
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.noData}>No user data available yet.</Text>
        )}
      </View>

      <View style={styles.footerInfo}>
        <Text style={styles.footerText}>Data synced with MongoDB Cluster</Text>
        <Text style={styles.footerText}>Last Updated: {new Date().toLocaleTimeString()}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND, padding: 20 },  // was #F0F4F0
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND },

  header: { fontSize: 26, fontWeight: 'bold', color: THEME_DARK, marginBottom: 22, marginTop: 10 },  // was 28 / THEME_COLOR

  statCard: {
    backgroundColor: THEME_DARK,          // was flat THEME_COLOR — richer
    padding: 24, borderRadius: 22,        // was 25 / 24
    marginBottom: 22,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 10,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 14,
  },
  label:     { color: '#C8E6C9', fontSize: 14, fontWeight: '600' },   // was #FFF opacity 0.9
  mainValue: { color: '#FFF', fontSize: 48, fontWeight: 'bold', marginTop: 5 },
  statEmoji: { fontSize: 38, opacity: 0.45 },

  whiteBox: {
    backgroundColor: '#FFF',
    borderRadius: 20,                     // was 24
    padding: 20,
    elevation: 4,
    shadowColor: THEME_DARK,             // was #000
    shadowOpacity: 0.08, shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    borderWidth: 1, borderColor: '#EBEBEB',
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 18 },  // was 17 / #333

  barRow:      { marginBottom: 18 },     // was 20
  barHeader:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  barLabel:    { fontSize: 14, fontWeight: 'bold', color: TEXT_PRIMARY },    // was 15 / #444
  barValue:    { fontSize: 12, color: TEXT_SECONDARY, fontWeight: '600' },   // was 13 / #777
  barContainer:{ height: 10, backgroundColor: THEME_SURFACE, borderRadius: 6, overflow: 'hidden' },  // was 12 / #E8F5E9
  barFill:     { height: '100%', borderRadius: 6 },

  noData:     { textAlign: 'center', color: TEXT_SECONDARY, marginVertical: 20, fontStyle: 'italic' },
  footerInfo: { marginTop: 28, alignItems: 'center', paddingBottom: 40 },
  footerText: { fontSize: 11, color: '#AAA', marginBottom: 4 },
});

export default AdminDashboardScreen;
