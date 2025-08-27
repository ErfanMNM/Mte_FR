const PROJECTS_KEY = 'projects-v1'

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

export function addProject({ name, description = '', participants = [], cover = '' }) {
  const list = load()
  const project = { id: crypto.randomUUID(), name: name?.trim() || 'Untitled', description: description?.trim() || '', participants, cover }
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
  return load().find(p => p.id === id) || null
}

export function projectBoardKey(id) { return `kanban-board-project-${id}` }
