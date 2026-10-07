"""
CareerLens local API
Person 4 integration server.

Run:
    uvicorn api_server:app --reload --port 8000

The endpoint accepts a resume PDF plus optional LinkedIn PDF and public
profile URLs, runs the existing analyzers, then sends all evidence to the
Person 4 verification engine.
"""

import os
import shutil
import tempfile
from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from resume_analyzer import analyze_resume
from github_analyzer import analyze_github
from leetcode_analyzer import analyze_leetcode
from linkedin_analyzer import analyze_linkedin_pdf
from portfolio_evidence import analyze_figma
from verification_engine import verify_candidate, load_roles


app = FastAPI(
    title="CareerLens API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_LAST_RESULT = {}


def _save_upload(upload: Optional[UploadFile], directory: str):
    if not upload or not upload.filename:
        return None

    path = os.path.join(
        directory,
        os.path.basename(upload.filename),
    )

    with open(path, "wb") as target:
        shutil.copyfileobj(upload.file, target)

    return path


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "CareerLens"}


@app.get("/api/roles")
def roles():
    return load_roles()


@app.post("/api/analyze-profile")
async def analyze_profile(
    resume: UploadFile = File(...),
    target_role: str = Form(...),
    github_url: str = Form(""),
    leetcode_url: str = Form(""),
    linkedin_url: str = Form(""),
    figma_url: str = Form(""),
    linkedin_pdf: Optional[UploadFile] = File(None),
):
    """
    One local integration endpoint for the current hackathon flow.
    Resume is required. Other evidence sources are optional.
    """

    global _LAST_RESULT

    with tempfile.TemporaryDirectory(prefix="careerlens_") as temp_dir:
        resume_path = _save_upload(resume, temp_dir)
        linkedin_pdf_path = _save_upload(linkedin_pdf, temp_dir)

        resume_result = analyze_resume(resume_path)
        github_result = (
            analyze_github(github_url)
            if github_url.strip()
            else {"status": "not_provided", "evidence": []}
        )
        leetcode_result = (
            analyze_leetcode(leetcode_url)
            if leetcode_url.strip()
            else {"status": "not_provided", "evidence": []}
        )
        linkedin_result = (
            analyze_linkedin_pdf(
                linkedin_pdf_path,
                linkedin_url=linkedin_url,
            )
            if linkedin_pdf_path
            else {"status": "not_provided", "evidence": []}
        )
        portfolio_result = (
            analyze_figma(figma_url)
            if figma_url.strip()
            else {"status": "not_provided", "evidence": []}
        )

        result = verify_candidate(
            resume_result=resume_result,
            github_result=github_result,
            leetcode_result=leetcode_result,
            linkedin_result=linkedin_result,
            portfolio_result=portfolio_result,
            target_role=target_role,
        )

        response = {
            "status": result.get("status", "success"),
            "analysis": result,
            "sources": {
                "resume": resume_result,
                "github": github_result,
                "leetcode": leetcode_result,
                "linkedin": linkedin_result,
                "figma": portfolio_result,
            },
        }

        _LAST_RESULT = response
        return response


@app.get("/api/readiness/{target_role}")
def readiness(target_role: str):
    """
    Returns the most recent analysis for a role if it was already run.
    This keeps the README-style GET route while the actual analysis remains
    POST-based because PDFs and profile URLs are input data.
    """

    if not _LAST_RESULT:
        return {
            "status": "not_ready",
            "message": "Run POST /api/analyze-profile first.",
        }

    analysis = _LAST_RESULT.get("analysis", {})

    if analysis.get("target_role") != target_role:
        return {
            "status": "not_found",
            "message": f"No recent analysis for role: {target_role}",
        }

    return {
        "target_role": target_role,
        "readiness_score": analysis.get("readiness_score", 0),
        "strengths": analysis.get("strengths", []),
        "skill_gaps": analysis.get("skill_gaps", []),
        "pillars": analysis.get("pillars", {}),
        "corroboration_score": analysis.get("corroboration_score", 0),
    }


@app.get("/api/evidence-verification")
def evidence_verification():
    if not _LAST_RESULT:
        return {
            "status": "not_ready",
            "message": "Run POST /api/analyze-profile first.",
        }

    analysis = _LAST_RESULT.get("analysis", {})

    return {
        "status": "success",
        "target_role": analysis.get("target_role"),
        "corroboration_score": analysis.get("corroboration_score", 0),
        "verified_skills": analysis.get("verified_skills", []),
    }
