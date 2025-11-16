import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validatePath } from './security.js';
import { logSecurityEvent, SECURITY_EVENTS } from './securityLogger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_FILE = path.join(__dirname, '..', 'bot_memory.json');
const MEMORY_DAYS = 7;

// Carregar memória do arquivo
function loadMemory() {
    try {
        try {
            validatePath(MEMORY_FILE);
        } catch (pathError) {
            console.error('⚠️ Path inválido para memory:', pathError.message);
            logSecurityEvent(SECURITY_EVENTS.PATH_TRAVERSAL_BLOCKED, { file: MEMORY_FILE, operation: 'load' });
            return {};
        }
        if (fs.existsSync(MEMORY_FILE)) {
            const data = fs.readFileSync(MEMORY_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar memória:', error);
    }
    return {};
}

// Salvar memória no arquivo
function saveMemory(memory) {
    try {
        try {
            validatePath(MEMORY_FILE);
        } catch (pathError) {
            console.error('⚠️ Path inválido para salvar memory:', pathError.message);
            logSecurityEvent(SECURITY_EVENTS.PATH_TRAVERSAL_BLOCKED, { file: MEMORY_FILE, operation: 'save' });
            return;
        }
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ Erro ao salvar memória:', error);
    }
}

let conversationMemory = loadMemory();

// Adicionar mensagem à memória
export function addToMemory(userId, role, content) {
    if (!conversationMemory[userId]) {
        conversationMemory[userId] = [];
    }
    
    conversationMemory[userId].push({
        role: role,
        content: content,
        timestamp: Date.now()
    });
    
    // Limpar mensagens antigas (mais de 7 dias)
    cleanOldMemories(userId);
    
    saveMemory(conversationMemory);
}

// Obter histórico de conversas
export function getMemory(userId) {
    if (!conversationMemory[userId]) {
        return [];
    }
    
    // Limpar memórias antigas antes de retornar
    cleanOldMemories(userId);
    
    // Retornar apenas role e content (sem timestamp)
    return conversationMemory[userId].map(msg => ({
        role: msg.role,
        content: msg.content
    }));
}

// Limpar memórias antigas (mais de 7 dias)
function cleanOldMemories(userId) {
    if (!conversationMemory[userId]) return;
    
    const sevenDaysAgo = Date.now() - (MEMORY_DAYS * 24 * 60 * 60 * 1000);
    
    conversationMemory[userId] = conversationMemory[userId].filter(msg => 
        msg.timestamp > sevenDaysAgo
    );
    
    // Remover usuário se não tiver mais mensagens
    if (conversationMemory[userId].length === 0) {
        delete conversationMemory[userId];
    }
}

// Limpar toda memória de um usuário
export function clearUserMemory(userId) {
    delete conversationMemory[userId];
    saveMemory(conversationMemory);
}

// Limpar memórias antigas de todos os usuários
export function cleanAllOldMemories() {
    const sevenDaysAgo = Date.now() - (MEMORY_DAYS * 24 * 60 * 60 * 1000);
    
    for (const userId in conversationMemory) {
        conversationMemory[userId] = conversationMemory[userId].filter(msg => 
            msg.timestamp > sevenDaysAgo
        );
        
        if (conversationMemory[userId].length === 0) {
            delete conversationMemory[userId];
        }
    }
    
    saveMemory(conversationMemory);
    console.log('🧹 Memórias antigas limpas');
}

// Limpar memórias antigas a cada 24 horas
setInterval(() => {
    cleanAllOldMemories();
}, 24 * 60 * 60 * 1000);
