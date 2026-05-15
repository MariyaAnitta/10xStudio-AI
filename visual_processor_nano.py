import os
import sys
import json
import base64
from google import genai
from google.genai import types
from PIL import Image as PILImage
import io


def get_client():
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
            # Use v1 as the model is already stable in us-east1
            return genai.Client(vertexai=True, project=project_id, location='us-central1', http_options={'api_version': 'v1'})
        else:
            api_key = os.getenv("GOOGLE_API_KEY")
            if api_key:
                return genai.Client(api_key=api_key, http_options={'api_version': 'v1'})
    except Exception as e:
        print(f"Client Init Error: {e}", file=sys.stderr)
    return None

import time

def process_image(input_path, output_dir):
    """
    ULTRA-PREMIUM RESTAURANT MENU PIPELINE:
    Generates 3 professional styles: Dark Slate, Rustic Wood, and Modern Marble.
    """
    try:
        print(f"🚀 Starting Professional Restaurant Enhancement for {input_path}...", file=sys.stderr)
        
        client = get_client()
        if not client:
            raise Exception("Could not initialize Google GenAI client")
        
        with open(input_path, "rb") as f:
            image_data = f.read()

        # Styles definition
        styles = [
            {
                "id": "slate_hero",
                "bg": "Matte Black Slate with scattered sea salt and cracked pepper",
                "lighting": "Cinematic Rim Lighting, high contrast, moody shadows",
                "description": "Dramatic and sophisticated"
            },
            {
                "id": "rustic_warmth",
                "bg": "Aged Rustic Oak table with a soft linen napkin corner",
                "lighting": "Golden Hour side-light, warm and inviting, soft bokeh",
                "description": "Home-style luxury and warmth"
            },
            {
                "id": "modern_minimal",
                "bg": "White Carrara Marble with a clean, bright background",
                "lighting": "Bright diffused daylight, minimalist, fresh and airy",
                "description": "Clean and contemporary"
            }
        ]

        results = []
        os.makedirs(output_dir, exist_ok=True)

        for style in styles:
            # Add a small delay between styles to avoid 429 Rate Limits
            if results:
                print("⏳ Cooling down for 2s to prevent rate limits...", file=sys.stderr)
                time.sleep(2)

            print(f"🎨 Generating Style: {style['id']}...", file=sys.stderr)
            
            # Simple retry logic
            max_retries = 2
            for attempt in range(max_retries + 1):
                try:
                    prompt = f"""
                    ACT AS A WORLD-CLASS COMMERCIAL FOOD PHOTOGRAPHER.
                    Task: Transform this amateur photo into a professional 5-star restaurant menu hero shot.

                    STYLE DIRECTION: {style['description']}
                    
                    MANDATORY RULES:
                    1. GROUND TRUTH: Maintain 100% pixel-perfect identity of the main dish (the food on the plate). Do NOT change the ingredients, plate shape, or food arrangement.
                    2. BACKGROUND CLEANUP: COMPLETELY REMOVE any distracting elements from the original photo such as:
                       - Unwanted cutlery (spoons, forks, knives) unless they are professionally styled.
                       - Messy napkins, cluttered kitchen backgrounds, or home-style furniture.
                       - Any text, logos, or watermarks.
                    3. ENVIRONMENT: Place the plate on a {style['bg']}.
                    4. LIGHTING: Apply {style['lighting']}. Focus on highlighting textures (crispy edges, moist surfaces, steam).
                    5. LENS: Use an '85mm f/1.2 Macro' effect for professional shallow depth-of-field.
                    6. POLISH: Enhance colors to be vibrant and appetising. The food must look "freshly served" with a light glisten.

                    Generate ONLY the final professional image.
                    """

                    response = client.models.generate_content(
                        model="publishers/google/models/gemini-2.5-flash-image",
                        contents=[
                            types.Content(
                                role="user",
                                parts=[
                                    types.Part.from_bytes(data=image_data, mime_type="image/jpeg"),
                                    types.Part.from_text(text=prompt)
                                ]
                            )
                        ],
                        config=types.GenerateContentConfig(temperature=0.4)
                    )
                    
                    generated_image = None
                    for part in response.candidates[0].content.parts:
                        if part.inline_data:
                            generated_image = part.inline_data.data
                            break

                    if generated_image:
                        base_name = os.path.basename(input_path)
                        filename = f"pro_{style['id']}_{base_name}"
                        output_path = os.path.join(output_dir, filename)
                        
                        with open(output_path, "wb") as f:
                            f.write(generated_image)
                        
                        results.append({
                            "style": style['id'],
                            "filename": filename,
                            "output_path": output_path
                        })
                        break # Success, exit retry loop
                    
                except Exception as e:
                    if "429" in str(e) and attempt < max_retries:
                        print(f"⚠️ Rate limited (429). Retrying in 5s (Attempt {attempt+1}/{max_retries})...", file=sys.stderr)
                        time.sleep(5)
                    else:
                        raise e

        if not results:
            raise Exception("No images were generated.")

        print(json.dumps({
            "success": True,
            "results": results,
            "method": "Gemini 2.5 Flash Image Pro Pipeline"
        }))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        process_image(sys.argv[1], sys.argv[2])
