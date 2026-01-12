import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './HomePage.css';

function HomePage() {
    const navigate = useNavigate();
    const [selectedTeam, setSelectedTeam] = useState('1');

    const handleTeamJoin = () => {
        navigate(`/team/${selectedTeam}`);
    };

    const handleAdminJoin = () => {
        navigate('/admin');
    };

    return (
        <div className="home-page">
            <div className="home-container fade-in">
                <div className="home-header">
                    <h1 className="game-title">
                        <span className="title-icon">🎯</span>
                        HIỆU ỨNG DOMINO LỊCH SỬ
                    </h1>
                    <p className="game-subtitle">
                        Trò chơi học lịch sử đầy kịch tính với hiệu ứng dây chuyền
                    </p>
                </div>

                <div className="home-content">
                    <div className="join-section glass">
                        <h2>🎮 Tham Gia Với Tư Cách Người Chơi</h2>
                        <div className="team-selector">
                            <label htmlFor="team-select">Chọn nhóm của bạn:</label>
                            <select
                                id="team-select"
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                            >
                                {[1, 3, 4, 5, 6, 7, 8, 9, 10].map((teamId) => (
                                    <option key={teamId} value={teamId}>
                                        Nhóm {teamId}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button className="btn btn-primary btn-large" onClick={handleTeamJoin}>
                            Vào Game
                        </button>
                    </div>

                    <div className="join-section glass">
                        <h2>👨‍💼 Tham Gia Với Tư Cách BTC/Admin</h2>
                        <p className="admin-desc">
                            Điều khiển game, tạo câu hỏi và xem bảng điểm trực tiếp
                        </p>
                        <button className="btn btn-success btn-large" onClick={handleAdminJoin}>
                            Vào Trang Admin
                        </button>
                    </div>
                </div>

                <div className="game-rules glass">
                    <h3>📜 Luật Chơi Cơ Bản</h3>
                    <div className="rules-grid">
                        <div className="rule-item">
                            <span className="rule-icon">✅</span>
                            <div>
                                <strong>Trả lời đúng:</strong> +2 điểm
                            </div>
                        </div>
                        <div className="rule-item">
                            <span className="rule-icon">❌</span>
                            <div>
                                <strong>Trả lời sai:</strong> -2 điểm
                            </div>
                        </div>
                        <div className="rule-item">
                            <span className="rule-icon">⛓️</span>
                            <div>
                                <strong>Hiệu ứng Domino:</strong> Nhóm sai kéo theo nhóm tiếp theo -1 điểm
                            </div>
                        </div>
                        <div className="rule-item">
                            <span className="rule-icon">⚠️</span>
                            <div>
                                <strong>Khủng Hoảng:</strong> ≥5 nhóm sai → Tất cả -2 điểm
                            </div>
                        </div>
                        <div className="rule-item">
                            <span className="rule-icon">🛡️</span>
                            <div>
                                <strong>Thẻ Miễn Nhiễm:</strong> Chặn domino
                            </div>
                        </div>
                        <div className="rule-item">
                            <span className="rule-icon">🔄</span>
                            <div>
                                <strong>Thẻ Chuyển Hướng:</strong> Đẩy domino sang nhóm khác
                            </div>
                        </div>
                        <div className="rule-item">
                            <span className="rule-icon">🎲</span>
                            <div>
                                <strong>Thẻ Tất Tay:</strong> Đúng +4, Sai -4
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
