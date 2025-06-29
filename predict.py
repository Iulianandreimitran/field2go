import sys
import json
from pymongo import MongoClient
from bson import ObjectId
import joblib
import pandas as pd
from sklearn.preprocessing import LabelEncoder

if len(sys.argv) < 3:
    print(json.dumps({"error": "Ai nevoie de userId și fieldId"}))
    sys.exit(1)

user_id = sys.argv[1]
field_id = sys.argv[2]

client = MongoClient("mongodb://localhost:27017")
db = client["field2go"]

model = joblib.load("model.joblib")

dataset = pd.read_csv("dataset.csv")
enc_sport = LabelEncoder()
enc_sport.fit(dataset["sportType"])

enc_loc = LabelEncoder()
enc_loc.fit(dataset["location"])

field = db.fields.find_one({"_id": ObjectId(field_id)})
if not field:
    print(json.dumps({"error": "Terenul nu a fost găsit"}))
    sys.exit(1)

reservation = db.reservations.find_one({
    "owner": ObjectId(user_id),
    "field": ObjectId(field_id)
})

duration = reservation.get("duration") if reservation else 0
weekday = reservation.get("date").weekday() if reservation and reservation.get("date") else -1

try:
    sport_enc = enc_sport.transform([field["sportType"]])[0]
    loc_enc = enc_loc.transform([field["location"]])[0]
except:
    print(json.dumps({"error": "Valori necunoscute pentru sport/location"}))
    sys.exit(1)

vec = [[
    sport_enc,
    loc_enc,
    field["pricePerHour"],
    duration,
    weekday
]]

pred = model.predict(vec)[0]
prob = model.predict_proba(vec)[0][1]

print(json.dumps({
    "predicted": bool(pred),
    "probability": round(prob * 100, 2)
}))
