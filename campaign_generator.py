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
    Each campaign type has a unique, highly engineered prompt for outstanding visuals.
    """

    STYLE_MAP = {
        'luxury': 'ultra-premium, dark and moody lighting, deep jewel tones, cinematic depth of field, editorial magazine quality',
        'casual': 'bright, warm, and inviting lighting, vibrant saturated colors, fun and energetic, lifestyle feel',
        'minimal': 'clean white negative space, soft diffused lighting, muted neutral tones, Scandinavian minimalist aesthetic',
        'bold': 'high-contrast punchy colors, dramatic direct lighting, strong shadows, sports/streetwear energy',
    }
    style_descriptor = STYLE_MAP.get(brand_style.lower(), 'professional commercial food photography quality')

    if campaign_type in ["Festival", "Seasonal"]:
        final_prompt = f"""
        ROLE: World-class commercial food photographer and festival poster director.
        
        SUBJECT: {dish_name}
        VISUAL STYLE: {style_descriptor}
        
        CREATE A STUNNING FESTIVAL/CELEBRATION CAMPAIGN IMAGE:
        
        COMPOSITION & LAYOUT (CRITICAL):
        - Place the dish as the centerpiece, shot from a slight overhead angle (45 degrees).
        - Surround the dish with elegant, thematic festive elements: candles, marigold petals, golden sparkles, moody bokeh lights in the background.
        - The top 30% of the frame must be deep, dark empty space (for large text overlay).
        - The bottom 25% must also be a dark, clean gradient fade to black (for price/CTA text).
        - Use warm amber and gold color grading to evoke celebration.
        
        TECHNICAL SPECS:
        - 9:16 vertical portrait orientation (Instagram Story / Reel Thumbnail format).
        - 8K ultra-sharp detail on the food.
        - Rich vignette darkening around all 4 edges.
        - Render ONLY the photograph. Absolutely NO text, watermarks, or overlays.
        """

    elif campaign_type == "Combo offer":
        final_prompt = f"""
        ROLE: World-class commercial food photographer specializing in combo deal advertising.
        
        SUBJECT: {dish_name} combo meal
        VISUAL STYLE: {style_descriptor}
        
        CREATE A STUNNING COMBO DEAL CAMPAIGN IMAGE:
        
        COMPOSITION & LAYOUT (CRITICAL):
        - Use a wide, slightly overhead shot that shows 2-3 food items beautifully arranged together.
        - The main dish on the right side, complementary items (fries, drink, sides) artistically placed on the left.
        - Shoot on a premium dark wooden surface or dark stone surface with warm hero lighting from the top-left.
        - The LEFT 45% of the frame must have dark, rich background with significant empty space for text.
        - Items should be steaming, fresh, glistening with sauce, photographed at peak deliciousness.
        - Include subtle depth of field, front items in sharp focus, background slightly blurred.
        
        TECHNICAL SPECS:
        - 1:1 square or slightly wide format.
        - Ultra vibrant food colors that pop off the dark background.
        - NO text, NO price tags, NO watermarks. ONLY the food photograph.
        """

    elif campaign_type == "Flash sale":
        final_prompt = f"""
        ROLE: World-class advertising photographer specializing in high-energy Flash Sale campaigns.
        
        SUBJECT: {dish_name}
        VISUAL STYLE: Bold, punchy, high-energy. {style_descriptor}
        
        CREATE AN ULTRA-ENERGETIC FLASH SALE CAMPAIGN IMAGE:
        
        COMPOSITION & LAYOUT (CRITICAL):
        - The dish must be HERO-shot from a dramatic low-angle (eye level or below), making it look enormous and irresistible.
        - Place the food in the RIGHT half or CENTER-RIGHT of the frame.
        - The LEFT 40% must be a clean, bold solid-color background (matching the food's complementary color) — this is the text zone.
        - The food must be touching or slightly breaking the border between the solid color and background, creating a dynamic split-composition.
        - Lighting must be dramatic: strong overhead key light, creating rich shadows and glowing highlights on the food.
        - The food should look EXPLOSIVE — sesame seeds scattered, sauce dripping, cheese pull, steam rising.
        
        TECHNICAL SPECS:
        - 1:1 or 4:5 format.
        - Maximum saturation and contrast.
        - NO text, NO price tags, NO watermarks. ONLY the food photograph.
        """

    elif campaign_type == "New launch":
        final_prompt = f"""
        ROLE: World-class brand launch photographer and art director.
        
        SUBJECT: {dish_name} — new product reveal
        VISUAL STYLE: Premium, aspirational, debut-worthy. {style_descriptor}
        
        CREATE A STUNNING NEW LAUNCH REVEAL IMAGE:
        
        COMPOSITION & LAYOUT (CRITICAL):
        - Photograph the dish as if it is a luxury product being unveiled — centered, perfectly lit, hero shot.
        - Use a clean, pure black OR deep midnight blue background with a dramatic single overhead light creating a spotlight effect.
        - The dish should be elevated (on a dark slate board, premium plate, or reflective surface).
        - Create a subtle glowing halo effect around the dish using backlit steam or bokeh.
        - Leave a significant top section (30%) and bottom section (25%) of pure dark space for text overlays.
        - Every garnish, sauce drizzle, and texture must be picture perfect — this is a debut.
        
        TECHNICAL SPECS:
        - 9:16 vertical portrait format preferred.
        - Studio-quality lighting, deep blacks, rich highlights.
        - NO text, NO price tags, NO watermarks. ONLY the photograph.
        """

    else:
        # Dish promo (default)
        final_prompt = f"""
        ROLE: World-class commercial food photographer creating a viral social media promotional poster.
        
        SUBJECT: {dish_name}
        VISUAL STYLE: {style_descriptor}
        
        CREATE A STUNNING DISH PROMOTIONAL IMAGE:
        
        COMPOSITION & LAYOUT (CRITICAL):
        - Use a dramatic 3/4 angle shot (not top-down, not side-on — a beautiful 45-degree angle) that shows the depth and texture of the dish.
        - The dish must fill approximately 60% of the frame, positioned in the CENTER-BOTTOM area.
        - The top 35% of the frame should be the natural background, beautifully blurred (bokeh) with warm restaurant ambient lighting.
        - The bottom 15% should gently fade into a slightly darker gradient.
        - The food must look OUTRAGEOUSLY delicious: cheese pull, steam wisps, sauce glistening, perfectly garnished.
        - Use a vibrant, warm color palette — amber, gold, rich reds and oranges from the food itself.
        - Include a shallow depth of field: front edge of the dish slightly soft, the center dead-sharp.
        
        TECHNICAL SPECS:
        - 9:16 vertical portrait orientation (Instagram format).
        - 8K ultra-sharp detail on the hero food item.
        - Natural but enhanced food-grade lighting.
        - NO text, NO price tags, NO overlays, NO watermarks. ONLY the food photograph.
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
                            types.Part.from_text(text=final_prompt)
                        ]
                    )
                ],
                config=types.GenerateContentConfig(temperature=0.3)
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
