import os
import sys
import json
import requests
from dotenv import load_dotenv
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
from google import genai
from google.genai import types
from PIL import Image as PILImage
import io

load_dotenv()

def fetch_pexels_image(query):
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key:
        return "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg" # Fallback
    
    headers = {"Authorization": api_key}
    url = f"https://api.pexels.com/v1/search?query={query}&per_page=1"
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        if data.get("photos"):
            return data["photos"][0]["src"]["large2x"]
    except Exception as e:
        print(f"Pexels Error: {e}", file=sys.stderr)
    return "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"

def get_genai_client():
    """Initializes the google-genai client using Service Account."""
    try:
        # Look for service-account.json in the script's directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        service_account_path = os.path.join(script_dir, 'service-account.json')
        if os.path.exists(service_account_path):
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path
            with open(service_account_path, 'r') as f:
                service_account = json.load(f)
                project_id = service_account['project_id']
            client = genai.Client(vertexai=True, project=project_id, location='us-central1')
            return client
        else:
            # Fallback to API Key if service account is missing
            api_key = os.getenv("GOOGLE_API_KEY")
            if api_key:
                return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"GenAI Client Init Error: {e}", file=sys.stderr)
    return None

def enhance_image_prompt(image_path):
    """
    Uses Gemini 2.0 Flash to analyze the food and generate a professional prompt.
    This helps the image generation engine understand the fine details.
    """
    try:
        client = get_genai_client()
        if not client:
            return "Professional restaurant food photography, wooden background, warm lighting."
            return {"food_description": "Professional food photography", "background_material": "wood", "lighting_style": "warm", "camera_brief": "standard", "full_prompt": "Professional restaurant food photography, wooden background, warm lighting."}

        with open(image_path, "rb") as f:
            image_data = f.read()
        
        # THE PHOTOGRAPHER'S BRIEF
        # We ask Gemini to act as a professional food photographer and analyze the image
        prompt = """
        ACT AS A PROFESSIONAL FOOD PHOTOGRAPHER. 
        Analyze the attached image and generate a technical 'Photographer's Brief' for a photoshoot.
        
        1. Identify the exact food items (e.g., Ribeye steak, asparagus, mashed potatoes).
        2. Determine the best professional background material that matches this dish (e.g., Dark Slate, Rustic Oak, White Marble).
        3. Define the lighting style (e.g., Side-lit by softbox, warm candle-light, bright midday window light).
        4. Define the camera lens and angle (e.g., 85mm f/1.8 macro, 45-degree hero shot).
        
        Return the result ONLY as a JSON object with these keys:
        {
          "food_description": "short description of the dish",
          "background_material": "material name",
          "lighting_style": "lighting description",
          "camera_brief": "technical camera specs",
          "full_prompt": "A combined professional prompt for an image generator"
        }
        """
        
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[types.Content(parts=[types.Part.from_bytes(data=image_data, mime_type="image/jpeg"), types.Part.from_text(text=prompt)])]
        )
        
        # Clean the response to get valid JSON
        text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(text)
    except Exception as e:
        print(f"Prompt Enhancement Error: {e}", file=sys.stderr)
        return {"food_description": "dish", "background_material": "wood", "lighting_style": "warm", "camera_brief": "standard", "full_prompt": "Professional restaurant food photography, wooden background, warm lighting."}


