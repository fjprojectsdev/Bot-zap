// games.js - Jogos simples
export function rollDice(sides = 6) {
    const result = Math.floor(Math.random() * sides) + 1;
    return `🎲 *DADO ROLADO!*\n\n🎯 Resultado: **${result}**\n📊 Dado de ${sides} lados`;
}

export function flipCoin() {
    const result = Math.random() < 0.5 ? 'CARA' : 'COROA';
    const emoji = result === 'CARA' ? '🪙' : '🔄';
    return `${emoji} *MOEDA LANÇADA!*\n\n🎯 Resultado: **${result}**`;
}

export function magic8Ball(question) {
    const responses = [
        'Sim, definitivamente!',
        'É certo que sim.',
        'Sem dúvida.',
        'Sim, com certeza.',
        'Pode contar com isso.',
        'Como eu vejo, sim.',
        'Muito provável.',
        'Perspectiva boa.',
        'Sim.',
        'Sinais apontam que sim.',
        'Resposta nebulosa, tente novamente.',
        'Pergunte novamente mais tarde.',
        'Melhor não te dizer agora.',
        'Não posso prever agora.',
        'Concentre-se e pergunte novamente.',
        'Não conte com isso.',
        'Minha resposta é não.',
        'Minhas fontes dizem que não.',
        'Perspectiva não muito boa.',
        'Muito duvidoso.'
    ];
    
    const answer = responses[Math.floor(Math.random() * responses.length)];
    return `🔮 *BOLA 8 MÁGICA* 🔮\n\n❓ Pergunta: ${question}\n\n🎱 Resposta: **${answer}**`;
}

export function slotMachine() {
    const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
    const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
    const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
    const reel3 = symbols[Math.floor(Math.random() * symbols.length)];
    
    let result = `🎰 *CAÇA-NÍQUEIS* 🎰\n\n`;
    result += `┌─────────────┐\n`;
    result += `│  ${reel1}  ${reel2}  ${reel3}  │\n`;
    result += `└─────────────┘\n\n`;
    
    if (reel1 === reel2 && reel2 === reel3) {
        if (reel1 === '💎') {
            result += `💰 **JACKPOT DIAMANTE!** 💰\n🏆 Prêmio máximo!`;
        } else if (reel1 === '7️⃣') {
            result += `🎉 **TRIPLE SEVEN!** 🎉\n🏆 Grande prêmio!`;
        } else {
            result += `✨ **TRÊS IGUAIS!** ✨\n🏆 Você ganhou!`;
        }
    } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
        result += `🎯 **DOIS IGUAIS!** 🎯\n🏆 Prêmio pequeno!`;
    } else {
        result += `😅 **TENTE NOVAMENTE!** 😅\n🎲 Sem prêmio desta vez.`;
    }
    
    return result;
}

export function generateQuiz() {
    const questions = [
        {
            question: "Qual é a capital do Brasil?",
            options: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
            correct: 2
        },
        {
            question: "Quantos continentes existem?",
            options: ["5", "6", "7", "8"],
            correct: 2
        },
        {
            question: "Qual é o maior planeta do sistema solar?",
            options: ["Terra", "Marte", "Júpiter", "Saturno"],
            correct: 2
        },
        {
            question: "Em que ano o Brasil foi descoberto?",
            options: ["1498", "1500", "1502", "1504"],
            correct: 1
        },
        {
            question: "Qual é o menor país do mundo?",
            options: ["Mônaco", "Vaticano", "San Marino", "Liechtenstein"],
            correct: 1
        }
    ];
    
    const quiz = questions[Math.floor(Math.random() * questions.length)];
    
    let result = `🧠 *QUIZ TIME!* 🧠\n\n`;
    result += `❓ ${quiz.question}\n\n`;
    quiz.options.forEach((option, i) => {
        result += `${i + 1}. ${option}\n`;
    });
    result += `\nResponda com o número da opção!`;
    
    return { question: result, correct: quiz.correct, answer: quiz.options[quiz.correct] };
}