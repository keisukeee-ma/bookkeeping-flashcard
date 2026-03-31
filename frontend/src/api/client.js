const BASE = 'http://localhost:8000/api'

export async function createOrGetUser(username) {
  const res = await fetch(`${BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
  return res.json()
}

export async function getQuestions(level, theme = null) {
  const url = theme
    ? `${BASE}/questions/${level}?theme=${encodeURIComponent(theme)}`
    : `${BASE}/questions/${level}`
  const res = await fetch(url)
  return res.json()
}

export async function getThemes(level) {
  const res = await fetch(`${BASE}/questions/${level}/themes/list`)
  return res.json()
}

export async function getWeakQuestions(userId, level) {
  const res = await fetch(`${BASE}/results/weak/${userId}/${level}`)
  return res.json()
}

export async function recordResult(userId, questionId, level, isCorrect) {
  await fetch(`${BASE}/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      question_id: questionId,
      level,
      is_correct: isCorrect ? 1 : 0,
    }),
  })
}

export async function getRanking() {
  const res = await fetch(`${BASE}/ranking`)
  return res.json()
}

export async function getUserStats(userId) {
  const res = await fetch(`${BASE}/stats/${userId}`)
  return res.json()
}
