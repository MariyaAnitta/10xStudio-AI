import os
import sys
import json
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
from google import genai
from google.genai import types
from PIL import Image as PILImage
import io

def get_genai_client():
    """Initializes the google-genai client using Vertex AI or API Key."""
    try:
        service_account_path = os.path.join(os.getcwd(), 'service-account.json')
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
            model="gemini-2.5-flash",
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
        service_account_path = os.path.join(os.getcwd(), 'service-account.json')
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path
        with open(service_account_path, 'r') as f:
            service_account = json.load(f)
            project_id = service_account['project_id']
        
        vertexai.init(project=project_id, location='us-central1')
        model = GenerativeModel("gemini-2.5-flash")
        
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
        for scene in storyboard['scenes']:
            query_prompt = f"""Generate a 4-word Pexels search query for this scene: {scene['scene_description']}.
            CONTEXT: {user_prompt}
            RULE: You MUST include at least one core noun from the CONTEXT (e.g. if context is 'Seafood', include 'seafood' or 'lobster'). 
            Output ONLY the 4 words."""
            query_response = model.generate_content(query_prompt)
            scene['image_query'] = query_response.text.strip().replace('"', '')

        # --- STAGE 4: 10XFRAME INDUSTRIAL ARCHITECT (HyperFrames Certified) ---
        architect_prompt = f"""You are a 10xFrame video code architect.
        Goal: Create a ROBUST, CINEMATIC, NO-ERROR video composition.

        STORYBOARD:
        {json.dumps(storyboard)}

        HYPERFRAMES RULES (MANDATORY):
        1. Root: <div id="stage" data-composition-id="10x-video" style="background:#000; width:100%; height:100%;">
        2. Isolation: EVERY scene (including the Outro) MUST be a <div class="scene-container" data-start="S" data-duration="D" style="opacity:0; position:absolute; inset:0; width:100%; height:100%;">.
        3. Assets: EVERY scene container MUST have <img class="clip" src="PLACEHOLDER_IMAGE_N" style="width:100%; height:100%; object-fit:cover; position:absolute;" />.
        4. Layout: 
           - Headline: <h1 class="video-headline" style="position:absolute; top:35%; width:100%; text-align:center; font-size:80px; z-index:10;">TEXT</h1>
           - Subtext: <p class="video-subtext" style="position:absolute; top:50%; width:100%; text-align:center; font-size:30px; z-index:10;">TEXT</p>
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
