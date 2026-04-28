import os, django, pandas as pd, ast
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AyurRecSys.settings')
django.setup()
from recommender_api.models import Disease, Symptom

def repair():
    print("🛠️ Starting Final Repair...")
    file = 'recommender_api_disease_symptoms.csv' # Your actual filename
    
    if not os.path.exists(file):
        print(f"❌ File {file} not found!")
        return

    df = pd.read_csv(file)
    print(f"📂 Loaded {len(df)} rows from CSV.")
    
    success_count = 0
    for _, row in df.iterrows():
        try:
            # 1. Clean the names
            d_name = str(row['Disease']).strip()
            
            # 2. Find the disease (Case insensitive and partial match)
            disease = Disease.objects.filter(name__icontains=d_name).first()
            
            if disease:
                # 3. Handle the Symptom list: ["Symptom1", "Symptom2"]
                s_data = row['Symptom']
                if isinstance(s_data, str):
                    # Convert "[...]" string to a real Python list
                    s_list = ast.literal_eval(s_data)
                else:
                    s_list = s_data

                for s_name in s_list:
                    s_obj = Symptom.objects.filter(name__iexact=s_name.strip()).first()
                    if s_obj:
                        disease.symptoms.add(s_obj)
                
                success_count += 1
                if success_count % 100 == 0:
                    print(f"✅ Successfully mapped {success_count} diseases...")
            else:
                # Optional: print if it can't find a disease to help debug
                pass

        except Exception as e:
            continue

    print(f"\n✨ FINISHED! Successfully mapped {success_count} diseases.")

if __name__ == "__main__":
    repair()