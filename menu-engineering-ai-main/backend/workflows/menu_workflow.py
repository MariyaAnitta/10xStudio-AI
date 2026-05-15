from concurrent.futures import ThreadPoolExecutor
import time

from agents.restaurant_rag_agent import get_dish_price
from agents.restaurant_rag_agent import get_prices_for_dishes
from agents.menu_generation_agent import build_menu_item

from tools.image_generator import generate_dish_image
from tools.local_image_loader import load_local_dish_image
from tools.price_estimator import estimate_price

from configs.settings import DEV_MODE, DEV_MODE_BATCH_RAG


def process_single_dish(dish):
    """
    Process a single dish in NORMAL mode.
    """

    # 1️⃣ Get price from RAG (with fallback)
    try:
        price = get_dish_price(dish)
    except Exception as e:
        print(f"RAG Error for {dish}: {e}")
        price = None

    # fallback if RAG fails
    if price is None:
        price = estimate_price(dish)

    # 2️⃣ Image handling
    if DEV_MODE:
        image_path = load_local_dish_image(dish)
    else:
        image_path = generate_dish_image(dish)

    # 3️⃣ Build menu item
    return build_menu_item(dish, price, image_path)


def generate_menu(selected_dishes):

    # simulate AI processing delay in DEV mode
    if DEV_MODE:
        print("DEV MODE: Simulating AI generation delay...")
        time.sleep(10)

    menu = []

    # ---------- DEV BATCH MODE ----------
    if DEV_MODE_BATCH_RAG:

        try:
            prices = get_prices_for_dishes(selected_dishes)
        except Exception as e:
            print(f"Batch RAG Error: {e}")
            prices = {}

        for dish in selected_dishes:

            price = prices.get(dish)

            if price is None:
                price = estimate_price(dish)

            if DEV_MODE:
                image_path = load_local_dish_image(dish)
            else:
                image_path = generate_dish_image(dish)

            item = build_menu_item(dish, price, image_path)

            menu.append(item)

        return menu

    # ---------- NORMAL MODE ----------
    with ThreadPoolExecutor(max_workers=5) as executor:
        results = executor.map(process_single_dish, selected_dishes)

    for item in results:
        menu.append(item)

    return menu