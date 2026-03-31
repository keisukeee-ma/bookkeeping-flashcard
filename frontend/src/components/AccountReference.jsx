import { useState } from 'react'

const ACCOUNTS = [
  {
    category: '資産', side: '借方（左）', color: 'blue',
    items: ['現金','当座預金','普通預金','小口現金','受取手形','売掛金','電子記録債権',
      '売買目的有価証券','満期保有目的債券','繰越商品','前払費用','未収入金','仮払金',
      '前払金','貸付金','建物','機械','備品','土地','建設仮勘定','のれん',
      'ソフトウェア','投資有価証券','長期貸付金','繰延税金資産','仮払法人税等'],
  },
  {
    category: '負債', side: '貸方（右）', color: 'red',
    items: ['支払手形','買掛金','電子記録債務','前受金','未払金','未払費用','預り金',
      '仮受金','借入金','長期借入金','社債','貸倒引当金','退職給付引当金',
      '賞与引当金','修繕引当金','未払法人税等','仮受消費税','電子記録債務'],
  },
  {
    category: '純資産', side: '貸方（右）', color: 'green',
    items: ['資本金','資本準備金','その他資本剰余金','利益準備金','任意積立金',
      '繰越利益剰余金'],
  },
  {
    category: '収益', side: '貸方（右）', color: 'amber',
    items: ['売上','受取利息','受取配当金','有価証券売却益','有価証券評価益',
      '固定資産売却益','為替差益','償却債権取立益','受取家賃','雑益',
      '有価証券利息'],
  },
  {
    category: '費用', side: '借方（左）', color: 'purple',
    items: ['仕入','給料','支払家賃','支払利息','減価償却費','のれん償却',
      '貸倒引当金繰入','貸倒損失','通信費','水道光熱費','消耗品費',
      '広告宣伝費','旅費交通費','保険料','租税公課','法人税等',
      '有価証券売却損','有価証券評価損','固定資産売却損','為替差損',
      '退職給付費用','手形売却損','雑損'],
  },
  {
    category: '工業簿記', side: '各勘定による', color: 'teal',
    items: ['材料','賃金','製造間接費','仕掛品','製品','売上原価',
      '製造間接費配賦差異','未払賃金','材料消費価格差異','本社','工場'],
  },
]

const COLOR_MAP = {
  blue:   { badge: 'bg-blue-100 text-blue-700',   tag: 'bg-blue-50 border-blue-200 text-blue-700',   header: 'bg-blue-500' },
  red:    { badge: 'bg-red-100 text-red-700',     tag: 'bg-red-50 border-red-200 text-red-700',     header: 'bg-red-500' },
  green:  { badge: 'bg-green-100 text-green-700', tag: 'bg-green-50 border-green-200 text-green-700', header: 'bg-green-500' },
  amber:  { badge: 'bg-amber-100 text-amber-700', tag: 'bg-amber-50 border-amber-200 text-amber-700', header: 'bg-amber-500' },
  purple: { badge: 'bg-purple-100 text-purple-700',tag: 'bg-purple-50 border-purple-200 text-purple-700',header: 'bg-purple-500' },
  teal:   { badge: 'bg-teal-100 text-teal-700',   tag: 'bg-teal-50 border-teal-200 text-teal-700',   header: 'bg-teal-500' },
}

export default function AccountReference({ onClose }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)

  const filtered = ACCOUNTS.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      (!search || item.includes(search)) &&
      (!activeCategory || cat.category === activeCategory)
    )
  })).filter(cat => cat.items.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">勘定科目 クイックリファレンス</h2>
            <p className="text-xs text-gray-400 mt-0.5">増減する側が通常の記入側です</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">✕</button>
        </div>

        {/* 検索 + カテゴリフィルタ */}
        <div className="px-5 py-3 border-b space-y-2">
          <input
            type="text"
            placeholder="勘定科目を検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition ${!activeCategory ? 'bg-gray-700 text-white border-transparent' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}
            >すべて</button>
            {ACCOUNTS.map(cat => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(activeCategory === cat.category ? null : cat.category)}
                className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition ${activeCategory === cat.category ? `${COLOR_MAP[cat.color].header} text-white border-transparent` : `${COLOR_MAP[cat.color].badge} border-transparent hover:opacity-80`}`}
              >{cat.category}</button>
            ))}
          </div>
        </div>

        {/* リスト */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-4">
          {filtered.map(cat => (
            <div key={cat.category}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${COLOR_MAP[cat.color].badge}`}>{cat.category}</span>
                <span className="text-xs text-gray-400">通常：{cat.side}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map(item => (
                  <span key={item} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${COLOR_MAP[cat.color].tag}`}>{item}</span>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">該当する勘定科目がありません</p>
          )}
        </div>
      </div>
    </div>
  )
}
