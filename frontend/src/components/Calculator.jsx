import { useState, useEffect, useCallback } from 'react'

export default function Calculator() {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState(null)
  const [op, setOp] = useState(null)
  const [waitNext, setWaitNext] = useState(false)

  const inputDigit = useCallback((d) => {
    setDisplay(prev => {
      if (waitNext) { setWaitNext(false); return String(d) }
      return prev === '0' ? String(d) : prev + d
    })
  }, [waitNext])

  const inputDot = useCallback(() => {
    if (waitNext) { setDisplay('0.'); setWaitNext(false); return }
    setDisplay(prev => prev.includes('.') ? prev : prev + '.')
  }, [waitNext])

  const compute = (a, b, o) => {
    if (o === '+') return a + b
    if (o === '-') return a - b
    if (o === '×' || o === '*') return a * b
    if (o === '÷' || o === '/') return b !== 0 ? a / b : 0
    return b
  }

  const applyOp = useCallback((nextOp) => {
    const current = parseFloat(display)
    setPrev(p => {
      if (p !== null && op && !waitNext) {
        const result = compute(p, current, op)
        const str = String(Math.round(result * 1000) / 1000)
        setDisplay(str)
        setOp(nextOp)
        setWaitNext(true)
        return parseFloat(str)
      }
      setOp(nextOp)
      setWaitNext(true)
      return current
    })
  }, [display, op, waitNext])

  const equals = useCallback(() => {
    setPrev(p => {
      if (p === null || !op) return p
      const current = parseFloat(display)
      const result = compute(p, current, op)
      const str = String(Math.round(result * 1000) / 1000)
      setDisplay(str)
      setOp(null)
      setWaitNext(true)
      return null
    })
  }, [display, op])

  const clear = useCallback(() => {
    setDisplay('0'); setPrev(null); setOp(null); setWaitNext(false)
  }, [])

  const toggleSign = () => setDisplay(d => String(parseFloat(d) * -1))
  const percent = () => setDisplay(d => String(parseFloat(d) / 100))

  // キーボード入力対応
  useEffect(() => {
    const handler = (e) => {
      // テキスト入力中は電卓キーを無効
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key >= '0' && e.key <= '9') { e.preventDefault(); inputDigit(e.key) }
      else if (e.key === '.') { e.preventDefault(); inputDot() }
      else if (e.key === '+') { e.preventDefault(); applyOp('+') }
      else if (e.key === '-') { e.preventDefault(); applyOp('-') }
      else if (e.key === '*') { e.preventDefault(); applyOp('×') }
      else if (e.key === '/') { e.preventDefault(); applyOp('÷') }
      else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); equals() }
      else if (e.key === 'Backspace') { e.preventDefault(); setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0') }
      else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') { e.preventDefault(); clear() }
      else if (e.key === '%') { e.preventDefault(); percent() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [inputDigit, inputDot, applyOp, equals, clear])

  const btn = (label, onClick, style) => (
    <button key={label} onClick={onClick}
      className={`rounded-xl py-3 text-sm font-bold transition active:scale-95 select-none ${style}`}
    >{label}</button>
  )

  const opActive = (o) =>
    op === o && waitNext ? 'bg-white text-amber-400' : 'bg-amber-400 text-white hover:bg-amber-500'

  return (
    <div className="bg-gray-900 rounded-2xl p-3 w-48 shadow-xl select-none">
      <div className="bg-black rounded-xl px-3 py-2 mb-1 text-right text-white font-mono overflow-hidden min-h-[2.5rem] flex items-center justify-end">
        <span className={display.length > 10 ? 'text-base' : 'text-2xl'}>{display}</span>
      </div>
      <p className="text-gray-500 text-center text-xs mb-2">キーボード入力対応</p>
      <div className="grid grid-cols-4 gap-1">
        {btn('C', clear, 'bg-gray-500 text-white hover:bg-gray-400')}
        {btn('±', toggleSign, 'bg-gray-500 text-white hover:bg-gray-400')}
        {btn('%', percent, 'bg-gray-500 text-white hover:bg-gray-400')}
        {btn('÷', () => applyOp('÷'), opActive('÷'))}
        {['7','8','9'].map(d => btn(d, () => inputDigit(d), 'bg-gray-700 text-white hover:bg-gray-600'))}
        {btn('×', () => applyOp('×'), opActive('×'))}
        {['4','5','6'].map(d => btn(d, () => inputDigit(d), 'bg-gray-700 text-white hover:bg-gray-600'))}
        {btn('-', () => applyOp('-'), opActive('-'))}
        {['1','2','3'].map(d => btn(d, () => inputDigit(d), 'bg-gray-700 text-white hover:bg-gray-600'))}
        {btn('+', () => applyOp('+'), opActive('+'))}
      </div>
      <div className="grid grid-cols-4 gap-1 mt-1">
        <button onClick={() => inputDigit('0')}
          className="col-span-2 rounded-xl py-3 text-sm font-bold bg-gray-700 text-white hover:bg-gray-600 transition active:scale-95">0</button>
        {btn('.', inputDot, 'bg-gray-700 text-white hover:bg-gray-600')}
        {btn('=', equals, 'bg-indigo-500 text-white hover:bg-indigo-600')}
      </div>
    </div>
  )
}
