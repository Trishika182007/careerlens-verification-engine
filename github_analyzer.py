"""
CareerLens - GitHub Evidence Analyzer
"""

import os
import re
import requests
from dotenv import load_dotenv


load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")


def extract_github_username(github_url):

    if not github_url:
        return None

    github_url = github_url.strip().rstrip("/")

    match = re.search(
        r"github\.com/([^/?#]+)",
        github_url
    )

    if match:
        return match.group(1)

    if "/" not in github_url:
        return github_url

    return None


def make_evidence(
    skill,
    strength,
    reason,
    source_url,
    metrics=None
):

    return {
        "skill": skill,
        "source": "GitHub",
        "evidence_type": "repository_activity",
        "strength": max(0, min(int(strength), 100)),
        "reason": reason,
        "source_url": source_url,
        "metrics": metrics or {}
    }


def analyze_github(github_url):

    username = extract_github_username(github_url)

    if not username:

        return {
            "status": "error",
            "message": "Invalid GitHub URL."
        }


    headers = {
        "Accept": "application/vnd.github+json"
    }

    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"


    try:

        # Get GitHub user
        user_response = requests.get(
            f"https://api.github.com/users/{username}",
            headers=headers,
            timeout=15
        )

        if user_response.status_code == 404:

            return {
                "status": "error",
                "message": "GitHub user not found."
            }

        user_response.raise_for_status()

        user_data = user_response.json()


        # Get repositories
        repos_response = requests.get(
            f"https://api.github.com/users/{username}/repos",
            params={
                "per_page": 100,
                "sort": "updated"
            },
            headers=headers,
            timeout=15
        )

        repos_response.raise_for_status()

        repos = repos_response.json()


        # Ignore forked repositories
        original_repos = [
            repo
            for repo in repos
            if not repo.get("fork")
        ]


        language_counts = {}

        total_stars = 0


        for repo in original_repos:

            language = repo.get("language")

            if language:

                language_counts[language] = (
                    language_counts.get(language, 0) + 1
                )

            total_stars += repo.get(
                "stargazers_count",
                0
            )


        evidence = []


        for language, repo_count in language_counts.items():

            strength = min(
                40 + repo_count * 10,
                95
            )

            evidence.append(
                make_evidence(
                    skill=language,
                    strength=strength,
                    reason=(
                        f"{language} is the primary language "
                        f"in {repo_count} public repositories."
                    ),
                    source_url=f"https://github.com/{username}",
                    metrics={
                        "repository_count": repo_count
                    }
                )
            )


        return {
            "status": "success",
            "source": "GitHub",
            "username": username,
            "name": user_data.get("name"),
            "profile_url": user_data.get("html_url"),
            "public_repositories": len(original_repos),
            "followers": user_data.get("followers", 0),
            "total_stars": total_stars,
            "languages": language_counts,
            "evidence": evidence
        }


    except requests.exceptions.RequestException as error:

        return {
            "status": "error",
            "message": str(error)
        }
