import './App.css'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useScrollToTop } from './hooks/useScrollToTop'

import Home from './pages/Home/Home'
import Doacoes from './pages/Doacoes/Doacoes'
import NavBar from './components/NavBar/NavBar'
import Login from './pages/Login/Login'

// Páginas privadas: sem token, volta para o login.
function RotaPrivada({ children }: { children: ReactNode }) {
  return localStorage.getItem("token") ? children : <Navigate to="/" replace />;
}

function AppContent() {
  useScrollToTop();

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/inicio" element={<RotaPrivada><Home /></RotaPrivada>} />
        <Route path="/doacoes" element={<RotaPrivada><Doacoes /></RotaPrivada>} />
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