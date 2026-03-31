export default function JournalEntryTable({ question, zones, selectedChip, onZoneClick, answered, amountInputs, onAmountChange, onDragStartFromZone, onDropToZone }) {
  const debitRows = question.answer.debit
  const creditRows = question.answer.credit
  const rowCount = Math.max(debitRows.length, creditRows.length)

  const getZoneClass = (zoneId, answerAccount) => {
    const placed = zones[zoneId]
    let base = 'h-10 sm:h-12 rounded-lg border-2 flex items-center justify-center text-xs sm:text-sm font-medium transition cursor-pointer select-none min-w-[72px] sm:min-w-[100px] px-1 sm:px-2'
    if (answered) {
      if (placed === answerAccount) return base + ' bg-green-100 border-green-400 text-green-800'
      else if (placed) return base + ' bg-red-100 border-red-400 text-red-800'
      else return base + ' bg-gray-100 border-gray-300 text-gray-400'
    }
    if (placed) return base + ' bg-indigo-100 border-indigo-400 text-indigo-800'
    if (selectedChip) return base + ' bg-blue-50 border-blue-400 border-dashed text-blue-400 zone-highlight'
    return base + ' bg-gray-50 border-dashed border-gray-300 text-gray-400'
  }

  const getAmountClass = (zoneId, correctAmount) => {
    if (!answered) return ''
    const entered = parseInt((amountInputs?.[zoneId] || '').replace(/,/g, '')) || 0
    return entered === correctAmount ? 'text-green-700 font-bold' : 'text-red-600 font-bold'
  }

  const fmt = (n) => `¥${n.toLocaleString()}`

  const handleAmountInput = (zoneId, val) => {
    const numeric = val.replace(/[^0-9]/g, '')
    onAmountChange(zoneId, numeric)
  }

  const handleAmountBlur = (zoneId) => {
    const raw = (amountInputs?.[zoneId] || '').replace(/,/g, '')
    if (raw === '' || isNaN(Number(raw))) onAmountChange(zoneId, '')
    else onAmountChange(zoneId, Number(raw).toLocaleString())
  }

  const renderAmountCell = (zoneId, correctAmount) => {
    if (answered) {
      const entered = parseInt((amountInputs?.[zoneId] || '').replace(/,/g, '')) || 0
      return (
        <div className="text-xs sm:text-sm font-mono">
          <div className={getAmountClass(zoneId, correctAmount)}>
            ¥{entered.toLocaleString()}
          </div>
          {entered !== correctAmount && (
            <div className="text-xs text-gray-500 mt-0.5">正: {fmt(correctAmount)}</div>
          )}
        </div>
      )
    }
    return (
      <input
        type="text"
        inputMode="numeric"
        value={amountInputs?.[zoneId] || ''}
        onChange={(e) => handleAmountInput(zoneId, e.target.value)}
        onBlur={() => handleAmountBlur(zoneId)}
        placeholder="金額"
        className="w-full border border-gray-300 rounded-lg px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[60px]"
      />
    )
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-center border-collapse text-xs sm:text-sm" style={{ minWidth: '300px' }}>
        <thead>
          <tr>
            <th className="bg-blue-100 text-blue-800 py-1.5 sm:py-2 px-1.5 sm:px-3 text-xs font-semibold border border-blue-200 rounded-tl-lg">借方科目</th>
            <th className="bg-blue-100 text-blue-800 py-1.5 sm:py-2 px-1.5 sm:px-3 text-xs font-semibold border border-blue-200">金額</th>
            <th className="bg-red-100 text-red-800 py-1.5 sm:py-2 px-1.5 sm:px-3 text-xs font-semibold border border-red-200">貸方科目</th>
            <th className="bg-red-100 text-red-800 py-1.5 sm:py-2 px-1.5 sm:px-3 text-xs font-semibold border border-red-200 rounded-tr-lg">金額</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }).map((_, i) => {
            const debit = debitRows[i]
            const credit = creditRows[i]
            return (
              <tr key={i}>
                <td className="border border-gray-200 p-1 sm:p-2">
                  {debit ? (
                    <div
                      className={getZoneClass(`d-${i}`, debit.account)}
                      onClick={() => onZoneClick(`d-${i}`)}
                      draggable={!answered && !!zones[`d-${i}`]}
                      onDragStart={() => onDragStartFromZone?.(`d-${i}`)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDropToZone?.(`d-${i}`)}
                    >
                      {zones[`d-${i}`] || <span className="text-xs text-center leading-tight">{selectedChip ? 'タップ' : 'ここへ'}</span>}
                    </div>
                  ) : <div className="h-10 sm:h-12" />}
                </td>
                <td className="border border-gray-200 p-1 sm:p-2">
                  {debit ? renderAmountCell(`d-${i}`, debit.amount) : ''}
                </td>
                <td className="border border-gray-200 p-1 sm:p-2">
                  {credit ? (
                    <div
                      className={getZoneClass(`c-${i}`, credit.account)}
                      onClick={() => onZoneClick(`c-${i}`)}
                      draggable={!answered && !!zones[`c-${i}`]}
                      onDragStart={() => onDragStartFromZone?.(`c-${i}`)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDropToZone?.(`c-${i}`)}
                    >
                      {zones[`c-${i}`] || <span className="text-xs text-center leading-tight">{selectedChip ? 'タップ' : 'ここへ'}</span>}
                    </div>
                  ) : <div className="h-10 sm:h-12" />}
                </td>
                <td className="border border-gray-200 p-1 sm:p-2">
                  {credit ? renderAmountCell(`c-${i}`, credit.amount) : ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {answered && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 text-left font-semibold mb-1">正解</p>
          <table className="w-full text-center border-collapse text-xs sm:text-sm">
            <tbody>
              {Array.from({ length: rowCount }).map((_, i) => {
                const debit = debitRows[i]
                const credit = creditRows[i]
                return (
                  <tr key={i}>
                    <td className="bg-green-50 border border-green-200 p-1 sm:p-2 text-green-800 font-medium">{debit?.account || ''}</td>
                    <td className="bg-green-50 border border-green-200 p-1 sm:p-2 text-green-700 font-mono">{debit ? fmt(debit.amount) : ''}</td>
                    <td className="bg-green-50 border border-green-200 p-1 sm:p-2 text-green-800 font-medium">{credit?.account || ''}</td>
                    <td className="bg-green-50 border border-green-200 p-1 sm:p-2 text-green-700 font-mono">{credit ? fmt(credit.amount) : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
