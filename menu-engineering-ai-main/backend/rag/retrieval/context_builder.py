def build_context(results):

    chunks = []

    for doc in results:

        data = doc.to_dict()
        chunks.append(data["chunk_text"])

    return "\n\n".join(chunks)