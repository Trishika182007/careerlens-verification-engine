"""
CareerLens - Person 3
Design + Professional Evidence Module

Figma evidence analyzer used by Person 4.
"""

import os
import re
import json
import requests

from typing import Any, Dict, Optional
from dotenv import load_dotenv


load_dotenv()
FIGMA_TOKEN = os.getenv("FIGMA_TOKEN")


def make_evidence(
    skill: str,
    source: str,
    evidence_type: str,
    strength: int,
    reason: str,
    source_url: Optional[str] = None,
    metrics: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:

    strength = max(0, min(int(strength), 100))

    return {
        "skill": skill,
        "source": source,
        "evidence_type": evidence_type,
        "strength": strength,
        "reason": reason,
        "source_url": source_url,
        "metrics": metrics if metrics is not None else {},
    }


def extract_figma_file_key(figma_url):
    if not figma_url:
        return None

    match = re.search(
        r"figma\.com/(?:design|file|proto)/([^/?]+)",
        figma_url,
    )

    return match.group(1) if match else None


def count_figma_nodes(node, counts):
    node_type = node.get("type", "")

    if node_type == "CANVAS":
        counts["pages"] += 1
    elif node_type == "FRAME":
        counts["frames"] += 1
    elif node_type == "COMPONENT":
        counts["components"] += 1
    elif node_type == "COMPONENT_SET":
        counts["component_sets"] += 1

    interactions = node.get("interactions", [])
    if interactions:
        counts["interactions"] += len(interactions)

    for child in node.get("children", []):
        count_figma_nodes(child, counts)


def analyze_figma(figma_url):

    if not figma_url:
        return {"status": "not_provided", "evidence": []}

    file_key = extract_figma_file_key(figma_url)

    if not file_key:
        return {
            "status": "invalid_url",
            "message": "Could not extract Figma file key.",
            "evidence": [],
        }

    if not FIGMA_TOKEN:
        return {
            "status": "token_missing",
            "message": "FIGMA_TOKEN was not found in .env",
            "evidence": [],
        }

    api_url = f"https://api.figma.com/v1/files/{file_key}"
    headers = {"X-Figma-Token": FIGMA_TOKEN}

    try:
        response = requests.get(
            api_url,
            headers=headers,
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as error:
        return {
            "status": "error",
            "message": str(error),
            "evidence": [],
        }

    counts = {
        "pages": 0,
        "frames": 0,
        "components": 0,
        "component_sets": 0,
        "interactions": 0,
    }

    count_figma_nodes(data.get("document", {}), counts)

    evidence = []

    ui_strength = min(
        20
        + counts["pages"] * 5
        + counts["frames"] * 3
        + counts["components"] * 4,
        100,
    )

    evidence.append(
        make_evidence(
            skill="UI/UX Design",
            source="Figma",
            evidence_type="design_project",
            strength=ui_strength,
            reason=(
                f"{counts['pages']} pages, "
                f"{counts['frames']} frames and "
                f"{counts['components']} reusable components found."
            ),
            source_url=figma_url,
            metrics={
                "pages": counts["pages"],
                "frames": counts["frames"],
                "components": counts["components"],
            },
        )
    )

    if counts["interactions"] > 0:
        prototype_strength = min(
            40 + counts["interactions"] * 5,
            100,
        )
        evidence.append(
            make_evidence(
                skill="Prototyping",
                source="Figma",
                evidence_type="interactive_prototype",
                strength=prototype_strength,
                reason=(
                    f"{counts['interactions']} prototype interactions found."
                ),
                source_url=figma_url,
                metrics={
                    "prototype_interactions": counts["interactions"]
                },
            )
        )

    total_components = (
        counts["components"] + counts["component_sets"]
    )

    if total_components > 0:
        design_system_strength = min(
            35 + total_components * 5,
            100,
        )
        evidence.append(
            make_evidence(
                skill="Design Systems",
                source="Figma",
                evidence_type="reusable_components",
                strength=design_system_strength,
                reason=(
                    f"{total_components} reusable components "
                    "or component sets found."
                ),
                source_url=figma_url,
                metrics={
                    "components": counts["components"],
                    "component_sets": counts["component_sets"],
                },
            )
        )

    return {
        "status": "success",
        "source": "Figma",
        "file_name": data.get("name"),
        "last_modified": data.get("lastModified"),
        "metrics": counts,
        "evidence": evidence,
    }


if __name__ == "__main__":
    print(json.dumps(analyze_figma(input("Enter Figma file URL: ")), indent=2))
