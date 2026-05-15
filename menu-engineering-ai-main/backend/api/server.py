from fastapi import FastAPI, UploadFile, File, Request, Form
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from configs.settings import DEV_MODE
from workflows.menu_workflow import generate_menu
from workflows.menu_engineering_workflow import process_menu_engineering_file

from agents.cuisine_agent import suggest_dishes
from rag.pipelines.rag_pipeline import run_rag
from configs.gemini_client import gemini_client
from database.firestore_client import db
from services.storage_service import upload_image_to_supabase

import time
import pandas as pd
from io import BytesIO
import subprocess
import json
import os
import sys
import traceback


app = FastAPI()

print("SERVER FILE LOADED:", __file__)
# -------------------------------
# Enable CORS (for Next.js frontend)
# -------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"GLOBAL ERROR CAUGHT: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "details": str(exc)},
    )


# -------------------------------
# Static images for menu
# -------------------------------

@app.on_event("startup")
async def startup_event():
    os.makedirs("localimages", exist_ok=True)
    os.makedirs("localvideos", exist_ok=True)

app.mount("/images", StaticFiles(directory="localimages"), name="images")
app.mount("/videos", StaticFiles(directory="localvideos"), name="videos")


# -------------------------------
# Request model for dish suggestion
# -------------------------------

class RestaurantRequest(BaseModel):
    restaurantName: str
    details: str
    cuisine: str


# -------------------------------
# Endpoint: Suggest 20 dishes
# -------------------------------

@app.post("/suggest-dishes")
def get_dishes(data: RestaurantRequest):
    print(f"DEBUG: Received suggest-dishes request for {data.cuisine}")

    # simulate AI processing delay in DEV mode
    if DEV_MODE:
        print("DEV MODE: Simulating dish recommendation generation...")
        # time.sleep(10) # Removed for faster testing

    if DEV_MODE:
        dishes = [
            "Harees",
            "Machboos",
            "Thareed",
            "Luqaimat",
            "Khameer",
            "Balaleet",
            "Aseeda",
            "Madrouba",
            "Ghuzi",
            "Saloona",
            "Markouka",
            "Batheeth",
            "Khubz Jabab",
            "Khubz Regag",
            "Farni",
            "Samak Mashwi",
            "Shuwaa",
            "Khabeesa",
            "Mhammar",
            "Jasheed"
        ]
    else:
        dishes = suggest_dishes(data.cuisine)

    return {
        "dishes": dishes
    }


# -------------------------------
# Request model for final menu
# -------------------------------

class MenuRequest(BaseModel):
    dishes: list[str]


# -------------------------------
# Endpoint: Generate final menu
# -------------------------------

@app.post("/generate-menu")
def generate_menu_api(data: MenuRequest):
    print(f"DEBUG: Received generate-menu request with {len(data.dishes)} dishes")

    dishes = data.dishes

    if len(dishes) != 10:
        return {
            "error": "Exactly 10 dishes required"
        }

    result = generate_menu(dishes)

    return {
        "menu": result
    }


# -------------------------------
# RAG Request model
# -------------------------------

class RagRequest(BaseModel):
    question: str


# -------------------------------
# Endpoint: RAG Chat
# -------------------------------

@app.post("/ask-rag")
def ask_rag(data: RagRequest):

    question = data.question

    prompt = f"""
You are a senior restaurant AI consultant named Neo.

Answer the user's question with practical, actionable advice.

Focus on:
- menu engineering
- pricing strategy
- cost control
- profitability
- customer behavior
- upselling and promotions


Rules:
- Do NOT use markdown formatting
- Do NOT use *, ** , any special characters .
- Use plain text only
- Keep answers clean and professional

Be concise, structured, and business-focused.Keep the response short and clear. Do not over-explain unless the user requests.
Be friendly and polite . Maintain the conversation flow as an expert assistant.

Question:
{question}
"""

    response = gemini_client.models.generate_content(
        model="gemini-1.5-flash",
        contents=prompt
    )

    return {
        "answer": response.text
    }
# -------------------------------
# Endpoint: Menu Engineering Upload
# -------------------------------

