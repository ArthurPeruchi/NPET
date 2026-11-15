import './App.css';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
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
import Historico from './pages/Historico/Historico';
import Perfil from './pages/Perfil/Perfil';

function RootLayout() {
  useScrollToTop();

  return (
    <AuthProvider>
      <div className="App">
        <Outlet />
      </div>
    </AuthProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Rotas públicas
      { path: "/", element: <Home /> },
      { path: "/login", element: <RotaAnonima><Login /></RotaAnonima> },
      { path: "/cadastro", element: <RotaAnonima><Cadastro /></RotaAnonima> },
      { path: "/sair", element: <Sair /> },

      // Rotas protegidas
      { path: "/doacoes", element: <RotaProtegida><Doacoes /></RotaProtegida> },
      { path: "/historico", element: <RotaProtegida><Historico /></RotaProtegida> },
      { path: "/perfil", element: <RotaProtegida><Perfil /></RotaProtegida> },

      // Rota não encontrada → home
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <RouterProvider router={router} />
  );
}