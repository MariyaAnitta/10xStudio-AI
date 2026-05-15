from google.cloud.firestore_v1.vector import Vector
from database.firestore_client import db
from configs.settings import VECTOR_COLLECTION


def insert_chunk(chunk_text, embedding, chunk_id, source):

    collection = db.collection(VECTOR_COLLECTION)

    document = {
        "chunk_text": chunk_text,
        "embedding": Vector(embedding),
        "chunk_id": chunk_id,
        "source": source
    }

    collection.document(f"chunk_{chunk_id}").set(document)