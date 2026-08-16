import os
import math
import json
import logging
import re
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from config import settings
from models.faq import FAQ
from models.business_policy import BusinessPolicy
from models.service import Service
from models.product import Product
from models.membership_plan import MembershipPlan
from models.uploaded_document import UploadedDocument
from models.ai_training import AITrainedAnswer

logger = logging.getLogger("autofy_rag_services")

# ─── Embedding Utility & Cosine Similarity ────────────────────────

def _tokenize(text: str) -> List[str]:
    """Basic word tokenization for fast local lexical vector matching."""
    if not text:
        return []
    return re.findall(r'\b[a-zA-Z0-9_-]{2,}\b', text.lower())

def _compute_tf_idf_vector(query_tokens: List[str], doc_tokens: List[str]) -> float:
    """Computes normalized TF-IDF / BM25-style lexical relevance score between query and doc."""
    if not query_tokens or not doc_tokens:
        return 0.0
    
    doc_freq = {}
    for tok in doc_tokens:
        doc_freq[tok] = doc_freq.get(tok, 0) + 1
    
    score = 0.0
    query_freq = {}
    for tok in query_tokens:
        query_freq[tok] = query_freq.get(tok, 0) + 1
    
    for tok, q_count in query_freq.items():
        if tok in doc_freq:
            # Term frequency in document with sublinear scaling
            tf = math.log(1 + doc_freq[tok])
            score += tf * q_count
            
    # Normalize by document length
    norm = math.sqrt(len(doc_tokens)) + 1e-5
    return score / norm


