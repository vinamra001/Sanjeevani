// ─────────────────────────────────────────────────────────────────────────────
// In src/navigation/AppNavigator.js
// ADD these 3 imports at the top with your other screen imports:
// ─────────────────────────────────────────────────────────────────────────────

import DailyPulseCheckScreen  from '../screens/DailyPulseCheckScreen';
import SmartNotificationsScreen from '../screens/SmartNotificationsScreen';
import PanchakarmaPlanner     from '../screens/PanchakarmaPlanner';

// ─────────────────────────────────────────────────────────────────────────────
// Inside AppStack(), ADD these 3 Stack.Screen entries
// (place them in the "LIFESTYLE & UTILITIES" section):
// ─────────────────────────────────────────────────────────────────────────────

<Stack.Screen name="DailyPulseCheck"      component={DailyPulseCheckScreen} />
<Stack.Screen name="SmartNotifications"   component={SmartNotificationsScreen} />
<Stack.Screen name="PanchakarmaPlanner"   component={PanchakarmaPlanner} />

// ─────────────────────────────────────────────────────────────────────────────
// That's all — no other changes to AppNavigator.js needed.
// The HomeScreen already navigates to these with:
//   navigation.navigate('DailyPulseCheck', { dosha, userName: displayName, lang })
//   navigation.navigate('SmartNotifications', { dosha, lang })
//   navigation.navigate('PanchakarmaPlanner', { dosha, lang })
// ─────────────────────────────────────────────────────────────────────────────
