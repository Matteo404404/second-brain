export function notifyRefresh(area = 'all') {
  window.dispatchEvent(new CustomEvent('sb-refresh', { detail: { area } }))
}

export function onRefresh(callback, area = 'all') {
  const handler = (event) => {
    const target = event.detail?.area ?? 'all'
    if (area === 'all' || target === 'all' || target === area) callback()
  }
  window.addEventListener('sb-refresh', handler)
  return () => window.removeEventListener('sb-refresh', handler)
}
