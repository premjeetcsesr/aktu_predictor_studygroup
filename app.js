const state = {
  crl_rank: null,
  home_state: "Uttar Pradesh",
  gender: "Male",
  category: "GEN",
  is_pwd: "false",
  college_type: "ALL" // "ALL", "GOVT", "PRIVATE"
};

let allFetchedItems = [];

// DOM Elements
const rankInput = document.getElementById("rankInput");
const predictorForm = document.getElementById("predictorForm");
const statusBox = document.getElementById("statusBox");
const resultsBox = document.getElementById("resultsBox");
const categoryNote = document.getElementById("categoryNote");
const categoryPills = document.getElementById("categoryPills");
const collegeTypePills = document.getElementById("collegeTypePills");

const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeToggleBtnMobile = document.getElementById("themeToggleBtnMobile");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const navLinks = document.getElementById("navLinks");

const countAllEl = document.getElementById("countAll");
const countGovtEl = document.getElementById("countGovt");
const countPrivateEl = document.getElementById("countPrivate");
const resultFilterTabs = document.getElementById("resultFilterTabs");

const navGovtLink = document.getElementById("navGovtLink");
const navPrivateLink = document.getElementById("navPrivateLink");

// Mobile Menu Toggle
if (mobileMenuBtn && navLinks) {
  mobileMenuBtn.addEventListener("click", () => {
    mobileMenuBtn.classList.toggle("open");
    navLinks.classList.toggle("active");
  });

  // Close menu when clicking nav item
  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      mobileMenuBtn.classList.remove("open");
      navLinks.classList.remove("active");
    });
  });
}

// Theme Toggle Management
function initTheme() {
  const savedTheme = localStorage.getItem("aktu_theme") || "dark";
  applyTheme(savedTheme);

  const themeBtns = [themeToggleBtn, themeToggleBtnMobile].filter(Boolean);
  themeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const isDark = document.body.classList.contains("dark-theme");
      const newTheme = isDark ? "light" : "dark";
      applyTheme(newTheme);
      localStorage.setItem("aktu_theme", newTheme);
    });
  });
}

function applyTheme(theme) {
  const themeBtns = [themeToggleBtn, themeToggleBtnMobile].filter(Boolean);

  if (theme === "light") {
    document.body.classList.remove("dark-theme");
    document.body.classList.add("light-theme");
    themeBtns.forEach(btn => {
      btn.querySelector(".theme-icon").textContent = "🌙";
      btn.querySelector(".theme-label").textContent = "Dark Mode";
    });
  } else {
    document.body.classList.remove("light-theme");
    document.body.classList.add("dark-theme");
    themeBtns.forEach(btn => {
      btn.querySelector(".theme-icon").textContent = "☀️";
      btn.querySelector(".theme-label").textContent = "Light Mode";
    });
  }
}

// College Classification (Government vs Private)
function getCollegeType(name) {
  if (!name) return "Private";
  const n = name.toUpperCase();

  if (
    n.includes("INSTITUTE OF ENGINEERING & TECHNOLOGY,LUCKNOW") ||
    n.includes("I.E.T.") || n.includes("IET LUCKNOW") ||
    n.includes("KAMLA NEHRU") || n.includes("K.N.I.T") || n.includes("KNIT") ||
    n.includes("BUNDELKHAND") || n.includes("B.I.E.T") || n.includes("BIET") ||
    n.includes("RAJKIYA") || n.includes("REC,") || n.includes("REC ") ||
    n.includes("UNIVERSITY") || n.includes("CAMPUS") ||
    n.includes("TEXTILE TECHNOLOGY") || n.includes("UPTTI") ||
    n.includes("DIVYANGJAN") || n.includes("CARPET") ||
    n.includes("CENTRAL") || n.includes("GOVERNMENT") || n.includes("GOVT")
  ) {
    return "Government";
  }

  return "Private";
}

// Helper function to setup pill selection
function setupPills(containerId, stateKey, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill-btn");
    if (!btn || btn.classList.contains("disabled")) return;

    container.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    state[stateKey] = btn.dataset.value;

    if (onChange) onChange(btn.dataset.value);
  });
}

