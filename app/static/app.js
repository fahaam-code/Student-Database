// Student CRUD & Local AI Assistant Frontend Logic
const API_BASE = window.location.origin;

let allStudents = [];
let currentDeletingId = null;

// DOM Elements
const studentsTableBody = document.getElementById("students-table-body");
const recordCountText = document.getElementById("record-count-text");
const searchInput = document.getElementById("search-input");
const searchClearBtn = document.getElementById("search-clear-btn");
const courseFilter = document.getElementById("course-filter");
const ageFilter = document.getElementById("age-filter");
const refreshBtn = document.getElementById("refresh-table-btn");
const seedBtn = document.getElementById("seed-btn");
const addStudentBtn = document.getElementById("add-student-btn");

// Stat counters
const statTotal = document.getElementById("stat-total-students");
const statActiveCourses = document.getElementById("stat-active-courses");
const statPost2005 = document.getElementById("stat-post-2005");
const ollamaBadge = document.getElementById("ollama-status-badge");
const ollamaStatusText = document.getElementById("ollama-status-text");

// Modals
const studentModal = document.getElementById("student-modal");
const studentForm = document.getElementById("student-form");
const modalTitle = document.getElementById("modal-title");
const formMode = document.getElementById("form-mode");
const editOriginalId = document.getElementById("edit-original-id");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalCancelBtn = document.getElementById("modal-cancel-btn");
const modalError = document.getElementById("modal-error-message");

const viewModal = document.getElementById("view-modal");
const viewCloseBtn = document.getElementById("view-close-btn");
const viewDoneBtn = document.getElementById("view-done-btn");
const profileDetailsContent = document.getElementById("profile-details-content");

const deleteModal = document.getElementById("delete-modal");
const deleteCancelBtn = document.getElementById("delete-cancel-btn");
const deleteConfirmBtn = document.getElementById("delete-confirm-btn");
const deleteConfirmText = document.getElementById("delete-confirm-text");

// AI section
const aiForm = document.getElementById("ai-query-form");
const aiInput = document.getElementById("ai-prompt-input");
const aiSubmitBtn = document.getElementById("ai-submit-btn");
const aiResponseContainer = document.getElementById("ai-response-container");
const promptChips = document.querySelectorAll(".chip");

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  checkOllamaStatus();
  loadStudents();
  setupEventListeners();
});

function setupEventListeners() {
  // Search input live filtering
  searchInput.addEventListener("input", () => {
    searchClearBtn.classList.toggle("hidden", !searchInput.value);
    debounce(loadStudents, 250)();
  });

  searchClearBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchClearBtn.classList.add("hidden");
    loadStudents();
  });

  courseFilter.addEventListener("change", loadStudents);
  ageFilter.addEventListener("change", loadStudents);
  refreshBtn.addEventListener("click", () => {
    loadStudents();
    checkOllamaStatus();
    showToast("Data refreshed", "success");
  });

  // Modal triggers
  addStudentBtn.addEventListener("click", openCreateModal);
  modalCloseBtn.addEventListener("click", closeStudentModal);
  modalCancelBtn.addEventListener("click", closeStudentModal);
  viewCloseBtn.addEventListener("click", () => viewModal.classList.add("hidden"));
  viewDoneBtn.addEventListener("click", () => viewModal.classList.add("hidden"));
  deleteCancelBtn.addEventListener("click", () => deleteModal.classList.add("hidden"));
  deleteConfirmBtn.addEventListener("click", confirmDeleteStudent);

  studentForm.addEventListener("submit", handleStudentFormSubmit);

  // Seed sample data
  seedBtn.addEventListener("click", handleSeedData);

  // AI Assistant form
  aiForm.addEventListener("submit", handleAISubmit);

  promptChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt");
      aiInput.value = prompt;
      aiForm.dispatchEvent(new Event("submit"));
    });
  });
}

