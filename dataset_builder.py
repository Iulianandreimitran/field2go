from pymongo import MongoClient
from bson import ObjectId
import pandas as pd
import random

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "field2go"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

users = list(db["users"].find())
fields = list(db["fields"].find())
reservations = list(db["reservations"].find())


reservation_map = {}
for res in reservations:
    key = (str(res["owner"]), str(res["field"]))
    reservation_map[key] = {
        "duration": res.get("duration", None),
        "date": res.get("date", None)
    }

positive_samples = set(reservation_map.keys())

data = []

for user in users:
    user_id = str(user["_id"])

    # Pozitive
    for (uid, fid), meta in reservation_map.items():
        if uid == user_id:
            field = next((f for f in fields if str(f["_id"]) == fid), None)
            if field:
                data.append({
                    "user_id": user_id,
                    "field_id": fid,
                    "sportType": field["sportType"],
                    "location": field["location"],
                    "pricePerHour": field["pricePerHour"],
                    "duration": meta["duration"],
                    "date": meta["date"],
                    "reserved": 1
                })

    
    reserved_field_ids = {fid for (uid, fid) in positive_samples if uid == user_id}
    non_reserved_fields = [f for f in fields if str(f["_id"]) not in reserved_field_ids]
    sampled_negatives = random.sample(non_reserved_fields, min(len(non_reserved_fields), 3))

    for field in sampled_negatives:
        data.append({
            "user_id": user_id,
            "field_id": str(field["_id"]),
            "sportType": field["sportType"],
            "location": field["location"],
            "pricePerHour": field["pricePerHour"],
            "duration": 0,         
            "date": None,
            "reserved": 0
        })

df = pd.DataFrame(data)
df.to_csv("dataset.csv", index=False)
print("Dataset salvat în dataset.csv")
