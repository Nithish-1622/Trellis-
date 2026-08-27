import './App.css'
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Roadmap from './pages/Roadmap';
import Jobs from './pages/Jobs';
import Chat from './pages/Chat';
import InterviewPrep from './pages/InterviewPrep';
import ComingSoonNFT from './pages/nft/ComingSoonNFT';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth-components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/practice" element={<InterviewPrep />} />
            <Route path="/nft" element={<ComingSoonNFT />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
