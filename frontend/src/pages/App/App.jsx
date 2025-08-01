import { useState } from 'react';
import { Routes, Route } from 'react-router';
import { getUser } from '../../services/authService';
import HomePage from '../HomePage/HomePage';
import SupportWallPage from '../SupportWallPage/SupportWallPage';
import NewSupportPostPage from '../NewSupportPostPage/NewSupportPostPage';
import SignUpPage from '../SignUpPage/SignUpPage';
import LogInPage from '../LogInPage/LogInPage';
import DashboardPage from '../DashboardPage/DashboardPage';
import NavBar from '../../components/NavBar/NavBar';
import './App.css';

export default function App() {
  const [user, setUser] = useState(getUser());

  return (
    <main className="App">
      <NavBar user={user} setUser={setUser} />
      <section id="main-section">
 {user ? (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/dashboard" element={<DashboardPage user={user} />} />
    <Route path="/posts" element={<SupportWallPage />} />
    <Route path="/posts/new" element={<NewSupportPostPage />} />
    <Route path="*" element={null} />
  </Routes>
) : (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/signup" element={<SignUpPage setUser={setUser} />} />
    <Route path="/login" element={<LogInPage setUser={setUser} />} />
    <Route path="*" element={null} />
  </Routes>
)}

      </section>
    </main>
  );
}

