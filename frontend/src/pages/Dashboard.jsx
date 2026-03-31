import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserStats } from '../api/client'
import { getStreak } from '../utils/streak'

const LEVEL_LABEL = { '3': '3級', '2c': '2級商業', '2i': '2級工業' }
const LEVEL_COLOR = { '3': 'indigo', '2c': 'purple', '2i': 'teal' }

const BAR_COLOR = {
  indigo: 'bg-indigo-500', purple: 'bg-purple-500', teal: 'bg-teal-500',
  green: 'bg-green-500', amber: 'bg-amber-400', red: 'bg-red-400',
}

function rateColor(rate) {
  if (rate >= 80) return 'text-green-600'
  if (rate >= 60) return 'text-amber-500'
  return 'text-red-500'
}

function BarRow({ label, correct, total, rate, color = 'indigo' }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700 truncate max-w-[60%]">{label}</span>
        <span className={`text-sm font-bold ${rateColor(rate)}`}>{rate}% <span className="text-gray-400 font-normal text-xs">({correct}/{total})</span></span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div className={`${BAR_COLOR[color] || 'bg-indigo-500'} h-3 rounded-full transition-all duration-500`} style={{ width: `${rate}%` }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const userId = Number(localStorage.getItem('userId'))
  const username = localStorage.getItem('username') || 'ゲスト'
  const streak = getStreak(userId)

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeLevel, setActiveLevel] = useState('all')

  useEffect(() => {
    if (!userId) { navigate('/'); return }
    getUserStats(userId).then(s => { setStats(s); setLoading(false) })
  }, [userId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-100">
      <div className="text-gray-400 text-sm">読み込み中...</div>
    </div>
  )

  const levels = ['3', '2c', '2i']
  const byTheme = stats?.by_theme || []
  const filteredThemes = (activeLevel === 'all' ? byTheme : byTheme.filter(t => t.level === activeLevel))
    .sort((a, b) => a.rate - b.rate)

  const totalRate = stats?.total_answered > 0
    ? Math.round(stats.total_correct / stats.total_answered * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">

        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-2xl hover:opacity-75 transition" title="トップへ戻る">📒</button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">進捗ダッシュボード</h1>
            <p className="text-sm text-gray-500">{username} さんの学習記録</p>
          </div>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-4 shadow text-center">
            <div className="text-3xl font-bold text-indigo-600">{stats?.total_answered ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">総回答数</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow text-center">
            <div className={`text-3xl font-bold ${rateColor(totalRate)}`}>{totalRate}%</div>
            <div className="text-xs text-gray-500 mt-1">総合正解率</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow text-center">
            <div className="text-3xl font-bold text-amber-500">🔥{streak}</div>
            <div className="text-xs text-gray-500 mt-1">連続学習日数</div>
          </div>
        </div>

        {/* レベル別 */}
        <div className="bg-white rounded-2xl shadow p-5 mb-4">
          <h2 className="font-bold text-gray-700 mb-4 text-sm">📊 レベル別正解率</h2>
          {levels.map(lv => {
            const s = stats?.by_level?.[lv]
            if (!s) return (
              <div key={lv} className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{LEVEL_LABEL[lv]}</span>
                  <span className="text-xs text-gray-400">未挑戦</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3" />
              </div>
            )
            return <BarRow key={lv} label={LEVEL_LABEL[lv]} correct={s.correct} total={s.total} rate={s.rate} color={LEVEL_COLOR[lv]} />
          })}
        </div>

        {/* テーマ別 */}
        <div className="bg-white rounded-2xl shadow p-5 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="font-bold text-gray-700 text-sm">📌 テーマ別正解率（低い順）</h2>
            <div className="flex flex-wrap gap-1">
              {['all', ...levels].map(lv => (
                <button key={lv}
                  onClick={() => setActiveLevel(lv)}
                  className={`text-xs px-2 py-1 rounded-lg font-semibold transition ${activeLevel === lv ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {lv === 'all' ? '全て' : LEVEL_LABEL[lv]}
                </button>
              ))}
            </div>
          </div>
          {filteredThemes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">まだデータがありません</p>
          ) : (
            filteredThemes.map((t, i) => (
              <BarRow key={i}
                label={`${LEVEL_LABEL[t.level]} / ${t.theme}`}
                correct={t.correct} total={t.total} rate={t.rate}
                color={LEVEL_COLOR[t.level]}
              />
            ))
          )}
        </div>

        {/* 日別学習グラフ */}
        {stats?.daily?.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-5 mb-4">
            <h2 className="font-bold text-gray-700 mb-4 text-sm">📅 日別学習回数（直近30日）</h2>
            <div className="flex items-end gap-1 h-20">
              {stats.daily.map((d, i) => {
                const maxTotal = Math.max(...stats.daily.map(x => x.total), 1)
                const height = Math.round((d.total / maxTotal) * 100)
                const rate = d.total > 0 ? Math.round(d.correct / d.total * 100) : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {d.date}<br />{d.total}問 / {rate}%正解
                    </div>
                    <div className="w-full rounded-t-sm bg-indigo-400 hover:bg-indigo-500 transition"
                      style={{ height: `${Math.max(height, 4)}%` }} />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{stats.daily[0]?.date?.slice(5)}</span>
              <span>{stats.daily[stats.daily.length - 1]?.date?.slice(5)}</span>
            </div>
          </div>
        )}

        <button onClick={() => navigate('/')}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm transition">
          ← トップへ戻る
        </button>
      </div>
    </div>
  )
}
