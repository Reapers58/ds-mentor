import os
import uuid

import aiofiles
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_role
from app.models.document import Document
from app.models.user import User
from app.rag.ingestion import ingest_document, remove_document_vectors
from app.schemas.document import DocumentResponse, DocumentUploadResponse

router = APIRouter(prefix="/admin", tags=["admin"])
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "sample_data")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/documents", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    roles: str = Form("developer,qa,pm,devops,po"),
    description: str = Form(""),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    file_id = str(uuid.uuid4())
    filename = file.filename or "upload"
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "pdf"
    save_filename = f"{file_id}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, save_filename)

    content = await file.read()
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    role_list = [r.strip() for r in roles.split(",") if r.strip()]
    doc = Document(
        filename=save_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_type=ext,
        roles=role_list,
        description=description or None,
        uploaded_by=user.id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    if ext.lower() == "pdf":
        chunk_count = ingest_document(file_path, doc.id, role_list, filename)
    else:
        chunk_count = 0

    return DocumentUploadResponse(
        id=doc.id,
        filename=save_filename,
        roles=role_list,
        message=f"Uploaded and indexed ({chunk_count} chunks)" if chunk_count else "Uploaded (no indexing done)",
    )


@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    result = await db.execute(
        select(Document).order_by(Document.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    remove_document_vectors(str(doc.id))

    await db.delete(doc)
    await db.commit()


@router.post("/documents/reindex", status_code=status.HTTP_200_OK)
async def reindex_all(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Document))
    docs = result.scalars().all()

    total = 0
    for doc in docs:
        if doc.file_type.lower() == "pdf" and os.path.exists(doc.file_path):
            chunk_count = ingest_document(doc.file_path, doc.id, doc.roles, doc.original_filename)
            total += chunk_count

    return {"message": f"Reindexed {len(docs)} documents ({total} chunks)"}
