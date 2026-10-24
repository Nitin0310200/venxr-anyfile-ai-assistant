# VenXR Edge Cases & QA Test Suite Specification

A comprehensive QA and edge-case testing suite covering all 5 mandatory areas of the VenXR assignment in a clean, downloadable plain text (`.txt`) document with expected behaviors, failure modes, and an in-app viewer.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Aligned with your confirmed choices:
> - **Scope**: Comprehensive edge case coverage across all 5 core assignment pillars (Long-running chat, Any file in, Any file out, LangGraph agent routing, and Django ASGI streaming).
> - **Format**: QA Checklist with concrete steps, inputs, expected outcomes, and failure mode recovery mechanisms.
> - **Access**: Downloadable plain text document (`VENXR_EDGE_CASES_AND_TEST_RESULTS.txt`) via direct browser link + a dedicated interactive **"Edge Cases & QA"** tab in the in-app architecture inspector.

---

## 1. Overview & Core Concept

- **The Goal**: Give candidates and interviewers an exhaustive, production-grade test specification that verifies every boundary condition, error recovery path, and security constraint defined in the VenXR assignment brief.
- **Deliverables**:
  1. `public/VENXR_EDGE_CASES_AND_TEST_RESULTS.txt`: A standalone, human-readable text document structured with test IDs, inputs, execution steps, expected results, and actual pass/fail criteria.
  2. **In-App Edge Cases Viewer Tab**: Integrated into `ArchitectureDrawer.tsx` with a search filter, status indicators, and an instant one-click download button.
  3. **Direct Server Download Route**: `/api/download/edge-cases` and static URL `/VENXR_EDGE_CASES_AND_TEST_RESULTS.txt`.

---

## 2. Test Suite Breakdown by Assignment Area

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 VENXR ASSIGNMENT EDGE CASE SPECIFICATION                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Long-Running Chat & Memory                                               │
│    • TC-MEM-01: 100+ turns context window exceeding model capacity          │
│    • TC-MEM-02: Refer back to file contents uploaded 30 turns earlier       │
│    • TC-MEM-03: Thread resume after browser hard refresh (Postgres state)   │
│    • TC-MEM-04: Stop generation race condition and upstream cancel check    │
│    • TC-MEM-05: Rapid double-submission (debouncing & active stream lock)   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Any File In (Ingestion & Security Boundaries)                            │
│    • TC-FIN-01: Magic byte spoofing (.exe disguised as .pdf)                │
│    • TC-FIN-02: 0-byte empty file upload                                    │
│    • TC-FIN-03: File exceeding 25MB maximum threshold                       │
│    • TC-FIN-04: Password-protected / corrupted PDF handling                 │
│    • TC-FIN-05: ZIP bomb defense (>100MB uncompressed / >200 files)         │
│    • TC-FIN-06: Path traversal attempt (../../etc/passwd in ZIP archive)    │
│    • TC-FIN-07: Multi-file mixed batch (PDF + XLSX + PNG + ZIP in 1 prompt) │
│    • TC-FIN-08: Unsupported file format (.xyz, .bin) graceful failure       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Any File Out (Generation & Revision Pipeline)                            │
│    • TC-FOUT-01: Real downloadable file generation (CSV, DOCX, Code)        │
│    • TC-FOUT-02: Multi-turn revision loop ("Add a column", "Make shorter")  │
│    • TC-FOUT-03: Cross-format transformation (CSV dataset to DOCX report)   │
│    • TC-FOUT-04: Ambiguous generation request ("Make a file for me")        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. Agent (LangGraph) Routing & Reliability                                  │
│    • TC-AGT-01: Conditional router bypass (plain text skips file_parser)    │
│    • TC-AGT-02: Tool parser failure triggers bounded retry (max 2 attempts) │
│    • TC-AGT-03: Malformed model output captured by error boundary           │
│    • TC-AGT-04: Postgres checkpointer thread isolation & resume accuracy    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. Backend (Django ASGI & Network Resilience)                               │
│    • TC-NET-01: Upstream generator cancellation on client socket close      │
│    • TC-NET-02: HTTP 500 service failure captures rejectWithValue in Redux  │
│    • TC-NET-03: Rate limit 429 throttling backoff and retry UI trigger      │
│    • TC-NET-04: Mobile viewport layout integrity on complex data tables     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Steps

1. **Create Plain Text Document (`public/VENXR_EDGE_CASES_AND_TEST_RESULTS.txt`)**:
   - Write structured, cleanly formatted test cases with concrete inputs, expected responses, failure recovery steps, and verification commands.
2. **Add Server Download Route (`server.ts`)**:
   - Add `/api/download/edge-cases` endpoint serving the file as an attachment.
3. **Enhance In-App Presentation Drawer (`ArchitectureDrawer.tsx`)**:
   - Add a 5th tab: **"Edge Cases & QA"** (`activeTab === 'edgecases'`).
   - Include direct download link and interactive checklist with collapsible test categories.
4. **Compile & Lint Verification**:
   - Run `lint_applet` and `compile_applet` to verify clean build.
