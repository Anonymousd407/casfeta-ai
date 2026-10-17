# CASFETA Blueprint — ContractShield AI

## Goal
Help students, small businesses and individuals spot potentially problematic contract clauses through explainable, evidence-backed screening.

## Flow
Web frontend → FastAPI → text extractor (PDF/DOCX/TXT) → deterministic rule engine → optional opt-in LLM explanations → SQLite report store → report dashboard and PDF export.

## Pages
Overview, Analyze Contract, Risk Report, History, Settings.

## Delivery milestones
1. Frontend, responsive navigation, visual design
2. FastAPI input validation and extraction
3. Risk screening engine and citations into source excerpts
4. SQLite history and PDF reports
5. Optional AI notes (requires API key)
6. Automated tests, production build, demo preparation

## Out of scope in MVP
Legal advice, scanned PDF OCR, user authentication, multi-user SaaS, robust multi-language support, legal jurisdiction-specific interpretation, production-grade threat defenses.

## Team
Frontend: Sospiter, Amosi, Emmanuel, Victoria, Glory, Everlin, Rain, Lazaro, Ezekiel.
Backend: Shedracc, Sospiter, Amos, Emmanuel, others.
