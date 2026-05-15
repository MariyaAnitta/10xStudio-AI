import json
from configs.gemini_client import create_gemini_client

print("INSIGHT AGENT FILE LOADED:", __file__)


def generate_ai_insights(summary, categories, revenue_chart):
    """
    Generate AI-powered insights + AI-generated scores
    """

    try:
        client, _ = create_gemini_client()

        # -------------------------------
        # Prepare structured data
        # (IMPORTANT: NO scores passed here)
        # -------------------------------
        structured_data = {
            "summary": {
                "total_revenue": summary.get("total_revenue"),
                "total_profit": summary.get("total_profit"),
                "gross_margin_percent": summary.get("gross_margin_percent"),
                "food_cost_percent": summary.get("food_cost_percent"),
                "best_performing_dish": summary.get("best_performing_dish"),
                "worst_performing_dish": summary.get("worst_performing_dish"),
            },

            "menu_categories": {
                "stars": [item.get("name") for item in categories.get("stars", [])],
                "plowhorses": [item.get("name") for item in categories.get("plowhorses", [])],
                "puzzles": [item.get("name") for item in categories.get("puzzles", [])],
                "duds": [item.get("name") for item in categories.get("duds", [])],
            },

            "top_revenue_items": revenue_chart
        }

        # -------------------------------
        # Debug input
        # -------------------------------
        print("\n===== DEBUG: INPUT TO GEMINI =====")
        print(json.dumps(structured_data, indent=2))
        print("==================================\n")

        # -------------------------------
        # Prompt (UPDATED)
        # -------------------------------
        prompt = f"""
You are a senior restaurant menu engineering consultant.

Analyze the restaurant performance data below and generate strategic insights.

IMPORTANT:
- You MUST generate ONLY these numeric scores:
  1. revenue_opportunity_score
  2. ai_health_score

- DO NOT modify or regenerate:
  total_revenue, total_profit, margins, or dish names

- Use the provided summary and menu categories

SCORING RULES:
- Scores must be between 0 and 100

- Revenue Opportunity Score:
  High if many Plowhorses and Puzzles exist
  High if pricing or promotion opportunities exist
  Low if menu is already optimized

- AI Health Score:
  High if strong Stars and low Duds
  Low if many Duds or weak balance

Return JSON format EXACTLY like this:

{{
  "revenue_opportunity_score": number,
  "ai_health_score": number,

  "executive_summary": "string",

  "pricing_recommendations": [
    "string",
    "string",
    "string"
  ],

  "promotion_opportunities": [
    "string",
    "string",
    "string"
  ],

  "removal_recommendations": [
    "string",
    "string"
  ],

  "bundle_opportunities": [
    "string",
    "string"
  ]
}}

Restaurant Data:
{json.dumps(structured_data, indent=2)}
"""

        # -------------------------------
        # Gemini Call
        # -------------------------------
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        raw_text = response.text.strip()

        # -------------------------------
        # Clean response
        # -------------------------------
        if raw_text.startswith("```json"):
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text.replace("```", "").strip()

        print("\n===== RAW GEMINI RESPONSE =====")
        print(raw_text)
        print("================================\n")

        # -------------------------------
        # Parse JSON
        # -------------------------------
        ai_insights = json.loads(raw_text)

        # -------------------------------
        # Safe fallback for scores
        # -------------------------------
        ai_insights["revenue_opportunity_score"] = ai_insights.get(
            "revenue_opportunity_score",
            summary.get("revenue_opportunity_score")
        )

        ai_insights["ai_health_score"] = ai_insights.get(
            "ai_health_score",
            summary.get("ai_health_score")
        )

        # -------------------------------
        # Debug output
        # -------------------------------
        print("\n===== AI GENERATED SCORES =====")
        print("Revenue Opportunity:", ai_insights["revenue_opportunity_score"])
        print("AI Health Score:", ai_insights["ai_health_score"])
        print("================================\n")

        return ai_insights

    except Exception as e:
        print(f"Gemini AI Insight Error: {str(e)}")

        # -------------------------------
        # Safe fallback (VERY IMPORTANT)
        # -------------------------------
        return {
            "revenue_opportunity_score": summary.get("revenue_opportunity_score"),
            "ai_health_score": summary.get("ai_health_score"),

            "executive_summary": "AI insights temporarily unavailable.",

            "pricing_recommendations": [
                "Review pricing of high-volume low-margin dishes"
            ],

            "promotion_opportunities": [
                "Promote high-profit dishes"
            ],

            "removal_recommendations": [
                "Review low-performing items"
            ],

            "bundle_opportunities": [
                "Create combo offers"
            ]
        }