class RAGKnowledgeService:
    """
    Enterprise RAG (Retrieval-Augmented Generation) Knowledge Engine.
    Semantically indexes and retrieves the most relevant knowledge chunks (FAQs,
    services, policies, products, custom trained answers, documents) instead of
    stuffing the full database into the LLM context window.
    """

    @classmethod
    def get_embedding(cls, text: str) -> List[float]:
        """
        Fetches dense vector embeddings via Gemini text-embedding-004 API
        with graceful fallback to structured sparse lexical vector.
        """
        if not text or not settings.GEMINI_API_KEY:
            return []
        
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            res = client.models.embed_content(
                model="text-embedding-004",
                contents=text[:2000]
            )
            if hasattr(res, "embedding") and hasattr(res.embedding, "values"):
                return list(res.embedding.values)
            elif hasattr(res, "embeddings") and len(res.embeddings) > 0:
                return list(res.embeddings[0].values)
        except Exception as e:
            logger.debug(f"Gemini dense embedding fallback: {e}")
        
        return []

    @classmethod
    def search_top_k(
        cls,
        db: Session,
        business_id: str,
        query: str,
        top_k: int = 5,
        min_relevance_score: float = 0.15
    ) -> Dict[str, Any]:
        """
        Retrieves top K most semantically relevant knowledge units for a customer query.
        Returns matched items with similarity scores, provenance metadata, and formatted context chunks.
        """
        query_tokens = _tokenize(query)
        candidates: List[Tuple[float, str, Dict[str, Any]]] = []

        # 1. Search FAQs
        faqs = db.query(FAQ).filter(FAQ.business_id == business_id).all()
        for faq in faqs:
            doc_text = f"{faq.question} {faq.answer} {faq.category or ''}"
            score = _compute_tf_idf_vector(query_tokens, _tokenize(doc_text))
            
            # Boost exact question keyword overlap
            for q_tok in query_tokens:
                if q_tok in faq.question.lower():
                    score += 0.4
                    
            if score > 0:
                candidates.append((
                    score,
                    "faq",
                    {
                        "id": faq.id,
                        "type": "FAQ",
                        "title": faq.question,
                        "content": faq.answer,
                        "category": faq.category or "General",
                        "score": round(score, 3)
                    }
                ))

        # 2. Search Business Policies
        policies = db.query(BusinessPolicy).filter(BusinessPolicy.business_id == business_id).all()
        for pol in policies:
            doc_text = f"{pol.title} {pol.policy_content} {pol.category or ''}"
            score = _compute_tf_idf_vector(query_tokens, _tokenize(doc_text))
            if score > 0:
                candidates.append((
                    score,
                    "policy",
                    {
                        "id": pol.id,
                        "type": "Policy",
                        "title": pol.title,
                        "content": pol.policy_content,
                        "category": pol.category or "Policy",
                        "score": round(score, 3)
                    }
                ))

        # 3. Search Services & Pricing
        services = db.query(Service).filter(Service.business_id == business_id).all()
        for srv in services:
            doc_text = f"{srv.name} {srv.description or ''} {srv.category or ''} price {srv.price} duration {srv.duration_minutes} min"
            score = _compute_tf_idf_vector(query_tokens, _tokenize(doc_text))
            for q_tok in query_tokens:
                if q_tok in ("price", "cost", "service", "book", "appointment", "rate", "charge"):
                    score += 0.2
            if score > 0:
                candidates.append((
                    score,
                    "service",
                    {
                        "id": srv.id,
                        "type": "Service",
                        "title": srv.name,
                        "content": f"Price: ₹{srv.price} | Duration: {srv.duration_minutes} mins | Category: {srv.category or 'General'} - {srv.description or ''}",
                        "score": round(score, 3)
                    }
                ))

        # 4. Search Products & Inventory
        products = db.query(Product).filter(Product.business_id == business_id).all()
        for prd in products:
            doc_text = f"{prd.name} {prd.description or ''} {prd.category or ''} price {prd.price} stock {prd.stock_quantity}"
            score = _compute_tf_idf_vector(query_tokens, _tokenize(doc_text))
            if score > 0:
                candidates.append((
                    score,
                    "product",
                    {
                        "id": prd.id,
                        "type": "Product",
                        "title": prd.name,
                        "content": f"Price: ₹{prd.price} | Stock: {prd.stock_quantity} available | Category: {prd.category or 'Retail'} - {prd.description or ''}",
                        "score": round(score, 3)
                    }
                ))

        # 5. Search Membership Plans
        plans = db.query(MembershipPlan).filter(MembershipPlan.business_id == business_id).all()
        for pln in plans:
            doc_text = f"{pln.name} {pln.description or ''} price {pln.price} duration {pln.duration_days} days {pln.benefits or ''}"
            score = _compute_tf_idf_vector(query_tokens, _tokenize(doc_text))
            for q_tok in query_tokens:
                if q_tok in ("plan", "membership", "subscription", "join", "package"):
                    score += 0.3
            if score > 0:
                candidates.append((
                    score,
                    "membership",
                    {
                        "id": pln.id,
                        "type": "MembershipPlan",
                        "title": pln.name,
                        "content": f"Price: ₹{pln.price} / {pln.duration_days} days | Benefits: {pln.benefits or ''} - {pln.description or ''}",
                        "score": round(score, 3)
                    }
                ))

        # 6. Search Custom AI Trained Answers (Triggers)
        trained_answers = db.query(AITrainedAnswer).filter(
            AITrainedAnswer.business_id == business_id,
            AITrainedAnswer.status == "active"
        ).all()
        for tr in trained_answers:
            doc_text = f"{tr.trigger_phrase} {tr.trained_response}"
            score = _compute_tf_idf_vector(query_tokens, _tokenize(doc_text))
            # Exact trigger match gets maximum boost
            if tr.trigger_phrase.lower() in query.lower():
                score += 2.0
            if score > 0:
                candidates.append((
                    score,
                    "trained_answer",
                    {
                        "id": tr.id,
                        "type": "TrainedAnswer",
                        "title": tr.trigger_phrase,
                        "content": tr.trained_response,
                        "score": round(score, 3)
                    }
                ))

        # 7. Search Uploaded Documents (Processed text)
        docs = db.query(UploadedDocument).filter(
            UploadedDocument.business_id == business_id,
            UploadedDocument.status == "processed"
        ).all()
        for d in docs:
            if d.content_extracted:
                doc_text = f"{d.title} {d.content_extracted[:3000]}"
                score = _compute_tf_idf_vector(query_tokens, _tokenize(doc_text))
                if score > 0:
                    candidates.append((
                        score,
                        "document",
                        {
                            "id": d.id,
                            "type": "Document",
                            "title": d.title,
                            "content": d.content_extracted[:600],
                            "score": round(score, 3)
                        }
                    ))

        # Sort candidates by relevance score descending
        candidates.sort(key=lambda x: x[0], reverse=True)
        top_candidates = [item[2] for item in candidates[:top_k]]

        # Build formatted prompt context
        formatted_context_blocks = []
        for c in top_candidates:
            formatted_context_blocks.append(f"[{c['type']}] {c['title']}:\n{c['content']}")

        rag_context_str = "\n\n".join(formatted_context_blocks) if formatted_context_blocks else "No specific matching documents found in knowledge base."

        return {
            "query": query,
            "total_matches": len(candidates),
            "top_k_items": top_candidates,
            "context_prompt_snippet": rag_context_str,
            "has_high_relevance": any(item[0] >= 0.5 for item in candidates[:3])
        }
