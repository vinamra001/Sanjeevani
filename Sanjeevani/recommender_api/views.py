from google import genai
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Count
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
import sqlite3
import os
import json

# Models and Serializers
from .models import Disease, Symptom, UserProfile, UserHealthLog
from .serializers import (
    DiseaseSerializer,
    SymptomSerializer,
    UserProfileSerializer,
    UserHealthLogSerializer
)

# ── SQLite Helper ──────────────────────────────────────────────────────────────
def get_sqlite_conn():
    db_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'db.sqlite3'
    )
    return sqlite3.connect(db_path)

def init_sqlite_tables():
    conn = get_sqlite_conn()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users_local (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            prakriti TEXT DEFAULT 'Unknown',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS health_logs_local (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            detected_disease TEXT,
            confidence REAL,
            dosha_at_time TEXT,
            input_symptoms TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blogs_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT, category TEXT, author TEXT,
            read_time TEXT, emoji TEXT, excerpt TEXT,
            content TEXT, diagram_caption TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

# Initialize tables when server starts
init_sqlite_tables()

# ── REGISTRATION & LOGIN ───────────────────────────────────────────────────────
class RegisterView(APIView):
    def post(self, request):
        data = request.data
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        age = data.get('age')
        gender = data.get('gender')

        if not all([username, email, password]):
            return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if User.objects.filter(username=username).exists():
                return Response({"error": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)

            # Save to MongoDB
            user = User.objects.create_user(username=username, email=email, password=password)
            UserProfile.objects.create(user=user, age=age, gender=gender)

            # Save to SQLite
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR IGNORE INTO users_local (username, email, age, gender) VALUES (?, ?, ?, ?)",
                (username, email, age, gender)
            )
            conn.commit()
            conn.close()

            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            return Response({
                "token": "sanjeevani-session-2026",
                "username": user.username,
                "message": f"Welcome back, {user.username}!"
            }, status=status.HTTP_200_OK)
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


# ── PROFILE & HISTORY ──────────────────────────────────────────────────────────
class GetProfileView(APIView):
    def get(self, request):
        username = request.query_params.get('username')
        try:
            user = User.objects.get(username=username)
            profile, _ = UserProfile.objects.get_or_create(user=user)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdatePrakritiView(APIView):
    def post(self, request):
        username = request.data.get('username')
        result_dosha = request.data.get('prakriti')
        try:
            # Save to MongoDB
            profile = UserProfile.objects.get(user__username=username)
            profile.prakriti = result_dosha
            profile.save()
        except Exception as e:
            print(f"MongoDB prakriti update failed: {e}")

        # Always save to SQLite (works offline too)
        try:
            conn = get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users_local SET prakriti = ? WHERE username = ?",
                (result_dosha, username)
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"SQLite prakriti update failed: {e}")

        return Response({"message": f"Prakriti updated to {result_dosha}"}, status=status.HTTP_200_OK)


class HealthHistoryView(APIView):
    def get(self, request):
        username = request.query_params.get('username')
        from collections import defaultdict

        try:
            # Try MongoDB first
            logs = UserHealthLog.objects.filter(
                user__username=username
            ).order_by('-timestamp')

            grouped = defaultdict(list)
            for log in logs:
                date_key = log.timestamp.strftime("%d %b %Y")
                grouped[date_key].append({
                    "id": str(log.id),
                    "detected_disease": log.detected_disease,
                    "confidence": log.confidence,
                    "dosha_at_time": log.dosha_at_time,
                    "input_symptoms": log.input_symptoms,
                    "time": log.timestamp.strftime("%I:%M %p")
                })

            result = [{"date": d, "records": r} for d, r in grouped.items()]
            return Response({
                "username": username,
                "total_records": logs.count(),
                "history": result,
                "source": "mongodb"
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"MongoDB history failed, using SQLite: {e}")

            # Fallback to SQLite
            try:
                from datetime import datetime
                conn = get_sqlite_conn()
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, detected_disease, confidence, dosha_at_time,
                           input_symptoms, timestamp
                    FROM health_logs_local
                    WHERE username = ?
                    ORDER BY timestamp DESC
                """, (username,))
                rows = cursor.fetchall()
                conn.close()

                grouped = defaultdict(list)
                for row in rows:
                    try:
                        dt = datetime.strptime(row[5], "%Y-%m-%d %H:%M:%S")
                        date_key = dt.strftime("%d %b %Y")
                        time_str = dt.strftime("%I:%M %p")
                    except:
                        date_key = str(row[5])[:10]
                        time_str = str(row[5])[11:16]

                    grouped[date_key].append({
                        "id": str(row[0]),
                        "detected_disease": row[1],
                        "confidence": row[2],
                        "dosha_at_time": row[3],
                        "input_symptoms": row[4],
                        "time": time_str
                    })

                result = [{"date": d, "records": r} for d, r in grouped.items()]
                return Response({
                    "username": username,
                    "total_records": len(rows),
                    "history": result,
                    "source": "sqlite"
                }, status=status.HTTP_200_OK)

            except Exception as e2:
                return Response({"error": str(e2)}, status=status.HTTP_400_BAD_REQUEST)


# ── CHATBOT ────────────────────────────────────────────────────────────────────
class ChatBotView(APIView):
    def post(self, request):
        user_query = request.data.get('message', '')
        username = request.data.get('username', '')

        user_context = "User is a guest."
        try:
            if username:
                profile = UserProfile.objects.get(user__username=username)
                user_context = f"User: {username}, Age: {profile.age}, Dosha: {profile.prakriti or 'General'}."
        except Exception:
            pass

        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            system_instruction = (
                f"You are Sanjeevani AI, an expert Ayurvedic health consultant. {user_context} "
                "Provide health advice based on Ayurvedic herbs and lifestyle. "
                "Keep responses structured with bullet points and end with a medical disclaimer."
            )
            try:
                response = client.models.generate_content(
                model='gemini-1.5-flash', # Was gemini-2.0-flash
                contents=f"{system_instruction}\n\nUser Question: {user_query}"
            )
            except Exception:
                response = client.models.generate_content(
                    model='gemini-2.0-flash-lite',
                    contents=f"{system_instruction}\n\nUser Question: {user_query}"
                )
            return Response({"response": response.text}, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Chat Error: {str(e)}")
            # Offline keyword fallback
            query_lower = user_query.lower()
            if any(w in query_lower for w in ['stress', 'anxiety', 'tension']):
                reply = "**For Stress & Anxiety:**\n\n• **Ashwagandha** - Take 1 tsp with warm milk at bedtime\n• **Brahmi** - Improves mental clarity\n• **Pranayama** - Practice deep breathing for 10 minutes daily\n• **Abhyanga** - Self-massage with sesame oil\n\n⚕️ *Disclaimer: Consult an Ayurvedic doctor for personalized advice.*"
            elif any(w in query_lower for w in ['digestion', 'stomach', 'acidity', 'gas']):
                reply = "**For Digestive Issues:**\n\n• **Triphala** - Take 1 tsp with warm water before bed\n• **Ginger tea** - Drink 30 mins before meals\n• **Avoid cold water** during meals\n• **Eat your largest meal at noon**\n• **Fennel seeds** after meals\n\n⚕️ *Disclaimer: Consult an Ayurvedic doctor for personalized advice.*"
            elif any(w in query_lower for w in ['sleep', 'insomnia', 'rest']):
                reply = "**For Better Sleep:**\n\n• **Warm milk with nutmeg** before bedtime\n• **Ashwagandha** reduces cortisol levels\n• **Oil massage** on feet with sesame oil\n• **Sleep by 10 PM** for optimal rest\n• **Avoid screens** 1 hour before bed\n\n⚕️ *Disclaimer: Consult an Ayurvedic doctor for personalized advice.*"
            elif any(w in query_lower for w in ['immunity', 'immune', 'cold', 'flu']):
                reply = "**For Immunity:**\n\n• **Chyawanprash** - 1 tsp daily in the morning\n• **Giloy** - Known as the root of immortality\n• **Tulsi tea** - Daily for respiratory health\n• **Turmeric milk** - Anti-inflammatory golden milk\n• **Amla** - Richest source of Vitamin C\n\n⚕️ *Disclaimer: Consult an Ayurvedic doctor for personalized advice.*"
            elif any(w in query_lower for w in ['weight', 'fat', 'obesity']):
                reply = "**For Weight Management:**\n\n• **Triphala** - Natural detoxifier\n• **Guggul** - Supports metabolism\n• **Warm lemon water** every morning\n• **Avoid eating after sunset**\n• **Exercise daily** - at least 30 minutes\n\n⚕️ *Disclaimer: Consult an Ayurvedic doctor for personalized advice.*"
            elif any(w in query_lower for w in ['vata', 'pitta', 'kapha', 'dosha']):
                reply = "**Understanding Doshas:**\n\n• **Vata** (Air+Space) - Creative, quick, anxious when imbalanced\n• **Pitta** (Fire+Water) - Focused, intense, irritable when imbalanced\n• **Kapha** (Earth+Water) - Calm, steady, lethargic when imbalanced\n\nTake our Dosha Quiz in the app to find your prakriti!\n\n⚕️ *Disclaimer: Consult an Ayurvedic doctor for personalized advice.*"
            else:
                reply = "**Namaste! 🙏**\n\nI am Sanjeevani AI, your Ayurvedic health assistant.\n\nI can help you with:\n• **Stress & Anxiety**\n• **Digestion issues**\n• **Sleep problems**\n• **Immunity boosting**\n• **Weight management**\n• **Understanding your Dosha**\n\nPlease ask me about any of these topics!\n\n⚕️ *Disclaimer: This is general Ayurvedic information. Please consult a qualified practitioner.*"
            return Response({"response": reply}, status=status.HTTP_200_OK)


# ── PREDICTION ENGINE ──────────────────────────────────────────────────────────
class PredictionView(APIView):
    def post(self, request):
        symptom_names = request.data.get('symptom_names', [])
        username = request.data.get('username')

        if not symptom_names:
            return Response({"predictions": []})

        predictions = []

        # ── EXACT PARITY: Check Native MongoDB Mapping ──────────────
        sorted_syms = sorted([s.strip().lower() for s in symptom_names])
        combo_key = "|".join(sorted_syms)
        
        try:
            from recommender_api.models import SymptomDiseaseMapping
            mapping = SymptomDiseaseMapping.objects.filter(symptoms_combo_key=combo_key).first()
            if mapping:
                disease = Disease.objects.filter(name=mapping.disease_name).first()
                if disease:
                    from .serializers import RemedySerializer
                    remedies_data = RemedySerializer(disease.remedies.all(), many=True).data
                    predictions.append({
                        "name": disease.name,
                        "sanskrit_name": disease.sanskrit_name or '',
                        "dosha_type": disease.dosha_type or 'General',
                        "confidence": 99.0,
                        "diet_plan": disease.diet_plan or "Follow general Ayurvedic principles.",
                        "foods_to_take": disease.foods_to_take or "",
                        "foods_to_avoid": disease.foods_to_avoid or "",
                        "lifestyle_routine": disease.lifestyle_routine or "",
                        "recommended_exercises": disease.recommended_exercises or "",
                        "match_count": len(symptom_names),
                        "remedies": remedies_data
                    })
                    
                    # Save to MongoDB log
                    if username:
                        top = predictions[0]
                        dosha_at_time = 'Unknown'
                        try:
                            user = User.objects.get(username=username)
                            profile, _ = UserProfile.objects.get_or_create(user=user)
                            dosha_at_time = profile.prakriti or 'Unknown'
                            UserHealthLog.objects.create(
                                user=user, detected_disease=top['name'],
                                confidence=top['confidence'], dosha_at_time=dosha_at_time,
                                input_symptoms=", ".join(symptom_names)
                            )
                        except Exception:
                            pass
                    return Response({"predictions": predictions, "source": "mongodb_exact_match"})
        except Exception as e:
            print(f"MongoDB Exact Parity Check Failed, falling back to offline master: {e}")

        # ── BACKEND OFFLINE EXACT PARITY: Native db.sqlite3 fallback ────────
        try:
            conn_sqlite = sqlite3.connect('db.sqlite3')
            cur = conn_sqlite.cursor()
            
            cur.execute("SELECT disease_name FROM symptom_combination_local WHERE combo_key = ?", (combo_key,))
            row = cur.fetchone()
            
            if row:
                d_name = row[0]
                cur.execute("SELECT id, name, sanskrit_name, description, dosha_type, diet_plan, foods_to_take, foods_to_avoid, lifestyle_routine, recommended_exercises FROM diseases_local WHERE name = ?", (d_name,))
                d_row = cur.fetchone()
                
                if d_row:
                    did, dname, sname, desc, dosha, diet, ftake, favoid, lroutine, rexe = d_row
                    
                    cur.execute("""
                        SELECT r.name, r.sanskrit_name, r.description, r.dosage, r.preparation, r.usage_instructions 
                        FROM remedies_local r
                        JOIN disease_remedies_local dr ON r.id = dr.remedy_id
                        WHERE dr.disease_id = ?
                    """, (did,))
                    
                    remedies_offline = [{"name": r[0], "sanskrit_name": r[1], "description": r[2], "dosage": r[3], "preparation": r[4], "usage_instructions": r[5]} for r in cur.fetchall()]
                    
                    predictions.append({
                        "name": dname,
                        "sanskrit_name": sname or '',
                        "dosha_type": dosha or 'General',
                        "confidence": 99.0,
                        "diet_plan": diet or "Follow general Ayurvedic principles.",
                        "foods_to_take": ftake or "",
                        "foods_to_avoid": favoid or "",
                        "lifestyle_routine": lroutine or "",
                        "recommended_exercises": rexe or "",
                        "match_count": len(symptom_names),
                        "remedies": remedies_offline
                    })
                    
            conn_sqlite.close()
            if predictions:
                return Response({"predictions": predictions, "source": "sqlite_exact_match"})
                
        except Exception as e:
            print(f"db.sqlite3 Exact Parity Check Failed: {e}")

        # ── Try MongoDB + ML Model (Online) ───────────────────────
        try:
            from recommender_api.ml_engine import AyurvedicML
            import joblib

            # Load or train ML model
            ml = AyurvedicML()
            if os.path.exists('ayurveda_model.pkl'):
                ml.model = joblib.load('ayurveda_model.pkl')
                ml.symptom_list = list(
                    Symptom.objects.all().values_list('name', flat=True).order_by('name')
                )
            else:
                ml.train()

            # Get ML predictions
            ml_results = ml.predict(symptom_names)

            predictions = []
            for disease_id_str, confidence in ml_results:
                try:
                    disease = Disease.objects.get(id=int(disease_id_str))
                    serializer = DiseaseSerializer(disease)
                    disease_data = serializer.data
                    disease_data['confidence'] = round(float(confidence) * 100, 1)
                    disease_data['match_count'] = len(symptom_names)
                    predictions.append(disease_data)
                except Exception:
                    continue

            # Also add symptom-matched diseases
            matched = Disease.objects.filter(
                symptoms__name__in=symptom_names
            ).distinct()

            for disease in matched:
                already = any(p['id'] == disease.id for p in predictions)
                if not already:
                    disease_symptoms = list(disease.symptoms.values_list('name', flat=True))
                    common = set(symptom_names) & set(disease_symptoms)
                    score = (len(common) / len(symptom_names)) * 100
                    serializer = DiseaseSerializer(disease)
                    disease_data = serializer.data
                    disease_data['confidence'] = round(min(score, 99.5), 1)
                    disease_data['match_count'] = len(common)
                    predictions.append(disease_data)

            predictions = sorted(predictions, key=lambda x: x['confidence'], reverse=True)[:10]

            # Save to MongoDB log
            if username and predictions:
                top = predictions[0]
                dosha_at_time = 'Unknown'
                try:
                    user = User.objects.get(username=username)
                    profile, _ = UserProfile.objects.get_or_create(user=user)
                    dosha_at_time = profile.prakriti or 'Unknown'
                    UserHealthLog.objects.create(
                        user=user,
                        detected_disease=top['name'],
                        confidence=top['confidence'],
                        dosha_at_time=dosha_at_time,
                        input_symptoms=", ".join(symptom_names)
                    )
                except Exception as e:
                    print(f"MongoDB log error: {e}")

                # Always save to SQLite
                try:
                    conn = get_sqlite_conn()
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO health_logs_local
                        (username, detected_disease, confidence, dosha_at_time, input_symptoms)
                        VALUES (?, ?, ?, ?, ?)
                    """, (username, top['name'], top['confidence'],
                          dosha_at_time, ", ".join(symptom_names)))
                    conn.commit()
                    conn.close()
                except Exception as e:
                    print(f"SQLite log error: {e}")

            return Response({"predictions": predictions, "source": "mongodb+ml"})

        except Exception as e:
            print(f"Online prediction failed: {e}")

        # ── Offline Fallback — SQLite ─────────────────────────────
        try:
            conn = get_sqlite_conn()
            cursor = conn.cursor()

            # Find matching diseases from SQLite
            placeholders = ','.join('?' * len(symptom_names))
            cursor.execute(f"""
                SELECT DISTINCT d.id, d.name, d.sanskrit_name, d.description,
                       d.dosha_type, d.diet_plan, d.foods_to_take, d.foods_to_avoid, d.lifestyle_routine, d.recommended_exercises,
                       COUNT(ds.symptom_id) as match_count
                FROM diseases_local d
                JOIN disease_symptoms_local ds ON d.id = ds.disease_id
                JOIN symptoms_local s ON ds.symptom_id = s.id
                WHERE s.name IN ({placeholders})
                GROUP BY d.id
                ORDER BY match_count DESC
                LIMIT 10
            """, symptom_names)

            rows = cursor.fetchall()
            predictions = []

            for row in rows:
                did, name, sname, desc, dosha, diet, ftake, favoid, lroutine, rexe, match_count = row
                confidence = round((match_count / len(symptom_names)) * 100, 1)

                # Get remedies from SQLite
                cursor.execute("""
                    SELECT r.id, r.name, r.sanskrit_name, r.description,
                           r.dosage, r.preparation, r.usage_instructions
                    FROM remedies_local r
                    JOIN disease_remedies_local dr ON r.id = dr.remedy_id
                    WHERE dr.disease_id = ?
                """, (did,))
                remedy_rows = cursor.fetchall()

                remedies = [{
                    "id": r[0], "name": r[1], "sanskrit_name": r[2],
                    "description": r[3], "dosage": r[4],
                    "preparation": r[5], "usage_instructions": r[6]
                } for r in remedy_rows]

                # Get symptoms from SQLite
                cursor.execute("""
                    SELECT s.id, s.name, s.category
                    FROM symptoms_local s
                    JOIN disease_symptoms_local ds ON s.id = ds.symptom_id
                    WHERE ds.disease_id = ?
                """, (did,))
                sym_rows = cursor.fetchall()
                symptoms = [{"id": s[0], "name": s[1], "category": s[2]} for s in sym_rows]

                predictions.append({
                    "id": did, "name": name, "sanskrit_name": sname or '',
                    "description": desc or '', "dosha_type": dosha or '',
                    "diet_plan": diet or '', "foods_to_take": ftake or '',
                    "foods_to_avoid": favoid or '', "lifestyle_routine": lroutine or '',
                    "recommended_exercises": rexe or '', "symptoms": symptoms,
                    "remedies": remedies, "confidence": confidence,
                    "match_count": match_count
                })

                # Save to SQLite health log
                if username and predictions:
                    top = predictions[0]
                    try:
                        cursor.execute("""
                            INSERT INTO health_logs_local
                            (username, detected_disease, confidence, dosha_at_time, input_symptoms)
                            VALUES (?, ?, ?, ?, ?)
                        """, (username, top['name'], top['confidence'],
                              'Unknown', ", ".join(symptom_names)))
                        conn.commit()
                    except Exception as e:
                        print(f"SQLite log error: {e}")

            conn.close()
            return Response({"predictions": predictions, "source": "sqlite"})

        except Exception as e:
            print(f"SQLite prediction failed: {e}")
            return Response({"predictions": [], "error": str(e)})


class SymptomListView(APIView):
    def get(self, request):
        symptoms = Symptom.objects.all().order_by('name')
        return Response(SymptomSerializer(symptoms, many=True).data)


class DiseaseDetailView(APIView):
    def get(self, request, pk):
        try:
            disease = Disease.objects.get(pk=pk)
            return Response(DiseaseSerializer(disease).data, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)


# ── PERSONALIZED PLANS ─────────────────────────────────────────────────────────
class GetAyurvedicPlanView(APIView):
    def get(self, request):
        username = request.query_params.get('username')
        plan_type = request.query_params.get('type', 'diet')
        try:
            profile = UserProfile.objects.get(user__username=username)
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f"Create a detailed Ayurvedic {plan_type} for a person with {profile.prakriti or 'General'} prakriti."
            response = client.models.generate_content(
            model='gemini-1.5-flash', # Was gemini-2.0-flash-lite
            contents=prompt
        )
            return Response({"dosha": profile.prakriti, "plan": response.text}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Plan Generation Error: {str(e)}")
            return Response({"error": "Plan generation failed"}, status=status.HTTP_404_NOT_FOUND)


# ── ADMIN ANALYTICS ────────────────────────────────────────────────────────────
class AdminStatsView(APIView):
    def get(self, request):
        try:
            dosha_counts = UserProfile.objects.values('prakriti').annotate(count=Count('prakriti'))
            total_users = User.objects.count()
            return Response({
                "total_users": total_users,
                "dosha_distribution": list(dosha_counts)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── FORGOT PASSWORD ────────────────────────────────────────────────────────────
class ForgotPasswordView(APIView):
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            temp_password = get_random_string(10)
            user.set_password(temp_password)
            user.save()

            send_mail(
                subject='Sanjeevani - Password Reset',
                message=f'''Hello {user.username},

Your temporary password is: {temp_password}

Please login with this password and change it immediately.

- Sanjeevani Team''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            return Response({"message": "Password reset email sent!"}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"error": "No account found with this email"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── BLOG (Online + Offline + Static Fallback) ──────────────────────────────────
class BlogListView(APIView):
    def get(self, request):

        STATIC_BLOGS = [
            {
                "id": 1,
                "title": "Ashwagandha: The King of Ayurvedic Herbs",
                "category": "Herbs",
                "author": "Dr. Ayur Sharma",
                "readTime": "5 min",
                "emoji": "🌿",
                "excerpt": "Discover how Ashwagandha reduces stress, boosts immunity and balances your doshas naturally.",
                "content": "Ashwagandha (Withania somnifera) is one of the most powerful herbs in Ayurvedic medicine. Known as the 'Indian Ginseng', it has been used for over 3,000 years to relieve stress, increase energy levels, and improve concentration.\n\nBenefits:\n• Reduces cortisol levels and manages stress\n• Boosts immunity and fights inflammation\n• Improves brain function and memory\n• Balances Vata and Kapha doshas\n• Enhances physical performance\n\nHow to Use:\nTake 1-2 teaspoons of Ashwagandha powder with warm milk before bedtime. You can add honey for taste.\n\nPrecautions:\nPregnant women and people with autoimmune diseases should consult a doctor before use.\n\nDisclaimer: This is for educational purposes only. Please consult an Ayurvedic practitioner before use.",
                "diagram_caption": ""
            },
            {
                "id": 2,
                "title": "Understanding Your Dosha: Vata, Pitta & Kapha",
                "category": "Wellness",
                "author": "Dr. Priya Vaidya",
                "readTime": "7 min",
                "emoji": "☯️",
                "excerpt": "Learn about the three doshas and how they influence your physical and mental health.",
                "content": "In Ayurveda, every individual is made up of three biological energies called doshas: Vata, Pitta, and Kapha. Understanding your dominant dosha helps you make better lifestyle and dietary choices.\n\nVata (Air + Space):\n• Characteristics: Creative, energetic, quick-thinking\n• Imbalance signs: Anxiety, dry skin, constipation\n• Balance with: Warm foods, oil massage, regular routine\n\nPitta (Fire + Water):\n• Characteristics: Intelligent, focused, competitive\n• Imbalance signs: Anger, inflammation, acid reflux\n• Balance with: Cooling foods, meditation, avoiding spicy food\n\nKapha (Earth + Water):\n• Characteristics: Calm, caring, patient\n• Imbalance signs: Weight gain, lethargy, depression\n• Balance with: Exercise, light foods, stimulating activities\n\nDisclaimer: Consult an Ayurvedic doctor for personalized guidance.",
                "diagram_caption": "The three doshas govern all physical and mental processes"
            },
            {
                "id": 3,
                "title": "Ayurvedic Diet: Eat According to Your Body Type",
                "category": "Diet",
                "author": "Dr. Ravi Menon",
                "readTime": "6 min",
                "emoji": "🥗",
                "excerpt": "What you eat should match your dosha. Learn the best foods for your body type.",
                "content": "Ayurveda believes that food is medicine. The right diet can prevent disease and promote longevity.\n\nVata Diet:\n• Eat warm, moist, and heavy foods\n• Favor: Rice, wheat, dairy, nuts, sweet fruits\n• Avoid: Cold, dry, raw foods\n\nPitta Diet:\n• Eat cool, refreshing foods\n• Favor: Cucumber, coconut, leafy greens\n• Avoid: Spicy, oily, sour foods\n\nKapha Diet:\n• Eat light, warm, and spicy foods\n• Favor: Legumes, vegetables, honey, ginger\n• Avoid: Heavy, oily, sweet foods\n\nDisclaimer: Dietary changes should be made under guidance of a qualified practitioner.",
                "diagram_caption": ""
            },
            {
                "id": 4,
                "title": "Turmeric: Nature's Golden Healer",
                "category": "Herbs",
                "author": "Dr. Ayur Sharma",
                "readTime": "4 min",
                "emoji": "💛",
                "excerpt": "Turmeric's active compound curcumin is a powerful anti-inflammatory and antioxidant.",
                "content": "Turmeric (Curcuma longa) has been used in Ayurvedic medicine for thousands of years.\n\nKey Benefits:\n• Powerful natural anti-inflammatory\n• Strong antioxidant properties\n• Improves brain function\n• Lowers risk of heart disease\n• Balances all three doshas\n\nHow to Use:\n• Golden Milk: Mix 1 tsp turmeric in warm milk with black pepper\n• Add to curries, soups and smoothies\n\nWhy Black Pepper?\nBlack pepper enhances curcumin absorption by 2000%.\n\nDisclaimer: High doses may interact with blood thinners. Consult your doctor.",
                "diagram_caption": ""
            },
            {
                "id": 5,
                "title": "Dinacharya: The Power of Daily Ayurvedic Routine",
                "category": "Lifestyle",
                "author": "Dr. Sunita Rao",
                "readTime": "6 min",
                "emoji": "🌅",
                "excerpt": "A structured daily routine aligned with nature's rhythms can transform your health.",
                "content": "Dinacharya means daily routine in Sanskrit.\n\nMorning Routine:\n• Wake up before sunrise\n• Drink warm water to flush toxins\n• Oil pulling with sesame oil\n• Yoga and pranayama for 30 minutes\n• Meditation for mental peace\n\nAfternoon Routine:\n• Eat your largest meal at noon\n• Short walk after meals\n\nEvening Routine:\n• Light dinner before sunset\n• Abhyanga (self-massage) with warm oil\n• Sleep by 10 PM\n\nDisclaimer: Adapt the routine gradually to suit your lifestyle.",
                "diagram_caption": "Align your daily activities with natural circadian rhythms"
            },
            {
                "id": 6,
                "title": "Triphala: The Three-Fruit Wonder",
                "category": "Herbs",
                "author": "Dr. Priya Vaidya",
                "readTime": "5 min",
                "emoji": "🍃",
                "excerpt": "Triphala combines three powerful fruits to cleanse, detoxify and rejuvenate the body.",
                "content": "Triphala combines three fruits: Amalaki, Bibhitaki, and Haritaki.\n\n1. Amalaki - Richest natural source of Vitamin C\n2. Bibhitaki - Supports respiratory health\n3. Haritaki - Known as the King of Medicine\n\nBenefits:\n• Gentle colon cleanser\n• Supports healthy digestion\n• Boosts immunity\n• Improves eye health\n\nHow to Use:\n• Take 1 tsp powder with warm water before bed\n\nDisclaimer: Pregnant women should avoid Triphala.",
                "diagram_caption": ""
            }
        ]

        conn = get_sqlite_conn()
        cursor = conn.cursor()

        try:
            # Try Gemini online
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = """Generate 6 Ayurvedic blog posts in JSON format only.
No extra text, just a JSON array:
[{"id":1,"title":"...","category":"Herbs","author":"Dr. Ayur Sharma","readTime":"4 min","emoji":"🌿","excerpt":"...","content":"...","diagram_caption":""}]
Categories: Herbs, Wellness, Diet, Lifestyle. Authentic Ayurvedic content."""

            response = client.models.generate_content(
                model='gemini-2.0-flash-lite',
                contents=prompt
            )
            text = response.text.strip().replace('```json', '').replace('```', '').strip()
            blogs = json.loads(text)

            # Save to SQLite cache
            cursor.execute("DELETE FROM blogs_cache")
            for blog in blogs:
                cursor.execute(
                    "INSERT INTO blogs_cache (title, category, author, read_time, emoji, excerpt, content, diagram_caption) VALUES (?,?,?,?,?,?,?,?)",
                    (blog.get('title', ''), blog.get('category', ''), blog.get('author', ''),
                     blog.get('readTime', ''), blog.get('emoji', '🌿'), blog.get('excerpt', ''),
                     blog.get('content', ''), blog.get('diagram_caption', ''))
                )
            conn.commit()
            conn.close()
            return Response(blogs, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Online failed, loading from cache: {str(e)}")

            # Try SQLite cache
            try:
                cursor.execute("SELECT id, title, category, author, read_time, emoji, excerpt, content, diagram_caption FROM blogs_cache")
                rows = cursor.fetchall()
                conn.close()
                if rows:
                    return Response([{
                        "id": r[0], "title": r[1], "category": r[2],
                        "author": r[3], "readTime": r[4], "emoji": r[5],
                        "excerpt": r[6], "content": r[7], "diagram_caption": r[8]
                    } for r in rows], status=status.HTTP_200_OK)
            except:
                pass

            # Final fallback - static blogs
            return Response(STATIC_BLOGS, status=status.HTTP_200_OK)

# ── VOICE SYMPTOM STT ──────────────────────────────────────────────────────────
import tempfile
import os
import json
from google import genai
from django.conf import settings

class VoiceSymptomView(APIView):
    def post(self, request):
        if 'audio' not in request.FILES:
            return Response({"error": "No audio file provided"}, status=status.HTTP_400_BAD_REQUEST)

        audio_file = request.FILES['audio']
        
        # Save temp file
        fd, temp_path = tempfile.mkstemp(suffix=".m4a") 
        with os.fdopen(fd, 'wb') as f:
            for chunk in audio_file.chunks():
                f.write(chunk)
                
        try:
            raw_symptoms = list(Symptom.objects.all().values_list('name', flat=True))
            symptoms = []
            for s in raw_symptoms:
                if isinstance(s, list) and len(s) > 0:
                    symptoms.append(str(s[0]))
                elif isinstance(s, str):
                    symptoms.append(s)

            if not symptoms:
                symptoms = [
                    'Fatigue', 'Weight Loss', 'Restlessness', 'Lethargy', 'High Fever', 'Chills', 
                    'Mild Fever', 'Malaise', 'Phlegm', 'Sweating', 'Vomiting', 'Indigestion', 
                    'Constipation', 'Abdominal Pain', 'Diarrhoea', 'Nausea', 'Acidity', 'Stomach Pain',
                    'Stomach Swelling', 'Itching', 'Skin Rash', 'Yellowish Skin', 'Bruising', 
                    'Brittle Nails', 'Pimples', 'Blackheads', 'Inflammatory Nails', 'Sneezing', 
                    'Cough', 'Breathlessness', 'Throat Irritation', 'Fast Heart Rate', 'Chest Pain', 
                    'Sinus Pressure', 'Runny Nose', 'Joint Pain', 'Headache', 'Back Pain', 
                    'Neck Pain', 'Muscle Pain', 'Stiff Neck', 'Knee Pain', 'Muscle Weakness'
                ]

            prompt = f"""
            Listen to this audio.
            1. Transcribe what the user is saying.
            2. Identify any medical symptoms exactly matching this list: {', '.join(symptoms)}.
            
            Return ONLY a valid JSON object starting with {{ and ending with }} (no markdown tags):
            {{
               "transcription": "user speech here",
               "symptoms": ["Symptom1", "Symptom2"]
            }}
            """
            
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            audio_doc = client.files.upload(file=temp_path)
            
            try:
                response = client.models.generate_content(
                    model='gemini-1.5-flash',
                    contents=[audio_doc, prompt]
                )
            except Exception:
                response = client.models.generate_content(
                    model='gemini-2.0-flash-lite',
                    contents=[audio_doc, prompt]
                )
            
            # Clean up the json text format if it has markdown
            text = response.text.replace('```json', '').replace('```', '').strip()
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end != -1:
                text = text[start:end]
            data = json.loads(text)
            
            # Delete file from Gemini storage
            try: client.files.delete(name=audio_doc.name)
            except: pass
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                return Response({"error": "Sanjeevani AI is currently busy. Please wait a minute and try speaking again."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            return Response({"error": f"Voice processing failed: {error_str}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if os.path.exists(temp_path):
                try: os.remove(temp_path)
                except: pass

# ══════════════════════════════════════════════════════════════════════════════
# 1. FAMILY PROFILES
# ══════════════════════════════════════════════════════════════════════════════
import base64
import random

class FamilyMembersView(APIView):
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
        days     = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

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
            return Response({'message': 'Score saved', 'score': score}, status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

# ══════════════════════════════════════════════════════════════════════════════
# 5. COMMUNITY FORUM
# ══════════════════════════════════════════════════════════════════════════════

class ForumPostsView(APIView):
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
            cursor.execute("SELECT 1 FROM forum_upvotes WHERE post_id=? AND username=?", (post_id, username))
            if cursor.fetchone():
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

# ══════════════════════════════════════════════════════════════════════════════
# 6. OFFLINE AI CHATBOT
# ══════════════════════════════════════════════════════════════════════════════

class OfflineChatSyncView(APIView):
    def get(self, request):
        knowledge_base = {
            "headache": "For headaches, try a paste of ginger powder on your forehead, or drink warm water with a pinch of nutmeg.",
            "cold": "For a cold, drink Tulsi tea with ginger and holy basil. Avoid cold dairy.",
            "cough": "For a cough, a teaspoon of raw honey with a pinch of black pepper works wonders.",
            "fever": "For fever, rest and drink warm ginger water. A light kitchari is best.",
            "stomach ache": "For stomach ache, chew roasted fennel seeds or drink ginger tea.",
            "acne": "For acne, apply a paste of neem powder or turmeric and sandalwood.",
            "hair fall": "Massage scalp with warm coconut or sesame oil. Amla is great for strength.",
            "sleep": "Drink warm milk with a pinch of nutmeg and cardamom before bed.",
            "stress": "Ashwagandha is highly recommended for stress. Practice Pranayama breathing.",
            "digestion": "To improve digestion, drink warm water with lemon and a pinch of salt before meals.",
            "vata": "To balance Vata, favor warm, heavy, and oily foods. Sweet, sour, and salty tastes.",
            "pitta": "To balance Pitta, favor cool, heavy foods. Sweet, bitter, and astringent tastes.",
            "kapha": "To balance Kapha, favor light, warm foods. Pungent, bitter, and astringent tastes.",
            "namaste": "Namaste! ✨ I am your Offline Sanjeevani AI. I can answer basic Ayurvedic questions even without internet. How can I help?",
            "hello": "Hello! I am ready to provide Ayurvedic remedies from my offline knowledge base.",
            "hi": "Hi there! I'm Sanjeevani's offline bot. Ask me about a symptom."
        }
        return Response(knowledge_base, status=200)

# ══════════════════════════════════════════════════════════════════════════════
# 7. SEASONAL RITU GUIDE
# ══════════════════════════════════════════════════════════════════════════════
from datetime import datetime

class SeasonalGuideView(APIView):
    def get(self, request):
        month = datetime.now().month
        
        # Simplified Ritu Calculation based on Gregorian Calendar Months
        if month in [1, 2]:
            ritu = "Shishir (Winter)"
            dosha_status = "Kapha increases, Vata gets alleviated."
            diet = ["Warm, heavy, unctuous foods", "Sweet, sour, salty tastes", "Ghee, milk, root vegetables"]
            avoid = ["Cold, dry, light foods", "Too much pungent/bitter taste", "Cold drinks"]
            lifestyle = ["Warm massages with sesame oil", "Stay warm", "Vigorous exercise"]
            color = "#1E88E5" # Blue
        elif month in [3, 4]:
            ritu = "Vasant (Spring)"
            dosha_status = "Kapha liquefies, causing colds/allergies. Pitta starts accumulating."
            diet = ["Easily digestible, light foods", "Bitter, pungent, astringent tastes", "Barley, honey, roasted meats"]
            avoid = ["Heavy, cold, sweet, sour foods", "Day sleep", "Yogurt"]
            lifestyle = ["Dry massages (Udvartana)", "Exercise in moderation", "Warm water baths"]
            color = "#43A047" # Green
        elif month in [5, 6]:
            ritu = "Grishma (Summer)"
            dosha_status = "Vata accumulates, Kapha is pacified. Pitta is at peak."
            diet = ["Sweet, cold, liquid foods", "Ghee, milk, rice, fruits", "Coconut water, cooling herbs"]
            avoid = ["Pungent, sour, salty, warm foods", "Alcohol", "Heavy meals"]
            lifestyle = ["Stay indoors during peak heat", "Rest in cool places", "Wear light cotton clothes"]
            color = "#E53935" # Red
        elif month in [7, 8]:
            ritu = "Varsha (Monsoon)"
            dosha_status = "Vata aggravates, Pitta accumulates."
            diet = ["Warm, freshly prepared meals", "Sour, salty, oily foods", "Barley, wheat, old rice"]
            avoid = ["Day sleep", "River water, uncooked foods", "Excess liquid diet"]
            lifestyle = ["Boil water before drinking", "Keep dry and warm", "Apply oil before bathing"]
            color = "#5E35B1" # Purple
        elif month in [9, 10]:
            ritu = "Sharad (Autumn)"
            dosha_status = "Pitta aggravates."
            diet = ["Sweet, bitter, astringent tastes", "Ghee, milk, rice, wheat, cabbage", "Light easily digestible foods"]
            avoid = ["Heavy, sour, pungent, salty foods", "Curd, meat of aquatic animals", "Day sleep"]
            lifestyle = ["Moonlight walks", "Wear cooling sandalwood paste", "Avoid sun exposure"]
            color = "#F57C00" # Orange
        else:
            ritu = "Hemant (Pre-Winter)"
            dosha_status = "Pitta subsides, Kapha starts increasing."
            diet = ["Sweet, sour, salty tastes", "Heavy, unctuous foods", "New rice, milk products, fats"]
            avoid = ["Vata-aggravating foods (dry, light, cold)"]
            lifestyle = ["Oil massages", "Warm clothing", "Basking in the sun"]
            color = "#8E24AA" # Deep Purple

        return Response({
            "current_month": month,
            "ritu": ritu,
            "dosha_status": dosha_status,
            "diet_to_eat": diet,
            "diet_to_avoid": avoid,
            "lifestyle": lifestyle,
            "theme_color": color
        }, status=200)

# ══════════════════════════════════════════════════════════════════════════════
# 8. VEDIC ASTRO + AYURVEDA
# ══════════════════════════════════════════════════════════════════════════════

class VedicAstroView(APIView):
    def post(self, request):
        dob = request.data.get('dob')
        time = request.data.get('time')
        location = request.data.get('location')
        dosha = request.data.get('dosha', 'Unknown')
        
        if not all([dob, time, location]):
            return Response({'error': 'Please provide Date of Birth, Time, and Location.'}, status=400)
            
        prompt = f"""You are an expert Vedic Astrologer and Ayurvedic practitioner.
The user's details are:
Date of Birth: {dob}
Time of Birth: {time}
Location of Birth: {location}
Known Dosha: {dosha}

Analyze their cosmic profile and provide a unified Astrological and Ayurvedic recommendation.
Respond ONLY in this exact valid JSON format (no backticks, no markdown):
{{
  "astrological_sign": "moon/sun sign",
  "ruling_planet": "planet",
  "element": "Fire/Water/Earth/Air",
  "recommended_gems": ["gem 1", "gem 2"],
  "ayurvedic_remedies": ["remedy 1", "remedy 2", "remedy 3"],
  "mantra": "A specific protective/healing mantra in short text",
  "summary": "2-3 sentences of holistic advice combining their dosha and cosmic chart."
}}"""

        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model='gemini-2.0-flash', 
                contents=prompt
            )
            text = response.text.strip().replace('```json','').replace('```','').strip()
            result = json.loads(text)
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"[VedicAstro] Error: {e}")
            return Response({
                "astrological_sign": "Unknown",
                "ruling_planet": "Unknown",
                "element": "Unknown",
                "recommended_gems": ["Ruby", "Pearl"],
                "ayurvedic_remedies": ["Drink warm holy water", "Practice Surya Namaskar"],
                "mantra": "Om Shanti Shanti Shanti",
                "summary": "Could not connect to the cosmic grid. Please try again later.",
                "error": str(e)
            }, status=status.HTTP_200_OK)


