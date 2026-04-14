import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CycleList from './pages/CycleList';
import CycleDetail from './pages/CycleDetail';
import ReportForm from './pages/ReportForm';
import TeamSummary from './pages/TeamSummary';
import ExecutiveReport from './pages/ExecutiveReport';
import Feedback from './pages/Feedback';
import Reminders from './pages/Reminders';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-lg text-gray-500">로딩중...</div></div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="cycles" element={<CycleList />} />
        <Route path="cycles/:id" element={<CycleDetail />} />
        <Route path="reports/new" element={<ReportForm />} />
        <Route path="reports/:id/edit" element={<ReportForm />} />
        <Route path="summary/:cycleId" element={<TeamSummary />} />
        <Route path="executive/:cycleId" element={<ExecutiveReport />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="reminders" element={<Reminders />} />
      </Route>
    </Routes>
  );
}
