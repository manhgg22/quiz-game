import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import PlayerScreen from './components/PlayerScreen';
import AdminScreen from './components/AdminScreen';
import HomePage from './components/HomePage';
import LoginScreen from './components/LoginScreen';
import AdminLoginScreen from './components/AdminLoginScreen';
import './App.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '561755452303-3c9onk2lmvf4oronpm049nnqqndlq0rp.apps.googleusercontent.com';

// Protected Route Component
function ProtectedRoute({ children }) {
    const token = localStorage.getItem('authToken');
    const userTeamId = localStorage.getItem('teamId');
    const { teamId: urlTeamId } = useParams();

    // Check if user is authenticated
    if (!token || !userTeamId) {
        return <Navigate to={`/login/${urlTeamId || '1'}`} replace />;
    }

    // Check if user is trying to access their own team
    if (urlTeamId && parseInt(urlTeamId) !== parseInt(userTeamId)) {
        // Redirect to their actual team
        return <Navigate to={`/team/${userTeamId}`} replace />;
    }

    return children;
}

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <Router>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login/:teamId" element={<LoginScreen />} />
                    <Route path="/admin/login" element={<AdminLoginScreen />} />
                    <Route
                        path="/team/:teamId"
                        element={
                            <ProtectedRoute>
                                <PlayerScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/admin" element={<AdminScreen />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </GoogleOAuthProvider>
    );
}

export default App;
