import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, TextInput, Alert, Modal, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants';

const { width } = Dimensions.get('window');

const THEME_COLOR   = '#2D7D46';
const THEME_DARK    = '#1E5C33';
const THEME_SURFACE = '#EAF4EC';
const BACKGROUND    = '#F7FAF8';
const TEXT_PRIMARY  = '#141F17';
const TEXT_SECONDARY= '#5A6E60';

const DOSHA_COLORS = {
  Vata:    { bg: '#EDE9FF', border: '#7B61FF', text: '#4B3DBF', emoji: '🌬️' },
  Pitta:   { bg: '#FFF0ED', border: '#E8593C', text: '#B03A22', emoji: '🔥' },
  Kapha:   { bg: '#E8F5FF', border: '#0F8CC0', text: '#0A6A94', emoji: '🌊' },
  Unknown: { bg: '#F0F0F0', border: '#999',    text: '#666',    emoji: '❓' },
};

const AVATAR_COLORS = ['#2D7D46','#E8593C','#7B61FF','#0F8CC0','#E8870A','#D4527E'];
const RELATIONS     = ['Self','Spouse','Parent','Child','Sibling','Other'];

const FamilyProfilesScreen = ({ navigation, route }) => {
  const { userName = '' } = route.params || {};

  const [members,    setMembers]    = useState([]);
  const [showModal,  setShowModal]  = useState(false);
  const [editMember, setEditMember] = useState(null);

  // Form state
  const [form, setForm] = useState({ name: '', age: '', relation: 'Spouse', dosha: 'Unknown', gender: 'Female' });

  const STORAGE_KEY = `family_profiles_${userName}`;

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    try {
      // Try backend first
      const res = await axios.get(`${API_BASE_URL}/family-members/?username=${userName}`, { timeout: 6000 });
      if (res.data && Array.isArray(res.data)) {
        setMembers(res.data);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
        return;
      }
    } catch (_) {}
    // Fallback to local
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) setMembers(JSON.parse(cached));
  };

  const saveMembers = async (updated) => {
    setMembers(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Sync to backend
    try {
      await axios.post(`${API_BASE_URL}/family-members/sync/`, { username: userName, members: updated }, { timeout: 6000 });
    } catch (_) {}
  };

  const openAdd = () => {
    setEditMember(null);
    setForm({ name: '', age: '', relation: 'Spouse', dosha: 'Unknown', gender: 'Female' });
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditMember(m);
    setForm({ name: m.name, age: String(m.age), relation: m.relation, dosha: m.dosha, gender: m.gender });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Name required'); return; }
    const member = {
      id:       editMember?.id || Date.now().toString(),
      name:     form.name.trim(),
      age:      parseInt(form.age) || 0,
      relation: form.relation,
      dosha:    form.dosha,
      gender:   form.gender,
      color:    editMember?.color || AVATAR_COLORS[members.length % AVATAR_COLORS.length],
    };
    const updated = editMember
      ? members.map(m => m.id === editMember.id ? member : m)
      : [...members, member];
    await saveMembers(updated);
    setShowModal(false);
  };

  const handleDelete = (m) => {
    Alert.alert('Remove Member', `Remove ${m.name} from family?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
          await saveMembers(members.filter(x => x.id !== m.id));
        }
      },
    ]);
  };

  const handleDiagnose = async (m) => {
    // Ensures the diagnosis does not overwrite the main user's profile
    await AsyncStorage.setItem('isGuest', 'true');
    navigation.navigate('Input', { dosha: m.dosha, userName: m.name, isGuest: true });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_DARK} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Profiles</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {members.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.emptyTitle}>No family members yet</Text>
            <Text style={styles.emptySubtitle}>Add your family to track everyone's Ayurvedic health in one app.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={openAdd}>
              <Text style={styles.primaryBtnText}>Add First Member</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>{members.length} family member{members.length !== 1 ? 's' : ''}</Text>
            {members.map(m => {
              const dc = DOSHA_COLORS[m.dosha] || DOSHA_COLORS.Unknown;
              return (
                <TouchableOpacity key={m.id} style={styles.memberCard} onPress={() => handleDiagnose(m)} activeOpacity={0.7}>
                  <View style={[styles.avatar, { backgroundColor: m.color }]}>
                    <Text style={styles.avatarText}>{m.name[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{m.name}</Text>
                    <Text style={styles.memberMeta}>{m.relation} · Age {m.age || '?'} · {m.gender}</Text>
                    <View style={[styles.doshaPill, { backgroundColor: dc.bg, borderColor: dc.border }]}>
                      <Text style={[styles.doshaPillText, { color: dc.text }]}>{dc.emoji} {m.dosha}</Text>
                    </View>
                  </View>
                  <View style={styles.memberActions}>
                    <TouchableOpacity onPress={() => openEdit(m)} style={styles.iconBtn}>
                      <Text style={styles.iconBtnText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(m)} style={styles.iconBtn}>
                      <Text style={styles.iconBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editMember ? 'Edit Member' : 'Add Family Member'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={v => setForm({...form, name: v})}
              placeholder="Member name" placeholderTextColor="#AAA" />

            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput style={styles.input} value={form.age} onChangeText={v => setForm({...form, age: v})}
              placeholder="Age" keyboardType="numeric" placeholderTextColor="#AAA" />

            <Text style={styles.fieldLabel}>Relation</Text>
            <View style={styles.chipRow}>
              {RELATIONS.map(r => (
                <TouchableOpacity key={r}
                  style={[styles.selectChip, form.relation === r && styles.selectChipActive]}
                  onPress={() => setForm({...form, relation: r})}>
                  <Text style={[styles.selectChipText, form.relation === r && styles.selectChipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.chipRow}>
              {['Male','Female','Other'].map(g => (
                <TouchableOpacity key={g}
                  style={[styles.selectChip, form.gender === g && styles.selectChipActive]}
                  onPress={() => setForm({...form, gender: g})}>
                  <Text style={[styles.selectChipText, form.gender === g && styles.selectChipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Dosha Type</Text>
            <View style={styles.chipRow}>
              {['Vata','Pitta','Kapha','Unknown'].map(d => {
                const dc = DOSHA_COLORS[d];
                return (
                  <TouchableOpacity key={d}
                    style={[styles.selectChip, form.dosha === d && { backgroundColor: dc.bg, borderColor: dc.border }]}
                    onPress={() => setForm({...form, dosha: d})}>
                    <Text style={[styles.selectChipText, form.dosha === d && { color: dc.text }]}>{dc.emoji} {d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={handleSave}>
                <Text style={styles.saveModalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  addBtn:      { backgroundColor: THEME_COLOR, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText:  { color: '#FFF', fontWeight: '700', fontSize: 13 },
  scroll:      { padding: 20 },
  sectionLabel:{ fontSize: 13, color: TEXT_SECONDARY, fontWeight: '600', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },

  emptyBox:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyEmoji:    { fontSize: 60, marginBottom: 16 },
  emptyTitle:    { fontSize: 20, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  primaryBtn:    { backgroundColor: THEME_COLOR, paddingVertical: 15, paddingHorizontal: 32, borderRadius: 14 },
  primaryBtnText:{ color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  memberCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 14,
    flexDirection: 'row', alignItems: 'flex-start',
    borderWidth: 1, borderColor: '#EBEBEB', elevation: 3,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8,
  },
  avatar:       { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText:   { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  memberInfo:   { flex: 1 },
  memberName:   { fontSize: 17, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 2 },
  memberMeta:   { fontSize: 12, color: TEXT_SECONDARY, marginBottom: 8 },
  doshaPill:    { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  doshaPillText:{ fontSize: 12, fontWeight: '700' },
  memberActions:{ alignItems: 'flex-end', gap: 6 },
  diagBtn:      { backgroundColor: THEME_SURFACE, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#C8E6C9' },
  diagBtnText:  { color: THEME_DARK, fontSize: 12, fontWeight: '700' },
  iconBtn:      { padding: 4 },
  iconBtnText:  { fontSize: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle:   { fontSize: 20, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 20 },
  fieldLabel:   { fontSize: 13, fontWeight: '700', color: TEXT_SECONDARY, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:        { backgroundColor: '#F7FAF8', borderRadius: 12, padding: 14, fontSize: 15, color: TEXT_PRIMARY, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 16 },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  selectChip:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#F7FAF8' },
  selectChipActive:    { backgroundColor: THEME_SURFACE, borderColor: THEME_COLOR },
  selectChipText:      { fontSize: 13, color: TEXT_SECONDARY, fontWeight: '600' },
  selectChipTextActive:{ color: THEME_DARK },
  modalBtns:    { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:    { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#E0E0E0' },
  cancelBtnText:{ color: TEXT_SECONDARY, fontWeight: '700', fontSize: 15 },
  saveModalBtn: { flex: 2, paddingVertical: 15, borderRadius: 14, alignItems: 'center', backgroundColor: THEME_COLOR },
  saveModalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});

export default FamilyProfilesScreen;