// Handle Home State change (Other State forces GEN category)
function handleHomeStateChange(val) {
  if (val === "Other State") {
    state.category = "GEN";
    categoryNote.textContent = "(GEN auto-selected for Other State)";

    categoryPills.querySelectorAll(".pill-btn").forEach(b => {
      if (b.dataset.value !== "GEN") {
        b.classList.add("disabled");
        b.classList.remove("active");
      } else {
        b.classList.add("active");
      }
    });
  } else {
    categoryNote.textContent = "";
    categoryPills.querySelectorAll(".pill-btn").forEach(b => {
      b.classList.remove("disabled");
    });
  }
}

// Handle College Type Filter Change
function handleCollegeTypeChange(val) {
  state.college_type = val;
  updateFilterTabUI(val);
  if (allFetchedItems.length > 0) {
    renderFilteredResults();
  }
}

// Update Results Filter Tabs Active State
function updateFilterTabUI(activeFilter) {
  if (!resultFilterTabs) return;
  resultFilterTabs.querySelectorAll(".tab-btn").forEach(tab => {
    if (tab.dataset.filter === activeFilter) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Sync with form pills
  if (collegeTypePills) {
    collegeTypePills.querySelectorAll(".pill-btn").forEach(btn => {
      if (btn.dataset.value === activeFilter) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }
}

// Setup Result Filter Tabs Event Listener
if (resultFilterTabs) {
  resultFilterTabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab-btn");
    if (!tab) return;
    const filter = tab.dataset.filter;
    state.college_type = filter;
    updateFilterTabUI(filter);
    if (allFetchedItems.length > 0) {
      renderFilteredResults();
    }
  });
}

// Navbar filter click handlers
if (navGovtLink) {
  navGovtLink.addEventListener("click", () => handleCollegeTypeChange("GOVT"));
}
if (navPrivateLink) {
  navPrivateLink.addEventListener("click", () => handleCollegeTypeChange("PRIVATE"));
}

// Extract items from API payload
function extractItems(payload) {
  if (Array.isArray(payload)) return payload.filter(item => item && typeof item === "object");

  if (payload && typeof payload === "object") {
    const possibleKeys = ["data", "results", "items", "colleges", "predictions", "rows", "docs"];

    for (const key of possibleKeys) {
      const value = payload[key];
      if (Array.isArray(value)) return value.filter(item => item && typeof item === "object");
      if (value && typeof value === "object") {
        for (const subkey of possibleKeys) {
          const subvalue = value[subkey];
          if (Array.isArray(subvalue)) return subvalue.filter(item => item && typeof item === "object");
        }
      }
    }
  }

  return [];
}

// Get value from multiple possible keys
function valueFromKeys(item, keys, fallback = "N/A") {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

// Render Single College Card
function renderCollegeCard(item, index) {
  const college = item.college || {};
  const collegeName = college.name || valueFromKeys(item, ["college_name", "institute_name", "name"], "N/A");
  const type = getCollegeType(collegeName);

  const programs = item.programs || item.program || [];
  const prog = Array.isArray(programs) ? (programs[0] || {}) : (programs || {});

  const branch = valueFromKeys(prog, ["name", "program_name", "branch_name"], "N/A");
  const courseType = valueFromKeys(prog, ["course_type", "type"], "");
  const opening = valueFromKeys(prog, ["opening_rank", "opening", "open_rank"], "N/A");
  const closing = valueFromKeys(prog, ["closing_rank", "closing", "close_rank"], "N/A");
  const quota = valueFromKeys(prog, ["quota"], "N/A");
  const category = valueFromKeys(prog, ["category"], "N/A");

  const badgeClass = type === "Government" ? "govt" : "private";
  const badgeLabel = type === "Government" ? "🏛️ Govt" : "🏢 Private";

  return `
    <div class="college-item-card">
      <div>
        <div class="card-top-header">
          <span class="college-number">Option #${index}</span>
          <span class="type-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <h3 class="college-name">${collegeName}</h3>
        <div class="college-detail-row">
          <span>Branch / Course:</span>
          <b>${branch} ${courseType ? `(${courseType})` : ''}</b>
        </div>
        <div class="college-detail-row">
          <span>Quota:</span>
          <b>${quota}</b>
        </div>
        <div class="college-detail-row">
          <span>Category:</span>
          <b>${category}</b>
        </div>
      </div>
      <div class="rank-pill-container">
        <div class="rank-badge">
          <span class="label">Opening Rank</span>
          <span class="value">${opening}</span>
        </div>
        <div class="rank-badge">
          <span class="label">Closing Rank</span>
          <span class="value">${closing}</span>
        </div>
      </div>
    </div>
  `;
}

// Render Filtered Results
function renderFilteredResults() {
  const govtItems = allFetchedItems.filter(item => getCollegeType(item.college?.name) === "Government");
  const privateItems = allFetchedItems.filter(item => getCollegeType(item.college?.name) === "Private");

  countAllEl.textContent = allFetchedItems.length;
  countGovtEl.textContent = govtItems.length;
  countPrivateEl.textContent = privateItems.length;

  let displayItems = allFetchedItems;
  if (state.college_type === "GOVT") {
    displayItems = govtItems;
  } else if (state.college_type === "PRIVATE") {
    displayItems = privateItems;
  }

  if (displayItems.length === 0) {
    resultsBox.innerHTML = `
      <div class="status-box error" style="grid-column: 1 / -1;">
        No ${state.college_type === 'GOVT' ? 'Government' : 'Private'} colleges matched for this rank.
      </div>
    `;
    return;
  }

  resultsBox.innerHTML = displayItems.map((item, index) => renderCollegeCard(item, index + 1)).join("");
}

// Fetch Predictions API
async function fetchPredictions() {
  const rankVal = rankInput.value.trim().replace(/,/g, "");
  if (!rankVal || isNaN(Number(rankVal))) {
    alert("Please enter a valid numeric CRL Rank.");
    rankInput.focus();
    return;
  }

  state.crl_rank = Number(rankVal);

  statusBox.className = "status-box loading";
  statusBox.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 8px;">⏳</div>
    <div>Fetching cutoff records for <b>CRL Rank ${state.crl_rank}</b>... Please wait.</div>
  `;
  resultsBox.innerHTML = "";

  // Scroll to results section smoothly
  document.getElementById("resultsSection").scrollIntoView({ behavior: "smooth" });

  const queryParams = new URLSearchParams({
    token: "collegePredictor2026",
    home_state: state.home_state,
    gender: state.gender,
    category: state.category,
    is_pwd: state.is_pwd,
    crl_rank: state.crl_rank
  });

  const url = `/api/predict?${queryParams.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const payload = await res.json();
    allFetchedItems = extractItems(payload);

    if (!allFetchedItems || allFetchedItems.length === 0) {
      statusBox.className = "status-box error";
      statusBox.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 8px;">🚫</div>
        <div>No matching colleges found for CRL Rank ${state.crl_rank}. Try adjusting your rank or state options.</div>
      `;
      countAllEl.textContent = "0";
      countGovtEl.textContent = "0";
      countPrivateEl.textContent = "0";
      return;
    }

    statusBox.className = "status-box success";
    statusBox.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">✅</div>
      <div>Successfully matched <b>${allFetchedItems.length} college records</b> for CRL Rank ${state.crl_rank}!</div>
    `;

    renderFilteredResults();
  } catch (err) {
    statusBox.className = "status-box error";
    statusBox.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">❌</div>
      <div>API request failed: ${err.message}. Please try again.</div>
    `;
  }
}

// Initialize Theme & Pill Handlers
initTheme();
setupPills("homeStatePills", "home_state", handleHomeStateChange);
setupPills("genderPills", "gender");
setupPills("categoryPills", "category");
setupPills("pwdPills", "is_pwd");
setupPills("collegeTypePills", "college_type", handleCollegeTypeChange);

// Form submit event
predictorForm.addEventListener("submit", (e) => {
  e.preventDefault();
  fetchPredictions();
});
