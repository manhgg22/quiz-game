import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './PlayerScreen.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

function PlayerScreen() {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [myTeam, setMyTeam] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState(null);
    const [role, setRole] = useState(null); // 'controller' or 'viewer'
    const [controllerEmail, setControllerEmail] = useState(null);
    const [userEmail, setUserEmail] = useState(null);

    useEffect(() => {
        // Get auth token from localStorage
        const token = localStorage.getItem('authToken');
        const email = localStorage.getItem('userEmail');

        if (!token) {
            // Redirect to login if no token
            navigate(`/login/${teamId}`);
            return;
        }

        setUserEmail(email);

        // Connect to socket with auth token
        const newSocket = io(SOCKET_URL, {
            auth: {
                token
            }
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Đã kết nối server với authentication');
        });

        newSocket.on('connect_error', (error) => {
            console.error('Lỗi kết nối:', error.message);
            if (error.message.includes('token')) {
                // Invalid token, redirect to login
                localStorage.removeItem('authToken');
                navigate(`/login/${teamId}`);
            }
        });

        // Receive auth success with role
        newSocket.on('authSuccess', (data) => {
            setRole(data.role);
            setControllerEmail(data.controllerEmail);
            console.log(`Role: ${data.role}, Controller: ${data.controllerEmail}`);
        });

        // Receive controller status updates
        newSocket.on('controllerStatus', (data) => {
            setControllerEmail(data.controllerEmail);
        });

        // Promoted to controller
        newSocket.on('promoted', (data) => {
            setRole('controller');
            alert(data.message);
        });

        newSocket.on('gameState', (state) => {
            setGameState(state);
            const team = state.teams.find(t => t.id === parseInt(teamId));
            setMyTeam(team);
            if (team) {
                setSelectedAnswer(team.answer);
            }
        });

        newSocket.on('newQuestion', () => {
            setSelectedAnswer(null);
            setShowResults(false);
            setResults(null);
        });

        newSocket.on('roundLocked', () => {
            console.log('Lượt đã bị khóa');
        });

        newSocket.on('roundResults', (roundResults) => {
            setResults(roundResults);
            setShowResults(true);
        });

        newSocket.on('gameReset', () => {
            setSelectedAnswer(null);
            setShowResults(false);
            setResults(null);
        });

        newSocket.on('error', (message) => {
            alert(message);
        });

        return () => newSocket.close();
    }, [teamId, navigate]);

    const handleAnswerSelect = (answer) => {
        if (role !== 'controller') {
            alert('Chỉ controller mới có thể trả lời!');
            return;
        }
        if (gameState?.isLocked) return;
        setSelectedAnswer(answer);
        socket.emit('submitAnswer', { teamId: parseInt(teamId), answer });
    };

    const handleCardActivate = (cardType) => {
        if (role !== 'controller') {
            alert('Chỉ controller mới có thể kích hoạt thẻ!');
            return;
        }
        if (gameState?.isLocked) return;

        if (cardType === 'redirect') {
            const target = prompt('Nhập số nhóm muốn chuyển hướng (1-10):');
            if (!target || target === teamId) return;
            socket.emit('activateCard', {
                teamId: parseInt(teamId),
                cardType,
                redirectTarget: parseInt(target)
            });
        } else {
            const confirm = window.confirm(`Bạn có chắc muốn sử dụng thẻ ${getCardName(cardType)}? Mỗi thẻ chỉ dùng được 1 lần!`);
            if (confirm) {
                socket.emit('activateCard', { teamId: parseInt(teamId), cardType });
            }
        }
    };

    const getCardName = (cardType) => {
        const names = {
            immunity: 'Miễn Nhiễm',
            redirect: 'Chuyển Hướng',
            allIn: 'Tất Tay'
        };
        return names[cardType];
    };

    const getCardIcon = (cardType) => {
        const icons = {
            immunity: '🛡️',
            redirect: '🔄',
            allIn: '🎲'
        };
        return icons[cardType];
    };

    const getMyResult = () => {
        if (!results || !myTeam) return null;
        return results.teams.find(t => t.id === myTeam.id);
    };

    const handleLogout = () => {
        if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('teamId');
            localStorage.removeItem('isAdmin');
            if (socket) {
                socket.disconnect();
            }
            navigate('/login/' + teamId);
        }
    };

    if (!gameState || !myTeam || role === null) {
        return (
            <div className="player-screen">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Đang kết nối...</p>
                </div>
            </div>
        );
    }

    const myResult = getMyResult();
    const isViewer = role === 'viewer';

    return (
        <div className="player-screen">
            <div className="player-container">
                {/* Header */}
                <div className="player-header glass">
                    <div className="team-info">
                        <h1 className="team-name">{myTeam.name}</h1>
                        <div className="team-score">
                            <span className="score-label">Điểm:</span>
                            <span className="score-value">{myTeam.score}</span>
                        </div>
                    </div>
                    <div className="header-badges">
                        {role === 'controller' ? (
                            <div className="role-badge controller-badge pulse">
                                🎮 BẠN ĐANG ĐIỀU KHIỂN
                            </div>
                        ) : (
                            <div className="role-badge viewer-badge">
                                👁️ CHẾ ĐỘ XEM
                            </div>
                        )}
                        {gameState.isLocked && (
                            <div className="locked-badge badge-danger pulse">
                                🔒 ĐÃ KHÓA
                            </div>
                        )}
                        <button className="btn btn-secondary" onClick={handleLogout} style={{ marginLeft: '10px' }}>
                            🚪 Đăng Xuất
                        </button>
                    </div>
                </div>

                {/* View-Only Banner for Viewers */}
                {isViewer && (
                    <div className="viewer-banner glass">
                        <div className="viewer-info">
                            <span className="viewer-icon">👁️</span>
                            <div>
                                <strong>Chế Độ Xem</strong>
                                <p>{controllerEmail} đang điều khiển nhóm này</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Special Cards */}
                <div className="special-cards glass">
                    <h3>🎴 Thẻ Đặc Biệt</h3>
                    <div className="cards-grid">
                        {Object.keys(myTeam.specialCards).map(cardType => (
                            <button
                                key={cardType}
                                className={`card-btn ${myTeam.activeCards[cardType] ? 'active' : ''} ${!myTeam.specialCards[cardType] ? 'used' : ''} ${isViewer ? 'disabled' : ''}`}
                                onClick={() => handleCardActivate(cardType)}
                                disabled={!myTeam.specialCards[cardType] || gameState.isLocked || isViewer}
                            >
                                <span className="card-icon">{getCardIcon(cardType)}</span>
                                <span className="card-name">{getCardName(cardType)}</span>
                                {myTeam.activeCards[cardType] && (
                                    <span className="card-active-badge">✓ ĐANG BẬT</span>
                                )}
                                {!myTeam.specialCards[cardType] && (
                                    <span className="card-used-badge">ĐÃ DÙNG</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Question */}
                {gameState.currentQuestion ? (
                    <div className="question-section glass">
                        <div className="question-header">
                            <span className="round-badge">Lượt {gameState.currentRound}</span>
                            <span className="question-type">
                                {gameState.currentQuestion.type === 'mcq' ? '📝 Trắc Nghiệm' : '✓ Đúng/Sai'}
                            </span>
                        </div>
                        <h2 className="question-text">{gameState.currentQuestion.question}</h2>

                        <div className="answers-grid">
                            {gameState.currentQuestion.options.map((option, index) => (
                                <button
                                    key={index}
                                    className={`answer-btn ${selectedAnswer === option ? 'selected' : ''} ${isViewer ? 'disabled' : ''}`}
                                    onClick={() => handleAnswerSelect(option)}
                                    disabled={gameState.isLocked || isViewer}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        {selectedAnswer && (
                            <div className="answer-status badge-success">
                                ✓ Đã chọn: {selectedAnswer}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="no-question glass">
                        <p>⏳ Đang chờ BTC tạo câu hỏi...</p>
                    </div>
                )}

                {/* Results */}
                {showResults && myResult && (
                    <div className={`results-section glass ${myResult.isCorrect ? 'correct' : 'wrong'}`}>
                        <h3>
                            {myResult.isCorrect ? '✅ CHÍNH XÁC!' : '❌ SAI RỒI!'}
                        </h3>
                        <div className="result-details">
                            <p>Câu trả lời của bạn: <strong>{myResult.answer || 'Không trả lời'}</strong></p>
                            <p>Đáp án đúng: <strong>{gameState.currentQuestion.correctAnswer}</strong></p>
                            <p className={`score-change ${myResult.scoreChange >= 0 ? 'positive' : 'negative'}`}>
                                Thay đổi điểm: {myResult.scoreChange >= 0 ? '+' : ''}{myResult.scoreChange}
                            </p>
                            <p>Điểm mới: <strong className="new-score">{myResult.scoreAfter}</strong></p>
                        </div>

                        {results.isCrisis && (
                            <div className="crisis-alert">
                                ⚠️ KHỦNG HOẢNG HỆ THỐNG! Tất cả nhóm bị -2 điểm
                            </div>
                        )}

                        {results.dominoChains.some(d => d.to === myTeam.id) && (
                            <div className="domino-alert">
                                ⛓️ Bạn bị ảnh hưởng bởi hiệu ứng Domino!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PlayerScreen;
