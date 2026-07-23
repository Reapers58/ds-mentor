import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.rag.graph import agent_graph
from app.rag.retriever import RetrievedDoc
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    MessageResponse,
    SearchResult,
    Source,
)

router = APIRouter(prefix="/chat", tags=["chat"])


async def generate_title(query: str, response: str) -> str:
    try:
        llm = ChatGroq(
            api_key=settings.groq_api_key,
            model=settings.groq_model,
            temperature=0.3,
        )
        messages = [
            SystemMessage(content="Generate a very short conversation title (max 6 words). No quotes, no punctuation at the end. Just the title."),
            HumanMessage(content=f"User asked: {query[:200]}\nAssistant answered: {response[:300]}"),
        ]
        result = llm.invoke(messages)
        return result.content.strip().strip('"').strip("'").rstrip(".")
    except Exception:
        return query[:50]


@router.post("", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conv_id = payload.conversation_id or str(uuid.uuid4())
    is_new_conversation = not payload.conversation_id

    if payload.conversation_id:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == payload.conversation_id,
                Conversation.user_id == user.id,
            )
        )
        conv = result.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    else:
        conv = Conversation(
            id=uuid.UUID(conv_id),
            user_id=user.id,
            title=payload.query[:100],
        )
        db.add(conv)
        await db.commit()

    messages_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
    )
    existing_messages = messages_result.scalars().all()

    conversation_history = [
        {"role": m.role, "content": m.content} for m in existing_messages
    ]

    initial_state = {
        "query": payload.query,
        "user_role": user.role,
        "conversation_history": conversation_history,
        "retrieved_docs": [],
        "response": "",
    }

    final_state = None
    for event in agent_graph.stream(initial_state):
        final_state = event

    if final_state is None or "generate" not in final_state:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="RAG generation failed")

    state = final_state["generate"]
    response_text = state.get("response", "")

    retrieved_docs: list[RetrievedDoc] = state.get("retrieved_docs", [])
    sources = [
        Source(
            filename=doc.metadata.get("filename"),
            score=round(doc.score, 3),
            content_preview=doc.content[:200],
        )
        for doc in retrieved_docs
    ]

    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=payload.query,
    )
    db.add(user_msg)

    bot_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=response_text,
        sources=json.dumps([s.model_dump() for s in sources]),
    )
    db.add(bot_msg)

    generated_title = None
    if is_new_conversation:
        generated_title = await generate_title(payload.query, response_text)
        conv.title = generated_title

    await db.commit()

    return ChatResponse(
        response=response_text,
        conversation_id=str(conv.id),
        sources=sources,
        title=generated_title,
    )


@router.get("/search", response_model=list[SearchResult])
async def search_messages(
    q: str = "",
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = q.strip()
    if not query:
        return []

    like = f"%{query}%"
    result = await db.execute(
        select(Message, Conversation)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            Conversation.user_id == user.id,
            Message.content.ilike(like),
        )
        .order_by(Message.created_at.desc())
        .limit(50)
    )

    return [
        SearchResult(
            conversation_id=str(conv.id),
            conversation_title=conv.title,
            message_id=str(msg.id),
            role=msg.role,
            content=msg.content,
            created_at=msg.created_at,
        )
        for msg, conv in result.all()
    ]


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    messages_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
    )
    return messages_result.scalars().all()


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    await db.delete(conv)
    await db.commit()
