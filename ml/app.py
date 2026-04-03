from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os

app = Flask(__name__)
CORS(app)

os.chdir(os.path.dirname(os.path.abspath(__file__)))

try:
    model         = joblib.load('ckd_model.pkl')
    scaler        = joblib.load('scaler.pkl')
    model_columns = joblib.load('model_columns.pkl')
    medians       = joblib.load('medians.pkl')
    print("✅ All model files loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model files: {e}")
    model = None

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500

        data = request.get_json()
        print(f"📥 Received: {data}")

        FULL_DEFAULTS = {
            "age":   medians.get("age",  50)  if isinstance(medians, dict) else 50,
            "bu":    medians.get("bu",   40)  if isinstance(medians, dict) else 40,
            "sc":    medians.get("sc",   1.2) if isinstance(medians, dict) else 1.2,
            "bp":    80.0,
            "sg":    1.020,
            "al":    0.0,
            "su":    0.0,
            "rbc":   1.0,
            "pc":    1.0,
            "pcc":   0.0,
            "ba":    0.0,
            "bgr":   100.0,
            "sod":   137.0,
            "pot":   4.5,
            "hemo":  13.5,
            "pcv":   44.0,
            "wc":    8000.0,
            "rc":    5.0,
            "htn":   0.0,
            "dm":    0.0,
            "cad":   0.0,
            "appet": 1.0,
            "pe":    0.0,
            "ane":   0.0,
        }

        mapping = {
            'creatinine': 'sc',
            'urea':       'bu',
            'age':        'age'
        }
        for key, value in data.items():
            col = mapping.get(key)
            if col and value is not None:
                FULL_DEFAULTS[col] = float(value)
                print(f"✅ Set {col} = {value}")

        input_row = pd.DataFrame(
            [[FULL_DEFAULTS[col] for col in model_columns]],
            columns=model_columns
        )

        input_scaled = pd.DataFrame(
            scaler.transform(input_row),
            columns=model_columns
        )

        prediction    = model.predict(input_scaled)[0]
        probabilities = model.predict_proba(input_scaled)[0]

        ckd_probability    = round(float(probabilities[0]) * 100, 1)
        normal_probability = round(float(probabilities[1]) * 100, 1)
        ckd_detected       = bool(prediction == 0)
        confidence         = ckd_probability if ckd_detected else normal_probability

        print(f"🎯 {'CKD' if ckd_detected else 'Normal'} | {confidence}%")

        return jsonify({
            'ckd_detected':       ckd_detected,
            'confidence':         round(confidence, 1),
            'message':            "CKD Detected" if ckd_detected else "Normal / Low Risk",
            'ckd_probability':    ckd_probability,
            'normal_probability': normal_probability
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 400

@app.route('/debug', methods=['GET'])
def debug():
    return jsonify({
        'model_columns':  list(model_columns),
        'num_columns':    len(model_columns),
        'medians_keys':   list(medians.keys()) if isinstance(medians, dict) else str(type(medians)),
        'medians_length': len(medians)
    })

@app.route('/test', methods=['GET'])
def test():
    return jsonify({
        "status":       "Server is alive!",
        "model_loaded": model is not None
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')