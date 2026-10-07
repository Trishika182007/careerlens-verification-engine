"""
CareerLens - LeetCode Evidence Analyzer
"""

import re
import requests


def extract_leetcode_username(leetcode_url):

    if not leetcode_url:
        return None

    leetcode_url = leetcode_url.strip().rstrip("/")

    match = re.search(
        r"leetcode\.com/(?:u/)?([^/?#]+)",
        leetcode_url
    )

    if match:
        return match.group(1)

    if "/" not in leetcode_url:
        return leetcode_url

    return None


def analyze_leetcode(leetcode_url):

    username = extract_leetcode_username(leetcode_url)

    if not username:
        return {
            "status": "error",
            "message": "Invalid LeetCode URL."
        }


    query = """
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
        }
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
    """


    headers = {
        "Content-Type": "application/json",
        "Referer": f"https://leetcode.com/u/{username}/",
        "User-Agent": "Mozilla/5.0"
    }


    try:

        response = requests.post(
            "https://leetcode.com/graphql",
            json={
                "query": query,
                "variables": {
                    "username": username
                }
            },
            headers=headers,
            timeout=20
        )

        response.raise_for_status()

        result = response.json()

        user = result.get("data", {}).get("matchedUser")

        if not user:
            return {
                "status": "error",
                "message": "LeetCode user not found."
            }


        stats = user["submitStats"]["acSubmissionNum"]

        solved = {}

        for item in stats:
            solved[item["difficulty"]] = item["count"]


        total = solved.get("All", 0)
        easy = solved.get("Easy", 0)
        medium = solved.get("Medium", 0)
        hard = solved.get("Hard", 0)


        # Simple MVP coding-strength score
        strength = min(
            30
            + easy * 0.2
            + medium * 0.5
            + hard * 1.0,
            100
        )


        evidence = [
            {
                "skill": "Data Structures and Algorithms",
                "source": "LeetCode",
                "evidence_type": "problem_solving",
                "strength": int(strength),
                "reason": (
                    f"Solved {total} problems: "
                    f"{easy} Easy, "
                    f"{medium} Medium, "
                    f"{hard} Hard."
                ),
                "source_url": (
                    f"https://leetcode.com/u/{username}/"
                ),
                "metrics": {
                    "total_solved": total,
                    "easy_solved": easy,
                    "medium_solved": medium,
                    "hard_solved": hard,
                    "ranking": user.get(
                        "profile", {}
                    ).get("ranking")
                }
            }
        ]


        return {
            "status": "success",
            "source": "LeetCode",
            "username": username,
            "total_solved": total,
            "easy_solved": easy,
            "medium_solved": medium,
            "hard_solved": hard,
            "ranking": user.get(
                "profile", {}
            ).get("ranking"),
            "evidence": evidence
        }


    except requests.exceptions.RequestException as error:

        return {
            "status": "error",
            "message": str(error)
        }

    except Exception as error:

        return {
            "status": "error",
            "message": str(error)
        }
