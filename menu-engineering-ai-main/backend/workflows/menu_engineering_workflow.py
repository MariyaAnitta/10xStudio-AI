import pandas as pd

from services.insight_agent import generate_ai_insights

print("WORKFLOW FILE LOADED:", __file__)


def classify_menu_item(row, avg_popularity, avg_profit):
    popularity = row["Number Sold"]
    profit_per_item = row["Contribution Margin"]

    if popularity >= avg_popularity and profit_per_item >= avg_profit:
        return "Star"
    elif popularity >= avg_popularity and profit_per_item < avg_profit:
        return "Plowhorse"
    elif popularity < avg_popularity and profit_per_item >= avg_profit:
        return "Puzzle"
    else:
        return "Dud"


def process_menu_engineering_file(file_path):

    # --------------------------------------------------
    # 1. Read Excel
    # --------------------------------------------------
    df = pd.read_excel(file_path)

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
        raise Exception(
            f"Missing required columns: {', '.join(missing_columns)}"
        )

    # --------------------------------------------------
    # 2. Core Calculations
    # --------------------------------------------------
    df["Revenue"] = df["Number Sold"] * df["Item Price"]

    df["Contribution Margin"] = (
        df["Item Price"] - df["Item Cost"]
    )

    df["Total Profit"] = (
        df["Contribution Margin"] * df["Number Sold"]
    )

    df["Profit Margin %"] = (
        (df["Total Profit"] / df["Revenue"]) * 100
    ).fillna(0)

    total_revenue = round(df["Revenue"].sum(), 2)
    total_profit = round(df["Total Profit"].sum(), 2)

    gross_margin_percent = round(
        (total_profit / total_revenue) * 100,
        2
    ) if total_revenue else 0

    food_cost_percent = round(
        100 - gross_margin_percent,
        2
    )

    # --------------------------------------------------
    # 3. Best / Worst Performing Dish
    # --------------------------------------------------
    best_row = df.loc[df["Total Profit"].idxmax()]
    worst_row = df.loc[df["Total Profit"].idxmin()]

    best_performing_dish = best_row["Menu Item Name"]
    worst_performing_dish = worst_row["Menu Item Name"]

    # --------------------------------------------------
    # 4. Menu Engineering Classification
    # --------------------------------------------------
    avg_popularity = df["Number Sold"].mean()
    avg_profit = df["Contribution Margin"].mean()

    df["Category"] = df.apply(
        lambda row: classify_menu_item(
            row,
            avg_popularity,
            avg_profit
        ),
        axis=1
    )

    categories = {
        "stars": [],
        "plowhorses": [],
        "puzzles": [],
        "duds": []
    }

    for _, row in df.iterrows():
        item = {
            "name": row["Menu Item Name"],
            "category": row["Category"]
        }

        if row["Category"] == "Star":
            categories["stars"].append(item)

        elif row["Category"] == "Plowhorse":
            categories["plowhorses"].append(item)

        elif row["Category"] == "Puzzle":
            categories["puzzles"].append(item)

        else:
            categories["duds"].append(item)

    # --------------------------------------------------
    # 5. Revenue Chart
    # --------------------------------------------------
    top_revenue = (
        df.sort_values(
            by="Revenue",
            ascending=False
        )
        .head(5)
    )

    revenue_chart = []

    for _, row in top_revenue.iterrows():
        revenue_chart.append({
            "name": row["Menu Item Name"],
            "value": round(row["Revenue"], 2)
        })

    # --------------------------------------------------
    # 6. Category Distribution
    # --------------------------------------------------
    category_distribution = [
        {"name": "Stars", "value": len(categories["stars"])},
        {"name": "Plowhorses", "value": len(categories["plowhorses"])},
        {"name": "Puzzles", "value": len(categories["puzzles"])},
        {"name": "Duds", "value": len(categories["duds"])}
    ]

    # --------------------------------------------------
    # 7. Base Scores (Fallback values)
    # --------------------------------------------------
    revenue_opportunity_score = 84
    ai_health_score = 91

    summary = {
        "total_revenue": total_revenue,
        "total_profit": total_profit,
        "gross_margin_percent": gross_margin_percent,
        "food_cost_percent": food_cost_percent,
        "best_performing_dish": best_performing_dish,
        "worst_performing_dish": worst_performing_dish,
        "revenue_opportunity_score": revenue_opportunity_score,
        "ai_health_score": ai_health_score
    }

    # --------------------------------------------------
    # 8. Gemini AI Insights
    # --------------------------------------------------
    ai_insights = generate_ai_insights(
        summary=summary,
        categories=categories,
        revenue_chart=revenue_chart
    )

    print("GEMINI RESPONSE:", ai_insights)

    # --------------------------------------------------
    # 🔥 9. Inject AI-generated scores into summary
    # --------------------------------------------------
    summary["revenue_opportunity_score"] = ai_insights.get(
        "revenue_opportunity_score",
        summary["revenue_opportunity_score"]
    )

    summary["ai_health_score"] = ai_insights.get(
        "ai_health_score",
        summary["ai_health_score"]
    )

    print("\n===== FINAL SCORES (USED IN UI) =====")
    print("Revenue Opportunity Score:", summary["revenue_opportunity_score"])
    print("AI Health Score:", summary["ai_health_score"])
    print("====================================\n")

    # --------------------------------------------------
    # 10. Dish-Level Table Data
    # --------------------------------------------------
    dish_level_data = []

    for _, row in df.iterrows():
        dish_level_data.append({
            "dish_name": row.get("Menu Item Name", ""),
            "number_sold": int(row.get("Number Sold", 0)),
            "revenue": round(float(row.get("Revenue", 0)), 2),
            "profit": round(float(row.get("Total Profit", 0)), 2),
            "profit_margin": round(float(row.get("Profit Margin %", 0)), 2),
            "category": row.get("Category", "-")
        })

    print("DISH LEVEL DATA SAMPLE:", dish_level_data[:5])

    # --------------------------------------------------
    # 11. Final API Response
    # --------------------------------------------------
    return {
        "status": "success",
        "summary": summary,
        "categories": categories,
        "revenue_chart": revenue_chart,
        "category_distribution": category_distribution,
        "ai_insights": ai_insights,
        "dish_level_data": dish_level_data
    }