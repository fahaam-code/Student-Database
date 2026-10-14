# Student Management Dashboard — Frontend

A clean, responsive, and minimalist web dashboard built with **React**, **TypeScript**, **Vite**, and **Vanilla CSS** featuring a warm **Beige / Sand** aesthetic. Integrates directly with the FastAPI + SQLite Student Database backend.

---

## 🎨 Design & Aesthetic

- **Theme**: Minimalist warm beige palette with soft linen/sand background (`#f6f3eb`), warm cream cards (`#ffffff`), warm terracotta accents (`#94572c`), and warm stone typography.
- **Simplicity**: Distraction-free, intuitive interface focused strictly on student CRUD workflows.

---

## 🚀 Key Features

- **Sidebar Navigation**:
  - **Dashboard**: High-level overview with key statistics and instant records table.
  - **Students**: Student records management, search, and filters.
  - **Live Backend Status**: Real-time connection indicator with FastAPI (`http://127.0.0.1:8000`).
- **Statistics Cards**:
  - **Total Enrolled**: Total count of registered students.
  - **Active Courses**: Number of unique academic programs.
  - **Born After 2005**: Real-time counter and quick filter chip for younger students.
- **Student Records Table**:
  - Search by Name, Student ID, Email, or Course.
  - Course filter dropdown and "Born After 2005" toggle chip.
  - Warm colored badges for academic programs.
  - Actions: **View Profile**, **Edit Profile**, and **Delete Record**.
- **Student Modal**:
  - Create and Edit modes with field validation.
  - Enforces the backend validation requirement: *At least one contact method (email or phone) must be provided*.
- **Notifications**:
  - Unobtrusive toast alerts for create, update, delete, and error events.

---

## 📦 Project Structure

```
frontend/
├── index.html              # HTML entry point with warm favicon & typography
├── package.json            # React, TypeScript, Vite, Lucide dependencies
├── tsconfig.json           # TypeScript configuration
├── tsconfig.node.json      # Vite node environment config
├── vite.config.ts          # Vite configuration with API reverse proxy
├── README.md               # Frontend documentation
└── src/
    ├── main.tsx            # React application root
    ├── App.tsx             # Root dashboard controller & modal states
    ├── index.css           # Warm beige design system
    ├── vite-env.d.ts       # Vite client typings
    ├── types/
    │   └── student.ts      # TypeScript interfaces for API models & filters
    ├── services/
    │   └── api.ts          # REST client for FastAPI endpoints
    └── components/
        ├── Sidebar.tsx             # Sidebar with navigation and backend status
        ├── Navbar.tsx              # Top navigation bar with actions
        ├── StatCards.tsx           # Total Enrolled, Active Courses, Born After 2005
        ├── StudentTable.tsx        # Records table, search, filters & actions
        ├── StudentModal.tsx        # Add/Edit student form with schema validation
        ├── StudentDetailModal.tsx  # Full student profile viewer
        ├── DeleteConfirmModal.tsx  # Safe deletion confirmation dialog
        └── Toast.tsx               # Friendly status & error notifications
```

---

## 🛠️ Quick Start & Running Locally

### 1. Start the Backend API (FastAPI)

From the project root:

```powershell
& ".\.venv\Scripts\python.exe" -m uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- API Root: `http://127.0.0.1:8000`
- Swagger Docs: `http://127.0.0.1:8000/docs`

### 2. Start the Frontend (Vite + React)

From the `frontend/` directory:

```powershell
cd frontend
npm install
npm run dev
```

The dashboard will launch at:
- Local URL: **`http://localhost:5173`**
