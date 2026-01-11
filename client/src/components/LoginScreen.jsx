import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import './LoginScreen.css';

const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

function LoginScreen() {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: credentialResponse.credential
                })
            });

            const data = await response.json();

            if (data.success) {
                // Save auth data to localStorage
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userEmail', data.email);
                localStorage.setItem('userName', data.name);
                localStorage.setItem('teamId', data.teamId);
                localStorage.setItem('isAdmin', data.isAdmin || false);

                // Auto-redirect to correct team (even if accessing wrong URL)
                if (data.isAdmin) {
                    navigate('/admin');
                } else {
                    navigate(`/team/${data.teamId}`);
                }
            } else {
                setError(data.error || 'Đăng nhập thất bại');
                setLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Lỗi kết nối server. Vui lòng thử lại.');
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
    };

    return (
        <div className="login-screen">
            <div className="login-container glass fade-in">
                <div className="login-header">
                    <h1 className="login-title">
                        <span className="title-icon">🔐</span>
                        Đăng Nhập
                    </h1>
                    {teamId === 'admin' ? (
                        <p className="team-info">🔧 Admin Panel</p>
                    ) : teamId ? (
                        <p className="team-info">Nhóm {teamId}</p>
                    ) : null}
                    <p className="login-subtitle">
                        Sử dụng email FPT của bạn để đăng nhập
                    </p>
                </div>

                <div className="login-content">
                    {error && (
                        <div className="error-message">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Đang xác thực...</p>
                        </div>
                    ) : (
                        <div className="google-login-wrapper">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                useOneTap={false}
                                theme="filled_blue"
                                size="large"
                                text="signin_with"
                                shape="rectangular"
                                logo_alignment="left"
                            />
                        </div>
                    )}

                    <div className="login-info">
                        <h3>📋 Lưu Ý</h3>
                        <ul>
                            <li>Chỉ email FPT trong danh sách mới được phép truy cập</li>
                            <li>Người đầu tiên đăng nhập sẽ là <strong>Controller</strong></li>
                            <li>Những người sau sẽ ở chế độ <strong>View-Only</strong></li>
                            <li>Nếu Controller disconnect, Viewer đầu tiên sẽ được thăng cấp</li>
                        </ul>
                    </div>
                </div>

                <div className="login-footer">
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/')}
                    >
                        ← Quay Lại Trang Chủ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginScreen;
