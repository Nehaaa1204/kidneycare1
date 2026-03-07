from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)  # This allows your React app to talk to this Python server

# Load the brain files we just created
try:
    model = joblib.load('ckd_model.pkl')
    model_columns = joblib.load('model_columns.pkl')
    medians = joblib.load('medians.pkl')
    print("Model and assets loaded successfully!")
except Exception as e:
    print(f"Error loading model files: {e}")

@app.route('/predict', methods=['POST'],strict_slashes=False)
@app.route('/predict/', methods=['POST', 'OPTIONS'])
def predict():
    try:
        # 1. Get data sent from React
        data = request.get_json()
        
        # 2. Map your extracted names to the dataset names
        # dataset uses 'sc' for creatinine, 'bu' for urea, etc.
        mapping = {
            'creatinine': 'sc',
            'urea': 'bu',
            'age': 'age'
        }

        # 3. Create a template row filled with medians
        input_row = pd.DataFrame([medians], columns=model_columns)

        # 4. Fill in the values we actually extracted
        for key, value in data.items():
            if key in mapping and mapping[key] in input_row.columns:
                if value is not None and str(value).lower() != 'n/a':
                    input_row[mapping[key]] = float(value)

        # 5. Make the prediction
        prediction = model.predict(input_row)[0]
        probability = model.predict_proba(input_row)[0][1]

        # 6. Send result back to React
        return jsonify({
            'ckd_detected': bool(prediction),
            'confidence': round(float(probability) * 100, 2),
            'message': "CKD Likely" if prediction == 1 else "Normal / Low Risk"
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400
@app.route('/test', methods=['GET'])
def test():
    return jsonify({"status": "Server is alive!"})
if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')