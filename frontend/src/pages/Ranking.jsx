import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRanking } from '../api/client'

export default function Ranking() {
  const navigate = useNavigate()
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const currentUser = localStorage.getItem('username')

  useEffect(() => {
    getRanking().then((data) => {
      setRanking(data)
      setLoading(false)
    })
  }, [])

  const medals = ['', '', '']

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            ← トップ
          </button>
          <h1 className="text-2xl font-bold text-indigo-700"> ランキング</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <p className="text-center text-gray-500 py-10">読み込み中...</p>
          ) : ranking.length === 0 ? (
            <p className="text-center text-gray-500 py-10">まだ記録がありません</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-indigo-50">
                  <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">順位</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">名前</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-indigo-700">正解数</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-indigo-700">正解率</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row, i) => (
                  <tr
                    key={row.user_id}
                    className={`border-t border-gray-100 ${
                      row.username === currentUser ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-4 px-4 text-lg">
                      {i < 3 ? medals[i] : `${i + 1}位`}
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-800">
                      {row.username}
                      {row.username === currentUser && (
                        <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                          あなた
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-700">
                      {row.correct}
                      <span className="text-xs text-gray-400 ml-1">/ {row.total}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`font-bold ${
                          row.rate >= 80
                            ? 'text-green-600'
                            : row.rate >= 50
                            ? 'text-amber-500'
                            : 'text-red-500'
                        }`}
                      >
                        {row.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <button
          onClick={() => getRanking().then(setRanking)}
          className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition text-sm"
        >
          更新
        </button>
      </div>
    </div>
  )
}
