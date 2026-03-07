
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import boto3
import re
import logging
from typing import Optional
import uuid
from datetime import datetime
from pydantic import BaseModel
import io
from PIL import Image
import numpy as np
import joblib
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CKD Prediction API", version="1.0.0")

# Add CORS middleware - MUST be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Get absolute path relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "ckd_model.pkl")

try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        logger.info(f"✅ ML Model loaded successfully from {MODEL_PATH}")
    else:
        model = None
        logger.warning(f"⚠️ Model file not found at {MODEL_PATH}")
except Exception as e:
    model = None
    logger.error(f"❌ Failed to load model: {e}")
try:
    textract = boto3.client("textract", region_name="ap-south-1")
    logger.info("AWS Textract client initialized")
except Exception as e:
    logger.error(f"Failed to initialize AWS Textract: {e}")
    textract = None

class PatientData(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    referred_by: Optional[str] = None

class LabValues(BaseModel):
    creatinine_mg_dl: Optional[float] = None
    urea_mg_dl: Optional[float] = None
    egfr: Optional[float] = None

class CKDResult(BaseModel):
    risk: str
    stage: str
class MLResult(BaseModel):
    prediction: str
    confidence: str

class AnalysisResponse(BaseModel):
    patient: PatientData
    values: LabValues
    ckd: CKDResult
    mlResult: Optional[MLResult] = None
    extracted_text: Optional[str] = None
    is_estimated: bool = False

class ReportData(BaseModel):
    patient: PatientData
    values: LabValues
    ckd: CKDResult
    extracted_text: Optional[str] = None
    ml_prediction: Optional[str] = None
    is_estimated: bool = False

def extract_all_text(blocks):
    """Extract all text from Textract response blocks"""
    try:
        return "\n".join(
            block["Text"]
            for block in blocks
            if block["BlockType"] == "LINE"
        )
    except Exception as e:
        logger.error(f"Error extracting text from blocks: {e}")
        return ""

def preprocess_image(image_bytes: bytes) -> bytes:
    """Preprocess image for better OCR results"""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert to grayscale
        img = img.convert('L')
        
        # Increase contrast
        img_array = np.array(img)
        img_array = np.clip(img_array * 1.2, 0, 255).astype(np.uint8)
        img = Image.fromarray(img_array)
        
        # Resize if too small
        if img.width < 800:
            img = img.resize((img.width * 2, img.height * 2), Image.LANCZOS)
        
        # Convert back to bytes
        output = io.BytesIO()
        img.save(output, format='PNG')
        return output.getvalue()
    except Exception as e:
        logger.warning(f"Image preprocessing failed, using original: {e}")
        return image_bytes

def clean_person_name(name: str) -> Optional[str]:
    """Clean and validate extracted person names while preserving titles like Mr./Mrs."""
    if not name:
        return None

    # Newlines ko spaces se badlein
    name = name.replace("\n", " ")

    # Sirf wahi words hatayein jo name ka part nahi ho sakte
    # 'mr', 'mrs', 'pateint' ko humne allow kiya hai
    noise_words = {
        "id", "sample", "received", "collected", "report", 
        "referred", "information", "reg", "no", "date", "phone", "nic"
    }

    words = name.split()
    # Har word ko check karein aur noise filter karein
    cleaned_words = [w for w in words if w.lower().strip('.:') not in noise_words]

    # Dobara join karein
    name = " ".join(cleaned_words)
    
    # Letters, Spaces aur Dots (titles ke liye) rehne dein, baaki symbols hatayein
    name = re.sub(r"[^A-Za-z\s\.]", "", name)
    
    # Extra spaces ko single space mein badlein
    name = re.sub(r"\s{2,}", " ", name).strip()

    # Agar name ki length 2 se badi hai toh return karein
    return name if len(name) > 2 else None

def fallback_medical_parse(text: str) -> dict:
    result = {"name": None, "age": None, "sex": None, "creatinine": None, "urea": None, "egfr": None}
    if not text: return result

    # Sabse pehle pehli 10 lines nikaalein kyunki name wahi hota hai
    lines = text.split('\n')
    header_text = "\n".join(lines[:10])

    # ============ PATIENT NAME REGEX ============
    # ============ PATIENT NAME (DYNAMICE KEYWORDS) ============
    name_patterns = [
        # 1. Matches labels like "Patient Name:", "Name:", "Pateint Name:" followed by the name
        # Isme 'Name' keyword bhi cover ho gaya hai
        r"(?:Patient\s*Name|PATIENT\s*NAME|Pateint\s*Name|Name)\s*[:\-]*\s*([A-Z\s\.]{3,})(?=\s+(?:NIC|Age|ID|Sex|Gender|$))",
        
        # 2. Matches "Mr.PARAMJEET SINGH" or "Mrs. Sha Bosco" (direct titles)
        r"(?:MR\.|MRS\.|MS\.|DR\.)\s*([A-Z\s\.]{3,})", 
        
        # 3. Fallback: Agar pehli line hi capital letters mein ho (Header check)
        r"^([A-Z\s\.]{5,})$"
    ]

    for pattern in name_patterns:
        match = re.search(pattern, header_text, re.I | re.M)
        if match:
            # group(1) asli name return karega label ke baad wala
            raw_name = match.group(1).strip()
            cleaned = clean_person_name(raw_name)
            if cleaned:
                result["name"] = cleaned
                logger.info(f"✅ Found Name: {cleaned}")
                break
    # ============ AGE ============
    # Matches 'Age', 'Years', 'Yrs' or just a number followed by Y
    # age_patterns = [
    #     # Garg Path Lab specialized: "60 Y/Male" or "60 YRS/Male"
    #     r"(\d{1,3})\s*[Yy](?:ears?|rs)?\s*/", 
        
    #     # General formats
    #     r"Age\s*[:\-]*\s*(\d{1,3})", 
    #     r"(\d{1,3})\s*(?:Years?|Yrs?|Y/O)\b",
        
    #     # Dr. Lal PathLabs specialized: "Age: 71 Years"
    #     r"Age\s*[:\-]*\s*(\d{1,3})\s*Years?",
    # ]
    # for pattern in age_patterns:
    #     match = re.search(pattern, clean_text, re.I)
    #     if match:
    #         val = int(match.group(1))
    #         if 0 < val < 120:
    #             result["age"] = val
    #             break
    age_match = re.search(r"(\d{1,3})\s*[Yy](?:ears?|rs)?(?:\s*/)?", text)
    if age_match:
        result["age"] = int(age_match.group(1))
    # ============ GENDER / SEX ============
    # Matches M/F, Male/Female, often found near Age
    # sex_patterns = [
    #     r"(?:Sex|Gender)\s*[:\-]*\s*(Male|Female|M|F)\b",
    #     r"/\s*(Male|Female|M|F)\b", # Handles 45/Male
    #     r"\b(Male|Female)\b" # Pure keyword search
    # ]
    # for pattern in sex_patterns:
    #     match = re.search(pattern, clean_text, re.I)
    #     if match:
    #         gender = match.group(1).strip().upper()
    #         result["sex"] = "Female" if gender.startswith("F") else "Male"
    #         break
    gender_match = re.search(r"(?:Gender|Sex)\s*[:\-]*\s*(Male|Female|M|F)|/\s*(Male|Female|M|F)", text, re.I)
    if gender_match:
        g = gender_match.group(1) or gender_match.group(2)
        result["sex"] = "Female" if g.strip().upper().startswith("F") else "Male"
    # ============ Lab Values - OPTIMIZED FOR MINHAJ LAB TABLE FORMAT ============
    
    # Pattern for UREA: "UREA (SERUM)  16.6 - 48.5  mg/dL  267"
    urea_patterns = [
        r"UREA\s*\(SERUM\).*?mg/dL\s+(\d+\.?\d*)",
        r"UREA\(SERUM\).*?(\d+\.?\d*)\s*(?=mg|$)",
        r"UREA.*?(\d+)\s*(?=\n|mg|CREATININE)",
    ]
    
    for pattern in urea_patterns:
        urea_match = re.search(pattern, text, re.I | re.DOTALL)
        if urea_match:
            urea_val = float(urea_match.group(1))
            if 0.1 < urea_val < 500:
                result["urea"] = round(urea_val, 2)
                logger.info(f"✅ Found Urea: {urea_val}")
                break
    # urea_match = re.search(r"UREA.*?(\d+)", text, re.I | re.DOTALL)
    # if urea_match:
    #     result["urea"] = float(urea_match.group(1))
    
    # Pattern for CREATININE: "CREATININE (SERUM)  0.5 - 1.0  mg/dL  13.0"
    creat_patterns = [
        r"CREATININE\s*\(SERUM\).*?mg/dL\s+(\d+\.?\d*)",
        r"CREATININE\(SERUM\).*?(\d+\.?\d*)\s*(?=mg|$)",
        r"CREATININE.*?(\d+\.?\d*)\s*(?=\n|mg|eGFR)",
    ]
    
    for pattern in creat_patterns:
        creat_match = re.search(pattern, text, re.I | re.DOTALL)
        if creat_match:
            creat_val = float(creat_match.group(1))
            if 0.1 < creat_val < 20:
                result["creatinine"] = round(creat_val, 2)
                logger.info(f"✅ Found Creatinine: {creat_val}")
                break
    # creat_match = re.search(r"CREATININE.*?(\d+\.\d+|\d+)", text, re.I | re.DOTALL)
    # if creat_match:
    #     result["creatinine"] = float(creat_match.group(1))
    # eGFR patterns
    egfr_patterns = [
        r"eGFR\s*\(See\s+Below\).*?mL/min/1\.73cm\s+(\d+\.?\d*)",
        r"eGFR\s*:?\s*(\d+\.?\d*)",
        r"eGFR.*?(\d+\.?\d*)\s*(?=mL|$)",
    ]
    
    for pattern in egfr_patterns:
        egfr_match = re.search(pattern, text, re.I | re.DOTALL)
        if egfr_match:
            egfr_val = float(egfr_match.group(1))
            if 0.1 < egfr_val < 200:
                result["egfr"] = round(egfr_val, 2)
                logger.info(f"✅ Found eGFR: {egfr_val}")
                break

    logger.info(f"📊 Final parsed result: {result}")
    return result

def calculate_egfr(creatinine: float, age: int, sex: str) -> Optional[float]:
    """Calculate eGFR using the CKD-EPI 2009 formula"""
    try:
        if not creatinine or not age or not sex:
            return None

        # Define constants based on Gender
        is_female = sex.lower() == "female"
        k = 0.7 if is_female else 0.9
        a = -0.329 if is_female else -0.411
        gender_factor = 1.018 if is_female else 1.0
        
        # Core Equation: 141 * min(Scr/k, 1)^a * max(Scr/k, 1)^-1.209 * 0.993^Age * GenderFactor
        scr_k_ratio = creatinine / k
        
        term1 = 141
        term2 = min(scr_k_ratio, 1) ** a
        term3 = max(scr_k_ratio, 1) ** -1.209
        term4 = 0.993 ** age
        
        egfr = term1 * term2 * term3 * term4 * gender_factor
        
        return round(egfr, 2)
    except Exception as e:
        logger.error(f"CKD-EPI Calculation Error: {e}")
        return None

def classify_ckd(egfr: Optional[float]) -> tuple:
    """Classify CKD stage based on eGFR value"""
    if egfr is None:
        return "Unknown", "Unknown - Could not determine eGFR"

    if egfr >= 90:
        return "Low", "Stage 1 (Normal)"
    elif egfr >= 60:
        return "Moderate", "Stage 2 (Mild)"
    elif egfr >= 45:
        return "High", "Stage 3a (Moderate) "
    elif egfr >= 30:
        return "High", "Stage 3b (Moderate)"
    elif egfr >= 15:
        return "High", "Stage 4 (Severe)"
    else:
        return "High", "Stage 5 (Kidney Failure) "

saved_reports: list = []

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "model_loaded": model is not None
    }
