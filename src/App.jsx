import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Onboarding from './components/onboarding/Onboarding'
import AppShell from './components/layout/AppShell'
import TodayScreen from './components/today/TodayScreen'
import GoalsScreen from './components/goals/GoalsScreen'
import ProgressScreen from './components/progress/ProgressScreen'
import ProfileScreen from './components/profile/ProfileScreen'
import KaeloChat from './components/ai/KaeloChat'
import { Toast } from './components/ui'

function App() {
  const { state } = useApp();
  const isOnboarded = state.user.onboarded;

  return (
    <>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        {!isOnboarded ? (
          <>
            <Route path="/" element={<Onboarding />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route element={<AppShell />}>
              <Route path="/today" element={<TodayScreen />} />
              <Route path="/quests" element={<GoalsScreen />} />
              <Route path="/goals" element={<Navigate to="/quests" replace />} />
              <Route path="/ai" element={<KaeloChat />} />
              <Route path="/journey" element={<ProgressScreen />} />
              <Route path="/progress" element={<Navigate to="/journey" replace />} />
              <Route path="/profile" element={<ProfileScreen />} />
            </Route>
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </>
        )}
      </Routes>

      <Toast />
    </>
  )
}

export default App

