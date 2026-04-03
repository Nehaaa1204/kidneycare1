import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import pickle

# Load dataset
data = pd.read_csv('kidney_disease (1).csv')

# Clean
data['classification'] = data['classification'].astype(str).str.replace('\t', '').str.strip()
data = data[data['classification'].isin(['ckd', 'notckd'])]

# Features
X = data[['age', 'bu', 'sc']]

# Missing values
X = X.replace('?', np.nan)
X = X.apply(pd.to_numeric, errors='coerce')
X = X.fillna(X.median())

# Create scaler
scaler = StandardScaler()
scaler.fit(X)

# Save
with open('scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)

print("✅ scaler.pkl created!")