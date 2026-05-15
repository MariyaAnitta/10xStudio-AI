from configs.gemini_client import gemini_client
from configs.settings import GENERATION_MODEL


def generate_answer(prompt):

    response = gemini_client.models.generate_content(
        model=GENERATION_MODEL,
        contents=prompt
    )

    return response.text