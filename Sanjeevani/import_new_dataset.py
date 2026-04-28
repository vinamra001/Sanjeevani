import os
import django
import pandas as pd
import ast

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AyurRecSys.settings')
django.setup()

from recommender_api.models import Disease, Symptom, Remedy

print("Clearing data...")
Disease.objects.all().delete()
Symptom.objects.all().delete()
Remedy.objects.all().delete()

print("Importing Symptoms...")
df = pd.read_excel("recommender_api_symptom.xlsx")
sym_map = {}
for _, r in df.iterrows():
    s = Symptom.objects.create(
        name=str(r['name']).strip(),
        category=str(r['category']).strip() if pd.notna(r['category']) else ''
    )
    sym_map[int(r['id'])] = s
print(f"  {len(sym_map)} symptoms done")

print("Importing Diseases...")
df = pd.read_excel("recommender_api_disease.xlsx")
dis_map = {}
for _, r in df.iterrows():
    d = str(r['dosha_type']).strip() if pd.notna(r['dosha_type']) else 'Tridoshic'
    if d not in ['Vata','Pitta','Kapha','Tridoshic']:
        d = 'Tridoshic'
    obj = Disease.objects.create(
        name=str(r['name']).strip(),
        sanskrit_name=str(r['sanskrit_name']).strip() if pd.notna(r['sanskrit_name']) else '',
        description=str(r['description']).strip() if pd.notna(r['description']) else '',
        dosha_type=d,
        diet_plan=str(r['diet_plan']).strip() if pd.notna(r['diet_plan']) else ''
    )
    dis_map[int(r['id'])] = obj
print(f"  {len(dis_map)} diseases done")

print("Importing Remedies...")
df = pd.read_excel("recommender_api_remedy.xlsx")
rem_map = {}
for _, r in df.iterrows():
    obj = Remedy.objects.create(
        name=str(r['name']).strip(),
        sanskrit_name=str(r['sanskrit_name']).strip() if pd.notna(r['sanskrit_name']) else '',
        description=str(r['description']).strip() if pd.notna(r['description']) else '',
        dosage=str(r['dosage']).strip() if pd.notna(r['dosage']) else '',
        preparation=str(r['preparation']).strip() if pd.notna(r['preparation']) else '',
        usage_instructions=str(r['usage_instructions']).strip() if pd.notna(r['usage_instructions']) else ''
    )
    rem_map[int(r['id'])] = obj
print(f"  {len(rem_map)} remedies done")

print("Linking remedies to diseases...")
df = pd.read_excel("recommender_api_remedy_treats_diseases.xlsx")
linked = 0
for _, r in df.iterrows():
    rid, did = int(r['remedy_id']), int(r['disease_id'])
    if rid in rem_map and did in dis_map:
        dis_map[did].remedies.add(rem_map[rid])
        linked += 1
print(f"  {linked} links done")

print("Linking symptoms to diseases...")
df = pd.read_excel("symptom_disease_mapping_dataset.xlsx")
smap = {s.name.lower(): s for s in Symptom.objects.all()}
dmap = {d.name.lower(): d for d in Disease.objects.all()}
linked2 = 0
seen = set()

for _, r in df.iterrows():
    try:
        raw = str(r['Symptom']).strip()
        try:
            sl = ast.literal_eval(raw)
            sn = str(sl[0]).strip() if isinstance(sl, list) else raw.strip('[]"\'')
        except:
            sn = raw.strip('[]"\'')
        dn = str(r['Disease']).strip()
        pair = (sn.lower(), dn.lower())
        if pair in seen:
            continue
        seen.add(pair)
        so = smap.get(sn.lower())
        do = dmap.get(dn.lower())
        if so and do:
            do.symptoms.add(so)
            linked2 += 1
    except:
        continue

print(f"  {linked2} symptom-disease links done")
print("DONE!")
print(f"Diseases: {Disease.objects.count()}")
print(f"Symptoms: {Symptom.objects.count()}")
print(f"Remedies: {Remedy.objects.count()}")