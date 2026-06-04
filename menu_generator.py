import os
import sys
import json
import base64
import time
from google import genai
from google.genai import types
from PIL import Image as PILImage
import io

def get_client():
    """Initializes the google-genai client using Service Account."""
    try:
        service_account_path = os.path.join(os.getcwd(), 'service-account.json')
        if os.path.exists(service_account_path):
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path
            with open(service_account_path, 'r') as f:
                service_account = json.load(f)
                project_id = service_account['project_id']
            # Use v1 as the model is already stable in us-east1
            return genai.Client(vertexai=True, project=project_id, location='us-east1', http_options={'api_version': 'v1'})
        else:
            api_key = os.getenv("GOOGLE_API_KEY")
            if api_key:
                return genai.Client(api_key=api_key, http_options={'api_version': 'v1'})
    except Exception as e:
        print(f"Client Init Error: {e}", file=sys.stderr)
    return None

def generate_menu_details(dish_name, category, description, brand_style):
    """
    Use Gemini 2.5 Flash to generate dynamic story text and smart health score calculated from ingredients.
    """
    client = get_client()
    if not client:
        raise Exception("Could not initialize Google GenAI client for details generation")
        
    prompt = f"""
    You are an elite Culinary Director and a lenient, restaurant-friendly Comfort Food Nutritionist.
    Analyze the following dish details:
    Dish Name: {dish_name}
    Category: {category}
    Ingredients/Description: {description}
    Brand Style Constraint: {brand_style}
    
    Tasks:
    1. Calculate a lenient, restaurant-friendly Health Score out of 10.0 based on ingredients. DO NOT BE OVERLY STRICT. Comfort foods like burgers, pizzas, and fried foods MUST score a minimum of 7.0 (e.g. 7.5, 8.2) if they are delicious. We prioritize soul fulfillment and premium quality.
    2. Provide a health label (e.g., "Excellent", "Good", "Balanced", "Indulgent", "Treat").
    3. Write a brief nutritional justification (15-20 words max) focusing on the positive aspects of the ingredients (e.g., protein in chicken, energy from carbs).
    4. Write a compelling culinary "Story" (25-35 words max) in the "{brand_style}" brand tone that makes it sound exquisite.
    5. Generate a super-detailed, professional food photography prompt for generating an image of this dish.
    
    Return ONLY a valid JSON object matching this schema:
    {{
      "health_score": number,
      "health_label": "string",
      "health_detail": "string",
      "story": "string",
      "image_prompt": "string"
    }}
    """
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.7
        )
    )
    
    cleaned_text = response.text.replace('```json', '').replace('```', '').strip()
    return json.loads(cleaned_text)

def generate_or_enhance_image(client, input_image_path, image_prompt, brand_style, primary_color, output_dir):
    """
    Generates a high-quality dish image using publishers/google/models/gemini-2.5-flash-image.
    If input_image_path is provided, it enhances it.
    If not, it generates a fresh one using a blank reference plate image.
    """
    base_image_data = None
    
    if input_image_path and os.path.exists(input_image_path):
        with open(input_image_path, "rb") as f:
            base_image_data = f.read()
    else:
        # Create a premium blank dark-slate background reference in memory using PIL
        img = PILImage.new('RGB', (800, 1000), color=(13, 13, 13))
        byte_arr = io.BytesIO()
        img.save(byte_arr, format='JPEG')
        base_image_data = byte_arr.getvalue()

    # Craft the master photographer prompt
    style_direction = "Cinematic Rim Lighting, high contrast, moody dark shadows, professional 5-star restaurant menu hero shot"
    if brand_style == "fresh":
        style_direction = "Bright diffused daylight, minimalist, fresh and airy, wooden table, natural aesthetic"
    elif brand_style == "bold":
        style_direction = "Vibrant fiery lighting, high saturation, dark granite table with scattered premium spices"

    final_prompt = f"""
    ACT AS A WORLD-CLASS COMMERCIAL FOOD PHOTOGRAPHER.
    Subject: {image_prompt}
    
    MANDATORY RULES:
    1. STYLE: {style_direction}.
    2. COMPOSITION: Top-down or beautiful 45-degree angle closeup focusing on textures (steam, crispy edges, glistening details).
    3. BACKGROUND: Premium, luxurious dining table surface (matching the style direction above).
    4. NO cutlery or messy elements.
    5. Clean, breathtaking visual suitable for a high-end luxury menu.
    
    Generate ONLY the final professional food image.
    """
    
    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            response = client.models.generate_content(
                model="publishers/google/models/gemini-2.5-flash-image",
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_bytes(data=base_image_data, mime_type="image/jpeg"),
                            types.Part.from_text(text=final_prompt)
                        ]
                    )
                ],
                config=types.GenerateContentConfig(temperature=0.4)
            )
            
            generated_image_bytes = None
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    generated_image_bytes = part.inline_data.data
                    break
            
            if generated_image_bytes:
                filename = f"menu_dish_{int(time.time())}.jpg"
                os.makedirs(output_dir, exist_ok=True)
                output_path = os.path.join(output_dir, filename)
                with open(output_path, "wb") as f:
                    f.write(generated_image_bytes)
                return f"/assets/processed/{filename}"
            
        except Exception as e:
            if "429" in str(e) and attempt < max_retries:
                time.sleep(5)
            else:
                raise e
                
    return None

def main():
    try:
        if len(sys.argv) < 5:
            print(json.dumps({"success": False, "error": "Insufficient arguments"}))
            return
            
        dish_name = sys.argv[1]
        category = sys.argv[2]
        description = sys.argv[3]
        brand_style = sys.argv[4]
        primary_color = sys.argv[5] if len(sys.argv) > 5 else "#D4121A"
        input_image = sys.argv[6] if len(sys.argv) > 6 and sys.argv[6] != "null" else None
        
        # 1. Generate text details & smart health score using Gemini 2.5 Flash
        details = generate_menu_details(dish_name, category, description, brand_style)
        
        # 2. Initialize client for image generation
        client = get_client()
        
        # 3. Generate/Enhance image using Gemini 2.5 Flash Image
        output_dir = path_dir = path_dir = os.path.join(os.getcwd(), 'public', 'assets', 'processed')
        image_url = None
        
        if input_image:
            try:
                image_url = generate_or_enhance_image(
                    client, 
                    input_image, 
                    details.get("image_prompt", f"A professional commercial food photo of {dish_name}"),
                    brand_style,
                    primary_color,
                    output_dir
                )
            except Exception as img_err:
                print(f"Image Gen Error (falling back): {img_err}", file=sys.stderr)
            
        result = {
            "success": True,
            "dish_name": dish_name,
            "category": category,
            "story": details.get("story", ""),
            "health_score": details.get("health_score", 7.0),
            "health_label": details.get("health_label", "Moderate"),
            "health_detail": details.get("health_detail", ""),
            "image_url": image_url
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
