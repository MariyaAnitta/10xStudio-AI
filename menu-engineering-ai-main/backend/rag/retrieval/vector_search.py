from google.cloud.firestore_v1.vector import Vector
from google.cloud.firestore_v1.base_vector_query import DistanceMeasure
from database.firestore_client import db
from configs.settings import VECTOR_COLLECTION, TOP_K


def search_vectors(query_embedding):

    collection = db.collection(VECTOR_COLLECTION)

    results = collection.find_nearest(
        vector_field="embedding",
        query_vector=Vector(query_embedding),
        distance_measure=DistanceMeasure.COSINE,
        limit=TOP_K
    )

    return results.stream()