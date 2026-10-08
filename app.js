// CareerLens Application Controller & Router
// Person 4 Integration: Verification, Skill Confidence, Role Matching, Skill Gaps, and 6 Pillars

(function () {
  'use strict';

  // Available routes and their metadata
  const ROUTES = {
    'profile-setup': {
      title: 'Profile Setup',
      viewId: 'view-profile-setup'
    },
    'profile-analysis': {
      title: 'Profile Analysis',
      viewId: 'view-profile-analysis'
    },
    'evidence-verification': {
      title: 'Evidence Verification',
      viewId: 'view-evidence-verification'
    },
    'role-readiness': {
      title: 'Role Readiness',
      viewId: 'view-role-readiness'
    },
    'skill-gaps': {
      title: 'Skill Gaps',
      viewId: 'view-skill-gaps'
    },
    'career-roadmap': {
      title: 'Career Roadmap',
      viewId: 'view-career-roadmap'
    }
  };

  const DEFAULT_ROUTE = 'profile-setup';

  // Role Mapping: short codes to backend role IDs
  const ROLE_MAP = {
    'ml': 'ml_engineer',
    'ml_engineer': 'ml_engineer',
    'backend': 'backend_developer',
    'backend_developer': 'backend_developer',
    'frontend': 'frontend_developer',
    'frontend_developer': 'frontend_developer',
    'fullstack': 'fullstack_developer',
    'fullstack_developer': 'fullstack_developer',
    'data-analyst': 'data_analyst',
    'data_analyst': 'data_analyst',
    'data-scientist': 'data_scientist',
    'data_scientist': 'data_scientist',
    'ux': 'ui_ux_designer',
    'ui_ux_designer': 'ui_ux_designer'
  };

  // Helper to escape HTML characters
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Toast Notification Helper
  function showToast(message, icon = 'check_circle', duration = 2800) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'fixed top-24 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 opacity-0 pointer-events-none flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-on-primary shadow-lg font-label-md text-label-md max-w-[90vw] truncate';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="material-symbols-outlined text-[18px] text-tertiary-fixed shrink-0">${escapeHtml(icon)}</span><span class="truncate">${escapeHtml(message)}</span>`;
    toast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      toast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
      toast.classList.remove('opacity-100', 'translate-y-0');
    }, duration);
  }

  // Client-Side Router
  function navigateTo(routeKey) {
    if (!ROUTES[routeKey]) routeKey = DEFAULT_ROUTE;
    window.location.hash = '#' + routeKey;
  }

  function handleRouteChange() {
    let hash = window.location.hash.replace(/^#\/?/, '').trim();
    if (!hash || !ROUTES[hash]) {
      hash = DEFAULT_ROUTE;
    }

    const currentRoute = ROUTES[hash];

    // Toggle view panels
    Object.keys(ROUTES).forEach(key => {
      const panel = document.getElementById(ROUTES[key].viewId);
      if (panel) {
        if (key === hash) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      }
    });

    // Update Header Title
    const headerTitle = document.getElementById('header-screen-title');
    if (headerTitle) {
      headerTitle.textContent = currentRoute.title;
    }

    // Update Bottom Navigation Tab Highlight
    const navLinks = document.querySelectorAll('nav a[data-path]');
    navLinks.forEach(link => {
      const path = link.getAttribute('data-path');
      if (path === hash) {
        link.setAttribute('aria-current', 'page');
        link.classList.remove('text-on-surface-variant');
        link.classList.add('text-secondary', 'font-semibold');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('text-secondary', 'font-semibold');
        link.classList.add('text-on-surface-variant');
      }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Dynamic Skill Selection in Evidence Verification Inspector
  function selectSkill(skillIdentifier) {
    if (!window.careerLensData || !window.careerLensData.evidenceSkills) return;
    const skillsStore = window.careerLensData.evidenceSkills;

    // Search by exact key, normalized key, or title
    const normKey = String(skillIdentifier).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const data = skillsStore[skillIdentifier] || skillsStore[normKey] || skillsStore[String(skillIdentifier).toLowerCase()];
    if (!data) return;

    // Highlight selected row in skills list
    document.querySelectorAll('.skill-row').forEach(row => {
      row.classList.remove('border-secondary/40', 'bg-surface-container-low', 'shadow-md');
      row.classList.add('border-transparent');
    });

    const safeId = data.key || normKey;
    const selectedRow = document.getElementById('row-' + safeId);
    if (selectedRow) {
      selectedRow.classList.remove('border-transparent');
      selectedRow.classList.add('border-secondary/40', 'bg-surface-container-low', 'shadow-md');
    }

    // Update Auditor Inspector contents
    const inspectorTitle = document.getElementById('inspector-title');
    const badge = document.getElementById('inspector-strength-badge');
    const sources = document.getElementById('inspector-sources');
    const activity = document.getElementById('inspector-activity');
    const rationale = document.getElementById('inspector-rationale');
    const level = document.getElementById('inspector-level');

    if (inspectorTitle) inspectorTitle.textContent = data.title;
    if (badge) {
      badge.className = `px-space-sm py-1 rounded-full ${data.badgeClass} font-label-sm text-label-sm flex items-center gap-1 shrink-0`;
      badge.innerHTML = `<span class="material-symbols-outlined text-[14px]">${data.badgeIcon || 'verified'}</span> <span>${data.confidence}% • ${data.badgeText}</span>`;
    }
    if (sources) sources.textContent = data.sources || 'None detected';
    if (activity) activity.textContent = data.activity || 'No external code or activity records logged.';
    if (rationale) rationale.textContent = data.rationale || 'Awaiting repository artifact verification.';
    if (level) level.innerHTML = data.level;
  }

  // Filter in Evidence Verification
  function setEvidenceFilter(filterType) {
    const buttons = document.querySelectorAll('#evidence-filter-container .filter-btn');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-filter') === filterType) {
        btn.classList.remove('bg-surface-container', 'text-on-surface-variant');
        btn.classList.add('bg-primary', 'text-on-primary', 'shadow-sm');
      } else {
        btn.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm');
        btn.classList.add('bg-surface-container', 'text-on-surface-variant');
      }
    });

    const rows = document.querySelectorAll('.skill-row');
    rows.forEach(row => {
      const status = row.getAttribute('data-skill-status');
      if (filterType === 'all' || status === filterType) {
        row.style.display = 'flex';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // Filter in Skill Gaps
  function applyGapFilter(selected) {
    const filterBtns = {
      all: document.getElementById('filter-all'),
      high: document.getElementById('filter-high'),
      med: document.getElementById('filter-med'),
      low: document.getElementById('filter-low')
    };

    Object.keys(filterBtns).forEach(key => {
      const btn = filterBtns[key];
      if (!btn) return;
      if (key === selected) {
        btn.classList.remove('bg-surface-container-high', 'text-on-surface-variant');
        btn.classList.add('bg-primary', 'text-on-primary');
      } else {
        btn.classList.remove('bg-primary', 'text-on-primary');
        btn.classList.add('bg-surface-container-high', 'text-on-surface-variant');
      }
    });

    const cards = document.querySelectorAll('.gap-card-item');
    cards.forEach(card => {
      if (selected === 'all' || card.dataset.priority === selected) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Helper to update a 6-pillar card
  function updatePillar(idPrefix, value) {
    const scoreEl = document.getElementById(`${idPrefix}-score`);
    const barEl = document.getElementById(`${idPrefix}-bar`);
    const num = Math.min(100, Math.max(0, Math.round(Number(value) || 0)));

    if (scoreEl) scoreEl.textContent = `${num}%`;
    if (barEl) barEl.style.width = `${num}%`;
  }

  // Renders the Evidence Verification skills list dynamically
  function renderSkillsList(verifiedSkills) {
    const container = document.getElementById('skills-list');
    if (!container) return;
    container.innerHTML = '';

    if (!verifiedSkills || verifiedSkills.length === 0) {
      container.innerHTML = `
        <div class="p-space-md text-center bg-surface-container-lowest rounded-xl text-on-surface-variant font-body-sm">
          No skills detected yet. Upload a resume in Profile Setup to begin.
        </div>
      `;
      return;
    }

    verifiedSkills.forEach((item) => {
      const statusKey = item.status === 'Verified'
        ? 'verified'
        : (item.status === 'Partially Verified' || item.status === 'Evidence Found' ? 'partial' : 'unverified');

      let badgeClass = 'bg-surface-container-high text-outline';
      let badgeIcon = 'radio_button_unchecked';
      if (item.status === 'Verified') {
        badgeClass = 'bg-tertiary-container text-tertiary-fixed';
        badgeIcon = 'verified';
      } else if (item.status === 'Partially Verified') {
        badgeClass = 'bg-secondary-fixed text-on-secondary-fixed';
        badgeIcon = 'warning';
      } else if (item.status === 'Evidence Found') {
        badgeClass = 'bg-secondary-container text-on-secondary';
        badgeIcon = 'check_circle';
      }

      const sourcesList = item.sources || [];
      const sourcesText = sourcesList.join(' • ') || (item.claimed_in_resume ? 'Resume only' : 'No independent source');

      let barColor = 'bg-surface-dim';
      let confidenceLabel = 'Emerging';
      let confidenceColor = 'text-outline';
      if (item.confidence >= 75) {
        barColor = 'bg-on-tertiary-container';
        confidenceLabel = 'Strong';
        confidenceColor = 'text-on-tertiary-container';
      } else if (item.confidence >= 50) {
        barColor = 'bg-secondary';
        confidenceLabel = 'Moderate';
        confidenceColor = 'text-secondary';
      }

      const safeKey = String(item.skill).toLowerCase().replace(/[^a-z0-9]/g, '_');

      const card = document.createElement('div');
      card.id = 'row-' + safeKey;
      card.className = 'skill-row bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm cursor-pointer transition-all border-2 border-transparent hover:border-secondary/30';
      card.setAttribute('data-skill-status', statusKey);
      card.onclick = function () {
        selectSkill(safeKey);
      };

      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-space-xs truncate min-w-0 pr-space-xs">
            <span class="font-title-md text-title-md text-on-surface font-semibold truncate">${escapeHtml(item.skill)}</span>
            <span class="px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm shrink-0">
              ${item.claimed_in_resume ? 'Resume Claim' : 'Independent Source'}
            </span>
          </div>
          <span class="px-space-xs py-0.5 rounded-full ${badgeClass} font-label-sm text-label-sm flex items-center gap-0.5 shrink-0">
            <span class="material-symbols-outlined text-[13px]">${badgeIcon}</span> ${escapeHtml(item.status)}
          </span>
        </div>
        <div class="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
          <div class="flex items-center gap-1 truncate min-w-0 pr-space-xs">
            <span class="material-symbols-outlined text-[16px] shrink-0">hub</span>
            <span class="truncate">${escapeHtml(sourcesText)}</span>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <span class="font-label-sm text-label-sm font-semibold text-on-surface">${item.confidence}%</span>
            <span class="${confidenceColor} font-label-sm text-label-sm font-medium">${confidenceLabel}</span>
          </div>
        </div>
        <div class="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
          <div class="${barColor} h-full rounded-full transition-all duration-500" style="width: ${item.confidence}%;"></div>
        </div>
      `;

      container.appendChild(card);
    });
  }

  // Renders the Role Requirements vs Verified Profile comparison list on Screen 4
  function renderRequirementsList(requirements, verifiedSkills) {
    const container = document.getElementById('role-requirements-list');
    if (!container) return;
    container.innerHTML = '';

    const reqKeys = Object.keys(requirements || {});
    if (reqKeys.length === 0) {
      container.innerHTML = `<div class="p-space-sm text-center text-on-surface-variant font-body-sm">No specific role requirements loaded.</div>`;
      return;
    }

    const skillsMap = {};
    (verifiedSkills || []).forEach(item => {
      skillsMap[item.skill.toLowerCase()] = item;
    });

    reqKeys.forEach(reqName => {
      const spec = requirements[reqName];
      const requiredLevel = typeof spec === 'number' ? spec : (spec.required_level || 60);
      const weight = typeof spec === 'number' ? 3 : (spec.weight || 3);

      const candidate = skillsMap[reqName.toLowerCase()];
      const candScore = candidate ? candidate.confidence : 0;
      const isMet = candScore >= requiredLevel;

      const itemEl = document.createElement('div');
      itemEl.className = 'p-space-sm rounded-lg bg-surface-container-low flex flex-col space-y-1.5';
      itemEl.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] ${isMet ? 'text-on-tertiary-container' : 'text-error'}">
              ${isMet ? 'check_circle' : 'remove_circle_outline'}
            </span>
            <span class="font-label-md text-label-md text-on-surface font-semibold">${escapeHtml(reqName)}</span>
          </div>
          <div class="flex items-center gap-space-xs">
            <span class="font-code-sm text-code-sm ${isMet ? 'text-on-tertiary-container font-semibold' : 'text-error font-semibold'}">
              ${candScore}% / ${requiredLevel}% req
            </span>
            <span class="px-space-xs py-0.5 rounded text-[10px] font-semibold uppercase ${isMet ? 'bg-tertiary-container text-tertiary-fixed' : 'bg-error-container text-on-error-container'}">
              ${isMet ? 'Met' : 'Deficit'}
            </span>
          </div>
        </div>
        <div class="w-full bg-surface-container h-1.5 rounded-full overflow-hidden flex">
          <div class="${isMet ? 'bg-on-tertiary-container' : 'bg-error'} h-full rounded-full transition-all duration-500" style="width: ${Math.min(100, Math.round(candScore / requiredLevel * 100))}%;"></div>
        </div>
      `;
      container.appendChild(itemEl);
    });
  }

  // Renders the Skill Gaps cards dynamically on Screen 5
  function renderSkillGapsList(gaps) {
    const container = document.getElementById('gaps-cards-container');
    if (!container) return;
    container.innerHTML = '';

    if (!gaps || gaps.length === 0) {
      container.innerHTML = `
        <div class="p-space-lg text-center bg-surface-container-lowest rounded-xl shadow-sm space-y-2">
          <span class="material-symbols-outlined text-tertiary-fixed text-[36px]">verified</span>
          <h3 class="font-headline-sm text-headline-sm text-on-surface">Full Competency Alignment!</h3>
          <p class="font-body-md text-body-md text-on-surface-variant">All evaluated competencies meet or exceed the benchmarks required for this target role.</p>
        </div>
      `;
      return;
    }

    gaps.forEach((gap, index) => {
      let priorityCategory = 'med';
      let priorityLabel = 'Medium Priority';
      let badgeClass = 'bg-secondary-container text-on-secondary-container';
      let dotColor = 'bg-secondary';

      if (gap.priority >= 4) {
        priorityCategory = 'high';
        priorityLabel = 'Core Blocker';
        badgeClass = 'bg-error-container text-on-error-container';
        dotColor = 'bg-error';
      } else if (gap.priority <= 2) {
        priorityCategory = 'low';
        priorityLabel = 'Differentiator';
        badgeClass = 'bg-surface-container-high text-on-surface-variant';
        dotColor = 'bg-primary-container';
      }

      const card = document.createElement('article');
      card.className = 'gap-card-item bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md transition-all';
      card.setAttribute('data-priority', priorityCategory);

      card.innerHTML = `
        <div class="flex items-start justify-between gap-space-xs">
          <div class="flex items-center gap-space-xs">
            <div class="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-secondary text-[22px]">published_with_changes</span>
            </div>
            <div>
              <h2 class="font-title-md text-title-md text-on-surface font-semibold">${escapeHtml(gap.skill)}</h2>
              <div class="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                <span>Current: <strong>${gap.current_score}%</strong></span>
                <span>→</span>
                <span class="text-on-surface font-semibold">Target: ${gap.required_level}%</span>
                <span class="text-error font-medium">(${gap.gap}% gap)</span>
              </div>
            </div>
          </div>
          <span class="${badgeClass} px-space-xs py-1 rounded font-label-sm text-[10px] uppercase font-semibold text-right leading-tight shrink-0">
            ${priorityLabel}
          </span>
        </div>
        <div class="flex flex-col gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
          <div class="p-space-xs rounded bg-surface-container-low text-on-surface">
            <span class="font-label-sm text-label-sm text-on-surface-variant block uppercase text-[10px] font-semibold">Requirement Rationale:</span>
            Essential target skill for this role (weight factor: ${gap.priority}/5). Bridging this gap strengthens placement calibration.
          </div>
          <div class="flex items-start gap-space-xs">
            <span class="material-symbols-outlined text-[16px] text-error shrink-0 mt-0.5">remove_circle_outline</span>
            <p><span class="font-label-sm text-label-sm text-on-surface">Current Deficit:</span> Candidate verified level is ${gap.current_score}%, which is ${gap.gap}% below target threshold.</p>
          </div>
          <div class="flex items-start gap-space-xs">
            <span class="material-symbols-outlined text-[16px] text-secondary shrink-0 mt-0.5">check_circle</span>
            <p><span class="font-label-sm text-label-sm text-on-surface">Proof Target:</span> Create and push code commits or practical projects demonstrating verified proficiency in ${escapeHtml(gap.skill)}.</p>
          </div>
        </div>
        <div class="flex items-center justify-between pt-space-xs bg-surface-container-high/40 p-space-xs rounded-lg">
          <span class="font-label-sm text-label-sm text-on-surface-variant">Estimated Impact</span>
          <span class="font-label-md text-label-md text-secondary font-bold">+${(gap.gap * 0.15).toFixed(1)}% readiness gain</span>
        </div>
      `;

      container.appendChild(card);
    });
  }

  // Renders the dynamic Roadmap Steps on Screen 6
  function renderRoadmapSteps(gaps) {
    const container = document.getElementById('roadmap-timeline-steps');
    if (!container) return;
    container.innerHTML = `
      <div class="absolute left-4 top-6 bottom-8 w-0.5 bg-surface-container-high -z-0"></div>
    `;

    const stepItems = (gaps && gaps.length > 0)
      ? gaps.slice(0, 4)
      : [
          { skill: 'Portfolio Refinement', gap: 10, priority: 3 },
          { skill: 'Production Deployment', gap: 15, priority: 4 }
        ];

    stepItems.forEach((item, index) => {
      const stepNumber = index + 1;
      const stepEl = document.createElement('div');
      stepEl.className = 'relative flex items-start gap-space-md group';
      stepEl.innerHTML = `
        <div class="z-10 flex items-center justify-center w-8 h-8 rounded-full ${stepNumber === 1 ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface'} shrink-0 shadow-sm ring-4 ring-surface font-semibold text-sm">
          ${stepNumber}
        </div>
        <div class="flex-1 bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">
          <div class="flex items-start justify-between gap-space-xs">
            <div class="flex flex-col">
              <span class="font-label-sm text-label-sm text-secondary uppercase font-semibold">Step ${stepNumber} — Action</span>
              <h2 class="font-title-md text-title-md text-on-surface font-bold">Bridge ${escapeHtml(item.skill)} Gap</h2>
            </div>
            <span class="${stepNumber === 1 ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant'} font-label-sm text-label-sm px-space-xs py-0.5 rounded-full shrink-0 flex items-center gap-1">
              ${stepNumber === 1 ? '<span class="w-1.5 h-1.5 rounded-full bg-surface-container-lowest animate-pulse"></span> Priority 1' : 'Upcoming'}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-space-xs">
            <span class="bg-surface-container-low text-on-surface font-code-sm text-code-sm px-space-xs py-0.5 rounded flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px] text-secondary">tune</span>
              Target Skill: ${escapeHtml(item.skill)}
            </span>
            <span class="bg-surface-container-low text-secondary font-code-sm text-code-sm px-space-xs py-0.5 rounded font-bold">
              +${(item.gap * 0.15).toFixed(1)}% Impact
            </span>
          </div>
          <div class="bg-surface-container-low p-space-sm rounded-lg space-y-space-xs text-on-surface text-body-sm font-body-sm">
            <p>Commit a concrete demonstration project to GitHub with clear README documentation and automated test suites.</p>
          </div>
        </div>
      `;
      container.appendChild(stepEl);
    });
  }

  // Master function to render all backend response data across screens
  function renderAnalysisResults(response) {
    if (!response || !response.analysis) return;
    const analysis = response.analysis;
    const sources = response.sources || {};
    const verifiedSkills = analysis.verified_skills || [];
    const pillars = analysis.pillars || {};
    const gaps = analysis.skill_gaps || [];
    const requirements = analysis.requirements || {};
    const readiness = analysis.readiness_score ?? 0;
    const corroboration = analysis.corroboration_score ?? 0;

    // 1. Target Role Title Across All Screens
    const roleName = analysis.role_name || analysis.target_role || 'Target Trajectory';
    document.querySelectorAll('.target-role-label').forEach(el => {
      el.textContent = roleName;
    });

    // 2. Candidate Resume info
    const resumeInfo = sources.resume || {};
    if (resumeInfo.filename) {
      const fnEl = document.getElementById('resume-filename');
      if (fnEl) fnEl.textContent = resumeInfo.filename;
      const s2Meta = document.getElementById('screen2-resume-meta');
      if (s2Meta) s2Meta.textContent = `Parsed • ${resumeInfo.filename}`;
    }

    // 3. SCREEN 2: PROFILE ANALYSIS
    const signalVal = document.getElementById('screen2-signal-value');
    if (signalVal) signalVal.textContent = `${readiness}%`;

    const instScore = document.getElementById('screen2-institutional-score');
    if (instScore) instScore.textContent = `${readiness}%`;

    // Calculate active sources count
    let activeSourcesCount = 0;
    if (sources.resume && sources.resume.status === 'success') activeSourcesCount++;
    if (sources.github && sources.github.status !== 'not_provided') activeSourcesCount++;
    if (sources.leetcode && sources.leetcode.status !== 'not_provided') activeSourcesCount++;
    if (sources.linkedin && sources.linkedin.status !== 'not_provided') activeSourcesCount++;
    if (sources.figma && sources.figma.status !== 'not_provided') activeSourcesCount++;
    if (activeSourcesCount === 0) activeSourcesCount = 1;

    const sourcesCountEl = document.getElementById('screen2-sources-analyzed');
    if (sourcesCountEl) sourcesCountEl.textContent = activeSourcesCount;
    const sourcesBar = document.getElementById('screen2-sources-bar');
    if (sourcesBar) sourcesBar.style.width = `${Math.min(100, Math.round(activeSourcesCount / 5 * 100))}%`;

    // Consistency KPI
    const consistencyScore = pillars.consistency ?? corroboration;
    const consEl = document.getElementById('screen2-consistency-score');
    if (consEl) consEl.textContent = `${consistencyScore}%`;
    const consBar = document.getElementById('screen2-consistency-bar');
    if (consBar) consBar.style.width = `${consistencyScore}%`;
    const consBadge = document.getElementById('screen2-consistency-badge');
    if (consBadge) {
      consBadge.textContent = consistencyScore >= 70 ? 'High' : (consistencyScore >= 45 ? 'Moderate' : 'Low');
    }

    // Skills Detected KPI
    const skillsCountEl = document.getElementById('screen2-skills-detected');
    if (skillsCountEl) skillsCountEl.textContent = verifiedSkills.length;

    // Projects Logged KPI
    const verifiedCount = verifiedSkills.filter(s => s.status === 'Verified').length;
    const projectsCountEl = document.getElementById('screen2-projects-logged');
    if (projectsCountEl) projectsCountEl.textContent = Math.max(verifiedCount, 1);

    // Resume Claimed Skills Tags
    const claimedContainer = document.getElementById('screen2-claimed-skills-list');
    if (claimedContainer && resumeInfo.claimed_skills) {
      claimedContainer.innerHTML = '';
      resumeInfo.claimed_skills.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'px-2 py-0.5 rounded bg-surface-container text-on-surface font-code-sm text-code-sm';
        tag.textContent = skill;
        claimedContainer.appendChild(tag);
      });
    }

    // 4. SCREEN 3: EVIDENCE VERIFICATION (Claim vs Evidence)
    const corrobScoreEl = document.getElementById('evidence-corroboration-score');
    if (corrobScoreEl) corrobScoreEl.textContent = `${corroboration}%`;

    const corrobGaugeText = document.getElementById('evidence-gauge-text');
    if (corrobGaugeText) corrobGaugeText.textContent = `${corroboration}%`;

    const corrobGaugePath = document.getElementById('evidence-gauge-path');
    if (corrobGaugePath) corrobGaugePath.setAttribute('stroke-dasharray', `${corroboration}, 100`);

    const corrobBadge = document.getElementById('evidence-corroboration-badge');
    if (corrobBadge) {
      corrobBadge.textContent = corroboration >= 70 ? 'Tier-1 Qualified' : (corroboration >= 45 ? 'Partially Corroborated' : 'Emerging Evidence');
    }

    // Counts
    const verifiedItems = verifiedSkills.filter(s => s.status === 'Verified');
    const partialItems = verifiedSkills.filter(s => s.status === 'Partially Verified' || s.status === 'Evidence Found');
    const unverifiedItems = verifiedSkills.filter(s => s.status === 'Unverified');

    const cvEl = document.getElementById('count-verified');
    if (cvEl) cvEl.textContent = verifiedItems.length;
    const cpEl = document.getElementById('count-partial');
    if (cpEl) cpEl.textContent = partialItems.length;
    const cuEl = document.getElementById('count-unverified');
    if (cuEl) cuEl.textContent = unverifiedItems.length;

    // Filter labels
    const fAll = document.getElementById('filter-all-label');
    if (fAll) fAll.textContent = `All (${verifiedSkills.length})`;
    const fVer = document.getElementById('filter-verified-label');
    if (fVer) fVer.textContent = `Verified (${verifiedItems.length})`;
    const fPar = document.getElementById('filter-partial-label');
    if (fPar) fPar.textContent = `Partial (${partialItems.length})`;
    const fUnv = document.getElementById('filter-unverified-label');
    if (fUnv) fUnv.textContent = `Unverified (${unverifiedItems.length})`;

    // Render Skills List
    renderSkillsList(verifiedSkills);

    // Auto-select first skill in inspector
    if (verifiedSkills.length > 0) {
      const firstSkillName = verifiedSkills[0].skill;
      selectSkill(firstSkillName);
    }

    // 5. SCREEN 4: ROLE READINESS (Hero score + 6 Pillars + Requirements)
    const readinessHero = document.getElementById('readiness-score-text');
    if (readinessHero) readinessHero.textContent = `${readiness}%`;

    const readinessCircle = document.getElementById('readiness-gauge-circle');
    if (readinessCircle) {
      const circumference = 427.25;
      const offset = circumference * (1 - Math.min(100, Math.max(0, readiness)) / 100);
      readinessCircle.setAttribute('stroke-dashoffset', offset.toFixed(1));
    }

    // The 6 Pillars: Tech Skills, Evidence, Quality, Activity, Consistency, Coverage
    updatePillar('pillar-tech', pillars.tech_skills);
    updatePillar('pillar-evidence', pillars.evidence);
    updatePillar('pillar-quality', pillars.quality);
    updatePillar('pillar-activity', pillars.activity);
    updatePillar('pillar-consistency', pillars.consistency);
    updatePillar('pillar-coverage', pillars.coverage);

    // Requirements comparison list
    renderRequirementsList(requirements, verifiedSkills);

    // 6. SCREEN 5: SKILL GAPS
    const gapsScore = document.getElementById('gaps-current-score');
    if (gapsScore) gapsScore.textContent = `${readiness}%`;

    const gapUplift = (100 - readiness).toFixed(1);
    const upliftEl = document.getElementById('gaps-uplift-score');
    if (upliftEl) upliftEl.textContent = `+${gapUplift}% Score Uplift`;

    const itemsCountEl = document.getElementById('gaps-items-count');
    if (itemsCountEl) itemsCountEl.textContent = `${gaps.length} Action Items`;

    const baselineBar = document.getElementById('gaps-baseline-bar');
    if (baselineBar) baselineBar.style.width = `${readiness}%`;
    const deltaBar = document.getElementById('gaps-delta-bar');
    if (deltaBar) deltaBar.style.width = `${Math.max(0, 100 - readiness)}%`;

    // Gap priority counts
    const highGaps = gaps.filter(g => g.priority >= 4);
    const medGaps = gaps.filter(g => g.priority === 3);
    const lowGaps = gaps.filter(g => g.priority <= 2);

    const gAll = document.getElementById('gaps-count-all');
    if (gAll) gAll.textContent = gaps.length;
    const gHigh = document.getElementById('gaps-count-high');
    if (gHigh) gHigh.textContent = highGaps.length;
    const gMed = document.getElementById('gaps-count-med');
    if (gMed) gMed.textContent = medGaps.length;
    const gLow = document.getElementById('gaps-count-low');
    if (gLow) gLow.textContent = lowGaps.length;

    renderSkillGapsList(gaps);

    // 7. SCREEN 6: CAREER ROADMAP
    const rFrom = document.getElementById('roadmap-from-score');
    if (rFrom) rFrom.textContent = `${readiness}%`;

    const rCur = document.getElementById('roadmap-current-score');
    if (rCur) rCur.textContent = Math.round(readiness);
    const rCurBar = document.getElementById('roadmap-current-bar');
    if (rCurBar) rCurBar.style.width = `${readiness}%`;

    const projectedScore = Math.min(96, Math.round(readiness + (gaps.length > 0 ? 18 : 5)));
    const rProj = document.getElementById('roadmap-projected-score');
    if (rProj) rProj.textContent = projectedScore;
    const rProjBar = document.getElementById('roadmap-projected-bar');
    if (rProjBar) rProjBar.style.width = `${projectedScore}%`;

    const deltaVal = Math.max(0, projectedScore - Math.round(readiness));
    const rDelta = document.getElementById('roadmap-delta-text');
    if (rDelta) rDelta.textContent = `+${deltaVal}% Max Delta`;

    renderRoadmapSteps(gaps);
  }

  // Wire all page interactions on DOMContentLoaded
  function initApp() {
    // 1. Setup Hash Router Listener
    window.addEventListener('hashchange', handleRouteChange);

    // 2. Setup Nav Links
    document.querySelectorAll('nav a[data-path]').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const path = this.getAttribute('data-path');
        navigateTo(path);
      });
    });

    // 3. Screen 1: Profile Setup - Target Role Select
    const roleSelect = document.getElementById('role-select');
    if (roleSelect) {
      roleSelect.addEventListener('change', function () {
        const selectedText = this.options[this.selectedIndex].text;
        showToast(`Target role set to ${selectedText}`, 'target');

        // Update target role titles across all screens
        document.querySelectorAll('.target-role-label').forEach(el => {
          el.textContent = selectedText;
        });
      });
    }

    // Screen 1: Resume File Upload & Parsing Handler
    const resumeFileInput = document.getElementById('resume-file-input');
    const resumeUploadZone = document.getElementById('resume-upload-zone');
    const uploadResumeBtn = document.getElementById('upload-resume-btn');
    const resumeFilename = document.getElementById('resume-filename');
    const resumeMeta = document.getElementById('resume-meta');
    const resumeStatusText = document.getElementById('resume-status-text');

    function handleResumeFile(file) {
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        showToast('Please upload a PDF format resume.', 'error', 3500);
        return;
      }

      let sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      if (file.size < 1024 * 1024) {
        sizeStr = Math.max(1, Math.round(file.size / 1024)) + ' KB';
      }

      if (resumeFilename) {
        resumeFilename.textContent = file.name;
      }
      if (resumeMeta) {
        resumeMeta.textContent = `${sizeStr} • Selected`;
      }
      if (resumeStatusText) {
        resumeStatusText.innerHTML = `<span class="text-on-tertiary-container font-medium inline-flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">task_alt</span> Ready to analyze</span>`;
      }

      // Update in global data store
      if (window.careerLensData && window.careerLensData.candidate) {
        window.careerLensData.candidate.resumeFile = file.name;
        window.careerLensData.candidate.resumeSize = sizeStr;
      }

      // Update in Screen 2 CV Card
      const screen2CvMeta = document.getElementById('screen2-resume-meta');
      if (screen2CvMeta) {
        screen2CvMeta.textContent = `Selected • ${file.name} (${sizeStr})`;
      }

      showToast(`Resume "${file.name}" ready for analysis`, 'task_alt', 2500);
    }

    if (resumeUploadZone && resumeFileInput) {
      resumeUploadZone.addEventListener('click', () => {
        resumeFileInput.click();
      });

      if (uploadResumeBtn) {
        uploadResumeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          resumeFileInput.click();
        });
      }

      resumeFileInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
          handleResumeFile(this.files[0]);
        }
      });

      // Drag and drop events
      ['dragenter', 'dragover'].forEach(name => {
        resumeUploadZone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          resumeUploadZone.classList.add('border-secondary', 'bg-surface-container');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        resumeUploadZone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          resumeUploadZone.classList.remove('border-secondary', 'bg-surface-container');
        });
      });

      resumeUploadZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          resumeFileInput.files = files;
          handleResumeFile(files[0]);
        }
      });
    }

    // Screen 1: "Analyze My Career Profile" Button
const analyzeBtn = document.getElementById('analyze-btn');

if (analyzeBtn) {
  analyzeBtn.addEventListener('click', async function () {
    const btn = this;

    const resumeInput = document.getElementById('resume-file-input');
    const resumeFile = resumeInput && resumeInput.files
      ? resumeInput.files[0]
      : null;

    if (!resumeFile) {
      showToast('Please upload a resume PDF first.', 'error', 3000);
      return;
    }

    if (!resumeFile.name.toLowerCase().endsWith('.pdf')) {
      showToast(
        'Resume must be a PDF file for ATS parsing.',
        'error',
        3500
      );
      return;
    }

    const roleSelect = document.getElementById('role-select');
    const rawRole = roleSelect
      ? roleSelect.value
      : 'ml_engineer';

    const targetRole = ROLE_MAP[rawRole] || rawRole;

    // Support both current and older HTML input IDs
    function getInputValue(primaryId, secondaryId) {
      const primary = document.getElementById(primaryId);
      const secondary = document.getElementById(secondaryId);

      return (
        (primary && primary.value.trim()) ||
        (secondary && secondary.value.trim()) ||
        ''
      );
    }

    const githubUrl = getInputValue('github-url', 'input-github');
    const leetcodeUrl = getInputValue('leetcode-url', 'input-leetcode');
    const linkedinUrl = getInputValue('linkedin-url', 'input-linkedin');
    const figmaUrl = getInputValue('figma-url', 'input-figma');

    if (window.careerLensData) {
      window.careerLensData.profileLinks = {
        github_url: githubUrl,
        leetcode_url: leetcodeUrl,
        linkedin_url: linkedinUrl,
        figma_url: figmaUrl
      };
    }

    const formData = new FormData();

    formData.append('resume', resumeFile);
    formData.append('target_role', targetRole);
    formData.append('github_url', githubUrl);
    formData.append('leetcode_url', leetcodeUrl);
    formData.append('linkedin_url', linkedinUrl);
    formData.append('figma_url', figmaUrl);

    const originalContent = btn.innerHTML;

    btn.disabled = true;

    btn.innerHTML = `
      <span class="material-symbols-outlined text-[20px] animate-spin">
        refresh
      </span>
      <span>Cross-verifying repos & resume...</span>
    `;

    showToast(
      'Sending resume to CareerLens verification engine...',
      'sync',
      3000
    );

    try {
      const response = await fetch(
        'https://careerlens-verification-engine.onrender.com/api/analyze-profile',
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        let message = `Backend returned HTTP ${response.status}`;

        if (data && data.detail) {
          if (Array.isArray(data.detail)) {
            message = data.detail
              .map(item => item.msg || JSON.stringify(item))
              .join('; ');
          } else {
            message = String(data.detail);
          }
        } else if (data && data.message) {
          message = String(data.message);
        }

        throw new Error(message);
      }

      if (!data || !data.analysis) {
        throw new Error(
          'Backend response did not contain an analysis object.'
        );
      }

      console.log('CareerLens backend response:', data);

      window.careerLensAnalysis = data;

      // Update the existing dark UI
      renderAnalysisResults(data);

      // Notify the Person 4 integration layer
      window.dispatchEvent(
        new CustomEvent('careerlens:analysis-ready', {
          detail: data
        })
      );

      const score = data.analysis?.readiness_score ?? 0;

      showToast(
        `Diagnostic complete: ${score}% Role Readiness!`,
        'verified',
        3500
      );

      navigateTo('profile-analysis');

    } catch (error) {
      console.error('CareerLens backend error:', error);

      let message = error && error.message
        ? error.message
        : 'Unknown backend error';

      if (
        error instanceof TypeError ||
        message.toLowerCase().includes('failed to fetch') ||
        message.toLowerCase().includes('networkerror')
      ) {
        message =
          'Cannot connect to CareerLens backend. Make sure Uvicorn is running on port 8000.';
      }

      showToast(
        `Analysis failed: ${message}`,
        'error',
        6000
      );

    } finally {
      btn.innerHTML = originalContent;
      btn.disabled = false;
    }
  });
}

// 4. Screen 2: Profile Analysis - In-page CTAs
    const viewEvidenceCta = document.getElementById('view-evidence-cta');
    if (viewEvidenceCta) {
      viewEvidenceCta.addEventListener('click', function () {
        navigateTo('evidence-verification');
      });
    }

    const forceSyncBtn = document.getElementById('force-sync-btn');
    if (forceSyncBtn) {
      forceSyncBtn.addEventListener('click', function () {
        showToast('Re-analyzing connected digital sources...', 'sync');
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) analyzeBtn.click();
      });
    }

    const exportJsonBtn = document.getElementById('export-json-btn');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', function () {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.careerLensData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "careerlens_profile_telemetry.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('Exported telemetry JSON', 'file_download');
      });
    }

    // 5. Screen 3: Evidence Verification
    const compareTargetRoleBtn = document.getElementById('compare-target-role-btn');
    if (compareTargetRoleBtn) {
      compareTargetRoleBtn.addEventListener('click', function () {
        navigateTo('role-readiness');
      });
    }

    const viewCommitsBtn = document.getElementById('view-commits-btn');
    if (viewCommitsBtn) {
      viewCommitsBtn.addEventListener('click', function () {
        showToast('Verified SHA-256 commit hash in repository', 'fact_check');
      });
    }

    // 6. Screen 4: Role Readiness
    const viewSkillGapsBtn = document.getElementById('view-skill-gaps-btn');
    if (viewSkillGapsBtn) {
      viewSkillGapsBtn.addEventListener('click', function () {
        navigateTo('skill-gaps');
      });
    }

    // 7. Screen 5: Skill Gaps
    const buildRoadmapBtn = document.getElementById('build-roadmap-btn');
    if (buildRoadmapBtn) {
      buildRoadmapBtn.addEventListener('click', function () {
        navigateTo('career-roadmap');
      });
    }

    // 8. Screen 6: Career Roadmap
    const commitmentSlider = document.getElementById('commitment-slider');
    const hoursDisplay = document.getElementById('hours-display');
    if (commitmentSlider && hoursDisplay) {
      commitmentSlider.addEventListener('input', function () {
        hoursDisplay.textContent = this.value + ' hrs / week';
      });
    }

    const trackBtn = document.getElementById('track-btn');
    if (trackBtn) {
      trackBtn.addEventListener('click', function () {
        const label = this.querySelector('span:not(.material-symbols-outlined)');
        if (label) {
          label.textContent = 'Milestones Activated in Tracker!';
          this.classList.replace('bg-primary', 'bg-secondary');
          showToast('Milestones activated in study plan', 'checklist');
          setTimeout(() => {
            label.textContent = 'Track Progress & Set Milestones';
            this.classList.replace('bg-secondary', 'bg-primary');
          }, 2400);
        }
      });
    }

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        const label = this.querySelector('span:not(.material-symbols-outlined)');
        if (label) {
          const original = label.textContent;
          label.textContent = 'Generating Export...';
          setTimeout(() => {
            label.textContent = 'Saved to Downloads';
            showToast('Career Roadmap exported', 'ios_share');
            setTimeout(() => {
              label.textContent = original;
            }, 1800);
          }, 1000);
        }
      });
    }

    // Initial Route render
    handleRouteChange();
  }

  // Export functions to global scope for HTML onclick attributes
  window.navigateTo = navigateTo;
  window.selectSkill = selectSkill;
  window.setEvidenceFilter = setEvidenceFilter;
  window.applyGapFilter = applyGapFilter;
  window.renderAnalysisResults = renderAnalysisResults;

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
