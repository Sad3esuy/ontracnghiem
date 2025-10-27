// Quiz Application JavaScript
class QuizApp {
    constructor() {
        this.questions = this.loadQuestions();
        this.subjects = this.loadSubjects();
        this.currentQuiz = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.quizStartTime = null;
        this.timerInterval = null;
        this.practiceMode = 'check-as-you-go';
        this.statistics = this.loadStatistics();

        this.init();
    }

    async init() {
        // Tự động load dữ liệu từ file JSON nếu localStorage trống
        if (this.questions.length === 0) {
            await this.autoLoadBackupData();
        }
        
        this.setupNavigation();
        this.setupSubjectManagement();
        this.setupQuestionInput();
        this.setupPracticeMode();
        this.setupBackup();
        this.updateDashboard();
        this.setupStatistics();
    }

    async autoLoadBackupData() {
        try {
            const response = await fetch('data/ktct/quiz-backup-2025-10-27.json');
            if (!response.ok) {
                console.log('Không tìm thấy file backup, sử dụng dữ liệu trống');
                return;
            }
            
            const data = await response.json();
            
            // Validate data structure
            if (data.questions && data.subjects) {
                this.questions = data.questions;
                this.subjects = data.subjects;
                if (data.statistics) {
                    this.statistics = data.statistics;
                }

                // Save to localStorage
                this.saveQuestions();
                this.saveSubjects();
                this.saveStatistics();

                console.log(`Đã tự động load ${data.questions.length} câu hỏi từ file backup`);
            }
        } catch (error) {
            console.log('Lỗi khi tự động load dữ liệu:', error.message);
        }
    }

