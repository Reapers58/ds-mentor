import uuid

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LCDocument
from langchain_core.embeddings import Embeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, SparseIndexParams, SparseVectorParams, VectorParams

from app.config import settings
from app.rag.embeddings import get_embedding_model


def _get_qdrant_client() -> QdrantClient:
    return QdrantClient(url=settings.qdrant_url)


def _ensure_collection():
    client = _get_qdrant_client()
    collections = client.get_collections().collections
    exists = any(c.name == settings.qdrant_collection for c in collections)

    if not exists:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(
                size=get_embedding_model().get_sentence_embedding_dimension(),
                distance=Distance.COSINE,
            ),
            sparse_vectors_config={
                "sparse": SparseVectorParams(
                    index=SparseIndexParams()
                )
            },
        )


def _parse_pdf(file_path: str) -> str:
    from pypdf import PdfReader
    reader = PdfReader(file_path)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    return text


def _chunk_text(text: str) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    return splitter.split_text(text)


def ingest_document(file_path: str, doc_id: uuid.UUID, roles: list[str], filename: str) -> int:
    _ensure_collection()

    raw_text = _parse_pdf(file_path)
    chunks = _chunk_text(raw_text)

    langchain_docs = []
    for i, chunk in enumerate(chunks):
        lc_doc = LCDocument(
            page_content=chunk,
            metadata={
                "doc_id": str(doc_id),
                "filename": filename,
                "chunk_index": i,
                "roles": roles,
            },
        )
        langchain_docs.append(lc_doc)

    model = get_embedding_model()

    class LocalEmbeddings(Embeddings):
        def embed_documents(self, texts):
            return model.encode(texts).tolist()

        def embed_query(self, text):
            return model.encode(text).tolist()

    vectorstore = QdrantVectorStore(
        client=_get_qdrant_client(),
        collection_name=settings.qdrant_collection,
        embedding=LocalEmbeddings(),
    )

    vectorstore.add_documents(langchain_docs)

    return len(chunks)


def remove_document_vectors(doc_id: str):
    from qdrant_client.models import FieldCondition, Filter, MatchValue
    client = _get_qdrant_client()
    client.delete(
        collection_name=settings.qdrant_collection,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="doc_id",
                    match=MatchValue(value=doc_id),
                )
            ]
        ),
    )
