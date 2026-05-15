def build_menu_item(dish, price, image_path):

    image_path = image_path.replace("\\", "/")

    return {
        "dish": dish,
        "price": f"{price} OMR",
        "image": image_path
    }