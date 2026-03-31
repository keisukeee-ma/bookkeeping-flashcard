import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getQuestions, getWeakQuestions, recordResult } from '../api/client'
import JournalEntryTable from '../components/JournalEntryTable'
import Calculator from '../components/Calculator'
import AccountReference from '../components/AccountReference'
import { updateStreak } from '../utils/streak'

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function dateSeed(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}
function seededShuffle(arr, seed) {
  const rng = mulberry32(seed); const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// フラグ管理（localStorage）
function getFlags(userId) {
  try { return JSON.parse(localStorage.getItem(`flags_${userId}`) || '[]') } catch { return [] }
}
function toggleFlag(userId, level, questionId) {
  const flags = getFlags(userId)
  const idx = flags.findIndex(f => f.level === level && f.id === questionId)
  if (idx >= 0) flags.splice(idx, 1)
  else flags.push({ level, id: questionId })
  localStorage.setItem(`flags_${userId}`, JSON.stringify(flags))
  return idx < 0
}
function isFlagged(userId, level, questionId) {
  return getFlags(userId).some(f => f.level === level && f.id === questionId)
}

export default function Study({ mode }) {
  const { level } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetDate = searchParams.get('date') || null
  const theme = searchParams.get('theme') || null
  const isToday = !targetDate

  const userId = Number(localStorage.getItem('userId'))
  const username = localStorage.getItem('username') || 'ゲスト'

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [chips, setChips] = useState([])
  const [zones, setZones] = useState({})
  const [amountInputs, setAmountInputs] = useState({})
  const [selectedChip, setSelectedChip] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [correctStreak, setCorrectStreak] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showCalc, setShowCalc] = useState(false)
  const [showRef, setShowRef] = useState(false)
  const [flagged, setFlagged] = useState(false)
  const [streakUpdated, setStreakUpdated] = useState(false)
  const dragData = useRef(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let qs = await getQuestions(level, theme)

      if (mode === 'flagged' && userId) {
        const flags = getFlags(userId).filter(f => f.level === level)
        const flagIds = new Set(flags.map(f => f.id))
        qs = qs.filter(q => flagIds.has(q.id))
      } else if (mode === 'review' && userId) {
        const weak = await getWeakQuestions(userId, level)
        if (weak.length > 0) {
          const weakIds = new Set(weak.map(w => w.question_id))
          const filtered = qs.filter(q => weakIds.has(q.id))
          qs = filtered.length > 0 ? filtered : qs
        }
      }

      if (theme) qs = [...qs].sort(() => Math.random() - 0.5)
      else qs = seededShuffle(qs, dateSeed(targetDate))
      setQuestions(qs)
      setLoading(false)
    }
    load()
  }, [level, mode, userId, theme])

  const q = questions[currentIndex]

  useEffect(() => {
    if (!q) return
    const shuffled = [...q.choices].sort(() => Math.random() - 0.5).map((account, i) => ({ id: `chip-${i}`, account }))
    setChips(shuffled); setZones({}); setAmountInputs({})
    setSelectedChip(null); setAnswered(false); setIsCorrect(null)
    setFlagged(userId ? isFlagged(userId, level, q.id) : false)
  }, [currentIndex, q?.id])

  const handleChipClick = useCallback((chip) => {
    if (answered) return
    setSelectedChip(prev => prev?.id === chip.id ? null : chip)
  }, [answered])

  const handleZoneClick = useCallback((zoneId) => {
    if (answered) return
    const currentOccupant = zones[zoneId]
    if (selectedChip) {
      const newZones = { ...zones, [zoneId]: selectedChip.account }
      let newChips = chips.filter(c => c.id !== selectedChip.id)
      if (currentOccupant) newChips = [...newChips, { id: `chip-returned-${Date.now()}`, account: currentOccupant }]
      setZones(newZones); setChips(newChips); setSelectedChip(null)
    } else if (currentOccupant) {
      const newZones = { ...zones }; delete newZones[zoneId]
      setZones(newZones)
      setChips([...chips, { id: `chip-returned-${Date.now()}`, account: currentOccupant }])
    }
  }, [answered, chips, zones, selectedChip])

  const handleDragStartFromPool = (chip) => { dragData.current = { chipId: chip.id, chipAccount: chip.account, fromZoneId: null } }
  const handleDragStartFromZone = (zoneId) => { dragData.current = { chipId: null, chipAccount: zones[zoneId], fromZoneId: zoneId } }

  const handleDropToZone = useCallback((zoneId) => {
    if (!dragData.current || answered) return
    const { chipId, chipAccount, fromZoneId } = dragData.current
    if (fromZoneId === zoneId) return
    const currentOccupant = zones[zoneId]
    const newZones = { ...zones, [zoneId]: chipAccount }
    let newChips = chipId ? chips.filter(c => c.id !== chipId) : [...chips]
    if (fromZoneId) delete newZones[fromZoneId]
    if (currentOccupant) newChips = [...newChips, { id: `chip-returned-${Date.now()}`, account: currentOccupant }]
    setZones(newZones); setChips(newChips); setSelectedChip(null); dragData.current = null
  }, [answered, chips, zones])

  const handleDropToPool = useCallback(() => {
    if (!dragData.current || answered) return
    const { fromZoneId, chipAccount } = dragData.current
    if (!fromZoneId) return
    const newZones = { ...zones }; delete newZones[fromZoneId]
    setZones(newZones)
    setChips(prev => [...prev, { id: `chip-returned-${Date.now()}`, account: chipAccount }])
    dragData.current = null
  }, [answered, zones])

  const checkAnswer = async () => {
    const parseAmount = (zoneId) => parseInt((amountInputs[zoneId] || '').replace(/,/g, '')) || 0
    const debitCorrect = q.answer.debit.every((d, i) => zones[`d-${i}`] === d.account && parseAmount(`d-${i}`) === d.amount)
    const creditCorrect = q.answer.credit.every((c, i) => zones[`c-${i}`] === c.account && parseAmount(`c-${i}`) === c.amount)
    const correct = debitCorrect && creditCorrect
    setIsCorrect(correct); setAnswered(true)
    setCorrectStreak(prev => correct ? prev + 1 : 0)
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }))

    if (!streakUpdated && userId) { updateStreak(userId); setStreakUpdated(true) }
    if (userId) await recordResult(userId, q.id, level, correct)
  }

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) setFinished(true)
    else setCurrentIndex(i => i + 1)
  }

  const handleToggleFlag = () => {
    if (!userId || !q) return
    const now = toggleFlag(userId, level, q.id)
    setFlagged(now)
  }

  const levelLabel = level === '3' ? '日商簿記3級' : level === '2c' ? '2級商業簿記' : '2級工業簿記'
  const levelShort = level === '3' ? '3級' : level === '2c' ? '2級商業' : '2級工業'
  const modeLabel = mode === 'review' ? '苦手問題' : mode === 'flagged' ? 'フラグ問題' : levelLabel

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="spinner" /><p className="text-gray-400 text-sm">読み込み中...</p>
    </div>
  )

  if (finished || questions.length === 0) {
    const rate = score.total > 0 ? Math.round(score.correct / score.total * 100) : 0
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">{rate >= 80 ? '🎉' : rate >= 50 ? '😊' : '💪'}</div>
          <h2 className="text-xl font-bold text-indigo-700 mb-2">
            {questions.length === 0 ? (mode === 'flagged' ? 'フラグ問題がありません' : '苦手問題はありません！') : '完了！'}
          </h2>
          {score.total > 0 && (
            <p className="text-gray-600 mb-2">
              {score.total}問中 <span className="font-bold text-indigo-600">{score.correct}問</span> 正解（{rate}%）
            </p>
          )}
          {correctStreak >= 3 && <p className="text-amber-500 text-sm mb-4">🔥 {correctStreak}問連続正解！</p>}
          <div className="space-y-3">
            <button onClick={() => { setCurrentIndex(0); setScore({ correct: 0, total: 0 }); setCorrectStreak(0); setFinished(false); setQuestions(qs => [...qs].sort(() => Math.random() - 0.5)) }}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition">もう一度</button>
            <button onClick={() => navigate('/')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition">トップへ戻る</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-3 sm:py-6 sm:px-4 pb-24">

      {/* 電卓 FAB（画面右下固定） */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {showCalc && <Calculator />}
        <button
          onClick={() => setShowCalc(v => !v)}
          className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white text-xl shadow-lg flex items-center justify-center transition"
          title={showCalc ? '電卓を閉じる' : '電卓を開く'}
        >
          {showCalc ? '✕' : '🧮'}
        </button>
      </div>

      {/* 勘定科目参照モーダル */}
      {showRef && <AccountReference onClose={() => setShowRef(false)} />}

      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:opacity-75 transition shrink-0" title="トップへ戻る">
            <span className="text-2xl">📒</span>
            <span className="text-xs text-indigo-500 font-semibold hidden sm:block">トップ</span>
          </button>
          <div className="text-xs sm:text-sm text-gray-500 text-center min-w-0 flex-1 truncate">
            <span className="font-semibold text-indigo-600">{username}</span>
            <span className="hidden sm:inline">｜{modeLabel}</span>
            {theme && <span className="text-indigo-500 font-semibold">　{theme}</span>}
            {!isToday && <span className="text-amber-600 font-semibold ml-1">{targetDate}</span>}
          </div>
          <div className="text-xs sm:text-sm font-medium text-gray-600 shrink-0">{currentIndex + 1} / {questions.length}</div>
        </div>

        {/* 進捗バー */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mb-3">
          <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>

        {/* スコア + 科目一覧ボタン */}
        <div className="flex justify-between items-center mb-3 text-xs sm:text-sm">
          <div className="text-gray-600">正解: {score.correct} / {score.total}</div>
          <div className="flex items-center gap-2">
            {correctStreak >= 3 && (
              <span className="text-amber-500 font-bold text-xs">🔥 {correctStreak}連続！</span>
            )}
            <button onClick={() => setShowRef(true)}
              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold px-2.5 py-1 rounded-full transition border border-indigo-200">
              📖 科目一覧
            </button>
          </div>
        </div>

        {/* 問題カード */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded shrink-0">{levelShort}</span>
              {theme && <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded truncate">{theme}</span>}
              <span className="text-xs text-gray-400 shrink-0">Q{currentIndex + 1}</span>
            </div>
            <button onClick={handleToggleFlag}
              className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition shrink-0 ml-2 ${flagged ? 'bg-red-100 border-red-300 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'}`}>
              {flagged ? '🚩 ON' : '🚩'}
            </button>
          </div>
          <p className="text-gray-800 font-medium mb-4 text-sm sm:text-base leading-relaxed">{q.question}</p>
          <JournalEntryTable
            question={q} zones={zones} selectedChip={selectedChip}
            onZoneClick={handleZoneClick} answered={answered}
            amountInputs={amountInputs}
            onAmountChange={(zoneId, val) => setAmountInputs(prev => ({ ...prev, [zoneId]: val }))}
            onDragStartFromZone={handleDragStartFromZone} onDropToZone={handleDropToZone}
          />
        </div>

        {/* チップ */}
        <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4 mb-3"
          onDragOver={e => e.preventDefault()} onDrop={handleDropToPool}>
          <p className="text-xs text-gray-500 mb-2 font-medium">
            {selectedChip ? `「${selectedChip.account}」を選択中 — 配置先をタップ` : 'タップ（またはドラッグ）して配置'}
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {chips.map(chip => (
              <button key={chip.id} draggable={!answered}
                onDragStart={() => handleDragStartFromPool(chip)}
                onClick={() => handleChipClick(chip)} disabled={answered}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border-2 text-xs sm:text-sm font-medium transition ${selectedChip?.id === chip.id ? 'bg-indigo-500 border-indigo-500 text-white shadow-md scale-105' : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50'} ${answered ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}>
                {chip.account}
              </button>
            ))}
            {chips.length === 0 && !answered && <p className="text-xs text-gray-400">全て配置済みです</p>}
          </div>
        </div>

        {/* 解説 */}
        {answered && (
          <div className={`rounded-2xl shadow-lg p-4 sm:p-5 mb-3 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-lg font-bold mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isCorrect ? '✅ 正解！' : '❌ 不正解'}
            </p>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{q.explanation}</p>
          </div>
        )}

        {/* 答え合わせ／次へボタン */}
        <div className="flex gap-3">
          {!answered ? (
            <button onClick={checkAnswer} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-xl transition text-base sm:text-lg shadow">答え合わせ</button>
          ) : (
            <button onClick={nextQuestion} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-xl transition text-base sm:text-lg shadow">
              {currentIndex + 1 >= questions.length ? '結果を見る' : '次の問題 →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
