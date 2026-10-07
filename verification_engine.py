"""
CareerLens - Person 4
Verification + Role Readiness Engine

Consumes normalized evidence from the existing CareerLens analyzers and
produces:
- verified skills
- evidence confidence
- role readiness
- strengths
- skill gaps
- readiness pillars

The public functions remain compatible with the original engine while adding
Figma/portfolio support and more explicit role requirements.
"""

import json
import os
from typing import Any, Dict, Iterable, List, Optional


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROLES_FILE = os.path.join(BASE_DIR, "roles.json")


# ---------------------------------------------------------------------------
# SKILL NORMALIZATION
# ---------------------------------------------------------------------------

ALIASES = {
    "dsa": "Data Structures and Algorithms",
    "data structures": "Data Structures and Algorithms",
    "algorithms": "Data Structures and Algorithms",
    "problem solving": "Data Structures and Algorithms",

    "js": "JavaScript",
    "javascript": "JavaScript",

    "nodejs": "Node.js",
    "node.js": "Node.js",

    "ml": "Machine Learning",
    "machine learning": "Machine Learning",

    "dl": "Deep Learning",
    "deep learning": "Deep Learning",

    "github": "GitHub",
    "git": "Git",

    "ui ux": "UI/UX Design",
    "ui/ux": "UI/UX Design",
    "ux design": "UI/UX Design",
    "ui design": "UI/UX Design",

    "design system": "Design Systems",
    "design systems": "Design Systems",

    "rest api": "REST API",
    "rest apis": "REST API",

    "postgresql": "SQL",
    "mysql": "SQL",
}


def normalize_skill(skill: Any) -> str:
    if skill is None:
        return ""

    clean = str(skill).strip()
    if not clean:
        return ""

    return ALIASES.get(clean.lower(), clean)


# ---------------------------------------------------------------------------
# ROLE CONFIG
# ---------------------------------------------------------------------------

