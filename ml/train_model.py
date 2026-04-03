import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.utils.class_weight import compute_class_weight
import pickle
import os

file_path = r'"C:\Users\hp\Desktop\kidneycared\kidneycared\ml\kidney_disease (1).csv"'

try:
    data = pd.read_csv(file_path)
    print("✅ Dataset loaded successfully!")
    print(f"   Total records: {len(data)}")

    # Data Cleaning
    data['classification'] = data['classification'].astype(str).str.replace('\t', '').str.strip()
    data = data[data['classification'].isin(['ckd', 'notckd'])]
    print(f"   After cleaning: {len(data)} records")
    ckd_count = sum(data['classification'] == 'ckd')
    normal_count = sum(data['classification'] == 'notckd')
    print(f"   Class distribution: CKD={ckd_count}, Normal={normal_count}")

    # Feature Selection
    required_features = ['age', 'bu', 'sc']
    X = data[required_features]
    y = data['classification']

    # Handle Missing Values
    X = X.replace('?', np.nan)
    X = X.apply(pd.to_numeric, errors='coerce')
    medians_dict = X.median().to_dict()
    X = X.fillna(X.median())

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    print(f"\n✅ Features scaled")

    # Encode target
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    print(f"\n✅ Target encoded:")
    print(f"   Classes: {le.classes_}")

    # Train-test split with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"\n✅ Train-test split:")
    print(f"   Training: {len(X_train)}, Testing: {len(X_test)}")

    # ✅ COMPUTE CLASS WEIGHTS to handle imbalance
    class_weights = compute_class_weight('balanced', classes=np.unique(y_encoded), y=y_encoded)
    class_weight_dict = {i: w for i, w in enumerate(class_weights)}
    print(f"\n✅ Class weights (to balance imbalance):")
    print(f"   CKD (0): {class_weight_dict[0]:.2f}")
    print(f"   Normal (1): {class_weight_dict[1]:.2f}")

    # Train model with class weights
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight='balanced',  # ✅ USE BALANCED WEIGHTS!
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # Accuracy
    train_accuracy = model.score(X_train, y_train)
    test_accuracy = model.score(X_test, y_test)
    
    print(f"\n🎯 Model Accuracy:")
    print(f"   Training: {round(train_accuracy * 100, 2)}%")
    print(f"   Testing: {round(test_accuracy * 100, 2)}%")
    
    # Test predictions
    print(f"\n🧪 Test Predictions (SHOULD BE DIFFERENT NOW):")
    
    # Normal patient
    normal_test = pd.DataFrame({'age': [35], 'bu': [20], 'sc': [0.8]})
    normal_scaled = scaler.transform(normal_test)
    normal_pred = model.predict(normal_scaled)[0]
    normal_probs = model.predict_proba(normal_scaled)[0]
    normal_correct = "✅" if normal_pred == 1 else "❌"
    print(f"   {normal_correct} Normal (35, 0.8, 20): Pred={normal_pred} (want 1), Probs=[CKD:{normal_probs[0]:.1%}, Normal:{normal_probs[1]:.1%}]")
    
    # CKD patient
    ckd_test = pd.DataFrame({'age': [65], 'bu': [150], 'sc': [3.5]})
    ckd_scaled = scaler.transform(ckd_test)
    ckd_pred = model.predict(ckd_scaled)[0]
    ckd_probs = model.predict_proba(ckd_scaled)[0]
    ckd_correct = "✅" if ckd_pred == 0 else "❌"
    print(f"   {ckd_correct} CKD (65, 3.5, 150): Pred={ckd_pred} (want 0), Probs=[CKD:{ckd_probs[0]:.1%}, Normal:{ckd_probs[1]:.1%}]")

    # Save files
    print(f"\n💾 Saving files...")
    
    with open('ckd_model.pkl', 'wb') as f:
        pickle.dump(model, f)
    print("✅ Model saved")
    
    with open('scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    print("✅ Scaler saved")
    
    with open('model_columns.pkl', 'wb') as f:
        pickle.dump(required_features, f)
    print("✅ Columns saved")
    
    with open('medians.pkl', 'wb') as f:
        pickle.dump(medians_dict, f)
    print("✅ Medians saved")
    
    with open('label_encoder.pkl', 'wb') as f:
        pickle.dump(le, f)
    print("✅ Label encoder saved")
    
    print(f"\n✅ TRAINING COMPLETE!")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()