# Project Flow Design

This document defines the project process (flow) model, default pipeline, statuses, UX behaviors, and implementation plan. It replaces the earlier fixed-step approach with a flexible, stage-based pipeline that supports custom stages and clear status tracking.

## Goals

- Model the full lifecycle as ordered stages with clear statuses.
- Support custom (user-defined) stages in addition to a default pipeline.
- Allow marking each stage as In Progress, Completed, or Skipped.
- Provide a professional Flow UI: overview stepper + editable list.
- Persist per-project pipeline with metadata in local storage (or backend later).

## Default Pipeline (ordered)

1. Bắt đầu
2. Đánh giá
3. Kiểm tra & Báo cáo
4. Khảo sát demo (nếu cần)
5. Thiết kế & Thi công demo
6. Demo
7. Báo cáo Demo
8. Chờ hợp đồng
9. Thiết kế
10. Thi công
11. Thử nghiệm
12. Lắp đặt
13. Chạy thử
14. Bàn giao
15. Nghiệm thu
16. Hỗ trợ

Note: “Khảo sát demo (nếu cần)” may be Skipped for projects that don’t require it.

## Stage Statuses

- `in_progress` (Đang làm): The active/current stage.
- `done` (Hoàn thành): Finished stage.
- `skipped` (Bỏ qua): Not applicable stage; excluded from progress denominator (optional, see Progress below).

Recommended labels/colors (CSS classes):
- `.chip--status-in_progress` → yellow background, brown text
- `.chip--status-done` → green background, dark green text
- `.chip--status-skipped` → gray/neutral background, slate text

## Data Model

Extend the project record with a `pipeline` array of stage objects. Example:

```jsonc
{
  "id": "...",
  "name": "...",
  "description": "...",
  "participants": [1, 2, 3],
  "cover": "",
  // New flexible pipeline
  "pipeline": [
    {
      "id": "start",             // string, unique
      "name": "Bắt đầu",         // string, display
      "status": "in_progress",   // 'in_progress' | 'done' | 'skipped'
      "startAt": "2025-01-01T09:00:00Z", // ISO string (optional)
      "endAt": null,               // ISO string (optional)
      "owners": [1],               // array<userId> (optional)
      "note": "Khởi tạo hồ sơ",   // string (optional)
      "meta": {}                   // object (optional, for future)
    },
    { "id": "assessment", "name": "Đánh giá", "status": "done" }
  ]
}
```

Back-compat: If `pipeline` is missing, initialize from the Default Pipeline, infer current stage using the first stage not `done`/`skipped`.

### Derived Values

- Current Stage: first item with `status === 'in_progress'`, else first not-done (set to `in_progress` on load).
- Progress: number of `done` stages divided by total minus skipped ({done} / {total - skipped}).

## UX & Interactions

### Flow Tab (ProjectDetail)

Two main sections:

1) Overview Stepper
- Horizontal stepper with numbered circles and stage names.
- Colors reflect status:
  - in_progress → primary/blue or warning/yellow accent
  - done → green
  - skipped → gray
- Clicking a step selects it in the editor list (scrolls into view).
- Shows a compact progress bar and counts (Done/Skipped/Total).

2) Editable List
- Table or card list for all stages with controls:
  - Name (inline editable text)
  - Status dropdown: Đang làm / Hoàn thành / Bỏ qua
  - Owners (multi-select from backend users)
  - Start / End (datetime-local)
  - Note (text)
  - Actions: Move Up/Down, Delete (only for custom stages)
- Add Stage: opens small form (Name, insert position before/after selected, optional owners). Adds with `status = in_progress` or `skipped` depending on context.
- Reset to Default: replaces with default pipeline (confirm required).
- Auto-Advance: when a stage is set to ‘Hoàn thành’, optionally auto set the next non-done/non-skipped stage to `in_progress` if none is active.

### Rules & Behaviors

- Only one `in_progress` stage should be active at a time (enforced on change).
- Changing status to `in_progress` moves any other `in_progress` to an appropriate state (typically remains `done`).
- Setting `in_progress` sets `startAt` if not set yet; setting `done` sets `endAt` if not set yet.
- Skipped stages are included in history but may be excluded from progress denominator.
- Custom stages:
  - Have generated `id` (e.g., `custom-<uuid>`), can be deleted or reordered.
  - Persist fully like default stages.

## API / Persistence

- Current implementation uses localStorage via `src/projects/store.js`.
- Future: move to backend endpoints (GET/PUT `/projects/:id/pipeline`). The same JSON shape can be sent/received.

## Migration Plan

1) Schema extension:
- Add `pipeline` to projects. On read: if undefined, build from Default Pipeline and try to map legacy `stageIndex/stageMeta` to pipeline entries.
- Mark one stage `in_progress`: the first non-done/non-skipped entry.

2) UI overhaul (Flow tab):
- Replace `ProjectProcessCard` with `ProjectFlow` using the design above.
- Build Stepper with color-coded chips and progress.
- Build editable list with status, dates, owners, notes, actions.
- Add ‘Add Stage’ dialog.

3) Status visuals:
- Extend CSS to include `.chip--status-skipped`.
- Use consistent chips in both stepper and list.

4) Migration
- On first open, transform legacy `stageIndex/stageMeta` to `pipeline`.

5) Optional enhancements
- Audit log (who changed what when).
- Stage templates per project type.
- Backend sync.

## Component Sketch

- `<ProjectFlow />` (replacing `ProjectProcessCard`):
  - Props: `project`, `setProject`, `users`.
  - Sub-components:
    - `<FlowStepper pipeline={pipeline} onSelect={...} />`
    - `<FlowList pipeline={pipeline} users={users} onChangeStage={...} onAdd={...} onRemove={...} onMove={...} />`

## Default Pipeline IDs

`start`, `assessment`, `check_report`, `survey_demo`, `design_build_demo`, `demo`, `demo_report`, `await_contract`, `design`, `build`, `test`, `install`, `trial_run`, `handover`, `acceptance`, `support`

IDs are stable handles; names are editable.

