import os
import sys
import json
from google import genai
from google.genai import types

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

def analyze_visual_intelligence(image_path, dish_name, orders, margin, views, revenue, rating, avg_orders, avg_views):
    """
    VISUAL INTELLIGENCE LAYER:
    Connects photo quality scores with business outcomes.
    """
    try:
        client = get_client()
        if not client:
            raise Exception("Could not initialize Google GenAI client")

        with open(image_path, "rb") as f:
            image_data = f.read()

        # STEP 1: VISUAL QUALITY SCORE (Gemini 2.0 Flash)
        prompt = f"""
        ACT AS A PROFESSIONAL FOOD PHOTOGRAPHY CRITIC & QUALITY AUDITOR.
        Analyze this image for the menu item: "{dish_name}".
        
        1. Rate technical quality (0-10) for: Lighting, Background, Sharpness, Plating.
        2. RELEVANCE CHECK: Does the image actually show "{dish_name}"? 
           - If the image is unrelated (e.g., a photo of a restaurant building, a menu, or a different food item), give a low relevance score.
        
        Return ONLY a JSON object with this schema:
        {{
          "overall_score": number,
          "is_relevant_to_dish": boolean,
          "detected_item": "what the AI actually sees",
          "criteria": {{
            "lighting": number,
            "background": number,
            "sharpness": number,
            "plating": number
          }},
          "weaknesses": ["weakness 1", "weakness 2"]
        }}
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(data=image_data, mime_type="image/jpeg"),
                        types.Part.from_text(text=prompt)
                    ]
                )
            ]
        )

        # Parse AI response
        ai_data = json.loads(response.text.replace('```json', '').replace('```', '').strip())
        photo_score = ai_data['overall_score']
        is_relevant = ai_data.get('is_relevant_to_dish', True)

        # STEP 2: BUSINESS CROSS-REFERENCE (The 3 IF statements)
        insights = []

        # 1. Top dish + weak image (Balanced threshold: < 6.5)
        if photo_score < 6.5 and orders > avg_orders:
            insights.append({
                "type": "top_dish_weak_image",
                "label": "Green Up",
                "title": "Top dish → Weak image",
                "description": f"The '{dish_name}' is high-demand but has poor visuals. Fix photo immediately.",
                "color": "green"
            })

        # 2. High margin + low visibility
        if margin > 0.60 and views < avg_views:
            insights.append({
                "type": "high_margin_low_visibility",
                "label": "Green Up",
                "title": "High margin → Low visibility",
                "description": f"Push '{dish_name}' visually to the top of the menu to increase profit.",
                "color": "green"
            })

        # 3. High views + low orders (Visual Mismatch)
        # TRIPLE TRIGGER: High Views, Low Orders OR AI detected Relevance Mismatch
        if (views > avg_views and orders < avg_orders) or not is_relevant:
            mismatch_reason = "Visual mismatch vs actual dish." if is_relevant else f"Image shows {ai_data['detected_item']} but menu says {dish_name}."
            insights.append({
                "type": "visual_mismatch",
                "label": "Orange Warning",
                "title": "High views → Low orders",
                "description": f"{mismatch_reason} Retake photo to match reality.",
                "color": "orange"
            })

        # Final Result
        result = {
            "success": True,
            "dish_stats": {
                "dish_name": dish_name,
                "orders": orders,
                "revenue": revenue,
                "margin": margin,
                "rating": rating,
                "views": views
            },
            "ai_visual_score": ai_data,
            "insights": insights
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) >= 10:
        # Args: image_path, dish_name, orders, margin, views, revenue, rating, avg_orders, avg_views
        analyze_visual_intelligence(
            sys.argv[1], 
            sys.argv[2],
            int(sys.argv[3]), 
            float(sys.argv[4]), 
            int(sys.argv[5]), 
            sys.argv[6], 
            float(sys.argv[7]),
            int(sys.argv[8]),
            int(sys.argv[9])
        )
