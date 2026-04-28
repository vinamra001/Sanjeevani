from django.urls import path
from .views import (
    SymptomListView,
    PredictionView,
    DiseaseDetailView,
    LoginView,
    RegisterView,
    ChatBotView,
    UpdatePrakritiView,
    GetProfileView,
    GetAyurvedicPlanView,
    AdminStatsView,
    ForgotPasswordView,
    BlogListView,
    HealthHistoryView,
    VoiceSymptomView,
    FamilyMembersView, 
    FamilyMembersSyncView,
    MealPlanView,
    IdentifyHerbView,
    HealthScoreView,
    ForumPostsView, 
    ForumUpvoteView,
    OfflineChatSyncView,
    SeasonalGuideView,
    VedicAstroView
)

urlpatterns = [
    # --- 1. CORE DIAGNOSIS ENGINE ---
    # GET: Returns the list of all symptoms for the selection screen
    path('symptoms/', SymptomListView.as_view(), name='symptom-list'),
    
    # POST: Accepts symptoms and returns ML-based disease predictions
    path('predict/', PredictionView.as_view(), name='predict'),

    # GET: Returns detailed Ayurvedic info (Nidana, Chikitsa) for a specific disease
    path('diseases/<str:pk>/', DiseaseDetailView.as_view(), name='disease-detail'),

    # --- 2. USER AUTHENTICATION & PROFILES ---
    # POST: Validates user credentials and returns a session token
    path('login/', LoginView.as_view(), name='login'),
    
    # POST: Creates a new User and a corresponding UserProfile
    path('register/', RegisterView.as_view(), name='register'),
    
    # GET: Fetches Age, Gender, and Prakriti (Dosha) for the Profile Screen
    path('get-profile/', GetProfileView.as_view(), name='get-profile'),

    # POST: Saves the results of the Dosha Quiz to the database
    path('update-prakriti/', UpdatePrakritiView.as_view(), name='update-prakriti'),

    # --- 3. AI ASSISTANT & CONTENT ---
    # POST: Personalized AI chat using Gemini API with User context
    path('chat/', ChatBotView.as_view(), name='chatbot'),

    # GET: Generates a Dosha-specific Dincharya (Routine) or Diet Plan
    path('get-plan/', GetAyurvedicPlanView.as_view(), name='get-plan'),

    path('admin-stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('blogs/', BlogListView.as_view(), name='blogs'),
    path('health-history/', HealthHistoryView.as_view(), name='health-history'),
    path('voice-symptom/', VoiceSymptomView.as_view(), name='voice-symptom'),
    
    # Family profiles
    path('family-members/',       FamilyMembersView.as_view(),      name='family-members'),
    path('family-members/sync/',  FamilyMembersSyncView.as_view(),  name='family-sync'),

    # AI Meal Planner
    path('meal-plan/',            MealPlanView.as_view(),           name='meal-plan'),

    # AR Herb Identifier
    path('identify-herb/',        IdentifyHerbView.as_view(),       name='identify-herb'),

    # Health Score
    path('health-score/',         HealthScoreView.as_view(),        name='health-score'),

    # Community Forum
    path('forum/posts/',          ForumPostsView.as_view(),         name='forum-posts'),
    path('forum/upvote/',         ForumUpvoteView.as_view(),        name='forum-upvote'),

    # Offline Chat
    path('offline-chat-sync/',    OfflineChatSyncView.as_view(),    name='offline-chat-sync'),

    # Seasonal Guide
    path('seasonal-guide/',       SeasonalGuideView.as_view(),      name='seasonal-guide'),

    # Vedic Astro + Ayurveda
    path('vedic-astro/',          VedicAstroView.as_view(),         name='vedic-astro'),
]