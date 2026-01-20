import tensorflow as tf
from flask import Flask, request, jsonify
import numpy as np
from PIL import Image
import requests
from io import BytesIO
from tensorflow.keras.applications.resnet50 import preprocess_input

app = Flask(__name__)

# 🔥 Load SavedModel correctly
model = tf.saved_model.load(
    r"C:\Users\hp\Desktop\kidneycared\kidneycared\model\kidney_ct_finetuned"
)

infer = model.signatures["serving_default"]

print("✅ SavedModel loaded with serving_default")

CLASS_NAMES = ["Cyst", "Normal", "Stone", "Tumor"]

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        image_url = data.get("imageUrl")

        response = requests.get(image_url)
        image = Image.open(BytesIO(response.content)).convert("RGB")
        image = image.resize((224, 224))

        img = np.array(image, dtype=np.float32) 
        img = np.expand_dims(img, axis=0)
        img = preprocess_input(img)

        # 🔥 THIS IS THE KEY LINE
        outputs = infer(tf.constant(img))

        predictions = list(outputs.values())[0].numpy()
        idx = int(np.argmax(predictions[0]))

        return jsonify({
            "result": CLASS_NAMES[idx],
            "confidence": round(float(predictions[0][idx]) * 100, 2)
        })

    except Exception as e:
        print("❌ Error during prediction:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=8000, debug=True)
