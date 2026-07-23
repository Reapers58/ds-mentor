from typing import TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph

from app.config import settings
from app.rag.retriever import RetrievedDoc, format_docs_for_context, retrieve


class AgentState(TypedDict):
    query: str
    user_role: str
    conversation_history: list
    retrieved_docs: list[RetrievedDoc]
    response: str


SYSTEM_PROMPT = """You are DS-Mentor, an enterprise process and SOP assistant for IT companies.
Your role is to help employees follow company processes, SOPs, and best practices based on their role.

Guidelines:
- Answer based on the retrieved context documents. If the context doesn't contain enough information, say so clearly.
- Never mention document filenames, file paths, or source references in your response. Answer as if you already know the processes — do not reveal that your knowledge comes from specific files.
- Provide step-by-step guidance where applicable.
- Tailor your response to the user's role: Developer, QA, PM, DevOps, or Product Owner.
- Be concise, professional, and helpful.
- If the user asks about something outside the scope of SOPs and processes, politely redirect them."""


def retrieve_node(state: AgentState) -> dict:
    docs = retrieve(state["query"], state["user_role"])
    return {"retrieved_docs": docs}


def generate_node(state: AgentState) -> dict:
    llm = ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
        temperature=0.3,
    )

    context = format_docs_for_context(state["retrieved_docs"])

    messages = [SystemMessage(content=SYSTEM_PROMPT)]

    for msg in state.get("conversation_history", []):
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))

    user_content = f"User's Role: {state['user_role']}\n\nContext:\n{context}\n\nQuestion: {state['query']}"
    messages.append(HumanMessage(content=user_content))

    response = llm.invoke(messages)

    return {"response": response.content}


def build_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("retrieve", retrieve_node)
    workflow.add_node("generate", generate_node)

    workflow.set_entry_point("retrieve")
    workflow.add_edge("retrieve", "generate")
    workflow.add_edge("generate", END)

    return workflow.compile()


agent_graph = build_graph()
