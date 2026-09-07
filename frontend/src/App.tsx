import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useScrollToTop } from './hooks/useScrollToTop'

import Home from './pages/Home/Home'
import Doacoes from './pages/Doacoes/Doacoes'
import NavBar from './components/NavBar/NavBar'
import Login from './pages/Login/Login'

function AppContent() {
  useScrollToTop();

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/inicio" element={<Home />} />
        <Route path="/doacoes" element={<Doacoes />} />
        <Route path="*" element={<NavBar />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;