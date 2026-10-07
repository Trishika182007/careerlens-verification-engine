"""
CareerLens - Resume Analyzer
Person 1 Module
"""

import fitz
import os
import re


SKILLS = [
    "Python",
    "Java",
    "C++",
    "C",
    "JavaScript",
    "React",
    "Node.js",
    "SQL",
    "MongoDB",
    "HTML",
    "CSS",
    "Git",
    "GitHub",
    "Machine Learning",
    "Deep Learning",
    "Data Structures",
    "Algorithms",
    "FastAPI",
    "Flask",
    "Django",
    "AWS"
]


def extract_resume_text(pdf_path):

    document = fitz.open(pdf_path)

    text = ""

    for page in document:
        text += page.get_text() + "\n"

    document.close()

    return text


def detect_skills(text):

    detected = []
    text_lower = text.lower()

    for skill in SKILLS:

        # C needs special handling because it is a single letter
        if skill == "C":
            c_patterns = [
                r"\bc programming\b",
                r"\bc language\b",
                r"\bc/c\+\+\b"
            ]

            if any(re.search(pattern, text_lower) for pattern in c_patterns):
                detected.append("C")

        elif skill == "C++":
            if re.search(r"\bc\+\+\b", text_lower):
                detected.append("C++")

        elif skill == "Node.js":
            if "node.js" in text_lower or "nodejs" in text_lower:
                detected.append("Node.js")

        else:
            pattern = r"\b" + re.escape(skill.lower()) + r"\b"

            if re.search(pattern, text_lower):
                detected.append(skill)

    return detected
def analyze_resume(pdf_path):

    if not os.path.exists(pdf_path):

        return {
            "status": "error",
            "message": "Resume file not found."
        }

    try:

        text = extract_resume_text(pdf_path)

        skills = detect_skills(text)

        return {
            "status": "success",
            "source": "Resume",
            "filename": os.path.basename(pdf_path),
            "claimed_skills": skills,
            "raw_text": text
        }

    except Exception as error:

        return {
            "status": "error",
            "message": str(error)
        }
