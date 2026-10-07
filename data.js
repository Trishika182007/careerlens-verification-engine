/*
 * CareerLens backend data bridge.
 * Person 4 Integration Bridge
 *
 * Load this file before app.js.
 * Preserves the window.careerLensData and window.CareerLensAPI contract
 * while bridging live backend responses to the frontend.
 */

(function () {
  "use strict";

  const API_BASE = window.CAREERLENS_API_BASE || "http://localhost:8000";

  window.careerLensData = window.careerLensData || {
    candidate: {},
    evidenceSkills: {},
    analysis: {},
    sources: {},
    // Profile links configured by the candidate in Profile Setup form
    profileLinks: {
      github_url: '',
      leetcode_url: '',
      linkedin_url: '',
      figma_url: ''
    }
  };

  function badgeForStatus(status) {
    switch (status) {
      case "Verified":
        return {
          badgeText: "Verified",
          badgeClass: "bg-tertiary-container text-tertiary-fixed",
          badgeIcon: "verified"
        };
      case "Partially Verified":
        return {
          badgeText: "Partial",
          badgeClass: "bg-secondary-fixed text-on-secondary-fixed",
          badgeIcon: "warning"
        };
      case "Evidence Found":
        return {
          badgeText: "Evidence Found",
          badgeClass: "bg-secondary-container text-on-secondary",
          badgeIcon: "check_circle"
        };
      default:
        return {
          badgeText: "Unverified",
          badgeClass: "bg-surface-container-high text-outline",
          badgeIcon: "radio_button_unchecked"
        };
    }
  }

  function evidenceActivity(item) {
    const evidence = item.evidence || [];
    if (!evidence.length) {
      return item.claimed_in_resume
        ? "Claimed on resume; no external repository or platform commit activity found."
        : "No independent digital evidence found.";
    }

    return evidence.map(function (entry) {
      const source = entry.source || "Evidence";
      const reason = entry.reason || "Recorded.";
      return `${source}: ${reason}`;
    }).join(" • ");
  }

  function evidenceSources(item) {
    const list = item.sources || [];
    return list.join(" • ") || (item.claimed_in_resume ? "Resume only" : "None detected");
  }

  function toEvidenceSkills(verifiedSkills) {
    const result = {};

    (verifiedSkills || []).forEach(function (item) {
      const badge = badgeForStatus(item.status);
      const skillName = item.skill || "";
      const safeKey = skillName.toLowerCase().replace(/[^a-z0-9]/g, '_');

      const entry = {
        key: safeKey,
        title: skillName,
        badgeText: badge.badgeText,
        badgeClass: badge.badgeClass,
        badgeIcon: badge.badgeIcon,
        sources: evidenceSources(item),
        activity: evidenceActivity(item),
        rationale: item.evidence && item.evidence.length
          ? item.evidence.map(function (e) {
              return e.reason || "";
            }).filter(Boolean).join(" ")
          : (item.claimed_in_resume
              ? "This skill is cited on the resume without external code commits or independent platform artifacts."
              : "No independent digital evidence recorded yet."),
        level: `Estimated: <strong>${item.confidence}% confidence</strong> (${item.status})`,
        status: item.status,
        confidence: item.confidence,
        claimed_in_resume: !!item.claimed_in_resume,
        raw: item
      };

      // Multi-index for robust lookup
      result[safeKey] = entry;
      result[skillName] = entry;
      result[skillName.toLowerCase()] = entry;
    });

    return result;
  }

  function applyAnalysis(response) {
    if (!response || !response.analysis) return;

    const analysis = response.analysis;

    window.careerLensData.analysis = analysis;
    window.careerLensData.sources = response.sources || {};
    window.careerLensData.evidenceSkills =
      toEvidenceSkills(analysis.verified_skills || []);

    window.careerLensData.candidate =
      window.careerLensData.candidate || {};

    window.careerLensData.candidate.targetRole =
      analysis.role_name || analysis.target_role;

    window.careerLensData.candidate.readinessScore =
      analysis.readiness_score;

    window.careerLensData.candidate.corroborationScore =
      analysis.corroboration_score;

    window.dispatchEvent(
      new CustomEvent("careerlens:analysis-ready", {
        detail: response
      })
    );
  }

  async function analyzeProfile(formData) {
    let response;
    try {
      response = await fetch(
        `${API_BASE}/api/analyze-profile`,
        {
          method: "POST",
          body: formData
        }
      );
    } catch (networkError) {
      throw new Error(`Cannot connect to backend server at ${API_BASE}. Ensure "uvicorn api_server:app --reload --port 8000" is running.`);
    }

    if (!response.ok) {
      let errorMsg = `Backend returned HTTP ${response.status}`;
      try {
        const text = await response.text();
        const parsed = JSON.parse(text);
        if (parsed.detail) {
          errorMsg = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
        } else if (parsed.message) {
          errorMsg = parsed.message;
        }
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    applyAnalysis(data);
    return data;
  }

  window.CareerLensAPI = {
    baseUrl: API_BASE,
    analyzeProfile,
    applyAnalysis
  };
})();