// --- Data Fetching ---
async function loadStudents() {
  try {
    const params = new URLSearchParams();
    if (searchInput.value.trim()) {
      params.append("search", searchInput.value.trim());
    }
    if (courseFilter.value) {
      params.append("course", courseFilter.value);
    }
    if (ageFilter.value === "after-2005") {
      params.append("born_after", "2005-12-31");
    } else if (ageFilter.value === "before-2005") {
      params.append("born_before", "2005-01-01");
    }

    const res = await fetch(`${API_BASE}/students?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to load students");
    const data = await res.json();
    allStudents = data.students || [];

    renderTable(allStudents);
    recordCountText.textContent = `Showing ${allStudents.length} of ${data.total} student record(s)`;

    // Update KPIs & courses list
    updateStats();
  } catch (err) {
    console.error(err);
    studentsTableBody.innerHTML = `<tr><td colspan="7" class="loading-cell">Error loading records: ${err.message}</td></tr>`;
  }
}

async function updateStats() {
  try {
    const res = await fetch(`${API_BASE}/api/stats`);
    if (res.ok) {
      const stats = await res.json();
      statTotal.textContent = stats.total_students;
      statActiveCourses.textContent = stats.courses_count;

      // Update course dropdown filter options
      const currentSelected = courseFilter.value;
      courseFilter.innerHTML = '<option value="">All Courses</option>';
      for (const [courseName, count] of Object.entries(stats.course_breakdown)) {
        if (courseName && courseName !== "Undeclared") {
          const opt = document.createElement("option");
          opt.value = courseName;
          opt.textContent = `${courseName} (${count})`;
          courseFilter.appendChild(opt);
        }
      }
      courseFilter.value = currentSelected;
    }

    // Count post-2005 students
    const post2005Res = await fetch(`${API_BASE}/students?born_after=2005-12-31`);
    if (post2005Res.ok) {
      const post2005Data = await post2005Res.json();
      statPost2005.textContent = post2005Data.total;
    }
  } catch (err) {
    console.error("Failed to update stats", err);
  }
}

async function checkOllamaStatus() {
  try {
    const res = await fetch(`${API_BASE}/ai/status`);
    const data = await res.json();
    if (data.status === "connected") {
      ollamaBadge.className = "status-badge connected";
      ollamaStatusText.textContent = `Ollama: ${data.target_model}`;
    } else {
      ollamaBadge.className = "status-badge offline";
      ollamaStatusText.textContent = "Ollama: Offline (Grounded Fallback Active)";
    }
  } catch (err) {
    ollamaBadge.className = "status-badge offline";
    ollamaStatusText.textContent = "AI Grounded Fallback Active";
  }
}

// --- Render Table ---
function renderTable(students) {
  if (!students || students.length === 0) {
    studentsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-cell">
          <p style="font-size: 1rem; font-weight: 600; margin-bottom: 0.3rem;">No student records found</p>
          <p style="font-size: 0.8rem; color: var(--text-dim);">Try adjusting your search filters or click "Seed Mock Data".</p>
        </td>
      </tr>
    `;
    return;
  }

  studentsTableBody.innerHTML = students.map(s => {
    const isPost2005 = s.date_of_birth && parseInt(s.date_of_birth.split("-")[0]) > 2005;
    const age = calculateAge(s.date_of_birth);

    return `
      <tr data-id="${s.student_id}">
        <td>
          <span class="student-id-badge">${escapeHtml(s.student_id)}</span>
        </td>
        <td>
          <div class="student-name-box">
            <span class="student-primary-name">${escapeHtml(s.name)}</span>
            ${s.address ? `<span class="student-address-sub">${escapeHtml(s.address)}</span>` : ""}
          </div>
        </td>
        <td>
          <div class="dob-age">
            <span>${escapeHtml(s.date_of_birth)}</span>
            <span class="age-tag ${isPost2005 ? 'post-2005' : ''}">${age} yrs${isPost2005 ? ' • >2005' : ''}</span>
          </div>
        </td>
        <td>
          ${s.course ? `<span class="course-tag">${escapeHtml(s.course)}</span>` : `<span style="color: var(--text-dim);">—</span>`}
        </td>
        <td>
          <div class="contact-stack">
            ${s.email ? `<span>✉️ ${escapeHtml(s.email)}</span>` : ""}
            ${s.phone ? `<span>📞 ${escapeHtml(s.phone)}</span>` : ""}
            ${!s.email && !s.phone ? `<span style="color: var(--accent-rose);">No contact info</span>` : ""}
          </div>
        </td>
        <td>
          <span style="font-size: 0.82rem; color: var(--text-muted);">${s.enrollment_date || "—"}</span>
        </td>
        <td class="text-right">
          <div class="action-buttons">
            <button class="action-btn" title="View Profile" onclick="openViewModal('${escapeHtml(s.student_id)}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            <button class="action-btn edit" title="Edit Student" onclick="openEditModal('${escapeHtml(s.student_id)}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="action-btn delete" title="Delete Student" onclick="openDeleteModal('${escapeHtml(s.student_id)}', '${escapeHtml(s.name)}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// --- Modals Handling ---
function openCreateModal() {
  formMode.value = "create";
  modalTitle.textContent = "Add New Student";
  studentForm.reset();
  document.getElementById("input-student-id").disabled = false;
  document.getElementById("input-enrollment-date").valueAsDate = new Date();
  modalError.classList.add("hidden");
  studentModal.classList.remove("hidden");
}

async function openEditModal(studentId) {
  const student = allStudents.find(s => s.student_id === studentId);
  if (!student) return;

  formMode.value = "edit";
  editOriginalId.value = student.student_id;
  modalTitle.textContent = `Edit Student: ${student.name}`;

  const idInput = document.getElementById("input-student-id");
  idInput.value = student.student_id;
  idInput.disabled = true; // Primary unique ID

  document.getElementById("input-name").value = student.name;
  document.getElementById("input-dob").value = student.date_of_birth;
  document.getElementById("input-course").value = student.course || "";
  document.getElementById("input-email").value = student.email || "";
  document.getElementById("input-phone").value = student.phone || "";
  document.getElementById("input-address").value = student.address || "";
  document.getElementById("input-enrollment-date").value = student.enrollment_date || "";

  modalError.classList.add("hidden");
  studentModal.classList.remove("hidden");
}

function closeStudentModal() {
  studentModal.classList.add("hidden");
}

async function handleStudentFormSubmit(e) {
  e.preventDefault();
  modalError.classList.add("hidden");

  const mode = formMode.value;
  const name = document.getElementById("input-name").value.trim();
  const dob = document.getElementById("input-dob").value;
  const email = document.getElementById("input-email").value.trim() || null;
  const phone = document.getElementById("input-phone").value.trim() || null;
  const course = document.getElementById("input-course").value.trim() || null;
  const address = document.getElementById("input-address").value.trim() || null;
  const enrollmentDate = document.getElementById("input-enrollment-date").value || null;

  // Contact info validation
  if (!email && !phone) {
    modalError.textContent = "At least one contact method (email or phone) is required.";
    modalError.classList.remove("hidden");
    return;
  }

  const payload = {
    name,
    date_of_birth: dob,
    email,
    phone,
    course,
    address,
    enrollment_date: enrollmentDate,
  };

  try {
    let res;
    if (mode === "create") {
      const studentId = document.getElementById("input-student-id").value.trim();
      if (studentId) payload.student_id = studentId;

      res = await fetch(`${API_BASE}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      const origId = editOriginalId.value;
      res = await fetch(`${API_BASE}/students/${encodeURIComponent(origId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Operation failed.");
    }

    closeStudentModal();
    showToast(mode === "create" ? `Student ${data.name} created successfully!` : "Student details updated!", "success");
    loadStudents();
  } catch (err) {
    modalError.textContent = err.message;
    modalError.classList.remove("hidden");
  }
}

// --- View Profile Modal ---
function openViewModal(studentId) {
  const s = allStudents.find(st => st.student_id === studentId);
  if (!s) return;

  const age = calculateAge(s.date_of_birth);
  profileDetailsContent.innerHTML = `
    <div class="profile-detail-row">
      <span class="profile-label">Student ID</span>
      <span class="profile-value student-id-badge">${escapeHtml(s.student_id)}</span>
    </div>
    <div class="profile-detail-row">
      <span class="profile-label">Full Name</span>
      <span class="profile-value">${escapeHtml(s.name)}</span>
    </div>
    <div class="profile-detail-row">
      <span class="profile-label">Date of Birth</span>
      <span class="profile-value">${escapeHtml(s.date_of_birth)} (${age} years old)</span>
    </div>
    <div class="profile-detail-row">
      <span class="profile-label">Course / Program</span>
      <span class="profile-value">${s.course ? escapeHtml(s.course) : "—"}</span>
    </div>
    <div class="profile-detail-row">
      <span class="profile-label">Email</span>
      <span class="profile-value">${s.email ? escapeHtml(s.email) : "—"}</span>
    </div>
    <div class="profile-detail-row">
      <span class="profile-label">Phone</span>
      <span class="profile-value">${s.phone ? escapeHtml(s.phone) : "—"}</span>
    </div>
    <div class="profile-detail-row">
      <span class="profile-label">Residential Address</span>
      <span class="profile-value">${s.address ? escapeHtml(s.address) : "—"}</span>
    </div>
    <div class="profile-detail-row">
      <span class="profile-label">Enrollment Date</span>
      <span class="profile-value">${s.enrollment_date || "—"}</span>
    </div>
  `;
  viewModal.classList.remove("hidden");
}

// --- Delete Modal ---
function openDeleteModal(studentId, name) {
  currentDeletingId = studentId;
  deleteConfirmText.textContent = `Are you sure you want to permanently delete student ${name} (ID: ${studentId})? This action cannot be undone.`;
  deleteModal.classList.remove("hidden");
}

async function confirmDeleteStudent() {
  if (!currentDeletingId) return;
  try {
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(currentDeletingId)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Delete failed");

    deleteModal.classList.add("hidden");
    showToast(data.message || "Student deleted successfully", "success");
    loadStudents();
  } catch (err) {
    showToast(`Failed to delete: ${err.message}`, "error");
  }
}

// --- Seed Data Action ---
async function handleSeedData() {
  seedBtn.disabled = true;
  seedBtn.textContent = "Seeding...";
  try {
    const samples = [
      { name: "Aarav Sharma", date_of_birth: "2004-05-14", email: "aarav.sharma@example.edu", phone: "+91 98765 43210", course: "Computer Science", address: "42 MG Road, Bengaluru" },
      { name: "Diya Patel", date_of_birth: "2006-11-22", email: "diya.patel@example.edu", phone: "+91 98123 45678", course: "Data Science", address: "15 Park Street, Ahmedabad" },
      { name: "Rohan Verma", date_of_birth: "2003-03-10", email: "rohan.verma@example.edu", phone: "+91 97234 56789", course: "Mechanical Engineering", address: "88 Civil Lines, Delhi" },
      { name: "Ananya Iyer", date_of_birth: "2007-01-18", email: "ananya.iyer@example.edu", phone: "+91 96345 67890", course: "Computer Science", address: "12 Anna Salai, Chennai" },
      { name: "Sneha Kulkarni", date_of_birth: "2006-04-15", email: "sneha.k@example.edu", phone: "+91 94567 89012", course: "Data Science", address: "29 FC Road, Pune" },
    ];

    let createdCount = 0;
    for (const item of samples) {
      const res = await fetch(`${API_BASE}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) createdCount++;
    }

    showToast(`Seeded ${createdCount} new student records!`, "success");
    loadStudents();
  } catch (err) {
    showToast(`Error seeding data: ${err.message}`, "error");
  } finally {
    seedBtn.disabled = false;
    seedBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
      Seed Mock Data
    `;
  }
}

// --- AI Query Form Submission ---
async function handleAISubmit(e) {
  e.preventDefault();
  const question = aiInput.value.trim();
  if (!question) return;

  aiSubmitBtn.disabled = true;
  aiResponseContainer.innerHTML = `
    <div class="ai-loading-box">
      <div class="spinner"></div>
      <span>Querying database context & generating response...</span>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/ai/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || "AI query failed");
    }

    const data = await res.json();
    renderAIResponse(data);
  } catch (err) {
    aiResponseContainer.innerHTML = `
      <div class="ai-result-box">
        <div class="modal-error">AI Error: ${escapeHtml(err.message)}</div>
      </div>
    `;
  } finally {
    aiSubmitBtn.disabled = false;
  }
}

function renderAIResponse(data) {
  aiResponseContainer.innerHTML = `
    <div class="ai-result-box">
      <div class="ai-meta-bar">
        <span class="ai-source-tag">${escapeHtml(data.source === "ollama" ? "⚡ Ollama " + data.model_used : "🛡️ Grounded AI Engine")}</span>
        <span>Referenced: ${data.records_referenced} records</span>
      </div>
      <div class="ai-answer-body">${escapeHtml(data.answer)}</div>
    </div>
  `;
}

// --- Utilities ---
function calculateAge(dobString) {
  if (!dobString) return "—";
  const birth = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Expose globals for onclick handlers
window.openEditModal = openEditModal;
window.openViewModal = openViewModal;
window.openDeleteModal = openDeleteModal;
