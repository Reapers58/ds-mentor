from qdrant_client import QdrantClient, models

from app.config import settings
from app.rag.embeddings import get_embedding_model


class RetrievedDoc:
    def __init__(self, content: str, score: float, metadata: dict):
        self.content = content
        self.score = score
        self.metadata = metadata


def _get_client() -> QdrantClient:
    return QdrantClient(url=settings.qdrant_url)


def retrieve(query: str, user_role: str, top_k: int = 5) -> list[RetrievedDoc]:
    model = get_embedding_model()
    query_vector = model.encode(query).tolist()

    filter_condition = models.Filter(
        must=[
            models.FieldCondition(
                key="roles",
                match=models.MatchAny(any=[user_role]),
            )
        ]
    )

    client = _get_client()
    results = client.search(
        collection_name=settings.qdrant_collection,
        query_vector=query_vector,
        query_filter=filter_condition,
        limit=top_k,
        with_payload=True,
    )

    docs = []
    for res in results:
        payload = res.payload or {}
        docs.append(
            RetrievedDoc(
                content=payload.get("page_content", ""),
                score=res.score,
                metadata={
                    "filename": payload.get("filename", ""),
                    "chunk_index": payload.get("chunk_index", 0),
                    "doc_id": payload.get("doc_id", ""),
                    "roles": payload.get("roles", []),
                },
            )
        )

    return docs


def format_docs_for_context(docs: list[RetrievedDoc]) -> str:
    parts = []
    for i, doc in enumerate(docs, 1):
        parts.append(f"[{i}] {doc.content}")
    return "\n\n".join(parts)
