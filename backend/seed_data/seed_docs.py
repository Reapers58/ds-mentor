import asyncio
import os

from app.database import async_session
from app.models.document import Document
from app.rag.ingestion import ingest_document

ROLE_MAP = {
    "sdlc_overview": ["developer", "qa", "pm", "devops", "po"],
    "agile_scrum_process": ["pm", "po"],
    "code_review_standards": ["developer"],
    "database_migration_guide": ["developer", "devops"],
    "deployment_process": ["devops"],
    "dora_metrics": ["devops"],
    "incident_response": ["devops"],
    "performance_monitoring": ["devops"],
    "product_roadmap_guide": ["po", "pm"],
    "qa_testing_process": ["qa"],
    "security_best_practices": ["developer", "devops"],
    "sprint_planning_pm": ["pm", "po"],
}


async def seed():
    async with async_session() as db:
        sample_dir = "/app/sample_data"
        for fname in sorted(os.listdir(sample_dir)):
            if not fname.endswith(".pdf"):
                continue
            fpath = os.path.join(sample_dir, fname)
            key = fname.replace(".pdf", "").lower()
            roles = ROLE_MAP.get(key, ["developer", "qa", "pm", "devops", "po"])
            doc = Document(
                filename=fname,
                original_filename=fname,
                file_path=fpath,
                file_type="pdf",
                roles=roles,
            )
            db.add(doc)
            await db.commit()
            await db.refresh(doc)
            chunk_count = ingest_document(fpath, doc.id, roles, fname)
            print(f"{fname}: {chunk_count} chunks  roles={roles}")


asyncio.run(seed())
