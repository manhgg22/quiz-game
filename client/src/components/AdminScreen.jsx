import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './AdminScreen.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

function AdminScreen() {
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [sampleQuestions, setSampleQuestions] = useState([]);
    const [questionForm, setQuestionForm] = useState({
        question: '',
        type: 'mcq',
        options: ['', '', '', ''],
        correctAnswer: ''
    });
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState(null);

    useEffect(() => {
        // Get auth token from localStorage
        const token = localStorage.getItem('authToken');

        const newSocket = io(SOCKET_URL, {
            auth: {
                token: token
            }
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Admin đã kết nối server');
            newSocket.emit('joinAdmin');
            newSocket.emit('getSampleQuestions');
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            if (error.message === 'Invalid token' || error.message === 'No token provided') {
                alert('Vui lòng đăng nhập trước khi truy cập Admin Panel');
                window.location.href = '/admin/login';
            }
        });

        newSocket.on('gameState', (state) => {
            setGameState(state);
        });

        newSocket.on('sampleQuestions', (questions) => {
            setSampleQuestions(questions);
        });

        newSocket.on('roundResults', (roundResults) => {
            setResults(roundResults);
            setShowResults(true);
        });

        newSocket.on('gameReset', () => {
            setShowResults(false);
            setResults(null);
        });

        return () => newSocket.close();
    }, []);

    const handleFormChange = (field, value) => {
        setQuestionForm(prev => ({ ...prev, [field]: value }));
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...questionForm.options];
        newOptions[index] = value;
        setQuestionForm(prev => ({ ...prev, options: newOptions }));
    };

    const handleLoadSampleQuestion = (question) => {
        // Find the full option string that matches the correct answer letter (e.g. "C" matches "C. 1922")
        // For True/False, it might match directly
        let fullCorrectAnswer = question.correctAnswer;

        if (question.type === 'mcq') {
            const match = question.options.find(opt => opt.startsWith(question.correctAnswer + '.'));
            if (match) {
                fullCorrectAnswer = match;
            }
        }

        // Load question into form with correct answer pre-selected
        setQuestionForm({
            question: question.question,
            type: question.type,
            options: question.options,
            correctAnswer: fullCorrectAnswer
        });
        console.log(`📝 Đã load câu hỏi vào form: ${question.question.substring(0, 30)}... Correct: ${fullCorrectAnswer}`);
    };

    const handleCreateQuestion = () => {
        if (!questionForm.question.trim()) {
            alert('Vui lòng nhập câu hỏi!');
            return;
        }

        const filteredOptions = questionForm.type === 'truefalse'
            ? ['Đúng', 'Sai']
            : questionForm.options.filter(opt => opt.trim());

        if (filteredOptions.length < 2) {
            alert('Cần ít nhất 2 lựa chọn!');
            return;
        }

        if (!questionForm.correctAnswer) {
            alert('Vui lòng chọn đáp án đúng!');
            return;
        }

        socket.emit('createQuestion', {
            question: questionForm.question,
            type: questionForm.type,
            options: filteredOptions,
            correctAnswer: questionForm.correctAnswer
        });

        setShowResults(false);
        setResults(null);
    };

    const handleLockRound = () => {
        if (!gameState?.currentQuestion) {
            alert('Chưa có câu hỏi nào!');
            return;
        }
        socket.emit('lockRound');
    };

    const handleCalculateScores = () => {
        socket.emit('calculateScores');
    };

    const handleNextQuestion = () => {
        setQuestionForm({
            question: '',
            type: 'mcq',
            options: ['', '', '', ''],
            correctAnswer: ''
        });
        setShowResults(false);
        setResults(null);
    };

    const handleResetGame = () => {
        if (confirm('Bạn có chắc muốn reset toàn bộ game? Điểm và lịch sử sẽ bị xóa!')) {
            socket.emit('resetGame');
            handleNextQuestion();
        }
    };

    const getAnsweredCount = () => {
        if (!gameState) return 0;
        return gameState.teams.filter(t => t.answer !== null).length;
    };

    const getSortedTeams = () => {
        if (!gameState) return [];
        return [...gameState.teams].sort((a, b) => b.score - a.score);
    };

    const handleLogout = () => {
        if (window.confirm('Bạn có chắc muốn đăng xuất khỏi Admin Panel?')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('teamId');
            localStorage.removeItem('isAdmin');
            if (socket) {
                socket.disconnect();
            }
            navigate('/admin/login');
        }
    };

    if (!gameState) {
        return (
            <div className="admin-screen">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Đang kết nối...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-screen">
            <div className="admin-container">
                {/* Header */}
                <div className="admin-header">
                    <h1>Bảng Điều Khiển Admin</h1>
                    <div className="header-actions">
                        <button className="btn btn-danger" onClick={handleResetGame}>
                            Đặt Lại Game
                        </button>
                        <button className="btn btn-secondary" onClick={handleLogout}>
                            Đăng Xuất
                        </button>
                    </div>
                </div>

                <div className="admin-content">
                    {/* Left Panel - Controls */}
                    <div className="left-panel">
                        {/* Question Form */}
                        <div className="control-section">
                            <h2>Tạo Câu Hỏi</h2>

                            <div className="form-group">
                                <label>Loại Câu Hỏi</label>
                                <select
                                    value={questionForm.type}
                                    onChange={(e) => handleFormChange('type', e.target.value)}
                                >
                                    <option value="mcq">Trắc nghiệm</option>
                                    <option value="truefalse">Đúng/Sai</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Câu Hỏi</label>
                                <textarea
                                    value={questionForm.question}
                                    onChange={(e) => handleFormChange('question', e.target.value)}
                                    placeholder="Nhập câu hỏi..."
                                    rows="3"
                                />
                            </div>

                            {questionForm.type === 'mcq' && (
                                <div className="form-group">
                                    <label>Các Lựa Chọn</label>
                                    {questionForm.options.map((opt, idx) => (
                                        <input
                                            key={idx}
                                            type="text"
                                            value={opt}
                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                            placeholder={`Lựa chọn ${String.fromCharCode(65 + idx)}`}
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="form-group">
                                <label>Đáp Án Đúng</label>
                                <select
                                    value={questionForm.correctAnswer}
                                    onChange={(e) => handleFormChange('correctAnswer', e.target.value)}
                                >
                                    <option value="">-- Chọn Đáp Án --</option>
                                    {(questionForm.type === 'truefalse' ? ['Đúng', 'Sai'] : questionForm.options.filter(o => o.trim())).map((opt, idx) => (
                                        <option key={idx} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                className="btn btn-primary btn-block"
                                onClick={handleCreateQuestion}
                            >
                                Tạo Câu Hỏi Mới
                            </button>
                        </div>

                        {/* Sample Questions */}
                        {sampleQuestions.length > 0 && (
                            <div className="control-section">
                                <h3>Câu Hỏi Mẫu</h3>
                                <div className="sample-questions">
                                    {sampleQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            className="sample-question-btn"
                                            onClick={() => handleLoadSampleQuestion(q)}
                                            title="Click để load câu hỏi vào form (đáp án đã chọn sẵn)"
                                        >
                                            <span className="sample-number">#{idx + 1}</span>
                                            <span className="sample-text">{q.question.substring(0, 50)}...</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Round Controls */}
                        {gameState.currentQuestion && (
                            <div className="control-section">
                                <h3>Điều Khiển Lượt Chơi</h3>

                                <div className="round-info">
                                    <p><strong>Lượt:</strong> {gameState.currentRound}</p>
                                    <p><strong>Đã Trả Lời:</strong> {getAnsweredCount()}/{gameState.teams.length}</p>
                                    <p><strong>Trạng Thái:</strong>
                                        <span className={`status-badge ${gameState.isLocked ? 'locked' : 'active'}`}>
                                            {gameState.isLocked ? 'Đã Khóa' : 'Đang Chơi'}
                                        </span>
                                    </p>
                                </div>

                                <div className="control-buttons">
                                    {!gameState.isLocked && (
                                        <button
                                            className="btn btn-warning btn-block"
                                            onClick={handleLockRound}
                                        >
                                            Khóa Lượt
                                        </button>
                                    )}

                                    {gameState.isLocked && !showResults && (
                                        <button
                                            className="btn btn-success btn-block"
                                            onClick={handleCalculateScores}
                                        >
                                            Tính Điểm
                                        </button>
                                    )}

                                    {showResults && (
                                        <button
                                            className="btn btn-primary btn-block"
                                            onClick={handleNextQuestion}
                                        >
                                            Câu Hỏi Tiếp Theo
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Scoreboard & Status */}
                    <div className="right-panel">
                        {/* Scoreboard */}
                        <div className="scoreboard">
                            <h2>Bảng Xếp Hạng</h2>
                            <div className="teams-list">
                                {getSortedTeams().map((team, index) => (
                                    <div key={team.id} className={`team-card rank-${index + 1}`}>
                                        <div className="team-rank">#{index + 1}</div>
                                        <div className="team-details">
                                            <div className="team-name-row">
                                                <span className="team-name">{team.name}</span>
                                                {team.answer && (
                                                    <span className="answered-badge">✓</span>
                                                )}
                                            </div>
                                            <div className="team-score-row">
                                                <span className="team-score">{team.score} điểm</span>
                                            </div>
                                            {/* Active Cards */}
                                            {Object.entries(team.activeCards).some(([_, active]) => active) && (
                                                <div className="active-cards-row">
                                                    {team.activeCards.immunity && <span className="mini-badge">🛡️</span>}
                                                    {team.activeCards.redirect && <span className="mini-badge">🔄</span>}
                                                    {team.activeCards.allIn && <span className="mini-badge">🎲</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Results */}
                        {showResults && results && (
                            <div className="results-panel">
                                <h2>Kết Quả Lượt Chơi</h2>

                                {results.isCrisis && (
                                    <div className="crisis-banner">
                                        ⚠️ KHỦNG HOẢNG HỆ THỐNG! ≥5 nhóm sai → Tất cả -2 điểm
                                    </div>
                                )}

                                <div className="results-grid">
                                    {results.teams.map(team => (
                                        <div
                                            key={team.id}
                                            className={`result-card ${team.isCorrect ? 'correct' : 'wrong'}`}
                                        >
                                            <div className="result-header">
                                                <span className="result-team">{team.name}</span>
                                                <span className={`result-icon ${team.isCorrect ? 'correct' : 'wrong'}`}>
                                                    {team.isCorrect ? '✅' : '❌'}
                                                </span>
                                            </div>
                                            <div className="result-answer">
                                                Trả lời: <strong>{team.answer || 'Không trả lời'}</strong>
                                            </div>
                                            <div className={`result-score ${team.scoreChange >= 0 ? 'positive' : 'negative'}`}>
                                                {team.scoreChange >= 0 ? '+' : ''}{team.scoreChange} điểm
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {results.dominoChains.length > 0 && (
                                    <div className="domino-section">
                                        <h3>Chuỗi Domino</h3>
                                        <div className="domino-chains">
                                            {results.dominoChains.map((chain, idx) => (
                                                <div key={idx} className="domino-chain">
                                                    Nhóm {chain.from} → Nhóm {chain.to} ({chain.penalty} điểm)
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminScreen;
