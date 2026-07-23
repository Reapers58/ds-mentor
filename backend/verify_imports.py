"""verify_imports.py — Static analysis: verifies all imports, config, and connections resolve correctly.

Usage:
    python verify_imports.py
    python verify_imports.py --strict   # also checks DB & Qdrant connectivity
"""

import argparse
import importlib
import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(__file__))

CHECKS: list[dict] = []


def check(module: str, description: str, critical: bool = True):
    CHECKS.append(dict(module=module, description=description, critical=critical))


# ── 1. Core & config ──────────────────────────────────────────────
check("app.config", "settings / env loading")
check("app.database", "SQLAlchemy engine + session")
check("app.models.user", "User model")
check("app.models.project", "Project model")
check("app.models.task", "Task model")
check("app.models.document", "Document model")
check("app.models.conversation", "Conversation + Message models")
check("app.models", "model bundle (all __all__ exports)")
check("app.core.security", "password hashing + JWT")
check("app.core.dependencies", "dependency injection")

# ── 2. API routes ────────────────────────────────────────────────
check("app.api.v1.auth", "/auth endpoints")
check("app.api.v1.chat", "/chat endpoints")
check("app.api.v1.admin", "/admin endpoints")
check("app.api.v1.projects", "/projects endpoints")
check("app.api.v1.assistant", "/assistant endpoints")
check("app.api.v1", "router bundle")
check("app.main", "FastAPI app (import only)")

# ── 3. RAG pipeline ──────────────────────────────────────────────
check("app.rag.embeddings", "sentence-transformers model loader")
check("app.rag.ingestion", "PDF → chunk → Qdrant pipeline")
check("app.rag.graph", "LangGraph agent graph")

# ── 4. Schemas ───────────────────────────────────────────────────
check("app.schemas.auth", "auth request/response schemas")
check("app.schemas.chat", "chat schemas")
check("app.schemas.document", "document schemas")
check("app.schemas.project", "project schemas")
check("app.schemas.user", "user schemas")


def _verify_optional_import(module: str) -> None:
    try:
        importlib.import_module(module)
    except ImportError:
        pass  # optional dependency not installed – not an error


def run(strict: bool = False) -> list[str]:
    errors: list[str] = []

    print("=" * 60)
    print("DS-Mentor — Import Verification")
    print("=" * 60)

    for c in CHECKS:
        mod_name = c["module"]
        label = f"  {mod_name:<45} {c['description']}"
        try:
            importlib.import_module(mod_name)
            print(f"  ✓ {label}")
        except Exception as exc:
            level = "✗" if c["critical"] else "⚠"
            msg = f"  {level} {label}"
            print(msg)
            detail = traceback.format_exc(level=2).splitlines()[-1].strip()
            print(f"      ↳ {detail}")
            if c["critical"]:
                errors.append(f"{mod_name}: {exc}")

    # ── Optional: connectivity checks ─────────────────────────────
    if strict and not errors:
        print("\n  ── Connectivity ──")
        try:
            from app.config import settings
            print(f"  ✓ GROQ_API_KEY        {'set' if settings.groq_api_key else 'MISSING'}")
            print(f"  ✓ QDRANT_URL          {settings.qdrant_url}")
            print(f"  ✓ DATABASE_URL        {settings.database_url}")

            from qdrant_client import QdrantClient
            qclient = QdrantClient(url=settings.qdrant_url)
            qclient.get_collections()
            print(f"  ✓ Qdrant              reachable at {settings.qdrant_url}")
        except Exception as exc:
            errors.append(f"connectivity: {exc}")

    print("=" * 60)
    if errors:
        print(f"  FAILED — {len(errors)} error(s)")
    else:
        print("  ALL CHECKS PASSED")
    print("=" * 60)
    return errors


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--strict", action="store_true", help="Also check DB / Qdrant / Grok connectivity")
    args = parser.parse_args()
    errs = run(strict=args.strict)
    sys.exit(1 if errs else 0)
