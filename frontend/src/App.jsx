import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Study from './pages/Study'
import Ranking from './pages/Ranking'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/study/:level" element={<Study mode="study" />} />
        <Route path="/review/:level" element={<Study mode="review" />} />
        <Route path="/flagged/:level" element={<Study mode="flagged" />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
