import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import Hive from './pages/Hive';
import CreateHive from './pages/CreateHive';
import CreateBee from './pages/CreateBee';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/hive" element={<Hive />} />
        <Route path="/create-hive/:hiveName" element={<CreateHive />} />
        <Route path="/create-bee" element={<CreateBee />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
