from rag.ingestion.chunker import load_json, chunk_by_restaurant
from rag.ingestion.embedder import generate_embedding
from rag.ingestion.firestore_writer import insert_chunk


def ingest_json(file):

    data = load_json(file)

    chunks = chunk_by_restaurant(data)

    print("Total chunks:", len(chunks))

    for i, chunk in enumerate(chunks):

        embedding = generate_embedding(chunk)

        insert_chunk(chunk, embedding, i, file)

        print(f"Inserted chunk {i}")

    print("Ingestion completed")