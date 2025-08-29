import React, { useMemo } from 'react'

export default function ProjectTimeline({ project }) {
  const flattenLeaves = (nodes, path = []) =>
    (nodes || []).flatMap((n, i) => (n?.children?.length ? flattenLeaves(n.children, [...path, i]) : [{ node: n, path: [...path, i] }]))

  const leaves = useMemo(() => flattenLeaves(project?.pipeline || []), [project])

  const progress = useMemo(() => {
    const total = leaves.length
    const skipped = leaves.filter(x => x.node.status === 'skipped').length
    const done = leaves.filter(x => x.node.status === 'done').length
    const pct = Math.round((done / Math.max(1, total - skipped)) * 100)
    return { done, total, skipped, pct }
  }, [leaves])

  const currentLeafIndex = useMemo(() => {
    const activeIdx = leaves.findIndex(x => x.node.status === 'in_progress')
    if (activeIdx !== -1) return activeIdx
    for (let i = leaves.length - 1; i >= 0; i--) {
      if (leaves[i].node.status === 'done') return i
    }
    return leaves.length ? 0 : -1
  }, [leaves])

  const shown = currentLeafIndex >= 0 ? leaves.slice(0, currentLeafIndex + 1) : []

  return (
    <div className="card">
      <div className="card__body" style={{ display: 'grid', gap: 12 }}>
        <div className="card__title">Timeline quy trình</div>
        <span className="badge">Tiến độ: {progress.done}/{Math.max(0, progress.total - progress.skipped)} ({progress.pct}%)</span>
        <div style={{ display: 'grid', gap: 0, position: 'relative', paddingLeft: 26 }}>
          {shown.length === 0 ? (
            <div className="card__desc">Chưa có giai đoạn.</div>
          ) : shown.map((x, i) => {
            const s = x.node
            const isDone = s.status === 'done'
            const isActive = s.status === 'in_progress'
            const bg = isDone ? '#22c55e' : isActive ? '#2563eb' : '#94a3b8'
            const fg = '#fff'
            const isLast = i === shown.length - 1
            return (
              <div key={x.path.join('.')} style={{ position: 'relative', paddingBottom: isLast ? 0 : 14 }}>
                {/* connector line */}
                {!isLast ? (
                  <div style={{ position: 'absolute', left: 12, top: 26, bottom: 0, width: 2, background: '#e5e7eb' }} />
                ) : null}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'absolute', left: 0, width: 26, height: 26, borderRadius: 999, display: 'grid', placeItems: 'center', fontWeight: 700, color: fg, background: bg, border: '1px solid var(--border)' }}>{i + 1}</div>
                  <div style={{ fontWeight: isActive ? 700 : 500, marginLeft: 6 }}>{s.name}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