@app.post("/analyze-menu-engineering")
async def analyze_menu_engineering(
    file: UploadFile = File(...)
):
    """
    Upload Excel file
    → Validate structure
    → Run full menu engineering workflow
    → Generate Gemini AI insights
    → Return executive dashboard JSON
    """

    # -----------------------------------
    # Validate file type
    # -----------------------------------

    if not file.filename.endswith(".xlsx"):
        return {
            "status": "error",
            "message": "Only .xlsx files are supported"
        }

    try:
        # -----------------------------------
        # Read uploaded Excel file
        # -----------------------------------

        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))

        # -----------------------------------
        # Required columns validation
        # -----------------------------------

        required_columns = [
            "Menu Item Name",
            "Number Sold",
            "Item Cost",
            "Item Price"
        ]

        missing_columns = [
            col for col in required_columns
            if col not in df.columns
        ]

        if missing_columns:
            return {
                "status": "error",
                "message": f"Missing required columns: {', '.join(missing_columns)}"
            }

        # -----------------------------------
        # Save temporary file
        # because workflow expects file_path
        # -----------------------------------

        temp_file_path = f"temp_{file.filename}"

        df.to_excel(temp_file_path, index=False)

        # -----------------------------------
        # Run full workflow
        # IMPORTANT:
        # correct function name
        # -----------------------------------

        dashboard_response = process_menu_engineering_file(
            temp_file_path
        )

        # Save to Firestore for persistence
        try:
            db.collection("menu_analyses").add({
                "timestamp": time.time(),
                "filename": file.filename,
                "data": dashboard_response
            })
        except Exception as fe:
            print(f"Firestore Save Error: {fe}")

        return dashboard_response

    except Exception as e:
        print("MENU ENGINEERING ERROR:", str(e))

        return {
            "status": "error",
            "message": str(e)
        }

