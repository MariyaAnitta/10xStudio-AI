import os
import re
import time
import base64
from io import BytesIO
from PIL import Image, ImageDraw

from configs.settings import DEV_MODE
from configs.gemini_client import gemini_client

IMAGE_DIR = "images"
os.makedirs(IMAGE_DIR, exist_ok=True)

AI_IMAGE_LIMIT = 10
ai_image_count = 0


def safe_filename(name: str):
    name = name.lower().replace(" ", "_")
    name = re.sub(r"[^a-z0-9_]", "", name)
    return name


def generate_placeholder_image(dish, path):
    img = Image.new("RGB", (512, 512), color=(255, 230, 200))
    draw = ImageDraw.Draw(img)
    draw.text((256, 256), dish, fill=(0, 0, 0), anchor="mm")
    img.save(path)


def extract_image_bytes(response):
    """
    Extract image bytes from Gemini response safely
    """
    for candidate in response.candidates:
        for part in candidate.content.parts:
            if part.inline_data and part.inline_data.data:
                return base64.b64decode(part.inline_data.data)
    return None


def save_valid_image(image_bytes, path):
    """
    Validate image before saving (prevents broken images)
    """
    img = Image.open(BytesIO(image_bytes))
    img = img.convert("RGB")
    img.save(path, "PNG")


def generate_dish_image(dish):

    global ai_image_count

    filename = safe_filename(dish) + ".png"
    path = os.path.join(IMAGE_DIR, filename)

    # CACHE
    if os.path.exists(path):
        print(f"Using cached image for {dish}")
        return f"images/{filename}"

    if DEV_MODE:
        generate_placeholder_image(dish, path)
        return f"images/{filename}"

    if ai_image_count >= AI_IMAGE_LIMIT:
        generate_placeholder_image(dish, path)
        return f"images/{filename}"

    try:

        print(f"\nGenerating image for {dish}...")

        prompt = f"""
        Professional food photography of {dish},
        restaurant menu presentation,
        beautifully plated,
        soft warm restaurant lighting,
        high resolution,
        clean background
        """

        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=prompt
        )

        image_bytes = extract_image_bytes(response)

        if image_bytes is None:
            raise Exception("No image returned from Gemini")

        save_valid_image(image_bytes, path)

        ai_image_count += 1

        print(f"Image saved: {path}")

        # wait 60 seconds before next request
        print("Waiting 60 seconds before next image...")
        time.sleep(60)

    except Exception as e:

        print("Image generation failed, using placeholder:", e)
        generate_placeholder_image(dish, path)

    return f"images/{filename}"