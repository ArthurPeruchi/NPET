import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useScrollToTop } from './hooks/useScrollToTop';
import { AuthProvider } from './auth/AuthContext';
import RotaProtegida from './auth/RotaProtegida';
import RotaAnonima from './auth/RotaAnonima';
import Sair from "./auth/Sair";

// Páginas públicas
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Cadastro from './pages/Cadastro/Cadastro';

// Páginas protegidas
import Doacoes from './pages/Doacoes/Doacoes';

function AppRoutes() {
  useScrollToTop();

  return (
    <div className="App">
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<RotaAnonima><Login /></RotaAnonima>} />
        <Route path="/cadastro" element={<RotaAnonima><Cadastro /></RotaAnonima>} />
        <Route path="/sair" element={<Sair />} />

        {/* Rotas protegidas */}
        <Route path="/doacoes" element={<RotaProtegida><Doacoes /></RotaProtegida>} />

        {/* Rota não encontrada → home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
    );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}