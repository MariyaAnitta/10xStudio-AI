from google.genai.types import EmbedContentConfig
from configs.gemini_client import gemini_client
from configs.settings import EMBEDDING_MODEL


def generate_embedding(text):

    response = gemini_client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=[text],
        config=EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
    )

    return response.embeddings[0].values