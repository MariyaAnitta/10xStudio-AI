import os
import sys
import json
import time
import io
from google import genai
from google.genai import types
from PIL import Image as PILImage

def get_client():
    """Initializes the google-genai client."""
    try:
        service_account_path = os.path.join(os.getcwd(), 'service-account.json')
        if os.path.exists(service_account_path):
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path
            with open(service_account_path, 'r') as f:
                service_account = json.load(f)
                project_id = service_account['project_id']
            return genai.Client(vertexai=True, project=project_id, location='us-east1', http_options={'api_version': 'v1'})
        else:
            api_key = os.getenv("GOOGLE_API_KEY")
            if api_key:
                return genai.Client(api_key=api_key, http_options={'api_version': 'v1'})
    except Exception as e:
        print(f"Client Init Error: {e}", file=sys.stderr)
    return None

def generate_campaign_caption(client, dish_name, campaign_type, brand_style, tone, description, price):
    """
    Use Gemini 2.5 Flash to generate a professional caption and hashtags.
    """
    prompt = f"""
    You are a world-class Social Media Copywriter and Creative Director for a high-end gourmet restaurant brand.
    
    Task: Write an incredibly compelling, high-converting social media caption for a digital campaign.
    
    Inputs:
    Dish Name: {dish_name}
    Description: {description}
    Price: {price}
    Campaign Type: {campaign_type}
    Brand Style Constraint: {brand_style}
    Tone of Voice: {tone}
    
    Guidelines:
    1. STYLE & TONE: Write a captivating caption that perfectly embodies the '{tone}' tone (e.g. if 'Casual' use conversational, energetic, friendly words; if 'Professional' use premium, sophisticated, elegant language; if 'Witty' use clever puns, smart humor, hooky statements) and complies with the '{brand_style}' style.
    2. CONTEXT: Align the copy directly with the '{campaign_type}'. If it is a 'Combo offer', highlight the pairing value, taste synergy, and price advantage. If a 'Festival' or 'Seasonal', weave in the warm, celebratory atmosphere.
    3. LENGTH: 40-70 words maximum. Every word should make the customer's mouth water.
    4. HASHTAGS: Provide exactly 6 premium, trending, and highly specific social media hashtags.
       - NEVER use generic tags like #Food, #Restaurant, #FoodDelivery, or truncated tags like #FoodDeliver.
       - DO generate creative tags tailored to the specific dish name (e.g., #TenderButterChicken, #TandooriNaanLove), the gourmet nature of the cuisine (e.g., #ModernIndianDining), the campaign/offer (e.g., #WeekendFeast, #ComboDelight, #FestiveFlavors), and culinary lifestyle.
    
    Return ONLY a valid JSON object matching this schema:
    {{
      "caption": "string",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6"]
    }}
    """
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.85
        )
    )
    
    cleaned_text = response.text.replace('```json', '').replace('```', '').strip()
    return json.loads(cleaned_text)

def generate_campaign_image(client, dish_name, campaign_type, brand_style, output_dir):
    """
    Generates a high-quality master campaign image using Gemini 2.5 Flash Image.
    """
    
    # Base prompt rules
    base_prompt = f"""
    ACT AS A WORLD-CLASS COMMERCIAL FOOD PHOTOGRAPHER AND AD DESIGNER.
    Subject: {dish_name}
    Brand Style Constraint: {brand_style}
    
    MANDATORY RULES:
    1. Focus heavily on making the dish look unbelievably delicious, mouth-watering, and premium.
    2. Professional studio lighting, rich vibrant colors, 8k resolution detail.
    3. Generate ONLY the final photograph (NO text, NO overlays).
    """

    # Customize composition based on campaign type so it perfectly fits our CSS templates
    composition_prompt = ""
    
    if campaign_type == "Festival" or campaign_type == "Seasonal":
        composition_prompt = "COMPOSITION: A highly elegant, dark and moody top-down or slight-angle shot. The dish must be perfectly centered. Leave a large amount of dark, empty negative space at the top and bottom of the image for text. Use elegant subtle glowing elements in the background."
    elif campaign_type == "Combo offer":
        composition_prompt = "COMPOSITION: A split or wide-angle layout showing the main dish paired perfectly with sides. Use a vibrant dual-tone background or a clean surface. Leave prominent negative space on the left or bottom for promotional text blocks."
    elif campaign_type == "Flash sale":
        composition_prompt = "COMPOSITION: A highly energetic, punchy close-up of the dish on a solid, vivid background. Create a structural, magazine-style layout by keeping the subject in the lower-right or center, leaving massive solid-color negative space on the top and left for giant typography."
    else:
        # Dish promo, New launch, etc
        composition_prompt = "COMPOSITION: A sizzling, bright, and vibrant close-up shot. The background should be colorful and light, making the dish pop out dramatically. Leave ample negative space all around the dish for overlapping text layers."

    final_prompt = base_prompt + "\n" + composition_prompt
    
    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            response = client.models.generate_content(
                model="publishers/google/models/gemini-2.5-flash-image",
                contents=[
                    types.Content(
                        role="user",
                        parts=[
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
                filename = f"campaign_{int(time.time())}.jpg"
                os.makedirs(output_dir, exist_ok=True)
                output_path = os.path.join(output_dir, filename)
                with open(output_path, "wb") as f:
                    f.write(generated_image_bytes)
                return f"/assets/processed/{filename}"
            
        except Exception as e:
            if "429" in str(e) and attempt < max_retries:
                time.sleep(5)
            else:
                print(f"Image Gen Error: {e}", file=sys.stderr)
                return None
                
    return None

def main():
    try:
        if len(sys.argv) < 6:
            print(json.dumps({"success": False, "error": "Insufficient arguments."}))
            return
            
        dish_name = sys.argv[1]
        campaign_type = sys.argv[2]
        brand_style = sys.argv[3]
        tone = sys.argv[4]
        description = sys.argv[5] if len(sys.argv) > 5 else ""
        price = sys.argv[6] if len(sys.argv) > 6 else ""
        input_image = sys.argv[7] if len(sys.argv) > 7 and sys.argv[7] != "null" else None
        mode = sys.argv[8] if len(sys.argv) > 8 else "all"
        
        client = get_client()
        if not client:
            raise Exception("Failed to init AI client")

        result = {
            "success": True,
            "dish_name": dish_name,
            "campaign_type": campaign_type,
        }

        # 1. Generate text details if not in images-only mode
        if mode in ["all", "text"]:
            details = generate_campaign_caption(client, dish_name, campaign_type, brand_style, tone, description, price)
            result["caption"] = details.get("caption", "")
            result["hashtags"] = details.get("hashtags", [])
        
        # 2. Generate Master Campaign Image if not in text-only mode
        if mode in ["all", "images"]:
            output_dir = os.path.join(os.getcwd(), 'public', 'assets', 'processed')
            master_image_url = generate_campaign_image(client, dish_name, campaign_type, brand_style, output_dir)
            
            images = []
            if master_image_url:
                images = [
                    {"format": "ig_post", "url": master_image_url},
                    {"format": "ig_story", "url": master_image_url},
                    {"format": "wa_banner", "url": master_image_url},
                    {"format": "reel_thumb", "url": master_image_url}
                ]
            result["images"] = images
            
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
