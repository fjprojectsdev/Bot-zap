// securityLogger.js - Sistema de logs de segurança
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validatePath } from './security.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SECURITY_LOG_FILE = path.join(__dirname, '..', 'security.log');

// Tipos de eventos de segurança
export const SECURITY_EVENTS = {
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INVALID_URL_BLOCKED: 'INVALID_URL_BLOCKED',
    PATH_TRAVERSAL_BLOCKED: 'PATH_TRAVERSAL_BLOCKED',
    MALICIOUS_INPUT_DETECTED: 'MALICIOUS_INPUT_DETECTED',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    API_ERROR: 'API_ERROR'
};

// Log de evento de segurança
export function logSecurityEvent(eventType, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        eventType,
        details,
        severity: getSeverity(eventType)
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
        try {
            validatePath(SECURITY_LOG_FILE);
        } catch (pathError) {
            console.error('⚠️ Path inválido para log:', pathError.message);
            return;
        }
        fs.appendFileSync(SECURITY_LOG_FILE, logLine, 'utf8');
        console.log(`🔒 [SECURITY] ${eventType}: ${JSON.stringify(details)}`);
    } catch (error) {
        console.error('❌ Erro ao escrever log de segurança:', error);
    }
}

// Determinar severidade do evento
function getSeverity(eventType) {
    switch (eventType) {
        case SECURITY_EVENTS.PATH_TRAVERSAL_BLOCKED:
        case SECURITY_EVENTS.MALICIOUS_INPUT_DETECTED:
        case SECURITY_EVENTS.UNAUTHORIZED_ACCESS:
            return 'HIGH';
        case SECURITY_EVENTS.INVALID_URL_BLOCKED:
        case SECURITY_EVENTS.RATE_LIMIT_EXCEEDED:
            return 'MEDIUM';
        case SECURITY_EVENTS.API_ERROR:
            return 'LOW';
        default:
            return 'MEDIUM';
    }
}

// Ler logs de segurança
export function getSecurityLogs(limit = 100) {
    try {
        try {
            validatePath(SECURITY_LOG_FILE);
        } catch (pathError) {
            console.error('⚠️ Path inválido para logs:', pathError.message);
            return [];
        }
        if (!fs.existsSync(SECURITY_LOG_FILE)) {
            return [];
        }
        
        const content = fs.readFileSync(SECURITY_LOG_FILE, 'utf8');
        const lines = content.trim().split('\n').filter(line => line);
        
        return lines
            .slice(-limit)
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            })
            .filter(entry => entry !== null);
    } catch (error) {
        console.error('❌ Erro ao ler logs de segurança:', error);
        return [];
    }
}

// Limpar logs antigos (mais de 30 dias)
export function cleanOldSecurityLogs() {
    try {
        try {
            validatePath(SECURITY_LOG_FILE);
        } catch (pathError) {
            console.error('⚠️ Path inválido para limpeza:', pathError.message);
            return;
        }
        if (!fs.existsSync(SECURITY_LOG_FILE)) {
            return;
        }
        
        const content = fs.readFileSync(SECURITY_LOG_FILE, 'utf8');
        const lines = content.trim().split('\n').filter(line => line);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const validLines = lines.filter(line => {
            try {
                const entry = JSON.parse(line);
                return new Date(entry.timestamp) > thirtyDaysAgo;
            } catch {
                return false;
            }
        });
        
        fs.writeFileSync(SECURITY_LOG_FILE, validLines.join('\n') + '\n', 'utf8');
        console.log('🧹 Logs de segurança antigos removidos');
    } catch (error) {
        console.error('❌ Erro ao limpar logs antigos:', error);
    }
}

// Limpar logs antigos a cada 24 horas
setInterval(cleanOldSecurityLogs, 24 * 60 * 60 * 1000);