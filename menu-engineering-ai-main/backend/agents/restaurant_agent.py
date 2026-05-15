from rag.pipelines.rag_pipeline import run_rag


def restaurant_agent(question: str):

    """
    Generic RAG chat agent used by the Neo chatbot.
    """

    answer = run_rag(question)

    return answer