    // Navigation
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetPage = button.dataset.page;
                this.showPage(targetPage);
            });
        });
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        document.getElementById(pageId).classList.add('active');

        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

        // Update dashboard if showing dashboard
        if (pageId === 'dashboard') {
            this.updateDashboard();
        }
    }

    // Subject Management
    setupSubjectManagement() {
        this.setupSubjectDropdowns();
        this.setupNewSubjectForm();
        this.updateSubjectDropdowns();
    }

    setupSubjectDropdowns() {
        // Setup subject selection for adding questions
        const subjectSelect = document.getElementById('subject-select');
        const newSubjectBtn = document.getElementById('new-subject-btn');
        const manageSubjectsBtn = document.getElementById('manage-subjects-btn');
        const newSubjectForm = document.querySelector('.new-subject-form');
        const manageSubjectsPanel = document.querySelector('.manage-subjects-panel');
        const createSubjectBtn = document.getElementById('create-subject-btn');
        const cancelSubjectBtn = document.getElementById('cancel-subject-btn');
        const closeManageSubjectsBtn = document.getElementById('close-manage-subjects');
        const newSubjectInput = document.getElementById('new-subject-name');

        newSubjectBtn.addEventListener('click', () => {
            newSubjectForm.classList.remove('hidden');
            subjectSelect.style.display = 'none';
            newSubjectBtn.style.display = 'none';
            manageSubjectsBtn.style.display = 'none';
            newSubjectInput.focus();
        });

        createSubjectBtn.addEventListener('click', () => {
            const subjectName = newSubjectInput.value.trim();
            if (subjectName) {
                this.createSubject(subjectName);
                newSubjectInput.value = '';
                newSubjectForm.classList.add('hidden');
                subjectSelect.style.display = 'block';
                newSubjectBtn.style.display = 'block';
                manageSubjectsBtn.style.display = 'block';
                this.updateSubjectDropdowns();
            } else {
                this.showMessage('Vui lòng nhập tên bài học!', 'error');
            }
        });

        cancelSubjectBtn.addEventListener('click', () => {
            newSubjectInput.value = '';
            newSubjectForm.classList.add('hidden');
            subjectSelect.style.display = 'block';
            newSubjectBtn.style.display = 'block';
            manageSubjectsBtn.style.display = 'block';
        });

        manageSubjectsBtn.addEventListener('click', () => {
            manageSubjectsPanel.classList.remove('hidden');
            this.updateSubjectsList();
        });

        closeManageSubjectsBtn.addEventListener('click', () => {
            manageSubjectsPanel.classList.add('hidden');
        });

        // Setup practice subject filter
        const practiceSubjectSelect = document.getElementById('practice-subject-select');
        practiceSubjectSelect.addEventListener('change', () => {
            // This will be used when starting practice
        });
    }

    setupNewSubjectForm() {
        const newSubjectInput = document.getElementById('new-subject-name');
        newSubjectInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('create-subject-btn').click();
            } else if (e.key === 'Escape') {
                document.getElementById('cancel-subject-btn').click();
            }
        });
    }

    createSubject(name) {
        if (!this.subjects.includes(name)) {
            this.subjects.push(name);
            this.saveSubjects();
            this.showMessage(`Đã tạo bài học "${name}"!`, 'success');
        } else {
            this.showMessage('Bài học này đã tồn tại!', 'error');
        }
    }

    updateSubjectDropdowns() {
        const subjectSelect = document.getElementById('subject-select');
        const practiceSubjectSelect = document.getElementById('practice-subject-select');

        // Clear existing options (except the first one)
        while (subjectSelect.children.length > 1) {
            subjectSelect.removeChild(subjectSelect.lastChild);
        }
        while (practiceSubjectSelect.children.length > 1) {
            practiceSubjectSelect.removeChild(practiceSubjectSelect.lastChild);
        }

        // Add subjects
        this.subjects.forEach(subject => {
            const option1 = document.createElement('option');
            option1.value = subject;
            option1.textContent = subject;
            subjectSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = subject;
            option2.textContent = subject;
            practiceSubjectSelect.appendChild(option2);
        });
    }

    updateSubjectsList() {
        const subjectsList = document.getElementById('subjects-list');
        subjectsList.innerHTML = '';

        if (this.subjects.length === 0) {
            subjectsList.innerHTML = '<p>Chưa có bài học nào.</p>';
            return;
        }

        this.subjects.forEach((subject, index) => {
            const subjectQuestions = this.questions.filter(q => q.subject === subject);
            const subjectItem = document.createElement('div');
            subjectItem.className = 'subject-item';
            subjectItem.innerHTML = `
                <div class="subject-info">
                    <div class="subject-name">${subject}</div>
                    <div class="subject-count">${subjectQuestions.length} câu hỏi</div>
                </div>
                <div class="subject-actions">
                    <button class="delete-subject-btn" data-subject="${subject}">Xóa</button>
                </div>
            `;
            subjectsList.appendChild(subjectItem);
        });

        // Setup delete buttons
        subjectsList.querySelectorAll('.delete-subject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const subjectToDelete = e.target.dataset.subject;
                this.deleteSubject(subjectToDelete);
            });
        });
    }

    deleteSubject(subjectName) {
        if (confirm(`Bạn có chắc chắn muốn xóa bài học "${subjectName}"?\n\nTất cả câu hỏi trong bài học này sẽ bị xóa vĩnh viễn!`)) {
            // Remove subject from subjects list
            this.subjects = this.subjects.filter(s => s !== subjectName);

            // Remove all questions in this subject
            this.questions = this.questions.filter(q => q.subject !== subjectName);

            // Save changes
            this.saveSubjects();
            this.saveQuestions();

            // Update UI
            this.updateSubjectDropdowns();
            this.updateSubjectsList();
            this.updateDashboard();

            this.showMessage(`Đã xóa bài học "${subjectName}" và tất cả câu hỏi trong đó!`, 'success');
        }
    }

    // Question Management
    setupQuestionInput() {
        const parseButton = document.getElementById('parse-questions');
        const clearButton = document.getElementById('clear-input');
        const inputArea = document.getElementById('question-input');

        parseButton.addEventListener('click', () => {
            this.parseQuestions();
        });

        clearButton.addEventListener('click', () => {
            inputArea.value = '';
            document.getElementById('parsed-questions').innerHTML = '';
            document.getElementById('save-all-questions').classList.add('hidden');
        });

        // Allow Ctrl+Enter to parse
        inputArea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.parseQuestions();
            }
        });
    }

    parseQuestions() {
        const input = document.getElementById('question-input').value.trim();
        if (!input) {
            this.showMessage('Vui lòng nhập câu hỏi theo format!', 'error');
            return;
        }

        const questions = this.parseQuestionFormat(input);
        if (questions.length === 0) {
            this.showMessage('Không tìm thấy câu hỏi hợp lệ. Vui lòng kiểm tra format!', 'error');
            return;
        }

        this.displayParsedQuestions(questions);
    }

    parseQuestionFormat(text) {
        const questions = [];
        // Split by question pattern, but keep the question number
        const questionBlocks = text.split(/Câu\s+\d+:/).filter(block => block.trim());

        // Get selected subject
        const selectedSubject = document.getElementById('subject-select').value || 'Chưa phân loại';

        questionBlocks.forEach((block, index) => {
            if (!block.trim()) return;

            const lines = block.split('\n').map(line => line.trim()).filter(line => line);

            // Extract question text (first non-empty line)
            const questionText = lines[0];

            if (!questionText) return;

            // Find answers and correct answer
            const answers = [];
            let correctAnswer = 3; // Default to D (index 3)

            // Look for answer patterns (A., B., C., D. - uppercase)
            const answerMatches = block.match(/^[A-D]\.\s*.+$/gm);

            if (answerMatches) {
                answerMatches.forEach((answerLine) => {
                    const answerText = answerLine.substring(3).trim();

                    answers.push({
                        text: answerText,
                        isCorrect: false
                    });
                });
            }

            // Look for "Đáp án đúng: X" pattern
            const correctAnswerMatch = block.match(/Đáp án đúng:\s*([A-D])/i);
            if (correctAnswerMatch) {
                const correctLetter = correctAnswerMatch[1].toUpperCase();
                correctAnswer = correctLetter.charCodeAt(0) - 65; // Convert A=0, B=1, C=2, D=3
            }

            // Mark the correct answer
            if (answers[correctAnswer]) {
                answers[correctAnswer].isCorrect = true;
            }

            if (questionText && answers.length >= 2) {
                questions.push({
                    id: Date.now() + index,
                    question: questionText,
                    answers: answers,
                    correctAnswer: correctAnswer,
                    subject: selectedSubject,
                    difficulty: 'Trung bình'
                });
            }
        });

        return questions;
    }

    displayParsedQuestions(questions) {
        const container = document.getElementById('parsed-questions');
        const saveAllBtn = document.getElementById('save-all-questions');

        container.innerHTML = '';

        if (questions.length > 0) {
            saveAllBtn.classList.remove('hidden');
            saveAllBtn.onclick = () => this.saveAllQuestions(questions);
        } else {
            saveAllBtn.classList.add('hidden');
        }

        questions.forEach((q, index) => {
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card';
            questionCard.innerHTML = `
                <h4>Câu ${index + 1}: ${q.question}</h4>
                <div class="answers">
                    ${q.answers.map((answer, i) => `
                        <div class="answer ${i === q.correctAnswer ? 'correct' : 'incorrect'}">
                            ${String.fromCharCode(97 + i)}. ${answer.text}
                        </div>
                    `).join('')}
                </div>
                <div class="question-actions-small">
                    <button class="save-btn" data-question='${JSON.stringify(q).replace(/"/g, '"')}'>Lưu</button>
                    <button class="edit-btn">Sửa</button>
                    <button class="delete-btn">Xóa</button>
                </div>
            `;
            container.appendChild(questionCard);
        });

        // Setup save buttons
        container.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const questionData = JSON.parse(e.target.dataset.question.replace(/"/g, '"'));
                this.saveQuestion(questionData);
                e.target.textContent = 'Đã lưu';
                e.target.style.background = '#00b894';
            });
        });
    }

    saveAllQuestions(questions) {
        questions.forEach(q => {
            this.questions.push(q);
        });
        this.saveQuestions();
        this.showMessage(`Đã lưu ${questions.length} câu hỏi thành công!`, 'success');
        this.updateDashboard();

        // Clear the parsed questions and hide save all button
        document.getElementById('parsed-questions').innerHTML = '';
        document.getElementById('save-all-questions').classList.add('hidden');
    }

    saveQuestion(question) {
        this.questions.push(question);
        this.saveQuestions();
        this.showMessage('Câu hỏi đã được lưu thành công!', 'success');
        this.updateDashboard();
    }

    // Practice Mode
    setupPracticeMode() {
        const startButton = document.getElementById('start-practice');
        const modeSelect = document.getElementById('practice-mode');
        const questionCount = document.getElementById('question-count');
        const shuffleQuestions = document.getElementById('shuffle-questions');
        const shuffleAnswers = document.getElementById('shuffle-answers');

        startButton.addEventListener('click', () => {
            // Handle "all" option
            const countValue = questionCount.value === 'all' ? Infinity : parseInt(questionCount.value);

            this.startQuiz({
                mode: modeSelect.value,
                count: countValue,
                shuffleQuestions: shuffleQuestions.checked,
                shuffleAnswers: shuffleAnswers.checked
            });
        });
    }

    startQuiz(options) {
        const availableQuestions = this.selectQuestions(options.count, false); // Don't shuffle for counting

        if (availableQuestions.length === 0) {
            this.showMessage('Chưa có câu hỏi nào! Vui lòng thêm câu hỏi trước.', 'error');
            return;
        }

        if (options.count !== Infinity && availableQuestions.length < options.count) {
            this.showMessage(`Chỉ có ${availableQuestions.length} câu hỏi khả dụng. Sẽ làm ${availableQuestions.length} câu.`, 'info');
        }

        this.practiceMode = options.mode;
        this.currentQuiz = this.selectQuestions(options.count, options.shuffleQuestions);
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.quizStartTime = new Date();

        this.showQuizInterface();
        this.displayCurrentQuestion(options.shuffleAnswers);
        this.startTimer();
        this.setupBackToSetup();
    }

    selectQuestions(count, shuffle) {
        // Get selected subject for practice
        const selectedSubject = document.getElementById('practice-subject-select').value;

        let selected = [...this.questions];

        // Filter by subject if one is selected
        if (selectedSubject) {
            selected = selected.filter(q => q.subject === selectedSubject);
        }

        if (shuffle) {
            selected = this.shuffleArray(selected);
        }

        return selected.slice(0, Math.min(count, selected.length));
    }

    showQuizInterface() {
        document.getElementById('practice').querySelector('.practice-options').style.display = 'none';
        document.getElementById('start-practice').style.display = 'none';
        document.getElementById('quiz-container').classList.remove('hidden');
    }

    displayCurrentQuestion(shuffleAnswers) {
        const questionArea = document.getElementById('question-area');
        const currentQ = this.currentQuiz[this.currentQuestionIndex];

        if (!currentQ) return;

        let answers = [...currentQ.answers];
        if (shuffleAnswers) {
            answers = this.shuffleArray(answers);
        }

        questionArea.innerHTML = `
            <div class="question">
                <h3>${currentQ.question}</h3>
                <div class="answers">
                    ${answers.map((answer, index) => {
                        const originalIndex = currentQ.answers.findIndex(a => a.text === answer.text);
                        const isCorrect = originalIndex === currentQ.correctAnswer;
                        const answerId = `q${this.currentQuestionIndex}a${index}`;

                        return `
                            <label class="answer-option" for="${answerId}">
                                <input type="radio" id="${answerId}" name="question${this.currentQuestionIndex}"
                                       value="${originalIndex}" ${this.userAnswers[this.currentQuestionIndex] === originalIndex ? 'checked' : ''}>
                                <span class="answer-text">${String.fromCharCode(97 + index)}. ${answer.text}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
                ${this.practiceMode === 'check-as-you-go' ?
                    '<div class="explanation hidden">Giải thích: Chưa có giải thích</div>' : ''}
            </div>
        `;

        this.setupQuestionNavigation();
        this.updateQuizHeader();
    }

    setupQuestionNavigation() {
        const prevBtn = document.getElementById('prev-question');
        const nextBtn = document.getElementById('next-question');
        const submitBtn = document.getElementById('submit-quiz');

        // Setup answer selection
        document.querySelectorAll('input[name^="question"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.userAnswers[this.currentQuestionIndex] = parseInt(e.target.value);
                this.handleAnswerSelection();
            });
        });

        // Remove existing event listeners to avoid duplicates
        prevBtn.replaceWith(prevBtn.cloneNode(true));
        nextBtn.replaceWith(nextBtn.cloneNode(true));
        submitBtn.replaceWith(submitBtn.cloneNode(true));

        // Get fresh references
        const newPrevBtn = document.getElementById('prev-question');
        const newNextBtn = document.getElementById('next-question');
        const newSubmitBtn = document.getElementById('submit-quiz');

        newPrevBtn.addEventListener('click', () => {
            if (this.currentQuestionIndex > 0) {
                this.currentQuestionIndex--;
                this.displayCurrentQuestion(document.getElementById('shuffle-answers').checked);
            }
        });

        newNextBtn.addEventListener('click', () => {
            if (this.currentQuestionIndex < this.currentQuiz.length - 1) {
                this.currentQuestionIndex++;
                this.displayCurrentQuestion(document.getElementById('shuffle-answers').checked);
            } else {
                this.showQuizResults();
            }
        });

        newSubmitBtn.addEventListener('click', () => {
            this.showQuizResults();
        });

        // Update button visibility
        newPrevBtn.classList.toggle('hidden', this.currentQuestionIndex === 0);
        newNextBtn.textContent = this.currentQuestionIndex === this.currentQuiz.length - 1 ? 'Hoàn thành' : 'Câu tiếp';
        newSubmitBtn.classList.toggle('hidden', this.practiceMode === 'check-as-you-go');
    }

    handleAnswerSelection() {
        if (this.practiceMode === 'check-as-you-go') {
            const currentQ = this.currentQuiz[this.currentQuestionIndex];
            const userAnswer = this.userAnswers[this.currentQuestionIndex];
            const isCorrect = userAnswer === currentQ.correctAnswer;

            // Show explanation
            const explanation = document.querySelector('.explanation');
            if (explanation) {
                explanation.classList.remove('hidden');
                explanation.textContent = isCorrect ?
                    '✅ Đúng! Câu trả lời chính xác.' :
                    `❌ Sai! Đáp án đúng là: ${String.fromCharCode(97 + currentQ.correctAnswer)}. ${currentQ.answers[currentQ.correctAnswer].text}`;
            }

            // Highlight correct/incorrect answers
            document.querySelectorAll('.answer-option').forEach((option, index) => {
                const answerValue = parseInt(option.querySelector('input').value);
                if (answerValue === currentQ.correctAnswer) {
                    option.classList.add('correct');
                } else if (answerValue === userAnswer && !isCorrect) {
                    option.classList.add('incorrect');
                }
            });

            // Disable further changes for this question
            document.querySelectorAll('input[name^="question"]').forEach(input => {
                input.disabled = true;
            });

            // Update statistics
            this.updateStatistics(currentQ, isCorrect);

            // Show next button for check-as-you-go mode (listener already set in displayCurrentQuestion)
            if (this.practiceMode === 'check-as-you-go') {
                const nextBtn = document.getElementById('next-question');
                if (nextBtn) {
                    nextBtn.textContent = this.currentQuestionIndex === this.currentQuiz.length - 1 ? 'Xem kết quả' : 'Câu tiếp';
                    nextBtn.classList.remove('hidden');
                }
            }
        }
    }

    showQuizResults() {
        this.stopTimer();

        const correctAnswers = this.currentQuiz.reduce((count, q, index) => {
            return count + (this.userAnswers[index] === q.correctAnswer ? 1 : 0);
        }, 0);

        const accuracy = Math.round((correctAnswers / this.currentQuiz.length) * 100);
        const timeSpent = Math.round((new Date() - this.quizStartTime) / 1000);

        // Update results display
        document.getElementById('final-score').textContent = `${correctAnswers}/${this.currentQuiz.length}`;
        document.getElementById('final-accuracy').textContent = `${accuracy}%`;

        // Clear question area and quiz actions
        const questionArea = document.getElementById('question-area');
        const quizActions = document.querySelector('.quiz-actions');
        if (questionArea) questionArea.innerHTML = '';
        if (quizActions) quizActions.innerHTML = '';

        // Show results
        document.getElementById('quiz-results').classList.remove('hidden');

        // Save to history
        this.saveQuizToHistory(correctAnswers, this.currentQuiz.length, timeSpent);

        // Setup review and new quiz buttons - remove old listeners
        const reviewBtn = document.getElementById('review-answers');
        const newQuizBtn = document.getElementById('new-quiz');

        // Clone nodes to remove all event listeners
        const newReviewBtn = reviewBtn.cloneNode(true);
        const newNewQuizBtn = newQuizBtn.cloneNode(true);
        reviewBtn.parentNode.replaceChild(newReviewBtn, reviewBtn);
        newQuizBtn.parentNode.replaceChild(newNewQuizBtn, newQuizBtn);

        // Add fresh event listeners
        newReviewBtn.addEventListener('click', () => {
            this.reviewAnswers();
        });

        newNewQuizBtn.addEventListener('click', () => {
            this.resetQuiz();
        });
    }

    reviewAnswers() {
        const questionArea = document.getElementById('question-area');
        const quizResults = document.getElementById('quiz-results');

        // Hide results summary
        if (quizResults) quizResults.classList.add('hidden');

        questionArea.innerHTML = this.currentQuiz.map((q, index) => {
            const userAnswer = this.userAnswers[index];
            const isCorrect = userAnswer === q.correctAnswer;

            return `
                <div class="question">
                    <h3>Câu ${index + 1}: ${q.question} ${isCorrect ? '✅' : '❌'}</h3>
                    <div class="answers">
                        ${q.answers.map((answer, i) => {
                            let className = 'answer-option';
                            if (i === q.correctAnswer) className += ' correct';
                            if (i === userAnswer && !isCorrect) className += ' incorrect';
                            if (i === userAnswer) className += ' selected';

                            return `
                                <div class="${className}">
                                    <span class="answer-text">${String.fromCharCode(97 + i)}. ${answer.text}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Reset quiz actions to show back button
        const quizActions = document.querySelector('.quiz-actions');
        if (quizActions) {
            quizActions.innerHTML = '<button id="back-to-results" style="margin: 0 auto;">Quay lại kết quả</button>';

            // Setup back button event listener
            const backBtn = document.getElementById('back-to-results');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    this.showQuizResults();
                });
            }
        }
    }

    resetQuiz() {
        // Reset quiz state first
        this.currentQuiz = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        // Timer removed

        // Clear quiz content
        const questionArea = document.getElementById('question-area');
        const quizContainer = document.getElementById('quiz-container');
        const quizResults = document.getElementById('quiz-results');

        if (questionArea) questionArea.innerHTML = '';

        // Reset quiz actions buttons
        const quizActions = document.querySelector('.quiz-actions');
        if (quizActions) {
            quizActions.innerHTML = `
                <button id="prev-question" class="hidden">Câu trước</button>
                <button id="next-question">Câu tiếp</button>
                <button id="submit-quiz" class="hidden">Nộp bài</button>
            `;
        }

        // Hide quiz interface
        if (quizContainer) quizContainer.classList.add('hidden');
        if (quizResults) quizResults.classList.add('hidden');

        // Show practice options
        const practiceOptions = document.getElementById('practice').querySelector('.practice-options');
        const startPracticeBtn = document.getElementById('start-practice');

        if (practiceOptions) practiceOptions.style.display = 'grid';
        if (startPracticeBtn) startPracticeBtn.style.display = 'block';

        // Show the practice page
        this.showPage('practice');
    }

    // Timer
    startTimer() {
        const timerDisplay = document.getElementById('timer-display');
        if (!timerDisplay) return;
        
        this.timerInterval = setInterval(() => {
            const elapsed = Math.round((new Date() - this.quizStartTime) / 1000);
            timerDisplay.textContent = this.formatTime(elapsed);
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    setupBackToSetup() {
        const backBtn = document.getElementById('back-to-setup');
        if (!backBtn) return;

        // Remove existing listener
        const newBackBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(newBackBtn, backBtn);

        // Add fresh listener
        newBackBtn.addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn quay lại? Tiến trình hiện tại sẽ bị mất!')) {
                this.stopTimer();
                this.resetQuiz();
            }
        });
    }

    // Statistics
    updateStatistics(question, isCorrect) {
        const today = new Date().toDateString();

        if (!this.statistics.daily[today]) {
            this.statistics.daily[today] = { correct: 0, total: 0 };
        }

        this.statistics.daily[today].total++;
        if (isCorrect) {
            this.statistics.daily[today].correct++;
        }

        this.statistics.totalQuestions++;
        if (isCorrect) {
            this.statistics.correctAnswers++;
        }

        // Update streak
        if (isCorrect) {
            this.statistics.currentStreak++;
            this.statistics.longestStreak = Math.max(this.statistics.longestStreak, this.statistics.currentStreak);
        } else {
            this.statistics.currentStreak = 0;
        }

        this.saveStatistics();
        this.updateDashboard();
    }

    saveQuizToHistory(correct, total, timeSpent) {
        const historyItem = {
            date: new Date().toISOString(),
            correct,
            total,
            timeSpent,
            accuracy: Math.round((correct / total) * 100)
        };

        this.statistics.history.unshift(historyItem);
        this.statistics.history = this.statistics.history.slice(0, 100); // Keep last 100

        this.saveStatistics();
        this.updateHistoryDisplay();
    }

    updateDashboard() {
        const totalQuestions = this.questions.length;
        const practicedQuestions = this.statistics.totalQuestions;
        const accuracy = this.statistics.totalQuestions > 0 ?
            Math.round((this.statistics.correctAnswers / this.statistics.totalQuestions) * 100) : 0;

        document.getElementById('total-questions').textContent = totalQuestions;
        document.getElementById('practiced-questions').textContent = practicedQuestions;
        document.getElementById('accuracy-rate').textContent = `${accuracy}%`;
        document.getElementById('streak').textContent = this.statistics.currentStreak;

        // Update recent activity
        const recentActivity = this.statistics.history.slice(0, 5);
        const activityList = document.getElementById('recent-activity-list');

        if (recentActivity.length === 0) {
            activityList.innerHTML = 'Chưa có hoạt động nào';
        } else {
            activityList.innerHTML = recentActivity.map(item => {
                const date = new Date(item.date).toLocaleDateString('vi-VN');
                const timeStr = item.timeSpent ? ` - ${this.formatTime(item.timeSpent)}` : '';
                return `
                    <div class="history-item">
                        <div class="history-info">
                            <div class="history-date">${date}${timeStr}</div>
                            <div class="history-details">${item.correct}/${item.total} câu đúng (${item.accuracy}%)</div>
                        </div>
                        <div class="history-score">${item.accuracy}%</div>
                    </div>
                `;
            }).join('');
        }

        // Update subject statistics
        this.updateSubjectStats();
    }

    updateSubjectStats() {
        // Group questions by subject
        const subjectStats = {};
        this.subjects.forEach(subject => {
            const subjectQuestions = this.questions.filter(q => q.subject === subject);
            subjectStats[subject] = {
                total: subjectQuestions.length,
                practiced: 0,
                accuracy: 0
            };
        });

        // Calculate statistics for each subject
        this.statistics.history.forEach(session => {
            // This is a simplified calculation - in a real app you'd track per-subject stats
            const questionsInSession = Math.min(session.total, this.questions.length);
            if (questionsInSession > 0) {
                const accuracy = session.accuracy;
                // Distribute the session stats across subjects (simplified)
                this.subjects.forEach(subject => {
                    if (subjectStats[subject]) {
                        subjectStats[subject].practiced += Math.round(questionsInSession / this.subjects.length);
                        subjectStats[subject].accuracy = accuracy; // Simplified - same accuracy for all
                    }
                });
            }
        });

        // Update dashboard with subject info
        const dashboard = document.querySelector('.dashboard');
        let subjectInfo = '<div class="subject-stats"><h3>Thống kê theo bài học</h3>';

        if (this.subjects.length <= 1) {
            subjectInfo += '<p>Chưa có bài học nào. Hãy tạo bài học mới để tổ chức câu hỏi!</p>';
        } else {
            this.subjects.forEach(subject => {
                if (subject !== 'Chưa phân loại' || subjectStats[subject].total > 0) {
                    subjectInfo += `
                        <div class="subject-stat-item">
                            <strong>${subject}:</strong>
                            ${subjectStats[subject].total} câu hỏi
                            ${subjectStats[subject].practiced > 0 ? `, ${subjectStats[subject].practiced} đã ôn, ${subjectStats[subject].accuracy}% đúng` : ''}
                        </div>
                    `;
                }
            });
        }

        subjectInfo += '</div>';

        // Insert after stats grid
        const existingSubjectStats = document.querySelector('.subject-stats');
        if (existingSubjectStats) {
            existingSubjectStats.remove();
        }

        const statsGrid = document.querySelector('.stats-grid');
        statsGrid.insertAdjacentHTML('afterend', subjectInfo);
    }

    setupStatistics() {
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        if (this.statistics.history.length === 0) {
            historyList.innerHTML = '<div class="history-item">Chưa có lịch sử làm bài</div>';
        } else {
            historyList.innerHTML = this.statistics.history.map(item => {
                const date = new Date(item.date).toLocaleDateString('vi-VN');
                const time = new Date(item.date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
                const timeStr = item.timeSpent ? ` - ${this.formatTime(item.timeSpent)}` : '';
                return `
                    <div class="history-item">
                        <div class="history-info">
                            <div class="history-date">${date} ${time}${timeStr}</div>
                            <div class="history-details">${item.correct}/${item.total} câu đúng</div>
                        </div>
                        <div class="history-score">${item.accuracy}%</div>
                    </div>
                `;
            }).join('');
        }
    }

    // Utility Functions
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        // Insert at top of main content
        const main = document.querySelector('main .page.active');
        main.insertBefore(messageDiv, main.firstChild);

        // Remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }

    updateQuizHeader() {
        document.getElementById('current-question').textContent = this.currentQuestionIndex + 1;
        document.getElementById('total-quiz-questions').textContent = this.currentQuiz.length;
    }

    // Local Storage
    saveQuestions() {
        localStorage.setItem('quizQuestions', JSON.stringify(this.questions));
    }

    loadQuestions() {
        const saved = localStorage.getItem('quizQuestions');
        return saved ? JSON.parse(saved) : [];
    }

    saveSubjects() {
        localStorage.setItem('quizSubjects', JSON.stringify(this.subjects));
    }

    loadSubjects() {
        const saved = localStorage.getItem('quizSubjects');
        return saved ? JSON.parse(saved) : ['Chưa phân loại'];
    }

    saveStatistics() {
        localStorage.setItem('quizStatistics', JSON.stringify(this.statistics));
    }

    loadStatistics() {
        const saved = localStorage.getItem('quizStatistics');
        return saved ? JSON.parse(saved) : {
            totalQuestions: 0,
            correctAnswers: 0,
            currentStreak: 0,
            longestStreak: 0,
            daily: {},
            history: []
        };
    }

    // Backup & Restore
    setupBackup() {
        const exportBtn = document.getElementById('export-data');
        const importBtn = document.getElementById('import-data');
        const importFile = document.getElementById('import-file');

        exportBtn.addEventListener('click', () => {
            this.exportData();
        });

        importBtn.addEventListener('click', () => {
            importFile.click();
        });

        importFile.addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
            e.target.value = ''; // Reset file input
        });
    }

    exportData() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            questions: this.questions,
            subjects: this.subjects,
            statistics: this.statistics
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage('Đã xuất dữ liệu thành công! File đã được tải xuống.', 'success');
    }

    importData(file) {
        if (!file) {
            this.showMessage('Vui lòng chọn file để nhập!', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Validate data structure
                if (!data.questions || !data.subjects) {
                    throw new Error('File không đúng định dạng!');
                }

                // Confirm before importing
                const message = `Bạn có chắc muốn nhập dữ liệu?\n\n` +
                    `- Câu hỏi: ${data.questions.length} câu\n` +
                    `- Bài học: ${data.subjects.length} bài\n\n` +
                    `Dữ liệu hiện tại sẽ bị ghi đè!`;

                if (confirm(message)) {
                    this.questions = data.questions;
                    this.subjects = data.subjects;
                    if (data.statistics) {
                        this.statistics = data.statistics;
                    }

                    // Save to localStorage
                    this.saveQuestions();
                    this.saveSubjects();
                    this.saveStatistics();

                    // Update UI
                    this.updateSubjectDropdowns();
                    this.updateDashboard();
                    this.setupStatistics();

                    this.showMessage('Đã nhập dữ liệu thành công!', 'success');
                }
            } catch (error) {
                this.showMessage('Lỗi khi đọc file: ' + error.message, 'error');
            }
        };

        reader.readAsText(file);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});
