// Script để sửa lại correctAnswer cho đúng với vị trí isCorrect: true
const fs = require('fs');

// Đọc file JSON
const data = JSON.parse(fs.readFileSync('data/ktct/quiz-backup-2025-10-27.json', 'utf8'));

let fixedCount = 0;
let issuesFound = 0;

// Duyệt qua từng câu hỏi
data.questions.forEach((question, qIndex) => {
    // Tìm index của đáp án đúng (isCorrect: true)
    const correctIndex = question.answers.findIndex(answer => answer.isCorrect === true);
    
    if (correctIndex === -1) {
        console.log(`⚠️  Câu ${qIndex + 1}: Không tìm thấy đáp án đúng (ID: ${question.id})`);
        issuesFound++;
    } else if (question.correctAnswer !== correctIndex) {
        console.log(`🔧 Câu ${qIndex + 1}: Sửa correctAnswer từ ${question.correctAnswer} → ${correctIndex}`);
        question.correctAnswer = correctIndex;
        fixedCount++;
    }
    
    // Đảm bảo chỉ có 1 đáp án đúng
    const correctCount = question.answers.filter(a => a.isCorrect === true).length;
    if (correctCount > 1) {
        console.log(`⚠️  Câu ${qIndex + 1}: Có ${correctCount} đáp án được đánh dấu đúng! Chỉ giữ lại đáp án đầu tiên.`);
        let foundFirst = false;
        question.answers.forEach(answer => {
            if (answer.isCorrect === true) {
                if (foundFirst) {
                    answer.isCorrect = false;
                } else {
                    foundFirst = true;
                }
            }
        });
        issuesFound++;
    }
});

// Lưu file đã sửa
const outputPath = 'data/ktct/quiz-backup-2025-10-27.json';
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');

console.log('\n✅ Hoàn tất!');
console.log(`📊 Tổng số câu hỏi: ${data.questions.length}`);
console.log(`🔧 Đã sửa: ${fixedCount} câu`);
console.log(`⚠️  Vấn đề tìm thấy: ${issuesFound} câu`);
console.log(`💾 File đã được lưu: ${outputPath}`);