# -------------------------------
# Endpoint: Visual Creation Layer
# -------------------------------
@app.post("/process-visual-creation")
async def process_visual_creation(
    file: UploadFile = File(...),
    dish_name: str = Form(...)
):
    """
    Generate 3 professional styles for the dish image.
    """
    os.makedirs("localimages", exist_ok=True)
    
    # Save original
    original_path = f"localimages/original_{file.filename}"
    with open(original_path, "wb") as f:
        f.write(await file.read())
        
    output_dir = "localimages"
    
    # Call the Python script
    # Path is relative to the workspace root if run from backend
    script_path = os.path.abspath("../../visual_processor_nano.py")
    
    try:
        print(f"DEBUG: Running Visual Processor for {dish_name}...")
        result = subprocess.run(
            [sys.executable, script_path, os.path.abspath(original_path), os.path.abspath(output_dir)],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print("VISUAL PROCESSOR ERROR (CODE != 0):", result.stderr)
            return {"status": "error", "message": result.stderr}
            
        print("VISUAL PROCESSOR SUCCESS")
        local_result = json.loads(result.stdout)
        print(f"DEBUG: Local AI Results: {local_result}")
        
        # Upload results to Supabase Cloud
        cloud_results_list = []
        
        # Upload original
        original_url = upload_image_to_supabase(original_path, f"originals/{os.path.basename(original_path)}") or ""
        
        # Upload styles and build results list for frontend
        # The script returns a 'results' list: [{"style": "...", "filename": "...", "output_path": "..."}]
        ai_results = local_result.get("results", [])
        if not ai_results:
            print("WARNING: No results found in AI output!")
            
        for res in ai_results:
            style_name = res.get("style")
            local_filename = res.get("filename")
            # The script provides the output_path relative to current dir
            full_local_path = os.path.join(os.getcwd(), "localimages", local_filename)
            
            print(f"DEBUG: Uploading {style_name} from {full_local_path}")
            
            cloud_url = upload_image_to_supabase(full_local_path, f"generated/{local_filename}") or ""
            
            # FALLBACK: If cloud_url is empty, use the local path as a backup
            final_url = cloud_url if cloud_url else f"http://127.0.0.1:8000/images/{local_filename}"
            
            cloud_results_list.append({
                "style": style_name,
                "filename": local_filename,
                "cloud_url": final_url
            })
            
        print(f"DEBUG: Sending {len(cloud_results_list)} results to frontend.")
        return {
            "success": True, 
            "results": cloud_results_list,
            "original_url": original_url
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

# -------------------------------
# Endpoint: Visual Intelligence Layer
# -------------------------------

@app.post("/analyze-visual-intelligence")
async def analyze_visual_intelligence_api(
    file: Optional[UploadFile] = File(None),
    dish_name: str = Form(...),
    orders: float = Form(...),
    margin: float = Form(...),
    views: float = Form(...),
    revenue: str = Form(...),
    rating: float = Form(...),
    avg_orders: float = Form(...),
    avg_views: float = Form(...),
    image_url: Optional[str] = Form(None)
):
    """
    Perform visual quality audit cross-referenced with business data.
    """
    os.makedirs("localimages", exist_ok=True)
    
    image_path = None
    
    if file:
        # Save uploaded image
        image_path = f"localimages/audit_{file.filename}"
        with open(image_path, "wb") as f:
            f.write(await file.read())
    elif image_url:
        # Check if it's a local proxy URL or a Cloud URL
        if "localhost:8000/images/" in image_url or "127.0.0.1:8000/images/" in image_url:
            filename = image_url.split("/")[-1]
            image_path = os.path.join("localimages", filename)
        else:
            # It's a Cloud URL (Supabase). We need to download it for the AI script to read.
            try:
                import requests
                response = requests.get(image_url, stream=True)
                if response.status_code == 200:
                    image_path = f"localimages/cloud_audit_{int(time.time())}.png"
                    with open(image_path, "wb") as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                else:
                    return {"status": "error", "message": f"Failed to download cloud image: {response.status_code}"}
            except Exception as re:
                return {"status": "error", "message": f"Error downloading image: {re}"}
    
    if not image_path or not os.path.exists(image_path):
        return {"status": "error", "message": "No image found for analysis"}
        
    script_path = os.path.abspath("../../visual_intelligence.py")
    
    try:
        print(f"DEBUG: Running Visual Intelligence for {dish_name}...")
        result = subprocess.run(
            [
                sys.executable, script_path, 
                os.path.abspath(image_path), 
                dish_name, 
                str(orders), 
                str(margin), 
                str(views), 
                revenue, 
                str(rating), 
                str(avg_orders), 
                str(avg_views)
            ],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print("VISUAL INTELLIGENCE ERROR (CODE != 0):", result.stderr)
            return {"status": "error", "message": result.stderr}
            
        print("VISUAL INTELLIGENCE SUCCESS")
        audit_result = json.loads(result.stdout)
        
        # Save Audit to Firestore
        try:
            db.collection("visual_audits").document(dish_name).set({
                "timestamp": time.time(),
                "dish_name": dish_name,
                "business_data": {
                    "orders": orders,
                    "margin": margin,
                    "views": views,
                    "revenue": revenue,
                    "rating": rating
                },
                "audit_results": audit_result
            }, merge=True)
        except Exception as fe:
            print(f"Firestore Audit Save Error: {fe}")
            
        return audit_result
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/get-dish-audit/{dish_name}")
async def get_dish_audit(dish_name: str):
    """
    Retrieve existing visual audit and image data for a specific dish.
    """
    try:
        doc = db.collection("visual_audits").document(dish_name).get()
        if doc.exists:
            return doc.to_dict()
        else:
            return {"status": "not_found", "message": "No audit found for this dish"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/save-dish-visual")
async def save_dish_visual(
    dish_name: str = Form(...),
    image_url: str = Form(...)
):
    """
    Saves the user's selected 'Winner' photo for a dish in Firestore.
    """
    try:
        db.collection("visual_audits").document(dish_name).set({
            "dish_name": dish_name,
            "selected_image_url": image_url,
            "updated_at": time.time()
        }, merge=True)
        return {"status": "success", "message": "Visual selection saved to cloud"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# -------------------------------
# Endpoint: Video Generation Layer
# -------------------------------
@app.post("/generate-video")
async def generate_video_api(
    prompt: str = Form(...)
):
    """
    Generate a cinematic video composition using Gemini Bridge.
    """
    script_path = os.path.abspath("../../gemini_bridge.py")
    
    try:
        print(f"DEBUG: Running Video Generation for: {prompt}...")
        result = subprocess.run(
            [sys.executable, script_path, prompt],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print("VIDEO GENERATION ERROR (CODE != 0):", result.stderr)
            return {"status": "error", "message": result.stderr}
            
        print("VIDEO GENERATION SUCCESS")
        
        # Strip any extra text before/after JSON (common with Vertex AI logs)
        output = result.stdout.strip()
        if "{" in output:
            output = output[output.find("{"):output.rfind("}")+1]
            
        return json.loads(output)
        
    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@app.post("/export-mp4")
async def export_mp4_api(
    html: str = Form(...),
    duration: int = Form(30)
):
    """
    Export the cinematic HTML to an MP4 file.
    """
    os.makedirs("localvideos", exist_ok=True)
    
    # Save HTML to temp file for renderer
    temp_html_path = "temp_render/input.html"
    os.makedirs("temp_render", exist_ok=True)
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html)
        
    output_filename = f"video_{int(time.time())}.mp4"
    output_path = os.path.abspath(f"localvideos/{output_filename}")
    
    script_path = os.path.abspath("../../video_renderer.py")
    
    try:
        print(f"DEBUG: Rendering MP4 (Duration: {duration}s)...")
        result = subprocess.run(
            [sys.executable, script_path, os.path.abspath(temp_html_path), output_path, str(duration)],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print("MP4 RENDER ERROR (CODE != 0):", result.stderr)
            return {"status": "error", "message": result.stderr}
            
        print("MP4 RENDER SUCCESS")
        return json.loads(result.stdout)
        
    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

# -------------------------------
# Health check
# -------------------------------

@app.get("/")
def home():
    return {
        "status": "Menu AI Backend Running"
    }