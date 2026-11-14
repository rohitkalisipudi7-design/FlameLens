"""Unit tests for Module E: Hybrid Scientific RAG and SQL retrieval."""
import os
import pytest
from scripts.rag_service import FreefallRAGService

def test_rag_query_classification():
    """Verify hybrid RAG accurately routes queries to correct retrieval engines."""
    rag = FreefallRAGService()
    
    # Quantitative SQL query
    assert rag.classify_question("How many experiments tested heptane in 0g?") == "DATA_METRICS"
    assert rag.classify_question("Average burning rate K for methanol droplets") == "DATA_METRICS"
    
    # Literature question
    assert rag.classify_question("Explain cool flame kinetics in microgravity") == "LITERATURE"
    assert rag.classify_question("What does NTRS report say about Saffire radiative flux?") == "LITERATURE"
    
    # Comparative query
    assert rag.classify_question("Compare heptane vs methanol burning rate") == "COMPARISON"
    
    # Gap analysis
    assert rag.classify_question("What parameter gaps exist in exploration atmospheres 0.57 atm?") == "RESEARCH_GAP"


def test_rag_deterministic_sql_metrics():
    """Verify deterministic SQL engine computes exact figures without hallucination."""
    rag = FreefallRAGService()
    
    # Test material-specific SQL aggregation
    metrics = rag.execute_deterministic_sql_metrics("What is the average pressure and rate for silicone in microgravity?")
    assert metrics is not None
    assert metrics["sql_verified"] is True
    assert metrics["material"] == "Silicone"
    assert metrics["total_runs"] > 0
    assert metrics["avg_pressure_psi"] > 0


def test_rag_ask_workflow():
    """Verify that full hybrid ask pipeline generates structured result with evidence."""
    rag = FreefallRAGService()
    user_q = "How does silicone burn in microgravity according to Saffire-II?"
    res = rag.ask(user_q)
    
    assert "answer" in res
    assert "question_type" in res
    assert "claim_verification" in res
    assert "all_retrieved_papers" in res
    assert "deterministic_metrics" in res
    assert len(res["all_retrieved_papers"]) > 0
