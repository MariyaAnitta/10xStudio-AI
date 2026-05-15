from rag.pipelines.rag_pipeline import run_rag
import re

import json
from rag.pipelines.rag_pipeline import run_rag
def extract_price(text):

    match = re.search(r"\d+(\.\d+)?", text)

    if match:
        return float(match.group())

    return None


def get_dish_price(dish):

    question = f"What is the average price of {dish}?"

    answer = run_rag(question)

    print("RAG answer:", answer)

    price = extract_price(answer)

    print("Extracted price:", price)

    return price





def get_prices_for_dishes(dishes):

    dish_list = "\n".join(dishes)

    question = f"""
Using the restaurant menu data in the context,
give the average price of the following dishes in OMR.

{dish_list}

Return ONLY JSON.
"""

    answer = run_rag(question)

    print("BATCH RAG RAW ANSWER:")
    print(answer)

    try:
        prices = json.loads(answer)
        return prices
    except:
        print("JSON parsing failed")
        return {}