def generate_composition(user_prompt):
    try:
        # 0. Initialize Vertex AI
        script_dir = os.path.dirname(os.path.abspath(__file__))
        service_account_path = os.path.join(script_dir, 'service-account.json')
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path
        with open(service_account_path, 'r') as f:
            service_account = json.load(f)
            project_id = service_account['project_id']
        
        vertexai.init(project=project_id, location='us-central1')
        model = GenerativeModel("gemini-2.0-flash")
        
        # --- STAGE 1: SCRIPT WRITER ---
        script_prompt = f"""You are a professional video scriptwriter for cinematic advertising.
USER PROMPT: {user_prompt}
TONE: luxury, high-end, cinematic
VIDEO LENGTH: 30 seconds

Write a 4-scene script. For each scene:
- Headline: 1-5 words max.
- Subtext: 5-10 words max.
- Scene Description: What the camera sees.
"""
        script_response = model.generate_content(script_prompt)
        script_text = script_response.text

        # --- STAGE 2: STORYBOARD DIRECTOR ---
        storyboard_prompt = f"""Convert this script into a storyboard JSON.
INPUT SCRIPT:
{script_text}

Return ONLY valid JSON with this schema:
{{
  "scenes": [
    {{
      "headline": "string",
      "subtext": "string",
      "scene_description": "visual description",
      "start": number,
      "duration": number
    }}
  ]
}}"""
        storyboard_response = model.generate_content(
            storyboard_prompt,
            generation_config=GenerationConfig(response_mime_type="application/json")
        )
        storyboard = json.loads(storyboard_response.text)

        # --- STAGE 3: THE CINEMATIC SCOUT ---
        for i, scene in enumerate(storyboard['scenes']):
            query_prompt = f"""Generate a high-end 3-word Pexels search query for a culinary stock photo representing: {scene['scene_description']}.
            Focus on the dish: {user_prompt}. 
            Output ONLY the query."""
            query_response = model.generate_content(query_prompt)
            scene['image_query'] = query_response.text.strip().replace('"', '').replace('Query:', '').strip()

        # --- STAGE 4: 10XFRAME INDUSTRIAL ARCHITECT (HyperFrames Certified) ---
        architect_prompt = f"""You are a 10xFrame video code architect.
        Goal: Create a ROBUST, CINEMATIC, NO-ERROR video composition.

        STORYBOARD:
        {json.dumps(storyboard)}

        HYPERFRAMES RULES (MANDATORY):
        1. Root: <div id="stage" style="background:#000; width:100%; height:100%; position:relative; overflow:hidden;">
        2. Isolation: EVERY scene MUST be a <div id="scene_{{i}}" class="scene-container" style="opacity:0; position:absolute; inset:0; width:100%; height:100%; z-index:{{i+1}};">.
        3. Assets: EVERY scene container MUST have <img class="clip" src="PLACEHOLDER_IMAGE_{{i}}" style="width:100%; height:100%; object-fit:cover; position:absolute;" />.
        4. Layout: 
           - Headline: <h1 class="video-headline" style="position:absolute; top:35%; width:100%; text-align:center; font-size:85px; z-index:20; margin:0; padding:0 60px; box-sizing:border-box;">TEXT</h1>
           - Subtext: <p class="video-subtext" style="position:absolute; top:52%; width:100%; text-align:center; font-size:32px; z-index:20; margin:0;">TEXT</p>
        5. GSAP (STRICT):
           - FIRST LINE: window.__timelines = {{ "10x-video": gsap.timeline({{ paused: true }}) }};
           - SECOND LINE: gsap.set(".scene-container", {{ opacity: 0 }});
           - For EACH scene: 
             a) At 'start': tl.to(container, {{ opacity: 1, duration: 0.5 }}, start);
             b) Ken Burns: tl.fromTo(img, {{ scale: 1 }}, {{ scale: 1.05, duration: duration, ease: "none" }}, start);
             c) Fade Out: At 'start + duration - 0.5', tl.to(container, {{ opacity: 0, duration: 0.5 }}, start + duration - 0.5). 
                IMPORTANT: DO NOT add 'Fade Out' (c) for the VERY LAST scene in the storyboard. It should stay visible.

        Output ONLY the HTML. Use 'Playfair Display' for headlines and 'Outfit' for subtext."""
        
        architect_response = model.generate_content(architect_prompt)
        final_html = architect_response.text.strip()
        if "```html" in final_html:
            final_html = final_html.split("```html")[1].split("```")[0].strip()
        elif "```" in final_html:
            final_html = final_html.split("```")[1].split("```")[0].strip()

        # --- STAGE 5: ASSET CURATOR ---
        for i, scene in enumerate(storyboard['scenes']):
            real_url = fetch_pexels_image(scene['image_query'])
            placeholder = f"PLACEHOLDER_IMAGE_{i}"
            final_html = final_html.replace(placeholder, real_url)

        return json.dumps({
            "title": "Cinematic Masterpiece",
            "totalDuration": 30,
            "html": final_html,
            "scenes": storyboard['scenes']
        })
        
    except Exception as e:
        return json.dumps({"error": str(e)})

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(generate_composition(sys.argv[1]))