def get_ml_prediction(age, creatinine, urea):
    if model is None:
        return "Model Unavailable", "N/A"
    try:
        val_age = float(age) if age else 0.0
        val_creat = float(creatinine) if creatinine else 0.0
        val_urea = float(urea) if urea else 20.0 # Standard normal urea

        # 🔥 Match the training order: Age, BU (Urea), SC (Creatinine)
        features = np.array([[val_age, val_urea, val_creat]])

        probabilities = model.predict_proba(features)[0]
        # Agar aapka model 1 ko CKD maanta hai:
        ckd_probability = probabilities[1] 
        
        prediction_text = "CKD Likely" if ckd_probability > 0.5 else "Normal / Low Risk"
        # confidence_str = f"{round(max(probabilities) * 100, 1)}%"
        
        return prediction_text, confidence_str
    except Exception as e:
        logger.error(f"ML Inference failed: {e}")
        return "Error in Prediction", "0%"
@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(file: UploadFile = File(...)):
    """Analyze lab report and extract CKD data with ML prediction"""
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        allowed_types = {"image/jpeg", "image/png", "image/jpg", "application/pdf"}
        if file.content_type not in allowed_types:
             raise HTTPException(status_code=400, detail=f"File type {file.content_type} not supported")

        logger.info(f"🔍 Processing file: {file.filename}")
        image_bytes = await file.read()

        # Preprocess image for OCR
        processed_bytes = preprocess_image(image_bytes)

        # Extract text using AWS Textract
        full_text = ""
        if textract:
            try:
                response = textract.analyze_document(
                    Document={"Bytes": processed_bytes},
                    FeatureTypes=["TABLES", "FORMS"]
                )
                full_text = extract_all_text(response["Blocks"])
                logger.info(f"✅ Textract extracted {len(full_text)} characters")
            except Exception as e:
                logger.warning(f"⚠️ Textract failed: {e}")
                full_text = ""
        

        # Extract values
        parsed = fallback_medical_parse(full_text)
    
        # Values from OCR
        # --- 1. DATA PREPARATION ---
        creatinine = parsed["creatinine"]
        urea = parsed["urea"]
        age = parsed["age"]
        sex = parsed["sex"]
        egfr_from_report = parsed["egfr"]

        # Fix the 26.7 Decimal Issue (267 -> 26.7)
        if urea and urea > 150: urea = urea / 10
        if creatinine and creatinine > 15: creatinine = creatinine / 10

        # --- 2. THE eGFR FIX (Calculate if missing) ---
        current_egfr = egfr_from_report
        is_estimated = False

        if current_egfr is None:
            # Check if we have the "ingredients" to calculate it manually
            if all([creatinine, age, sex]):
                current_egfr = calculate_egfr(creatinine, age, sex)
                is_estimated = True
                logger.info(f"✅ eGFR manually calculated: {current_egfr}")
            else:
                logger.warning("⚠️ Cannot calculate eGFR: Missing age, sex, or creatinine")
        # Get Stage and Risk
        risk, stage = classify_ckd(current_egfr)

        # --- 3. DYNAMIC ML PREDICTION ---
     #   ml_prediction = "Insufficient Data"
      #  ml_confidence = "N/A"

        if model and all([age, creatinine]):
            try:
                # Urea agar missing hai toh default 20.0 (Normal)
                safe_urea = float(urea) if urea else 20.0
                
                # 🔥 FIX: Order must be [Age, Urea, Creatinine] 
                # Kyunki Training isi order (age, bu, sc) mein hui hai
                features = np.array([[float(age), float(safe_urea), float(creatinine)]])
                
                probs = model.predict_proba(features)[0]
                
                # ckd_model.pkl mein 0=CKD aur 1=NotCKD ho sakta hai 
                # ya vice-versa. Neeche wala logic general 'Probability' check hai:
                ckd_prob = probs[1] 
                
                ml_prediction = "CKD Detected" if ckd_prob > 0.5 else "Normal / Low Risk"
                ml_confidence = f"{round(max(probs) * 100, 1)}%"
                
            except Exception as e:
                logger.error(f"Ml Inference Error: {e}")
                ml_prediction, ml_confidence = "Error in Prediction", "N/A"
        # --- 4. RETURN EVERYTHING ---
        return {
            "patient": {
                "name": clean_person_name(parsed["name"]) or "Not Found",
                "age": age,
                "sex": sex or "N/A"
            },
            "values": {
                "creatinine_mg_dl": creatinine,
                "urea_mg_dl": urea,
                "egfr": current_egfr
            },
            "ckd": {"risk": risk, "stage": stage},
            # "mlResult": {"prediction": ml_prediction, "confidence": ml_confidence},
            "is_estimated": is_estimated
        }
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/save-report")
async def save_report(report: ReportData):
    """Save analyzed report"""
    try:
        report_dict = report.dict()
        report_dict["id"] = str(uuid.uuid4())
        report_dict["saved_at"] = datetime.utcnow().isoformat()
        
        saved_reports.append(report_dict)
        logger.info(f"✅ Report saved with ID: {report_dict['id']}")
        
        return {
            "message": "Report saved successfully",
            "report_id": report_dict["id"],
            "saved_at": report_dict["saved_at"]
        }
    except Exception as e:
        logger.error(f"Error saving report: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save report: {str(e)}")

@app.get("/reports")
async def get_reports():
    """Get all saved reports"""
    return {
        "total": len(saved_reports),
        "reports": saved_reports
    }

@app.get("/reports/{report_id}")
async def get_report(report_id: str):
    """Get specific report by ID"""
    report = next((r for r in saved_reports if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@app.delete("/reports/{report_id}")
async def delete_report(report_id: str):
    """Delete a report"""
    global saved_reports
    initial_count = len(saved_reports)
    saved_reports = [r for r in saved_reports if r["id"] != report_id]
    
    if len(saved_reports) == initial_count:
        raise HTTPException(status_code=404, detail="Report not found")
    
    logger.info(f"Report deleted: {report_id}")
    return {"message": "Report deleted successfully"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "CKD Prediction API",
        "version": "1.0.0",
        "status": "✅ Ready",
        "model_loaded": model is not None,
        "endpoints": {
            "health": "/health",
            "analyze": "POST /analyze",
            "save_report": "POST /save-report",
            "get_all_reports": "GET /reports",
            "get_report": "GET /reports/{report_id}",
            "delete_report": "DELETE /reports/{report_id}"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)