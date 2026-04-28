# ─────────────────────────────────────────────────────────────────────────────
# ADD ALL THESE VIEWS to recommender_api/views.py
# ─────────────────────────────────────────────────────────────────────────────
# Also add to models.py (see section at bottom of this file)
# ─────────────────────────────────────────────────────────────────────────────

import base64
import json
import random


# ══════════════════════════════════════════════════════════════════════════════
# 1. FAMILY PROFILES
# ══════════════════════════════════════════════════════════════════════════════

class FamilyMembersView(APIView):
    """
    GET  /api/v1/family-members/?username=neha  → list all members
    POST /api/v1/family-members/sync/           → bulk save members
    """
    def get(self, request):
        username = request.query_params.get('username')
        if not username:
            return Response([], status=status.HTTP_200_OK)
        try:
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS family_members (
                    id       TEXT PRIMARY KEY,
                    username TEXT NOT NULL,
                    name     TEXT, age INTEGER, relation TEXT,
                    dosha    TEXT DEFAULT 'Unknown',
                    gender   TEXT, color TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            cursor.execute("SELECT id,name,age,relation,dosha,gender,color FROM family_members WHERE username=?", (username,))
            rows = cursor.fetchall()
            conn.close()
            members = [{'id':r[0],'name':r[1],'age':r[2],'relation':r[3],'dosha':r[4],'gender':r[5],'color':r[6]} for r in rows]
            return Response(members, status=status.HTTP_200_OK)
        except Exception as e:
            return Response([], status=status.HTTP_200_OK)


class FamilyMembersSyncView(APIView):
    """POST /api/v1/family-members/sync/  — full sync from device"""
    def post(self, request):
        username = request.data.get('username')
        members  = request.data.get('members', [])
        if not username:
            return Response({'error': 'username required'}, status=400)
        try:
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS family_members (
                    id TEXT PRIMARY KEY, username TEXT NOT NULL,
                    name TEXT, age INTEGER, relation TEXT,
                    dosha TEXT DEFAULT 'Unknown', gender TEXT, color TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Delete old records for this user and re-insert all
            cursor.execute("DELETE FROM family_members WHERE username=?", (username,))
            for m in members:
                cursor.execute("""
                    INSERT OR REPLACE INTO family_members
                    (id, username, name, age, relation, dosha, gender, color)
                    VALUES (?,?,?,?,?,?,?,?)
                """, (m.get('id',''), username, m.get('name',''), m.get('age',0),
                      m.get('relation',''), m.get('dosha','Unknown'),
                      m.get('gender',''), m.get('color','')))
            conn.commit()
            conn.close()
            return Response({'message': f'{len(members)} members synced'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ══════════════════════════════════════════════════════════════════════════════
# 2. AI MEAL PLANNER
# ══════════════════════════════════════════════════════════════════════════════

class MealPlanView(APIView):
    """POST /api/v1/meal-plan/  — generate 7-day dosha meal plan via Gemini"""

    OFFLINE_PLANS = {
        'Vata': {
            'Monday':    {'Breakfast':'Warm oatmeal with ghee & dates','Lunch':'Kitchari with mung dal','Dinner':'Rice with warm lentil soup','Snack':'Warm milk with ashwagandha'},
            'Tuesday':   {'Breakfast':'Sesame banana smoothie','Lunch':'Wheat roti with spinach & ghee','Dinner':'Sweet potato & dal','Snack':'Soaked almonds & dates'},
            'Wednesday': {'Breakfast':'Rice porridge with jaggery','Lunch':'Moong dal with rice','Dinner':'Vegetable stew & chapati','Snack':'Warm herbal tea with honey'},
            'Thursday':  {'Breakfast':'Soft idli with ghee','Lunch':'Toor dal with rice','Dinner':'Khichdi with vegetables','Snack':'Warm almond milk'},
            'Friday':    {'Breakfast':'Banana pancakes','Lunch':'Rice with dal & carrots','Dinner':'Warm soup with bread','Snack':'Fig & walnut mix'},
            'Saturday':  {'Breakfast':'Semolina upma with ghee','Lunch':'Rice, dal, sabzi & roti','Dinner':'Light soup & bread','Snack':'Coconut ladoo'},
            'Sunday':    {'Breakfast':'Sweet pongal with ghee','Lunch':'Vata thali — warm & nourishing','Dinner':'Khichdi & buttermilk','Snack':'Warm ginger tea'},
        },
        'Pitta': {
            'Monday':    {'Breakfast':'Coconut milk oats with sweet fruits','Lunch':'Basmati rice & cooling dal','Dinner':'Cucumber raita & sabzi','Snack':'Coconut water & pomegranate'},
            'Tuesday':   {'Breakfast':'Sweet fruit bowl','Lunch':'Roti with mint chutney & dal','Dinner':'Rice with bottle gourd curry','Snack':'Rose water milk'},
            'Wednesday': {'Breakfast':'Fennel tea & fruit plate','Lunch':'Cooling rice salad','Dinner':'Moong dal & bread','Snack':'Sweet lassi'},
            'Thursday':  {'Breakfast':'Barley porridge with raisins','Lunch':'Toor dal & coconut sambar','Dinner':'Vegetable biryani — mild','Snack':'Aloe vera juice'},
            'Friday':    {'Breakfast':'Banana with coconut milk','Lunch':'Spinach dal & cooling sabzi','Dinner':'Cucumber soup & roti','Snack':'Dates & milk'},
            'Saturday':  {'Breakfast':'Coconut dosa & white chutney','Lunch':'Full Pitta thali — cooling','Dinner':'Light khichdi','Snack':'Cool herbal tea'},
            'Sunday':    {'Breakfast':'Sweet semolina halwa','Lunch':'Coconut rice & raita','Dinner':'Rice with pumpkin curry','Snack':'Mint lassi'},
        },
        'Kapha': {
            'Monday':    {'Breakfast':'Ginger lemon tea & light poha','Lunch':'Millet roti & spiced vegetables','Dinner':'Light lentil soup & barley','Snack':'Roasted seeds & honey'},
            'Tuesday':   {'Breakfast':'Hot ginger tea & fruit','Lunch':'Rajma with small rice','Dinner':'Spiced moong soup & roti','Snack':'Trikatu in warm water'},
            'Wednesday': {'Breakfast':'Turmeric milk & dry toast','Lunch':'Quinoa & steamed vegetables','Dinner':'Thin dal & stir-fry','Snack':'Apple with cinnamon'},
            'Thursday':  {'Breakfast':'Jowar flatbread & green chutney','Lunch':'Mixed dal & spinach','Dinner':'Barley khichdi','Snack':'Warm water honey pepper'},
            'Friday':    {'Breakfast':'Ragi porridge','Lunch':'Chickpea salad with lemon','Dinner':'Vegetable clear soup','Snack':'Sunflower seeds'},
            'Saturday':  {'Breakfast':'Sprout chaat with lemon','Lunch':'Kapha thali — light & spiced','Dinner':'Broth with roti','Snack':'Dry roasted nuts'},
            'Sunday':    {'Breakfast':'Oats with berries','Lunch':'Rice with peppery rasam','Dinner':'Light soup','Snack':'Warm ginger tea'},
        },
    }

    def post(self, request):
        dosha    = request.data.get('dosha', 'Vata')
        username = request.data.get('username', '')
        days     = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
        meals    = ['Breakfast','Lunch','Dinner','Snack']

        prompt = f"""Generate a 7-day Ayurvedic meal plan for {dosha} dosha.
Return ONLY valid JSON in this exact structure, no preamble:
{{
  "Monday":    {{"Breakfast":"...","Lunch":"...","Dinner":"...","Snack":"..."}},
  "Tuesday":   {{"Breakfast":"...","Lunch":"...","Dinner":"...","Snack":"..."}},
  "Wednesday": {{"Breakfast":"...","Lunch":"...","Dinner":"...","Snack":"..."}},
  "Thursday":  {{"Breakfast":"...","Lunch":"...","Dinner":"...","Snack":"..."}},
  "Friday":    {{"Breakfast":"...","Lunch":"...","Dinner":"...","Snack":"..."}},
  "Saturday":  {{"Breakfast":"...","Lunch":"...","Dinner":"...","Snack":"..."}},
  "Sunday":    {{"Breakfast":"...","Lunch":"...","Dinner":"...","Snack":"..."}}
}}
Use only authentic Indian Ayurvedic food names. Each meal: 5-8 words max."""

        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(model='gemini-2.0-flash-lite', contents=prompt)
            text = response.text.strip().replace('```json','').replace('```','').strip()
            plan = json.loads(text)
            # Validate structure
            for day in days:
                if day not in plan:
                    raise ValueError(f"Missing day: {day}")
            return Response({'plan': plan, 'source': 'gemini'}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"[MealPlan] Gemini failed: {e}")
            fallback = self.OFFLINE_PLANS.get(dosha, self.OFFLINE_PLANS['Vata'])
            return Response({'plan': fallback, 'source': 'offline'}, status=status.HTTP_200_OK)


# ══════════════════════════════════════════════════════════════════════════════
# 3. AR HERB IDENTIFIER
# ══════════════════════════════════════════════════════════════════════════════

class IdentifyHerbView(APIView):
    """
    POST /api/v1/identify-herb/
    Accepts base64 image, sends to Gemini Vision, returns herb info.
    """
    HERB_DB = {
        'Tulsi':       {'sanskrit':'Ocimum tenuiflorum','dosha':'Vata, Kapha','uses':'Immunity, respiratory, stress relief','preparation':'Tulsi tea: 10 leaves in boiling water 5 min','caution':'Avoid large doses in pregnancy'},
        'Ashwagandha': {'sanskrit':'Withania somnifera','dosha':'Vata, Kapha','uses':'Stress, energy, immunity','preparation':'1 tsp powder in warm milk at bedtime','caution':'Avoid with thyroid medication'},
        'Neem':        {'sanskrit':'Azadirachta indica','dosha':'Pitta, Kapha','uses':'Blood purifier, skin, anti-bacterial','preparation':'Neem tea or external paste','caution':'Avoid internally during pregnancy'},
        'Brahmi':      {'sanskrit':'Bacopa monnieri','dosha':'Vata, Pitta','uses':'Memory, focus, anxiety','preparation':'Brahmi oil massage or 1 tsp in warm milk','caution':'May slow heart rate'},
        'Turmeric':    {'sanskrit':'Curcuma longa','dosha':'All doshas','uses':'Anti-inflammatory, immunity, digestion','preparation':'Golden milk: ½ tsp + black pepper in warm milk','caution':'High doses may thin blood'},
        'Ginger':      {'sanskrit':'Zingiber officinale','dosha':'Vata, Kapha','uses':'Digestion, nausea, circulation','preparation':'Fresh ginger slice in hot water','caution':'Avoid with blood thinners'},
        'Triphala':    {'sanskrit':'Terminalia combo','dosha':'All doshas','uses':'Detox, colon cleanse, eye health','preparation':'1 tsp powder in warm water before bed','caution':'Avoid during pregnancy'},
        'Shatavari':   {'sanskrit':'Asparagus racemosus','dosha':'Vata, Pitta','uses':'Hormonal balance, digestion, immunity','preparation':'1 tsp powder in warm milk twice daily','caution':'Avoid with estrogen-sensitive conditions'},
    }

    def post(self, request):
        image_b64 = request.data.get('image_base64')
        if not image_b64:
            return Response({'error': 'No image provided'}, status=400)

        prompt = """You are an expert botanist and Ayurvedic practitioner.
Identify the herb/plant in this image. Respond ONLY in this JSON format (no preamble):
{
  "herb_name": "Common name of the herb",
  "sanskrit": "Sanskrit/scientific name",
  "dosha": "Which doshas it balances",
  "uses": "Main medicinal uses (one sentence)",
  "preparation": "How to prepare/use it (one sentence)",
  "caution": "Any precautions (one sentence)",
  "confidence": "high/medium/low"
}
If you cannot identify a herb/plant, return {"herb_name": null, "error": "not_identified"}"""

        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            # Build multimodal content with image
            image_data = base64.b64decode(image_b64)
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=[
                    {
                        "parts": [
                            {"inline_data": {"mime_type": "image/jpeg", "data": image_b64}},
                            {"text": prompt}
                        ]
                    }
                ]
            )
            text = response.text.strip().replace('```json','').replace('```','').strip()
            result = json.loads(text)

            if result.get('herb_name'):
                # Enrich with our local database if we have more info
                db_info = self.HERB_DB.get(result['herb_name'], {})
                for key in ['uses','preparation','caution','dosha']:
                    if not result.get(key) and db_info.get(key):
                        result[key] = db_info[key]
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response({'herb_name': None, 'error': 'not_identified'}, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"[HerbIdentify] Error: {e}")
            return Response({'herb_name': None, 'error': str(e)}, status=status.HTTP_200_OK)


# ══════════════════════════════════════════════════════════════════════════════
# 4. HEALTH SCORE
# ══════════════════════════════════════════════════════════════════════════════

class HealthScoreView(APIView):
    """
    GET  /api/v1/health-score/?username=neha  → get saved score
    POST /api/v1/health-score/                → save score from device
    """
    def get(self, request):
        username = request.query_params.get('username')
        try:
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS health_scores (
                    username TEXT PRIMARY KEY, score INTEGER,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("SELECT score, updated_at FROM health_scores WHERE username=?", (username,))
            row = cursor.fetchone()
            conn.close()
            if row:
                return Response({'score': row[0], 'updated_at': row[1]}, status=200)
            return Response({'score': 0}, status=200)
        except Exception as e:
            return Response({'score': 0}, status=200)

    def post(self, request):
        username = request.data.get('username')
        score    = request.data.get('score', 0)
        try:
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS health_scores (
                    username TEXT PRIMARY KEY, score INTEGER,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                INSERT INTO health_scores (username, score)
                VALUES (?,?)
                ON CONFLICT(username) DO UPDATE SET score=excluded.score, updated_at=CURRENT_TIMESTAMP
            """, (username, score))
            conn.commit()
            conn.close()
            # Also try MongoDB
            if username:
                try:
                    profile = UserProfile.objects.get(user__username=username)
                    # Store health score in a custom field if added to model
                    # For now we just log it
                    print(f"[HealthScore] {username}: {score}")
                except Exception:
                    pass
            return Response({'message': 'Score saved', 'score': score}, status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ══════════════════════════════════════════════════════════════════════════════
# 5. COMMUNITY FORUM
# ══════════════════════════════════════════════════════════════════════════════

class ForumPostsView(APIView):
    """
    GET  /api/v1/forum/posts/  → list all posts (newest first)
    POST /api/v1/forum/posts/  → create new post
    """
    def get(self, request):
        try:
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS forum_posts (
                    id         TEXT PRIMARY KEY,
                    username   TEXT,
                    author     TEXT,
                    category   TEXT,
                    title      TEXT,
                    body       TEXT,
                    dosha      TEXT DEFAULT 'General',
                    upvotes    INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            cursor.execute("""
                SELECT id, author, category, title, body, dosha, upvotes,
                       strftime('%d %b %Y', created_at) as time
                FROM forum_posts ORDER BY created_at DESC LIMIT 50
            """)
            rows = cursor.fetchall()
            conn.close()
            posts = [{
                'id': r[0], 'author': r[1], 'category': r[2], 'title': r[3],
                'body': r[4], 'dosha': r[5], 'upvotes': r[6], 'time': r[7],
                'userUpvoted': False,
            } for r in rows]
            return Response(posts, status=200)
        except Exception as e:
            return Response([], status=200)

    def post(self, request):
        try:
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS forum_posts (
                    id TEXT PRIMARY KEY, username TEXT, author TEXT,
                    category TEXT, title TEXT, body TEXT,
                    dosha TEXT DEFAULT 'General', upvotes INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            post_id = request.data.get('id', str(int(json.dumps({}).__hash__().__abs__())))
            cursor.execute("""
                INSERT OR IGNORE INTO forum_posts (id, username, author, category, title, body, dosha)
                VALUES (?,?,?,?,?,?,?)
            """, (
                request.data.get('id', ''),
                request.data.get('username', ''),
                request.data.get('author', 'Anonymous'),
                request.data.get('category', 'Remedy'),
                request.data.get('title', ''),
                request.data.get('body', ''),
                request.data.get('dosha', 'General'),
            ))
            conn.commit()
            conn.close()
            return Response({'message': 'Post created'}, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class ForumUpvoteView(APIView):
    """POST /api/v1/forum/upvote/  — toggle upvote on a post"""
    def post(self, request):
        post_id  = request.data.get('post_id')
        username = request.data.get('username', '')
        try:
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS forum_upvotes (
                    post_id TEXT, username TEXT,
                    PRIMARY KEY (post_id, username)
                )
            """)
            # Check if already upvoted
            cursor.execute("SELECT 1 FROM forum_upvotes WHERE post_id=? AND username=?", (post_id, username))
            if cursor.fetchone():
                # Remove upvote
                cursor.execute("DELETE FROM forum_upvotes WHERE post_id=? AND username=?", (post_id, username))
                cursor.execute("UPDATE forum_posts SET upvotes = MAX(0, upvotes-1) WHERE id=?", (post_id,))
                action = 'removed'
            else:
                cursor.execute("INSERT OR IGNORE INTO forum_upvotes (post_id, username) VALUES (?,?)", (post_id, username))
                cursor.execute("UPDATE forum_posts SET upvotes = upvotes+1 WHERE id=?", (post_id,))
                action = 'added'
            conn.commit()
            conn.close()
            return Response({'action': action}, status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ─────────────────────────────────────────────────────────────────────────────
# ADD THESE LINES to recommender_api/urls.py
# ─────────────────────────────────────────────────────────────────────────────
#
# from .views import (
#     FamilyMembersView, FamilyMembersSyncView,
#     MealPlanView,
#     IdentifyHerbView,
#     HealthScoreView,
#     ForumPostsView, ForumUpvoteView,
# )
#
# urlpatterns += [
#     # Family profiles
#     path('family-members/',       FamilyMembersView.as_view(),      name='family-members'),
#     path('family-members/sync/',  FamilyMembersSyncView.as_view(),  name='family-sync'),
#
#     # AI Meal Planner
#     path('meal-plan/',            MealPlanView.as_view(),           name='meal-plan'),
#
#     # AR Herb Identifier
#     path('identify-herb/',        IdentifyHerbView.as_view(),       name='identify-herb'),
#
#     # Health Score
#     path('health-score/',         HealthScoreView.as_view(),        name='health-score'),
#
#     # Community Forum
#     path('forum/posts/',          ForumPostsView.as_view(),         name='forum-posts'),
#     path('forum/upvote/',         ForumUpvoteView.as_view(),        name='forum-upvote'),
# ]
# ─────────────────────────────────────────────────────────────────────────────
#
# INSTALL REQUIRED PACKAGE (for AR herb identifier):
#   expo install expo-image-picker
#
# The app already has: expo-print, expo-sharing, react-native-svg
# ─────────────────────────────────────────────────────────────────────────────
