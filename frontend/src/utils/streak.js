const today = () => new Date().toISOString().slice(0, 10)
const yesterday = () => {
  const d = new Date(); d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function updateStreak(userId) {
  if (!userId) return
  const lastKey = `streak_${userId}_last`
  const countKey = `streak_${userId}_count`
  const t = today()
  const last = localStorage.getItem(lastKey)
  if (last === t) return // 今日すでに更新済み
  const count = parseInt(localStorage.getItem(countKey) || '0')
  const newCount = last === yesterday() ? count + 1 : 1
  localStorage.setItem(lastKey, t)
  localStorage.setItem(countKey, String(newCount))
}

export function getStreak(userId) {
  if (!userId) return 0
  const last = localStorage.getItem(`streak_${userId}_last`)
  const count = parseInt(localStorage.getItem(`streak_${userId}_count`) || '0')
  if (last === today() || last === yesterday()) return count
  return 0
}
