const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api'

/** 共通のfetchラッパー：レスポンスチェック + ネットワークエラー処理 */
async function request(url, options = {}) {
  try {
    const res = await fetch(url, options)
    if (!res.ok) {
      const errorBody = await res.text().catch(() => '')
      throw new Error(
        `API error ${res.status}: ${errorBody || res.statusText}`
      )
    }
    return res.json()
  } catch (err) {
    if (err.message.startsWith('API error')) throw err
    // ネットワークエラー（サーバー停止、オフライン等）
    throw new Error(
      'サーバーに接続できません。ネットワーク接続を確認してください。'
    )
  }
}

export async function createOrGetUser(username) {
  return request(`${BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
}

export async function getQuestions(level, theme = null) {
  const url = theme
    ? `${BASE}/questions/${level}?theme=${encodeURIComponent(theme)}`
    : `${BASE}/questions/${level}`
  return request(url)
}

export async function getThemes(level) {
  return request(`${BASE}/questions/${level}/themes/list`)
}

export async function getWeakQuestions(userId, level) {
  return request(`${BASE}/results/weak/${userId}/${level}`)
}

export async function recordResult(userId, questionId, level, isCorrect) {
  return request(`${BASE}/results`, {
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
  return request(`${BASE}/ranking`)
}

export async function getUserStats(userId) {
  return request(`${BASE}/stats/${userId}`)
}
