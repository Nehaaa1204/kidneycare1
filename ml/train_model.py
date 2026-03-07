import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import pickle
import os

# 1. Path setup (Using raw string 'r' for Windows)
file_path = r'C:\Users\Deepika\Downloads\kidneycare1\backend\ml\kidney_disease (1).csv'

try:
    data = pd.read_csv(file_path)
    print("✅ Dataset loaded successfully!")

    # 2. Data Cleaning - Bahut zaroori hai!
    # Classification column mein se extra spaces aur tabs ('\t') hatayein
    data['classification'] = data['classification'].astype(str).str.replace('\t', '').str.strip()
    
    # Sirf 'ckd' aur 'notckd' rows rakhein (kabhi-kabhi garbage data hota hai)
    data = data[data['classification'].isin(['ckd', 'notckd'])]

    # 3. Feature Selection
    # Aapke dataset ke column names 'age', 'bu', aur 'sc' hain (as per UCI standard)
    # Agar aapke CSV mein poore naam hain toh niche wahi likhein
    required_features = ['age', 'bu', 'sc'] 
    
    # Check if columns exist, if not use full names
    if 'bu' not in data.columns:
        required_features = ['age', 'blood_urea', 'serum_creatinine']

    X = data[required_features]
    y = data['classification']

    # 4. Missing Values (NaN) handle karein
    # Dataset mein '?' ya blank cells ho sakte hain
    X = X.replace('?', np.nan)
    X = X.apply(pd.to_numeric, errors='coerce') # Taaki sab numbers ban jayein
    X = X.fillna(X.median())

    # 5. Encoding & Training
    le = LabelEncoder()
    y = le.fit_transform(y) # ckd will likely be 0, notckd 1

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Model Accuracy check
    accuracy = model.score(X_test, y_test)
    print(f"🎯 Model Accuracy: {round(accuracy * 100, 2)}%")

    # 6. Save Model
    # Ise backend folder mein save karein jahan main.py hai
    save_path = 'ckd.pkl'
    with open(save_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"🚀 Model saved as {save_path} at {os.getcwd()}")

except Exception as e:
    print(f"❌ Error occurred: {e}")