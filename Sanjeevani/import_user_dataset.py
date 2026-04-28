import os
import django
import csv

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AyurRecSys.settings')
django.setup()

from recommender_api.models import Symptom, Disease, Remedy

def run():
    print("--- 1. Clearing Existing Collections ---")
    Symptom.objects.all().delete()
    Disease.objects.all().delete()
    Remedy.objects.all().delete()
    print("Cleared.")

    print("--- 2. Importing Symptoms safely (Unique Filter) ---")
    symptoms_dict = {}  # Store id -> Symptom
    added_names = set()
    with open('recommender_api_symptom.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            s_name = row.get('name[0]') or row.get('name') or ''
            s_name = s_name.strip()
            if not s_name or s_name in added_names:
                continue
            
            s_id = int(row['id'])
            s_cat = row.get('category', '').strip()
            sym = Symptom.objects.create(name=s_name, category=s_cat)
            symptoms_dict[s_id] = sym
            added_names.add(s_name)
    print(f"Imported {len(added_names)} unique symptoms.")

    print("--- 3. Importing Remedies ---")
    remedies_dict = {}  # id -> Remedy
    with open('recommender_api_remedy.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # unique remedies check
            r_id = int(row['id'])
            if r_id in remedies_dict: continue
            
            rem = Remedy.objects.create(
                name=row['name'].strip(),
                sanskrit_name=row['sanskrit_name'].strip(),
                description=row['description'].strip(),
                dosage=row['dosage'].strip(),
                preparation=row['preparation'].strip(),
                usage_instructions=row['usage_instructions'].strip()
            )
            remedies_dict[r_id] = rem
    print(f"Imported {len(remedies_dict)} unique remedies.")

    print("--- 4. Importing Diseases ---")
    diseases_dict = {}  # id -> Disease
    added_disease_names = set()
    with open('recommender_api_disease.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            d_name = row['name'].strip()
            d_id = int(row['id'])
            if d_name in added_disease_names:
                continue
            
            dis = Disease.objects.create(
                name=d_name,
                sanskrit_name=row.get('sanskrit_name', '').strip(),
                description=row.get('description', '').strip(),
                dosha_type=row.get('dosha_type', '').strip(),
                diet_plan=row.get('diet_plan') or row.get('diet', ''),
                foods_to_take=row.get('foods_to_take', '').strip(),
                foods_to_avoid=row.get('foods_to_avoid', '').strip(),
                lifestyle_routine=row.get('lifestyle_routine', '').strip(),
                recommended_exercises=row.get('recommended_exercises', '').strip()
            )
            diseases_dict[d_id] = dis
            added_disease_names.add(d_name)
    print(f"Imported {len(added_disease_names)} unique diseases.")

    print("--- 5. Linking Disease-Symptoms ---")
    symptom_links = 0
    with open('recommender_api_disease_symptoms.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            d_id_str = row.get('disease_id')
            s_id_str = row.get('symptom_id')
            if not d_id_str or not s_id_str: continue
            d_id = int(d_id_str)
            s_id = int(s_id_str)
            if d_id in diseases_dict and s_id in symptoms_dict:
                # To prevent IntegrityError, adding using many-to-many manager automatically handles duplicates gracefully in django
                diseases_dict[d_id].symptoms.add(symptoms_dict[s_id])
                symptom_links += 1
    print(f"Established {symptom_links} symptom bindings.")

    print("--- 6. Linking Disease-Remedies ---")
    remedy_links = 0
    with open('recommender_api_disease_remedies.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            d_id_str = row.get('disease_id')
            r_id_str = row.get('remedy_id')
            if not d_id_str or not r_id_str: continue
            d_id = int(d_id_str)
            r_id = int(r_id_str)
            if d_id in diseases_dict and r_id in remedies_dict:
                diseases_dict[d_id].remedies.add(remedies_dict[r_id])
                remedy_links += 1
    print(f"Established {remedy_links} remedy bindings.")

    print("--- DONE! ---")

if __name__ == '__main__':
    run()
