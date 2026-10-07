"""
CareerLens - LinkedIn Profile Analyzer
Reads a candidate-provided LinkedIn profile PDF.
"""

import fitz
import os
import re


KNOWN_SKILLS = [
    "Python",
    "Java",
    "C",
    "C++",
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
    "AWS",
    "Azure",
    "Docker",
    "Kubernetes",
    "Power BI",
    "Figma"
]


def extract_linkedin_text(pdf_path):

    document = fitz.open(pdf_path)

    text = ""

    for page in document:
        text += page.get_text() + "\n"

    document.close()

    return text


def detect_linkedin_skills(text):

    detected = []

    text_lower = text.lower()

    for skill in KNOWN_SKILLS:

        if skill == "C":

            patterns = [
                r"\bc programming\b",
                r"\bc language\b"
            ]

            if any(
                re.search(pattern, text_lower)
                for pattern in patterns
            ):
                detected.append("C")

        elif skill == "C++":

            if "c++" in text_lower:
                detected.append("C++")

        else:

            pattern = (
                r"\b"
                + re.escape(skill.lower())
                + r"\b"
            )

            if re.search(pattern, text_lower):
                detected.append(skill)

    return detected


def detect_certifications(text):

    certifications = []

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    inside_section = False

    for line in lines:

        lower = line.lower()

        if (
            "licenses & certifications" in lower
            or "licenses and certifications" in lower
            or lower == "certifications"
        ):
            inside_section = True
            continue

        if inside_section:

            # Stop when another common LinkedIn section begins
            if lower in [
                "experience",
                "education",
                "skills",
                "projects",
                "volunteering",
                "honors & awards",
                "honors and awards"
            ]:
                break

            certifications.append(line)

    return certifications[:10]


def detect_headline(text):

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    # LinkedIn PDFs usually begin with name,
    # followed by headline/profile information.
    if len(lines) >= 2:
        return lines[1]

    return ""


def analyze_linkedin_pdf(
    pdf_path,
    linkedin_url=""
):

    if not os.path.exists(pdf_path):

        return {
            "status": "error",
            "message": "LinkedIn PDF not found."
        }

    try:

        text = extract_linkedin_text(
            pdf_path
        )

        skills = detect_linkedin_skills(
            text
        )

        certifications = detect_certifications(
            text
        )

        headline = detect_headline(
            text
        )


        evidence = []


        for skill in skills:

            evidence.append({
                "skill": skill,
                "source": "LinkedIn",
                "evidence_type": "professional_profile_claim",
                "strength": 50,
                "reason": (
                    f"{skill} appears in the "
                    "candidate-provided LinkedIn profile."
                ),
                "source_url": linkedin_url,
                "metrics": {}
            })


        return {
            "status": "success",
            "source": "LinkedIn",
            "profile_url": linkedin_url,
            "headline": headline,
            "skills": skills,
            "certifications": certifications,
            "evidence": evidence,
            "raw_text": text
        }


    except Exception as error:

        return {
            "status": "error",
            "message": str(error)
        }
