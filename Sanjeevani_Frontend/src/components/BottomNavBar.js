import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const THEME_COLOR = '#2D7D46';

const NavItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <Text style={{ fontSize: 22, color: active ? THEME_COLOR : '#9E9E9E' }}>{icon}</Text>
    <Text style={[styles.navText, active && { color: THEME_COLOR, fontWeight: 'bold' }]}>{label}</Text>
  </TouchableOpacity>
);

const BottomNavBar = ({ navigation, activeScreen }) => {
  return (
    <View style={styles.bottomNav}>
      <NavItem
        icon="🏠"
        label="Home"
        active={activeScreen === 'Home'}
        onPress={() => navigation.navigate('Home')}
      />
      <NavItem
        icon="📋"
        label="Blogs"
        active={activeScreen === 'Blog'}
        onPress={() => navigation.navigate('Blog')}
      />
      <NavItem
        icon="👥"
        label="Family"
        active={activeScreen === 'Family'}
        onPress={() => navigation.navigate('FamilyProfiles')}
      />
      <NavItem
        icon="💬"
        label="Chat"
        active={activeScreen === 'Chat'}
        onPress={() => navigation.navigate('Chat')}
      />
      <NavItem
        icon="👤"
        label="Profile"
        active={activeScreen === 'Profile'}
        onPress={() => navigation.navigate('Profile')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: 85,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    elevation: 10, // Adds a shadow so it floats beautifully above scrollable content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  navText: {
    fontSize: 10,
    marginTop: 4,
    color: '#9E9E9E'
  }
});

export default BottomNavBar;
