import cv2
import numpy as np
import requests
from flask import Flask, request, jsonify
import tensorflow as tf
from tensorflow.keras.applications.efficientnet_v2 import preprocess_input

app = Flask(__name__)

# Load SavedModel
model = tf.saved_model.load(
    r"kidney_ct_finetuned"
)
infer = model.signatures["serving_default"]

CLASS_NAMES = ["Cyst", "Normal", "Stone", "Tumor"]

def preprocess_image(image_url):
    response = requests.get(image_url, timeout=10)
    img_array = np.asarray(bytearray(response.content), dtype=np.uint8)
    
    # ✅ FIX 1: Read as COLOR (not grayscale)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)  # Convert BGR→RGB

    # ✅ FIX 2: Removed GaussianBlur (was destroying fine details)
    
    # ✅ FIX 3: Normalize AFTER resize
    img = cv2.resize(img, (224, 224))
    img = cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX)

    # ✅ EfficientNet preprocessing
    img = preprocess_input(img.astype(np.float32))
    img = np.expand_dims(img, axis=0)
    
    return img

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    image_url = data.get("imageUrl")

    if not image_url:
        return jsonify({"error": "imageUrl required"}), 400

    img = preprocess_image(image_url)

    outputs = infer(input_layer_1=tf.constant(img))
    preds = list(outputs.values())[0].numpy()[0]

    idx = int(np.argmax(preds))
    confidence = float(preds[idx]) * 100

    return jsonify({
        "prediction": CLASS_NAMES[idx],
        "confidence": round(confidence, 2),
        "all_scores": {
            CLASS_NAMES[i]: round(float(preds[i]) * 100, 2)
            for i in range(len(CLASS_NAMES))
        }
    })

if __name__ == "__main__":
    app.run(port=5002, debug=True)