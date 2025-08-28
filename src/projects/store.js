const PROJECTS_KEY = 'projects-v1'

// ----- Pipeline model helpers -----
export function defaultPipeline() {
  return [
    { id: 'start', name: 'Bắt đầu' },
    { id: 'assessment', name: 'Đánh giá' },
    { id: 'check_report', name: 'Kiểm tra & Báo cáo' },
    { id: 'survey_demo', name: 'Khảo sát demo (nếu cần)' },
    { id: 'design_build_demo', name: 'Thiết kế & Thi công demo' },
    { id: 'demo', name: 'Demo' },
    { id: 'demo_report', name: 'Báo cáo Demo' },
    { id: 'await_contract', name: 'Chờ hợp đồng' },
    { id: 'design', name: 'Thiết kế' },
    { id: 'build', name: 'Thi công' },
    { id: 'test', name: 'Thử nghiệm' },
    { id: 'install', name: 'Lắp đặt' },
    { id: 'trial_run', name: 'Chạy thử' },
    { id: 'handover', name: 'Bàn giao' },
    { id: 'acceptance', name: 'Nghiệm thu' },
    { id: 'support', name: 'Hỗ trợ' }
  ]
}

function ensureSingleInProgress(pipeline) {
  const activeIdx = pipeline.findIndex(s => s.status === 'in_progress')
  if (activeIdx === -1) return pipeline
  return pipeline.map((s, i) => ({ ...s, status: i === activeIdx ? 'in_progress' : (s.status === 'in_progress' ? undefined : s.status) }))
}

function migrateLegacyToPipeline(project) {
  if (project.pipeline && Array.isArray(project.pipeline)) {
    return { ...project, pipeline: ensureSingleInProgress(project.pipeline) }
  }
  const legacyIndex = Math.max(0, Math.min(6, Number(project.stageIndex ?? 0)))
  const legacyMeta = project.stageMeta || {}

  // Build pipeline from defaults
  const base = defaultPipeline().map((s, i) => {
    const meta = legacyMeta[s.id] || {}
    let status
    if (i < legacyIndex) status = 'done'
    else if (i === legacyIndex) status = 'in_progress'
    return { ...s, ...meta, status }
  })

  return { ...project, pipeline: ensureSingleInProgress(base) }
}

function normalize(list) {
  let changed = false
  const next = list.map(p => {
    const n = migrateLegacyToPipeline(p)
    if (n !== p || !p.pipeline) changed = true
    return n
  })
  return { list: next, changed }
}

function load() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY)
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function save(list) {
  try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(list)) } catch {}
}

export function getProjects() { return load() }
export function getProjectsWithMigration() {
  const loaded = load()
  const { list, changed } = normalize(loaded)
  if (changed) save(list)
  return list
}

export function addProject({ name, description = '', participants = [], cover = '' }) {
  const list = load()
  const project = {
    id: crypto.randomUUID(),
    name: name?.trim() || 'Untitled',
    description: description?.trim() || '',
    participants,
    cover,
    stageIndex: 0,
    stageMeta: {},
    pipeline: defaultPipeline().map((s, i) => ({ ...s, status: i === 0 ? 'in_progress' : undefined }))
  }
  list.push(project)
  save(list)
  return project
}

export function updateProject(id, patch) {
  const list = load()
  const idx = list.findIndex(p => p.id === id)
  if (idx === -1) return null
  list[idx] = { ...list[idx], ...patch }
  save(list)
  return list[idx]
}

export function removeProject(id) {
  const list = load()
  const next = list.filter(p => p.id !== id)
  save(next)
}

export function getProject(id) {
  const loaded = load()
  const found = loaded.find(p => p.id === id) || null
  if (!found) return null
  const migrated = migrateLegacyToPipeline(found)
  if (migrated !== found || !found.pipeline) {
    const idx = loaded.findIndex(p => p.id === id)
    if (idx !== -1) {
      loaded[idx] = migrated
      save(loaded)
    }
  }
  return migrated
}

export function projectBoardKey(id) { return `kanban-board-project-${id}` }
