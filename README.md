# CareerLens — AI Career Readiness & Evidence Verification Platform

CareerLens is a multi-source employability and career-readiness analyzer built for campus placement use cases. It cross-verifies skills claimed on a candidate's resume against digital proof of work from GitHub, LeetCode, LinkedIn profile exports, and portfolio evidence, then generates an explainable readiness score, verified strengths, skill gaps, and an actionable roadmap.

## Live Demo

Frontend: https://careerlens-verification-engine-frontend.onrender.com

## GitHub Repository

https://github.com/Trishika182007/careerlens-verification-engine

## Problem

Student skills are usually scattered across resumes, coding platforms, professional profiles, and project repositories. Recruiters and placement teams often have to manually inspect these sources, while resume-only screening cannot reliably distinguish between claimed skills and demonstrated evidence.

CareerLens creates one unified career profile and evaluates how strongly each skill is supported by observable evidence.

## Core Features

- Resume PDF parsing and claimed-skill extraction
- GitHub repository and language/activity analysis
- LeetCode problem-solving evidence analysis
- LinkedIn profile PDF analysis
- Optional portfolio/Figma evidence support
- Cross-verification of resume claims against external evidence
- Verified / partially verified / unverified skill classification
- Target-role competency comparison
- Explainable career-readiness score
- Prioritized skill-gap detection
- Personalized milestone-based improvement roadmap
- Six-screen interactive CareerLens frontend

## System Flow

1. Candidate uploads a resume and selects a target role.
2. Candidate provides available evidence sources such as GitHub, LeetCode, LinkedIn, and portfolio links/files.
3. Source-specific analyzers extract structured evidence.
4. The verification engine combines evidence into a unified skill profile.
5. Candidate competencies are compared with the selected role benchmark.
6. CareerLens returns verified skills, evidence strength, readiness score, strengths, skill gaps, and a personalized roadmap.

## Architecture

```text
Resume PDF ───────────────► Resume Analyzer ───────┐
GitHub URL ───────────────► GitHub Analyzer ───────┤
LeetCode URL ─────────────► LeetCode Analyzer ─────┤
LinkedIn PDF / URL ───────► LinkedIn Analyzer ─────┤
Portfolio / Figma ────────► Portfolio Analyzer ────┤
                                                  ▼
                                      Verification Engine
                                                  ▼
                                      Unified Skill Profile
                                                  ▼
                                         Role Benchmark
                                                  ▼
                          Readiness + Strengths + Gaps + Roadmap
                                                  ▼
                                     CareerLens Frontend
```

## Tech Stack

### Frontend
- HTML
- JavaScript
- Tailwind CSS
- Client-side routing

### Backend
- Python
- FastAPI
- Uvicorn
- PyMuPDF / PDF text extraction
- Requests
- Rule-based evidence normalization and verification

## Main Backend Endpoint

```http
POST /api/analyze-profile
```

Inputs include:

- `resume` — required PDF
- `target_role`
- `github_url`
- `leetcode_url`
- `linkedin_url`
- `linkedin_pdf`
- `figma_url`

The API runs all available analyzers and sends the evidence to the verification engine.

## Project Structure

```text
careerlens-verification-engine/
├── index.html
├── app.js
├── data.js
├── api_server.py
├── resume_analyzer.py
├── github_analyzer.py
├── leetcode_analyzer.py
├── linkedin_analyzer.py
├── portfolio_evidence.py
├── verification_engine.py
├── roles.json
├── requirements.txt
├── .env.example
└── README.md
```

## Run Locally

Clone the repository:

```bash
git clone https://github.com/Trishika182007/careerlens-verification-engine.git
cd careerlens-verification-engine
```

Install dependencies:

```bash
python3 -m pip install -r requirements.txt
```

Start the backend:

```bash
python3 -m uvicorn api_server:app --reload --port 8000
```

Run the frontend in another terminal:

```bash
python3 -m http.server 3000
```

Then open the frontend in your browser.

## Evidence Philosophy

CareerLens does not treat missing evidence as proof that a candidate lacks a skill.

- **Verified** — supported by strong external evidence
- **Partially Verified** — some supporting evidence exists
- **Unverified** — insufficient submitted evidence

## Target Role Analysis

Candidate evidence is compared with competency requirements stored in `roles.json`. The verification engine calculates a readiness score and identifies the highest-priority gaps for the selected career path.

## Current Prototype Status

The current prototype includes the multi-source analyzers, verification engine, role comparison logic, readiness scoring, skill-gap analysis, roadmap logic, and interactive frontend.

CareerLens is an explainable placement-readiness decision-support tool, not a guarantee of employability.

## Future Improvements

- Approved LinkedIn OAuth/API integration
- Additional coding and design-platform connectors
- Database-backed candidate history
- Placement-cohort analytics
- Automated evidence re-verification
- Expanded role competency library
- Production authentication and deployment hardening

## DataQuest 3.0

CareerLens was developed as a hackathon project for DataQuest 3.0.