def load_roles() -> Dict[str, Any]:
    with open(ROLES_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


# ---------------------------------------------------------------------------
# EVIDENCE NORMALIZATION
# ---------------------------------------------------------------------------

def _safe_strength(value: Any) -> int:
    try:
        return max(0, min(int(float(value)), 100))
    except (TypeError, ValueError):
        return 0


def _iter_evidence(results: Iterable[Optional[Dict[str, Any]]]):
    """
    Yield only evidence records. This accepts the output of all current
    analyzers, including modules that return no evidence on failure.
    """
    for result in results:
        if not isinstance(result, dict):
            continue

        evidence_list = result.get("evidence", [])
        if not isinstance(evidence_list, list):
            continue

        for evidence in evidence_list:
            if isinstance(evidence, dict):
                yield evidence


# ---------------------------------------------------------------------------
# BUILD UNIFIED SKILL PROFILE
# ---------------------------------------------------------------------------

def build_skill_profile(
    resume_result: Optional[Dict[str, Any]],
    github_result: Optional[Dict[str, Any]],
    leetcode_result: Optional[Dict[str, Any]],
    linkedin_result: Optional[Dict[str, Any]],
    portfolio_result: Optional[Dict[str, Any]] = None,
    extra_results: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Merge resume claims and evidence from every analyzer.

    portfolio_result is optional so old callers using the original four
    arguments continue to work.
    """

    resume_result = resume_result or {}
    github_result = github_result or {}
    leetcode_result = leetcode_result or {}
    linkedin_result = linkedin_result or {}
    portfolio_result = portfolio_result or {}

    skills: Dict[str, Dict[str, Any]] = {}

    def ensure_skill(skill: Any):
        normalized = normalize_skill(skill)
        if not normalized:
            return None

        if normalized not in skills:
            skills[normalized] = {
                "skill": normalized,
                "claimed_in_resume": False,
                "sources": [],
                "evidence": [],
                "best_strength": 0,
            }

        return skills[normalized]

    # Resume claims are claims, not evidence.
    for skill in resume_result.get("claimed_skills", []):
        record = ensure_skill(skill)
        if record:
            record["claimed_in_resume"] = True
            if "Resume" not in record["sources"]:
                record["sources"].append("Resume")

    evidence_results = [
        github_result,
        leetcode_result,
        linkedin_result,
        portfolio_result,
    ]

    if extra_results:
        evidence_results.extend(extra_results)

    for evidence in _iter_evidence(evidence_results):
        record = ensure_skill(evidence.get("skill"))
        if not record:
            continue

        source = str(evidence.get("source", "Unknown")).strip() or "Unknown"

        if source not in record["sources"]:
            record["sources"].append(source)

        clean_evidence = dict(evidence)
        clean_evidence["skill"] = record["skill"]
        clean_evidence["strength"] = _safe_strength(
            evidence.get("strength", 0)
        )
        clean_evidence.setdefault("source_url", None)
        clean_evidence.setdefault("metrics", {})
        clean_evidence.setdefault("reason", "")

        record["evidence"].append(clean_evidence)
        record["best_strength"] = max(
            record["best_strength"],
            clean_evidence["strength"],
        )

    output: List[Dict[str, Any]] = []

    # Strong independent proof sources.
    strong_proof_sources = {"GitHub", "LeetCode", "Figma"}

    for skill, record in skills.items():
        strong_sources = sorted(
            {
                evidence.get("source")
                for evidence in record["evidence"]
                if evidence.get("source") in strong_proof_sources
                and _safe_strength(evidence.get("strength", 0)) >= 50
            }
        )

        independent_sources = {
            evidence.get("source")
            for evidence in record["evidence"]
            if evidence.get("source")
        }

        if strong_sources:
            status = "Verified"
            confidence = max(record["best_strength"], 60)

        elif (
            record["claimed_in_resume"]
            and "LinkedIn" in record["sources"]
        ):
            status = "Partially Verified"
            confidence = max(record["best_strength"], 45)

        elif record["claimed_in_resume"]:
            status = "Unverified"
            confidence = 30

        elif record["evidence"]:
            status = "Evidence Found"
            confidence = max(record["best_strength"], 40)

        else:
            status = "Unverified"
            confidence = 20

        # A second independent evidence source increases confidence slightly,
        # but never above 100.
        if len(independent_sources) >= 2 and status in {
            "Verified",
            "Partially Verified",
            "Evidence Found",
        }:
            confidence = min(confidence + 5, 100)

        output.append({
            "skill": skill,
            "status": status,
            "confidence": min(_safe_strength(confidence), 100),
            "claimed_in_resume": record["claimed_in_resume"],
            "sources": record["sources"],
            "evidence": record["evidence"],
        })

    return sorted(output, key=lambda item: item["skill"].lower())


# ---------------------------------------------------------------------------
# READINESS PILLARS
# ---------------------------------------------------------------------------

def _average(values: List[float]) -> float:
    return round(sum(values) / len(values), 1) if values else 0.0


def calculate_readiness_pillars(
    verified_skills: List[Dict[str, Any]],
    target_role: str,
) -> Dict[str, float]:
    """
    Derives the six dashboard pillars from the same evidence used for role
    readiness. These are diagnostic indicators, not separate claims.
    """

    roles = load_roles()
    role = roles.get(target_role)
    if not role:
        return {}

    requirements = role["requirements"]
    lookup = {
        normalize_skill(item.get("skill", "")).lower(): item
        for item in verified_skills
    }

    required_confidences = []
    evidence_backed = []
    source_counts = []
    activity_values = []

    for skill_name, spec in requirements.items():
        candidate = lookup.get(normalize_skill(skill_name).lower())
        confidence = (
            _safe_strength(candidate.get("confidence", 0))
            if candidate
            else 0
        )
        required_confidences.append(confidence)

        if candidate and candidate.get("evidence"):
            evidence_backed.append(confidence)

        if candidate:
            source_counts.append(
                min(len(candidate.get("sources", [])) * 25, 100)
            )

        for evidence in (candidate or {}).get("evidence", []):
            metrics = evidence.get("metrics") or {}
            source = evidence.get("source")

            if source == "GitHub":
                repo_count = metrics.get("repository_count", 0)
                activity_values.append(min(40 + int(repo_count) * 10, 100))

            elif source == "LeetCode":
                solved = metrics.get("total_solved", 0)
                activity_values.append(min(30 + int(solved) * 0.25, 100))

    coverage = (
        sum(1 for value in required_confidences if value >= 60)
        / len(required_confidences)
        * 100
        if required_confidences
        else 0
    )

    return {
        "tech_skills": _average(required_confidences),
        "evidence": _average(evidence_backed),
        "quality": _average(
            [value for value in required_confidences if value > 0]
        ),
        "activity": _average(activity_values),
        "consistency": _average(source_counts),
        "coverage": round(coverage, 1),
    }


# ---------------------------------------------------------------------------
# ROLE READINESS
# ---------------------------------------------------------------------------

def calculate_role_readiness(
    verified_skills: List[Dict[str, Any]],
    target_role: str,
) -> Dict[str, Any]:

    roles = load_roles()

    if target_role not in roles:
        return {
            "status": "error",
            "message": f"Unknown target role: {target_role}",
        }

    role = roles[target_role]
    requirements = role["requirements"]

    skill_lookup = {
        normalize_skill(item.get("skill", "")).lower(): item
        for item in verified_skills
    }

    weighted_score = 0.0
    total_weight = 0.0
    strengths = []
    gaps = []

    for skill, spec in requirements.items():
        # Backward-compatible support for a numeric role definition.
        if isinstance(spec, (int, float)):
            weight = float(spec)
            required_level = 60
        else:
            weight = float(spec.get("weight", 1))
            required_level = int(spec.get("required_level", 60))

        total_weight += weight

        candidate = skill_lookup.get(
            normalize_skill(skill).lower()
        )

        confidence = (
            _safe_strength(candidate.get("confidence", 0))
            if candidate
            else 0
        )

        # A skill contributes according to both confidence and the role's
        # required proficiency threshold.
        normalized_match = min(
            confidence / max(required_level, 1),
            1.0,
        )
        contribution = normalized_match * weight
        weighted_score += contribution

        if confidence >= required_level:
            strengths.append({
                "skill": skill,
                "score": confidence,
                "required_level": required_level,
                "status": candidate.get("status", "Unknown"),
            })
        else:
            gap_size = max(required_level - confidence, 0)
            gaps.append({
                "skill": skill,
                "current_score": confidence,
                "required_level": required_level,
                "priority": weight,
                "gap": gap_size,
            })

    readiness = (
        round(weighted_score / total_weight * 100, 1)
        if total_weight
        else 0.0
    )

    gaps.sort(
        key=lambda item: (item["priority"], item["gap"]),
        reverse=True,
    )

    return {
        "status": "success",
        "target_role": target_role,
        "role_name": role.get("name", target_role),
        "readiness_score": readiness,
        "strengths": strengths,
        "skill_gaps": gaps,
        "requirements": requirements,
        "pillars": calculate_readiness_pillars(
            verified_skills,
            target_role,
        ),
    }


# ---------------------------------------------------------------------------
# COMPLETE PIPELINE
# ---------------------------------------------------------------------------

def verify_candidate(
    resume_result: Optional[Dict[str, Any]],
    github_result: Optional[Dict[str, Any]],
    leetcode_result: Optional[Dict[str, Any]],
    linkedin_result: Optional[Dict[str, Any]],
    target_role: str,
    portfolio_result: Optional[Dict[str, Any]] = None,
    extra_results: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:

    verified_skills = build_skill_profile(
        resume_result,
        github_result,
        leetcode_result,
        linkedin_result,
        portfolio_result,
        extra_results,
    )

    role_result = calculate_role_readiness(
        verified_skills,
        target_role,
    )

    if role_result.get("status") == "error":
        return role_result

    total_skills = len(verified_skills)
    corroborated = sum(
        1
        for item in verified_skills
        if item.get("status") == "Verified"
    )

    corroboration_score = round(
        corroborated / total_skills * 100,
        1,
    ) if total_skills else 0.0

    return {
        "status": "success",
        "target_role": target_role,
        "role_name": role_result.get("role_name", target_role),
        "verified_skills": verified_skills,
        "readiness_score": role_result.get("readiness_score", 0),
        "strengths": role_result.get("strengths", []),
        "skill_gaps": role_result.get("skill_gaps", []),
        "requirements": role_result.get("requirements", {}),
        "pillars": role_result.get("pillars", {}),
        "corroboration_score": corroboration_score,
    }


if __name__ == "__main__":
    # Small smoke test with no external APIs.
    result = verify_candidate(
        resume_result={
            "claimed_skills": ["Python", "Docker", "UI/UX Design"]
        },
        github_result={
            "evidence": [{
                "skill": "Python",
                "source": "GitHub",
                "evidence_type": "repository_activity",
                "strength": 80,
                "reason": "Python used in 4 public repositories.",
                "source_url": "https://github.com/example",
                "metrics": {"repository_count": 4},
            }]
        },
        leetcode_result={
            "evidence": [{
                "skill": "Data Structures and Algorithms",
                "source": "LeetCode",
                "evidence_type": "problem_solving",
                "strength": 72,
                "reason": "Solved 100 problems.",
                "source_url": "https://leetcode.com/u/example/",
                "metrics": {"total_solved": 100},
            }]
        },
        linkedin_result={"evidence": []},
        portfolio_result={
            "evidence": [{
                "skill": "UI/UX Design",
                "source": "Figma",
                "evidence_type": "design_project",
                "strength": 82,
                "reason": "Multiple Figma frames and components found.",
                "source_url": "https://www.figma.com/design/example",
                "metrics": {"frames": 10, "components": 5},
            }]
        },
        target_role="ml_engineer",
    )

    print(json.dumps(result, indent=2))
