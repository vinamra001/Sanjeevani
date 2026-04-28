import os
import django
import sqlite3
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AyurRecSys.settings')
django.setup()

from recommender_api.models import Disease

def fill():
    print("--- Fixing Exhaustive Offline Combinations ---")
    db_path = 'sanjeevani_offline_master.db'
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # 1. Clear old schema fully and rebuild
    c.executescript("""
        DROP TABLE IF EXISTS DiseaseDetails;
        CREATE TABLE DiseaseDetails (
            diseaseName TEXT PRIMARY KEY,
            sanskritName TEXT,
            doshaType TEXT,
            dietPlan TEXT,
            foodsToTake TEXT,
            foodsToAvoid TEXT,
            lifestyleRoutine TEXT,
            recommendedExercises TEXT,
            remediesJSON TEXT
        );
    """)
    
    # 2. Iterate through perfectly clean Django items
    inserted = 0
    for dis in Disease.objects.all():
        rems = list(dis.remedies.values('name', 'sanskrit_name', 'description', 'dosage', 'preparation', 'usage_instructions'))
        
        # We must insert with matching exact casing to the combos
        c.execute("""
            INSERT OR REPLACE INTO DiseaseDetails (diseaseName, sanskritName, doshaType, dietPlan, foodsToTake, foodsToAvoid, lifestyleRoutine, recommendedExercises, remediesJSON)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            dis.name,
            dis.sanskrit_name,
            dis.dosha_type,
            dis.diet_plan,
            dis.foods_to_take,
            dis.foods_to_avoid,
            dis.lifestyle_routine,
            dis.recommended_exercises,
            json.dumps(rems)
        ))
        inserted += 1
        
    conn.commit()
    conn.close()
    print(f"Populated {inserted} exact DiseaseDetails in sanjeevani_offline_master.db")
    print("Now the 2.5 Lakh exact mapping combinations will perfectly retrieve disease logic!")

if __name__ == '__main__':
    fill()
