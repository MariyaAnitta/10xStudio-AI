from configs.gemini_client import gemini_client


def suggest_dishes(cuisine):

    prompt = f"""
    Suggest 20 popular dishes from {cuisine} cuisine.
    Return only dish names separated by new lines.
    Do not add numbering.
    """

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    text = response.text.strip()

    dishes = [d.strip() for d in text.split("\n") if d.strip()]

    return dishes