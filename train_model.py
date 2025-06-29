import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
import joblib

df = pd.read_csv("dataset.csv")

df["date"] = pd.to_datetime(df["date"], errors="coerce")
df["weekday"] = df["date"].dt.weekday.fillna(-1)
df["duration"] = df["duration"].fillna(0)

enc_sport = LabelEncoder()
enc_loc = LabelEncoder()

df["sportType_enc"] = enc_sport.fit_transform(df["sportType"])
df["location_enc"] = enc_loc.fit_transform(df["location"])

features = ["sportType_enc", "location_enc", "pricePerHour", "duration", "weekday"]
X = df[features]
y = df["reserved"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

lr = LogisticRegression(max_iter=1000)
rf = RandomForestClassifier(n_estimators=100, random_state=42)

lr.fit(X_train, y_train)
rf.fit(X_train, y_train)


print("=== Logistic Regression ===")
print(classification_report(y_test, lr.predict(X_test)))
print("=== Random Forest ===")
print(classification_report(y_test, rf.predict(X_test)))

acc_lr = lr.score(X_test, y_test)
acc_rf = rf.score(X_test, y_test)

model = rf if acc_rf > acc_lr else lr
joblib.dump(model, "model.joblib")
print(f"✔ Modelul salvat este: {'Random Forest' if model == rf else 'Logistic Regression'}")

print("\n=== Predictie manuala ===")
ex_sport = input(f"Sport (valori: {list(enc_sport.classes_)}): ")
ex_loc = input(f"Locatie (valori: {list(enc_loc.classes_)}): ")
ex_price = float(input("Pret per ora: "))
ex_duration = float(input("Durata (ore): "))
ex_weekday = int(input("Zi a saptamanii (0=Luni, 6=Duminica): "))

vec = [[
    enc_sport.transform([ex_sport])[0],
    enc_loc.transform([ex_loc])[0],
    ex_price,
    ex_duration,
    ex_weekday
]]

pred = model.predict(vec)[0]
prob = model.predict_proba(vec)[0][1]

print(f"\nRezultat predictie: {'VA REZERVA' if pred else 'NU va rezerva'} (Probabilitate: {round(prob*100, 2)}%)")
