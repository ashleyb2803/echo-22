import { useState } from 'react';
import { Routes, Route } from 'react-router-dom'; // <-- no BrowserRouter here
import { getUser } from '../../services/authService';
import HomePage from '../HomePage/HomePage';
import DashboardPage from '../DashboardPage/DashboardPage';
import PostListPage from '../PostListPage/PostListPage';
import NewPostPage from '../NewPostPage/NewPostPage';
import BuddySystemPage from '../BuddySystemPage/BuddySystemPage';
import ResourcesPage from '../ResourcesPage/ResourcesPage';
import JournalPage from '../JournalPage/JournalPage';
import SignUpPage from '../SignUpPage/SignUpPage';
import LogInPage from '../LogInPage/LogInPage';
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
            <Route path="/" element={<DashboardPage user={user} />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/posts" element={<PostListPage />} />
            <Route path="/posts/new" element={<NewPostPage />} />
            <Route path="/buddy-system" element={<BuddySystemPage user={user} />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/journal" element={<JournalPage user={user} />} />
            <Route path="*" element={<DashboardPage user={user} />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<SignUpPage setUser={setUser} />} />
            <Route path="/login" element={<LogInPage setUser={setUser} />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        )}
      </section>
    </main>
  );
}
