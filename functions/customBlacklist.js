import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validatePath } from './security.js';
import { logSecurityEvent, SECURITY_EVENTS } from './securityLogger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLACKLIST_FILE = path.join(__dirname, '..', 'blacklist.json');

// Carregar blacklist do arquivo
function loadBlacklist() {
    try {
        try {
            validatePath(BLACKLIST_FILE);
        } catch (pathError) {
            console.error('⚠️ Path inválido para blacklist:', pathError.message);
            logSecurityEvent(SECURITY_EVENTS.PATH_TRAVERSAL_BLOCKED, { file: BLACKLIST_FILE, operation: 'load' });
            return { words: [], links: [] };
        }
        if (fs.existsSync(BLACKLIST_FILE)) {
            const data = fs.readFileSync(BLACKLIST_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar blacklist:', error);
    }
    return { words: [], links: [] };
}

// Salvar blacklist no arquivo
function saveBlacklist(blacklist) {
    try {
        try {
            validatePath(BLACKLIST_FILE);
        } catch (pathError) {
            console.error('⚠️ Path inválido para salvar blacklist:', pathError.message);
            logSecurityEvent(SECURITY_EVENTS.PATH_TRAVERSAL_BLOCKED, { file: BLACKLIST_FILE, operation: 'save' });
            return;
        }
        fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(blacklist, null, 2), 'utf8');
        console.log('✅ Blacklist salva com sucesso');
    } catch (error) {
        console.error('❌ Erro ao salvar blacklist:', error);
    }
}

let customBlacklist = loadBlacklist();

export function addBlockedWord(word) {
    word = word.toLowerCase().trim();
    
    // Impedir bloqueio de comandos (começam com /)
    if (word.startsWith('/')) {
        return { success: false, message: `❌ Não é possível bloquear comandos (começam com /)` };
    }
    
    if (!customBlacklist.words.includes(word)) {
        customBlacklist.words.push(word);
        saveBlacklist(customBlacklist);
        return { success: true, message: `Palavra "${word}" adicionada à lista de bloqueio` };
    }
    return { success: false, message: `Palavra "${word}" já está bloqueada` };
}

export function addBlockedLink(link) {
    link = link.toLowerCase().trim();
    
    // Impedir bloqueio de comandos (começam com /)
    if (link.startsWith('/')) {
        return { success: false, message: `❌ Não é possível bloquear comandos (começam com /)` };
    }
    
    if (!customBlacklist.links.includes(link)) {
        customBlacklist.links.push(link);
        saveBlacklist(customBlacklist);
        return { success: true, message: `Link/domínio "${link}" adicionado à lista de bloqueio` };
    }
    return { success: false, message: `Link/domínio "${link}" já está bloqueado` };
}

export function removeBlockedWord(word) {
    word = word.toLowerCase().trim();
    const index = customBlacklist.words.indexOf(word);
    if (index > -1) {
        customBlacklist.words.splice(index, 1);
        saveBlacklist(customBlacklist);
        return { success: true, message: `Palavra "${word}" removida da lista de bloqueio` };
    }
    return { success: false, message: `Palavra "${word}" não está na lista` };
}

export function removeBlockedLink(link) {
    link = link.toLowerCase().trim();
    const index = customBlacklist.links.indexOf(link);
    if (index > -1) {
        customBlacklist.links.splice(index, 1);
        saveBlacklist(customBlacklist);
        return { success: true, message: `Link/domínio "${link}" removido da lista de bloqueio` };
    }
    return { success: false, message: `Link/domínio "${link}" não está na lista` };
}

export function getCustomBlacklist() {
    return customBlacklist;
}

export function checkCustomViolation(text) {
    const lowerText = text.toLowerCase();
    
    // Verificar palavras personalizadas
    for (const word of customBlacklist.words) {
        if (lowerText.includes(word)) {
            return { violated: true, type: `palavra bloqueada personalizada: "${word}"` };
        }
    }
    
    // Verificar links personalizados
    for (const link of customBlacklist.links) {
        if (lowerText.includes(link)) {
            return { violated: true, type: `link bloqueado personalizado: "${link}"` };
        }
    }
    
    return { violated: false };
}
