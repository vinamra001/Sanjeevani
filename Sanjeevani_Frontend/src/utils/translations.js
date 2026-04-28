// src/utils/translations.js
// Languages: English (en), Hindi (hi), Marathi (mr)

export const translations = {

  // ─── ENGLISH ──────────────────────────────────────────────────────────────
  en: {
    // Home
    namaste:          'Namaste',
    wellness_profile: 'Wellness Profile',
    dominant_dosha:   'Dominant Dosha',
    prakriti_desc:    'Take the Dosha Quiz to discover your unique body constitution.',
    analyze_prakriti: 'Analyze Your Prakriti',
    quick_actions:    'Quick Actions',
    diagnosis:        'Diagnosis',
    diet_plan:        'Diet Plan',
    routine:          'Morning Routine',
    remedies:         'Remedies',

    // New Sections
    title_today:      "Today's Wellness",
    title_adv:        "Advanced AI Features",
    
    // Feature titles & sub
    title_meal:       'AI Meal Planner',
    sub_meal:         '7-day personalized Ayurvedic diet',
    title_health:     'Health Score',
    sub_health:       'Evaluate holistic well-being',
    title_family:     'Family Profiles',
    sub_family:       "Manage everyone's dosha and history",
    title_forum:      'Community Forum',
    sub_forum:        'Share and discover Ayurvedic remedies',
    title_chatbot:    'Offline AI Chatbot',
    sub_chatbot:      'Smart replies without wifi',
    title_ritu:       'Seasonal Ritu Guide',
    sub_ritu:         'Auto-adjusts advice by season',
    title_astro:      'Vedic Astro + Ayurveda',
    sub_astro:        'Birth chart → Ayurvedic remedies',

    // Daily AI Pulse Check
    pulse_title:         'Daily AI Pulse Check',
    pulse_subtitle:      '7 quick questions → personalised health tip',
    pulse_q1:            'How are you feeling today overall?',
    pulse_q1_opts:       ['Great 😊', 'Okay 😐', 'Tired 😔', 'Unwell 🤒'],
    pulse_q2:            'How was your digestion today?',
    pulse_q2_opts:       ['Perfect 👍', 'Bloated 😮', 'Acidity 🔥', 'Irregular 🌀'],
    pulse_q3:            'How was your sleep last night?',
    pulse_q3_opts:       ['Restful 🌙', 'Light 😴', 'Poor 😵', 'No sleep 😩'],
    pulse_loading:       'Consulting Vedic wisdom...',
    pulse_tip_label:     "Today's Ayurvedic Tip",
    pulse_retake:        'Check Again Tomorrow',
    pulse_already_done:  "Today's check is complete ✓",
    pulse_btn:           'Start Daily Check',

    // Smart Push Notifications
    notif_title:         'Smart Notifications',
    notif_subtitle:      'Dosha-based daily reminders',
    notif_morning:       'Morning Ritual',
    notif_afternoon:     'Afternoon Balance',
    notif_evening:       'Evening Wind-Down',
    notif_enable:        'Enable Reminders',
    notif_enabled:       'Reminders Active ✓',
    notif_save:          'Save Schedule',
    notif_saved:         'Schedule Saved!',
    notif_permission:    'Please allow notifications in device settings.',

    // Panchakarma Planner
    pancha_title:        'Panchakarma Planner',
    pancha_subtitle:     '7-day Ayurvedic detox tracker',
    pancha_day:          'Day',
    pancha_complete:     'Mark Complete',
    pancha_completed:    'Completed ✓',
    pancha_reset:        'Reset Plan',
    pancha_progress:     'Detox Progress',
    pancha_start:        'Start 7-Day Detox',
    pancha_congrats:     '🎉 Detox Complete! Great discipline!',
    pancha_share:        'Share Progress',

    // Common
    back:   '← Back',
    save:   'Save',
    cancel: 'Cancel',
    done:   'Done',
    loading:'Loading...',
  },

  // ─── HINDI ────────────────────────────────────────────────────────────────
  hi: {
    // Home
    namaste:          'नमस्ते',
    wellness_profile: 'स्वास्थ्य प्रोफ़ाइल',
    dominant_dosha:   'प्रमुख दोष',
    prakriti_desc:    'अपनी अनोखी प्रकृति जानने के लिए दोष प्रश्नोत्तरी लें।',
    analyze_prakriti: 'अपनी प्रकृति जानें',
    quick_actions:    'त्वरित क्रियाएँ',
    diagnosis:        'निदान',
    diet_plan:        'आहार योजना',
    routine:          'सुबह की दिनचर्या',
    remedies:         'उपाय',

    // New Sections
    title_today:      'आज का स्वास्थ्य',
    title_adv:        'उन्नत AI सुविधाएँ',

    // Feature titles & sub
    title_meal:       'AI आहार योजनाकार',
    sub_meal:         '7-दिन का व्यक्तिगत आयुर्वेदिक आहार',
    title_health:     'स्वास्थ्य स्कोर',
    sub_health:       'समग्र कल्याण का मूल्यांकन करें',
    title_family:     'पारिवारिक प्रोफ़ाइल',
    sub_family:       'हर किसी के दोष और इतिहास का प्रबंधन करें',
    title_forum:      'सामुदायिक मंच',
    sub_forum:        'आयुर्वेदिक उपाय साझा करें और खोजें',
    title_chatbot:    'ऑफ़लाइन AI चैटबॉट',
    sub_chatbot:      'बिना वाईफ़ाई के स्मार्ट उत्तर',
    title_ritu:       'मौसमी ऋतु मार्गदर्शिका',
    sub_ritu:         'मौसम के अनुसार सलाह को स्वतः समायोजित करता है',
    title_astro:      'वैदिक ज्योतिष + आयुर्वेद',
    sub_astro:        'जन्म कुंडली → आयुर्वेदिक उपाय',

    // Daily AI Pulse Check
    pulse_title:         'दैनिक AI स्वास्थ्य जाँच',
    pulse_subtitle:      '3 सवाल → व्यक्तिगत स्वास्थ्य सुझाव',
    pulse_q1:            'आज आप कुल मिलाकर कैसा महसूस कर रहे हैं?',
    pulse_q1_opts:       ['बहुत अच्छा 😊', 'ठीक है 😐', 'थका हुआ 😔', 'अस्वस्थ 🤒'],
    pulse_q2:            'आज आपका पाचन कैसा रहा?',
    pulse_q2_opts:       ['बिल्कुल ठीक 👍', 'पेट फूलना 😮', 'एसिडिटी 🔥', 'अनियमित 🌀'],
    pulse_q3:            'कल रात आपकी नींद कैसी रही?',
    pulse_q3_opts:       ['अच्छी नींद 🌙', 'हल्की नींद 😴', 'खराब नींद 😵', 'नींद नहीं आई 😩'],
    pulse_loading:       'वैदिक ज्ञान से परामर्श हो रहा है...',
    pulse_tip_label:     'आज का आयुर्वेदिक सुझाव',
    pulse_retake:        'कल फिर जाँचें',
    pulse_already_done:  'आज की जाँच पूरी हो गई ✓',
    pulse_btn:           'दैनिक जाँच शुरू करें',

    // Smart Push Notifications
    notif_title:         'स्मार्ट सूचनाएँ',
    notif_subtitle:      'दोष-आधारित दैनिक स्मरण',
    notif_morning:       'सुबह की रस्म',
    notif_afternoon:     'दोपहर का संतुलन',
    notif_evening:       'शाम का आराम',
    notif_enable:        'रिमाइंडर चालू करें',
    notif_enabled:       'रिमाइंडर सक्रिय ✓',
    notif_save:          'शेड्यूल सहेजें',
    notif_saved:         'शेड्यूल सहेजा गया!',
    notif_permission:    'कृपया डिवाइस सेटिंग्स में सूचनाएँ अनुमति दें।',

    // Panchakarma Planner
    pancha_title:        'पंचकर्म योजनाकार',
    pancha_subtitle:     '7-दिन का आयुर्वेदिक विषहरण ट्रैकर',
    pancha_day:          'दिन',
    pancha_complete:     'पूर्ण चिह्नित करें',
    pancha_completed:    'पूर्ण ✓',
    pancha_reset:        'योजना रीसेट करें',
    pancha_progress:     'विषहरण प्रगति',
    pancha_start:        '7-दिन का डिटॉक्स शुरू करें',
    pancha_congrats:     '🎉 डिटॉक्स पूरा! बहुत अच्छा अनुशासन!',
    pancha_share:        'प्रगति साझा करें',

    // Common
    back:   '← वापस',
    save:   'सहेजें',
    cancel: 'रद्द करें',
    done:   'हो गया',
    loading:'लोड हो रहा है...',
  },

  // ─── MARATHI ──────────────────────────────────────────────────────────────
  mr: {
    // Home
    namaste:          'नमस्कार',
    wellness_profile: 'आरोग्य प्रोफाइल',
    dominant_dosha:   'प्रमुख दोष',
    prakriti_desc:    'आपली अनोखी प्रकृती जाणून घेण्यासाठी दोष प्रश्नमंजुषा घ्या.',
    analyze_prakriti: 'आपली प्रकृती जाणून घ्या',
    quick_actions:    'जलद क्रिया',
    diagnosis:        'निदान',
    diet_plan:        'आहार योजना',
    routine:          'सकाळची दिनचर्या',
    remedies:         'उपाय',

    // New Sections
    title_today:      'आजचे आरोग्य',
    title_adv:        'प्रगत AI वैशिष्ट्ये',

    // Feature titles & sub
    title_meal:       'AI आहार नियोजक',
    sub_meal:         '७-दिवसांचा वैयक्तिक आयुर्वेदिक आहार',
    title_health:     'आरोग्य स्कोअर',
    sub_health:       'समग्र कल्याणाचे मूल्यांकन करा',
    title_family:     'कौटुंबिक प्रोफाइल',
    sub_family:       'सर्वांचे दोष आणि इतिहास व्यवस्थापित करा',
    title_forum:      'समुदाय मंच',
    sub_forum:        'आयुर्वेदिक उपाय शेअर करा आणि शोधा',
    title_chatbot:    'ऑफलाइन AI चॅटबॉट',
    sub_chatbot:      'वायफाय शिवाय स्मार्ट उत्तरे',
    title_ritu:       'हंगामी ऋतू मार्गदर्शक',
    sub_ritu:         'हंगामानुसार सल्ला स्वयंचलितरित्या समायोजित करतो',
    title_astro:      'वैदिक ज्योतिष + आयुर्वेद',
    sub_astro:        'जन्मकुंडली → आयुर्वेदिक उपाय',

    // Daily AI Pulse Check
    pulse_title:         'दैनिक AI आरोग्य तपासणी',
    pulse_subtitle:      '३ प्रश्न → वैयक्तिक आरोग्य सल्ला',
    pulse_q1:            'आज तुम्हाला एकूण कसे वाटत आहे?',
    pulse_q1_opts:       ['खूप छान 😊', 'ठीक आहे 😐', 'थकलेलो 😔', 'अस्वस्थ 🤒'],
    pulse_q2:            'आज तुमचे पचन कसे होते?',
    pulse_q2_opts:       ['उत्तम 👍', 'पोट फुगणे 😮', 'आम्लपित्त 🔥', 'अनियमित 🌀'],
    pulse_q3:            'काल रात्री तुमची झोप कशी होती?',
    pulse_q3_opts:       ['शांत झोप 🌙', 'हलकी झोप 😴', 'खराब झोप 😵', 'झोप नाही 😩'],
    pulse_loading:       'वैदिक ज्ञानाचा सल्ला घेत आहे...',
    pulse_tip_label:     'आजचा आयुर्वेदिक सल्ला',
    pulse_retake:        'उद्या पुन्हा तपासा',
    pulse_already_done:  'आजची तपासणी पूर्ण ✓',
    pulse_btn:           'दैनिक तपासणी सुरू करा',

    // Smart Push Notifications
    notif_title:         'स्मार्ट सूचना',
    notif_subtitle:      'दोष-आधारित दैनिक स्मरणपत्र',
    notif_morning:       'सकाळची विधी',
    notif_afternoon:     'दुपारचे संतुलन',
    notif_evening:       'संध्याकाळची विश्रांती',
    notif_enable:        'स्मरणपत्र सुरू करा',
    notif_enabled:       'स्मरणपत्र सक्रिय ✓',
    notif_save:          'वेळापत्रक जतन करा',
    notif_saved:         'वेळापत्रक जतन झाले!',
    notif_permission:    'कृपया डिव्हाइस सेटिंग्जमध्ये सूचना परवानगी द्या.',

    // Panchakarma Planner
    pancha_title:        'पंचकर्म नियोजक',
    pancha_subtitle:     '७-दिवसांचा आयुर्वेदिक विषमुक्ती ट्रॅकर',
    pancha_day:          'दिवस',
    pancha_complete:     'पूर्ण म्हणून चिन्हांकित करा',
    pancha_completed:    'पूर्ण ✓',
    pancha_reset:        'योजना रीसेट करा',
    pancha_progress:     'विषमुक्ती प्रगती',
    pancha_start:        '७-दिवसांचा डिटॉक्स सुरू करा',
    pancha_congrats:     '🎉 डिटॉक्स पूर्ण! उत्कृष्ट शिस्त!',
    pancha_share:        'प्रगती शेअर करा',

    // Common
    back:   '← मागे',
    save:   'जतन करा',
    cancel: 'रद्द करा',
    done:   'झाले',
    loading:'लोड होत आहे...',
  },
};
