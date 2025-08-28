# Project Frontend Implementation Notes

This document summarizes the major features and decisions implemented in this repo to help future developers get up to speed quickly.

## Overview

- React + Vite app with React Router v6.
- Local storage used for Kanban and project data (mock persistence).
- Backend integration for authentication, profiles, and users via `src/api/client.js`.
- PWA support (manifest + service worker).
- Mobile-friendly CSS with responsive tables and reduced border radii.

## PWA

- `index.html` links to `public/manifest.webmanifest`, theme color, and icons.
- Service worker at `public/sw.js` registers in `src/main.jsx`.
- Icon expected at `/icon-512x512.png` (in repo root; consider moving to `/public`).

## Kanban Board (`src/kanban/KanbanBoard.jsx`)

- Columns and tasks persisted per storage key.
- Drag-and-drop between columns; per-column internal vertical scroll; horizontal scroll only for the board container.
- Task editing supports:
  - Title, description, type (task/info/request)
  - Priority (low/medium/high)
  - Tags array
  - Status (plan/prepare/in_progress/done) with Vietnamese labels (Dự kiến/Chuẩn bị/Đang làm/Hoàn thành)
  - Assignee: integrates with backend users via `users` prop (stores `assigneeId` and a display `assignee`)
- Double-click opens a dedicated Task page when `onOpenTask` prop provided; otherwise opens inline modal (centered).
- Adding a new task uses a dialog with fields for Type, Status, and Title.

## Task Detail Page (`src/pages/TaskDetailPage.jsx`)

- Route: `/projects/:id/tasks/:taskId` (registered in `src/App.jsx`).
- Loads the corresponding board from local storage using `projectBoardKey(id)`.
- Two-column layout on desktop (`.task-layout`), collapses to one column on mobile.
- Left: Task detail view/edit. Right: Sidebar with tabs (Activity, Files, Relations).
- Activity includes actor info from `useAuth` (name/initials/avatar if available) and logs view/update/attach/comment events.
- Files: attaches file metadata in local storage (no upload server).
- Relations: manage references to other tasks/URLs.
- Comments: persisted per task and displayed beneath details (left column).

## Users Integration (`src/api/client.js` and usage)

- `usersApi.list({ page, limit })` fetches users from `/users` (JWT token required).
- Projects store participant IDs rather than free text strings.
- `ProjectsList` and `ProjectDetail` map participant IDs to user display names (first+last name, fallback username/email).

## Projects and Process Flow

- Project storage (`src/projects/store.js`) now includes:
  - `stageIndex` (number): current stage index.
  - `stageMeta` (object): arbitrary meta per stage (e.g., dates/notes).
- `ProjectDetail` was redesigned into tabs:
  - Dashboard: Project description (with edit), members list/management, and a simple chat.
  - Kanban: The board for the project (keyed by `projectBoardKey`).
  - Flow dự án: A 6-step process (Thông tin → Khảo sát → Thiết kế → Thi công → Nghiệm thu → Hỗ trợ) with a stepper and stage meta form.
- Flow stages are now: Thông tin → Khảo sát → Thiết kế → Demo → Thi công → Nghiệm thu → Hỗ trợ.

- Flow "Thông tin" stage includes fields:
  - `sale_contact`: who from Sales handed off the project.
  - `tech_reviewer_id`: technical reviewer (backend user ID).
  - `feedback`: notes to send back to Sales.

- Flow "Demo" stage includes fields:
  - `demo_at`: scheduled demo time.
  - `demo_note`: quick note/outcome.

## Responsive UI & Styling

- Reduced global border radii for a less rounded look.
- Sidebar adapts on mobile; content area padding adjusted.
- Tables become stacked cards on narrow viewports using `data-label` attributes.
- Only Kanban board scrolls horizontally; global `overflow-x` hidden to prevent page-wide scroll.

## Files & Paths Changed (Key)

- Manifest & SW: `public/manifest.webmanifest`, `public/sw.js`, `index.html`, `src/main.jsx`.
- Styles: `src/styles.css` (responsive, radii, table stacking, status chips).
- API: `src/api/client.js` (added `usersApi`).
- Kanban: `src/kanban/KanbanBoard.jsx` (users, status selector, dialog add).
- Task page: `src/pages/TaskDetailPage.jsx` (sidebar, comments, status, user mapping).
- Projects: `src/projects/store.js` (stage fields), `src/pages/ProjectsList.jsx` (participants picker, process column), `src/pages/ProjectDetail.jsx` (tabs, flow, chat, members).

### Project Detail Tabs

- Implemented tabbed layout with an accessible tab bar:
  - Markup: container `.tabs` with `role="tablist"`, buttons `.tab` with `role="tab"` and `aria-selected`.
  - Styles in `src/styles.css` under the Tabs section: underline active tab, hover background, focus ring.
  - Tabs: Dashboard (description + members + chat), Kanban (board), Flow dự án (process stepper + stage meta forms).

## Notes & Next Steps

- Consider persisting projects and kanban to backend instead of localStorage.
- Optionally enforce stage transition rules (cannot advance without required fields).
- Enhance chat with WebSocket for real-time updates.
- Add search/filter to user pickers, server-side pagination if needed.
- Ensure `icon-512x512.png` is available under `/public` for PWA builds.
