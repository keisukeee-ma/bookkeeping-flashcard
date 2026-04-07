import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrGetUser } from '../api/client'
import { getStreak } from '../utils/streak'

const THEMES = {
  '3':  ['開業・資本金','商品売買','売掛金・買掛金','現金・預金','収益・費用'],
  '2c': ['固定資産','引当金','手形・電子記録債権','その他の取引','税金','株式会社会計','有価証券','外貨建取引','本支店会計'],
  '2i': ['材料費','労務費','製造間接費','仕掛品・製品','工場会計'],
}

const LEVELS = [
  { value: '3',  label: '3級',         color: 'indigo', emoji: '📘' },
  { value: '2c', label: '2級 商業簿記', color: 'purple', emoji: '📗' },
  { value: '2i', label: '2級 工業簿記', color: 'teal',   emoji: '📙' },
]

const COLOR = {
  indigo: { bg: 'bg-indigo-500 hover:bg-indigo-600', light: 'bg-indigo-50 border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', chip: 'hover:bg-indigo-50 hover:border-indigo-400', text: 'text-indigo-700', activeBg: 'bg-indigo-500' },
  purple: { bg: 'bg-purple-500 hover:bg-purple-600', light: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700', chip: 'hover:bg-purple-50 hover:border-purple-400', text: 'text-purple-700', activeBg: 'bg-purple-500' },
  teal:   { bg: 'bg-teal-500 hover:bg-teal-600',     light: 'bg-teal-50 border-teal-200',     badge: 'bg-teal-100 text-teal-700',     chip: 'hover:bg-teal-50 hover:border-teal-400',     text: 'text-teal-700',   activeBg: 'bg-teal-500'   },
}

function getFlagCount(userId, level) {
  try {
    const flags = JSON.parse(localStorage.getItem(`flags_${userId}`) || '[]')
    return level ? flags.filter(f => f.level === level).length : flags.length
  } catch { return 0 }
}

/** ボタン内スピナー */
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function Home() {
  const [username, setUsername] = useState(localStorage.getItem('username') || '')
  const [activeTab, setActiveTab] = useState('level')
  const [selectedLevel, setSelectedLevel] = useState('3')
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [loadingTarget, setLoadingTarget] = useState(null)   // どのボタンが読込中か
  const navigate = useNavigate()

  const userId = Number(localStorage.getItem('userId')) || null
  const streak = getStreak(userId)
  const lv = LEVELS.find(l => l.value === selectedLevel)
  const c = COLOR[lv.color]

  // ページ表示時にバックエンドを起こす（Renderコールドスタート対策）
  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    fetch(`${API}/`).catch(() => {})
  }, [])

  // PWA インストールプロンプト
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      // 一度閉じたら再表示しない
      if (!localStorage.getItem('pwa_install_dismissed')) {
        setShowInstallBanner(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setShowInstallBanner(false)
    setInstallPrompt(null)
  }

  const handleDismissInstall = () => {
    setShowInstallBanner(false)
    localStorage.setItem('pwa_install_dismissed', '1')
  }

  const go = async (path, targetKey) => {
    if (loadingTarget) return                    // 二重タップ防止
    setLoadingTarget(targetKey || path)
    const name = username.trim() || '匿名'
    try {
      const user = await createOrGetUser(name)
      if (user?.id) {
        localStorage.setItem('userId', user.id)
        localStorage.setItem('username', user.username)
      }
    } catch (e) {
      console.error('ユーザー取得失敗:', e)
    }
    navigate(path)
    // ※ navigate後に戻ってきた場合に備えてリセット
    setLoadingTarget(null)
  }

  const handleLevelStart  = (lv, mode) => go(`/${mode}/${lv.value}`, `${mode}-${lv.value}`)
  const handleThemeStart  = () => selectedTheme && go(`/study/${selectedLevel}?theme=${encodeURIComponent(selectedTheme)}`, 'theme-start')
  const handleFlaggedStart = (level) => go(`/flagged/${level}`, `flagged-${level}`)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-lg">

        {/* ヘッダー */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-1">📒</div>
          <h1 className="text-3xl font-bold text-indigo-800 tracking-tight">簿記フラッシュカード</h1>
          <p className="text-gray-500 text-sm mt-1">日商簿記検定 2級・3級 対策</p>
        </div>

        {/* PWA インストールバナー */}
        {showInstallBanner && (
          <div className="bg-indigo-600 text-white rounded-2xl p-4 mb-4 flex items-center gap-3 shadow-lg">
            <span className="text-2xl shrink-0">📲</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">ホーム画面に追加</p>
              <p className="text-xs text-indigo-200 mt-0.5">アプリとして使えるようになります</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={handleInstall}
                className="bg-white text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
                追加
              </button>
              <button onClick={handleDismissInstall}
                className="text-indigo-300 hover:text-white text-lg font-bold leading-none">
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-4">

          {/* ユーザー名 + ストリーク */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">ユーザー名</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                placeholder="例：田中（空欄で匿名）"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            {streak > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-center min-w-[72px]">
                <div className="text-xl font-bold text-amber-500">🔥{streak}</div>
                <div className="text-xs text-amber-400">日連続</div>
              </div>
            )}
          </div>

          {/* タブ */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm font-semibold">
            {[['level','レベルで学習'],['theme','テーマで学習'],['flag','フラグ問題']].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 py-2.5 transition text-xs sm:text-sm ${activeTab === key ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* === レベルタブ === */}
          {activeTab === 'level' && (
            <div className="space-y-3">
              {LEVELS.map(lv => {
                const col = COLOR[lv.color]
                return (
                  <div key={lv.value} className={`rounded-2xl border p-4 ${col.light}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{lv.emoji}</span>
                      <span className={`font-bold text-sm ${col.text}`}>{lv.label}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleLevelStart(lv, 'study')}
                        disabled={!!loadingTarget}
                        className={`flex-1 ${col.bg} text-white font-bold py-2 rounded-xl text-sm transition flex items-center justify-center gap-2 ${loadingTarget ? 'opacity-70 cursor-wait' : ''}`}>
                        {loadingTarget === `study-${lv.value}` ? <><Spinner /> 読込中…</> : '学習開始'}
                      </button>
                      <button onClick={() => handleLevelStart(lv, 'review')}
                        disabled={!!loadingTarget}
                        className={`flex-1 bg-amber-400 hover:bg-amber-500 text-white font-bold py-2 rounded-xl text-sm transition flex items-center justify-center gap-2 ${loadingTarget ? 'opacity-70 cursor-wait' : ''}`}>
                        {loadingTarget === `review-${lv.value}` ? <><Spinner /> 読込中…</> : '苦手復習'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* === テーマタブ === */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">級を選択</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  {LEVELS.map(lv => (
                    <button key={lv.value}
                      onClick={() => { setSelectedLevel(lv.value); setSelectedTheme(null) }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition ${selectedLevel === lv.value ? `${COLOR[lv.color].activeBg} text-white border-transparent` : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'}`}>
                      {lv.emoji} {lv.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">テーマを選択</label>
                <div className="flex flex-wrap gap-2">
                  {THEMES[selectedLevel].map(theme => (
                    <button key={theme} onClick={() => setSelectedTheme(theme === selectedTheme ? null : theme)}
                      className={`px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition ${selectedTheme === theme ? `${c.activeBg} text-white border-transparent shadow-md` : `border-gray-200 text-gray-600 bg-white ${c.chip}`}`}>
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleThemeStart} disabled={!selectedTheme || !!loadingTarget}
                className={`w-full font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 ${selectedTheme && !loadingTarget ? `${c.bg} text-white shadow` : 'bg-gray-100 text-gray-400 cursor-not-allowed'} ${loadingTarget === 'theme-start' ? 'cursor-wait' : ''}`}>
                {loadingTarget === 'theme-start' ? <><Spinner /> 読込中…</> : selectedTheme ? `「${selectedTheme}」で学習開始` : 'テーマを選んでください'}
              </button>
            </div>
          )}

          {/* === フラグタブ === */}
          {activeTab === 'flag' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">🚩 問題画面でフラグを立てた問題だけを復習できます</p>
              {LEVELS.map(lv => {
                const col = COLOR[lv.color]
                const count = getFlagCount(userId, lv.value)
                return (
                  <div key={lv.value} className={`rounded-2xl border p-4 ${col.light} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lv.emoji}</span>
                      <div>
                        <div className={`font-bold text-sm ${col.text}`}>{lv.label}</div>
                        <div className="text-xs text-gray-400">{count}問フラグ中</div>
                      </div>
                    </div>
                    <button onClick={() => handleFlaggedStart(lv.value)} disabled={count === 0 || !!loadingTarget}
                      className={`font-bold py-2 px-4 rounded-xl text-sm transition flex items-center gap-2 ${count > 0 && !loadingTarget ? `${col.bg} text-white` : 'bg-gray-100 text-gray-300 cursor-not-allowed'} ${loadingTarget === `flagged-${lv.value}` ? 'cursor-wait' : ''}`}>
                      {loadingTarget === `flagged-${lv.value}` ? <><Spinner /> 読込中…</> : '復習する'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* フッターボタン */}
          <div className="flex gap-2 pt-1">
            <button onClick={() => go('/dashboard', 'dashboard')}
              disabled={!!loadingTarget}
              className={`flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 border border-indigo-100 ${loadingTarget ? 'opacity-70 cursor-wait' : ''}`}>
              {loadingTarget === 'dashboard' ? <><Spinner /> 読込中…</> : '📊 進捗ダッシュボード'}
            </button>
            <button onClick={() => { if (!loadingTarget) navigate('/ranking') }}
              disabled={!!loadingTarget}
              className={`flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 ${loadingTarget ? 'opacity-70 cursor-wait' : ''}`}>
              🏆 ランキング
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
