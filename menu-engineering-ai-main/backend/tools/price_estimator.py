import random


def estimate_price(dish):

    dish = dish.lower()

    if "fish" in dish or "seafood" in dish:
        return round(random.uniform(5, 8), 2)

    if "chicken" in dish:
        return round(random.uniform(4, 6), 2)

    if "paneer" in dish:
        return round(random.uniform(3, 5), 2)

    if "dessert" in dish or "sweet" in dish:
        return round(random.uniform(2, 4), 2)

    return round(random.uniform(3, 6), 2)