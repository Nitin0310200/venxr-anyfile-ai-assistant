"""
backend/tests/test_graph.py
Unit tests for LangGraph state machine routing, conditional edges, and file parsing.
"""

import pytest
from backend.agent.graph import (
    AgentState,
    route_inbound,
    route_outbound,
    file_parser_node,
    file_generator_node,
    error_retry_node,
)

def test_route_inbound_with_attachments():
    """Verify that requests with attachments route to file_parser_node."""
    state: AgentState = {
        "thread_id": "test_1",
        "messages": [{"role": "user", "content": "analyze this"}],
        "attachments": [{"name": "report.pdf", "type": "pdf"}],
        "parsed_files": [],
        "generated_files": [],
        "action": None,
        "retry_count": 0,
        "error": None,
    }
    assert route_inbound(state) == "file_parser_node"

def test_route_inbound_without_attachments():
    """Verify that plain text requests bypass parsing and go directly to agent_node."""
    state: AgentState = {
        "thread_id": "test_2",
        "messages": [{"role": "user", "content": "hello"}],
        "attachments": [],
        "parsed_files": [],
        "generated_files": [],
        "action": None,
        "retry_count": 0,
        "error": None,
    }
    assert route_inbound(state) == "agent_node"

def test_route_outbound_file_generation():
    """Verify that action='generate_file' routes to file_generator_node."""
    state: AgentState = {
        "thread_id": "test_3",
        "messages": [],
        "attachments": [],
        "parsed_files": [],
        "generated_files": [],
        "action": "generate_file",
        "retry_count": 0,
        "error": None,
    }
    assert route_outbound(state) == "file_generator_node"

def test_error_retry_bounded_limit():
    """Verify bounded retry policy stops after 2 retries."""
    state: AgentState = {
        "thread_id": "test_4",
        "messages": [],
        "attachments": [],
        "parsed_files": [],
        "generated_files": [],
        "action": None,
        "retry_count": 2, # Already retried twice
        "error": None,
    }
    res = error_retry_node(state)
    assert res["action"] == "fail"
    assert "Maximum retries exceeded" in res["error"]
