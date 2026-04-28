# ─────────────────────────────────────────────────────────────────────────────
# ADD THIS VIEW to recommender_api/views.py
# Place it after the ChatBotView class
# ─────────────────────────────────────────────────────────────────────────────

class DailyPulseView(APIView):
    """
    POST /api/v1/daily-pulse/
    Accepts 3 answers (feeling, digestion, sleep) + dosha + lang.
    Returns a personalised Ayurvedic tip via Gemini, with SQLite logging.
    Works fully offline — SQLite log always saved; Gemini only when online.

    Request body:
    {
        "username":  "neha",
        "dosha":     "Pitta",
        "feeling":   "Tired 😔",
        "digestion": "Acidity 🔥",
        "sleep":     "Restful 🌙",
        "lang":      "mr"          // "en" | "hi" | "mr"
    }
    """

    # Offline tips per dosha — used when Gemini is unreachable
    OFFLINE_TIPS = {
        'Vata': [
            'Practice Abhyanga (self oil massage) with warm sesame oil today.',
            'Eat warm, moist foods like kitchari to ground your Vata.',
            'Maintain a regular sleep schedule — Vata needs routine.',
        ],
        'Pitta': [
            'Drink coconut water or rose water to cool excess Pitta today.',
            'Avoid spicy, sour, and salty foods — favour sweet and bitter tastes.',
            'Spend 10 minutes in cool air or moonlight to pacify Pitta heat.',
        ],
        'Kapha': [
            'Start with vigorous exercise to counter Kapha sluggishness today.',
            'Take hot ginger-honey tea — skip heavy breakfast if not hungry.',
            'Engage your mind with new learning to keep Kapha energised.',
        ],
        'General': [
            'Practice 10 minutes of Pranayama — Anulom Vilom breathing.',
            'Eat your largest meal at noon when Agni (digestive fire) is strongest.',
            'Drink warm water throughout the day to flush ama (toxins).',
        ],
    }

    LANG_INSTRUCTIONS = {
        'hi': 'Respond in Hindi (Devanagari script). Keep it practical and warm.',
        'mr': 'Respond in Marathi (Devanagari script). Keep it practical and warm.',
        'en': 'Respond in English. Keep it practical and warm.',
    }

    def post(self, request):
        username  = request.data.get('username', '')
        dosha     = request.data.get('dosha', 'General')
        feeling   = request.data.get('feeling', '')
        digestion = request.data.get('digestion', '')
        sleep_q   = request.data.get('sleep', '')
        lang      = request.data.get('lang', 'en')

        # ── 1. Always log to SQLite (works offline) ───────────────────────────
        try:
            conn = get_sqlite_conn()
            cursor = conn.cursor()

            # Create table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS daily_pulse_logs (
                    id        INTEGER PRIMARY KEY AUTOINCREMENT,
                    username  TEXT,
                    dosha     TEXT,
                    feeling   TEXT,
                    digestion TEXT,
                    sleep_q   TEXT,
                    tip       TEXT,
                    lang      TEXT,
                    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

            cursor.execute("""
                INSERT INTO daily_pulse_logs
                (username, dosha, feeling, digestion, sleep_q, lang)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (username, dosha, feeling, digestion, sleep_q, lang))
            conn.commit()
            pulse_log_id = cursor.lastrowid
            conn.close()
        except Exception as e:
            print(f"[DailyPulse] SQLite log failed: {e}")
            pulse_log_id = None

        # ── 2. Try Gemini for personalised tip ────────────────────────────────
        lang_instruction = self.LANG_INSTRUCTIONS.get(lang, self.LANG_INSTRUCTIONS['en'])

        prompt = f"""You are Sanjeevani AI, an expert Ayurvedic health assistant.
A user with {dosha} dosha reports:
- Overall feeling: {feeling}
- Digestion today: {digestion}
- Sleep last night: {sleep_q}

Give ONE specific, actionable Ayurvedic tip for today based on their dosha and these 3 answers.
The tip should be 2-3 sentences, practical, and reference a specific herb, food, or practice.
{lang_instruction}
Do NOT add disclaimers or bullet points. Just the tip as a single paragraph."""

        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model='gemini-2.0-flash-lite',
                contents=prompt
            )
            tip = response.text.strip()

            # Update SQLite log with the generated tip
            if pulse_log_id:
                try:
                    conn = get_sqlite_conn()
                    cursor = conn.cursor()
                    cursor.execute(
                        "UPDATE daily_pulse_logs SET tip = ? WHERE id = ?",
                        (tip, pulse_log_id)
                    )
                    conn.commit()
                    conn.close()
                except Exception:
                    pass

            # ── Also log to MongoDB UserHealthLog if user is registered ──────
            if username:
                try:
                    user = User.objects.get(username=username)
                    UserHealthLog.objects.create(
                        user=user,
                        detected_disease=f"Daily Pulse ({feeling})",
                        confidence=0.0,
                        dosha_at_time=dosha,
                        input_symptoms=f"feeling={feeling}, digestion={digestion}, sleep={sleep_q}"
                    )
                except Exception as mongo_e:
                    print(f"[DailyPulse] MongoDB log failed: {mongo_e}")

            return Response({"tip": tip, "source": "gemini"}, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"[DailyPulse] Gemini failed, using offline tip: {e}")
            import random
            tips = self.OFFLINE_TIPS.get(dosha, self.OFFLINE_TIPS['General'])
            tip  = random.choice(tips)
            return Response({"tip": tip, "source": "offline"}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# ADD THESE 2 LINES to recommender_api/urls.py
# ─────────────────────────────────────────────────────────────────────────────
#
#   from .views import DailyPulseView
#
#   path('daily-pulse/', DailyPulseView.as_view(), name='daily-pulse'),
#
# ─────────────────────────────────────────────────────────────────────────────
