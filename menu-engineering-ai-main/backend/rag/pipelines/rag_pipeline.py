from rag.retrieval.query_embedder import embed_query
from rag.retrieval.vector_search import search_vectors
from rag.retrieval.context_builder import build_context
from rag.generation.prompt_builder import build_prompt
from rag.generation.llm_generator import generate_answer



def run_rag(question):

    # Step 1 — embed query
    query_embedding = embed_query(question)

    # Step 2 — vector search
    results = search_vectors(query_embedding)

    # Step 3 — build context
    context = build_context(results)

    # Step 4 — build prompt
    prompt = build_prompt(context, question)

    # Step 5 — generate answer
    answer = generate_answer(prompt)

    return answer