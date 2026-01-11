import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginScreen.css';

const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

function AdminLoginScreen() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await response.json();

            if (data.success) {
                // Save auth data to localStorage
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userEmail', data.email || 'admin@system');
                localStorage.setItem('userName', data.name || 'Admin');
                localStorage.setItem('isAdmin', 'true');

                // Redirect to admin panel
                navigate('/admin');
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

    return (
        <div className="login-screen">
            <div className="login-container glass fade-in">
                <div className="login-header">
                    <h1 className="login-title">
                        <span className="title-icon">🔐</span>
                        Admin Login
                    </h1>
                    <p className="team-info">🔧 Admin Panel</p>
                    <p className="login-subtitle">
                        Chỉ dành cho Ban Tổ Chức
                    </p>
                </div>

                <div className="login-content">
                    {error && (
                        <div className="error-message">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Username:</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nhập username"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Password:</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập password"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={loading}
                        >
                            {loading ? 'Đang xác thực...' : '🚀 Đăng Nhập'}
                        </button>
                    </form>

                    <div className="login-info">
                        <h3>📋 Lưu Ý</h3>
                        <ul>
                            <li>Chỉ BTC mới có quyền truy cập</li>
                            <li>Không chia sẻ thông tin đăng nhập</li>
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

export default AdminLoginScreen;
