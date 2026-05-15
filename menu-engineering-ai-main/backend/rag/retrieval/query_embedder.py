from google.genai.types import EmbedContentConfig
from database.firestore_client import client
from configs.settings import EMBEDDING_MODEL


def embed_query(query):

    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=[query],
        config=EmbedContentConfig(task_type="RETRIEVAL_QUERY")
    )

    return response.embeddings[0].values