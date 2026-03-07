import cv2
import numpy as np
import requests
from flask import Flask, request, jsonify
import tensorflow as tf
from tensorflow.keras.applications.efficientnet_v2 import preprocess_input

app = Flask(__name__)

# Load SavedModel
model = tf.saved_model.load(
    r"C:\Users\hp\Desktop\kidneycared\kidneycared\model\kidney_ct_finetuned"
)
infer = model.signatures["serving_default"]

CLASS_NAMES = ["Cyst", "Normal", "Stone", "Tumor"]

def preprocess_image(image_url):
    response = requests.get(image_url, timeout=10)
    img_array = np.asarray(bytearray(response.content), dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_GRAYSCALE)

    img = cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX)
    img = cv2.GaussianBlur(img, (3, 3), 0)
    img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    img = cv2.resize(img, (224, 224))
    
    # ✅ Apply EfficientNet preprocessing
    img = preprocess_input(img)
    
    # ✅ Ensure it's float32 (preprocess_input should already do this, but let's be explicit)
    img = img.astype(np.float32)
    
    img = np.expand_dims(img, axis=0)
    return img

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    image_url = data.get("imageUrl")

    if not image_url:
        return jsonify({"error": "imageUrl required"}), 400

    img = preprocess_image(image_url)

    # ✅ Use named argument as the SavedModel expects
    outputs = infer(input_layer_1=tf.constant(img))
    
    preds = list(outputs.values())[0].numpy()[0]

    idx = int(np.argmax(preds))
    confidence = float(preds[idx]) * 100

    return jsonify({
        "prediction": CLASS_NAMES[idx],
        "confidence": round(confidence, 2)
    })

if __name__ == "__main__":
    app.run(port=8000, debug=True)

