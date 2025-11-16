// security.js - Middleware de segurança
import crypto from 'crypto';
import { logSecurityEvent, SECURITY_EVENTS } from './securityLogger.js';

// Lista de domínios permitidos
const ALLOWED_DOMAINS = [
    'api.huggingface.co',
    'router.huggingface.co',
    'api-inference.huggingface.co',
    'api.openai.com',
    'api.groq.com',
    'openrouter.ai',
    'wttr.in',
    'api.exchangerate-api.com'
];

// Validar URL para prevenir SSRF
export function validateUrl(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        
        // Verificar se o domínio está na lista permitida
        const isAllowed = ALLOWED_DOMAINS.some(domain => 
            hostname === domain || hostname.endsWith('.' + domain)
        );
        
        if (!isAllowed) {
            logSecurityEvent(SECURITY_EVENTS.INVALID_URL_BLOCKED, { url, hostname });
            throw new Error(`Domínio não permitido: ${hostname}`);
        }
        
        // Prevenir IPs locais e privados
        if (hostname.match(/^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/)) {
            logSecurityEvent(SECURITY_EVENTS.INVALID_URL_BLOCKED, { url, reason: 'IP privado' });
            throw new Error('Acesso a IPs privados não permitido');
        }
        
        return true;
    } catch (error) {
        console.error('❌ URL inválida:', error.message);
        return false;
    }
}

// Sanitizar entrada de usuário
export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/[<>]/g, '') // Remove < e >
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
}

// Validar path para prevenir path traversal
export function validatePath(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Verificar se contém sequências perigosas
    if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
        logSecurityEvent(SECURITY_EVENTS.PATH_TRAVERSAL_BLOCKED, { filePath });
        throw new Error('Path traversal detectado');
    }
    
    // Verificar se está tentando acessar arquivos do sistema
    const dangerousPaths = ['/etc/', '/proc/', '/sys/', 'C:\\Windows\\', 'C:\\System32\\'];
    if (dangerousPaths.some(path => normalizedPath.includes(path))) {
        logSecurityEvent(SECURITY_EVENTS.PATH_TRAVERSAL_BLOCKED, { filePath, reason: 'Arquivo do sistema' });
        throw new Error('Acesso a arquivos do sistema não permitido');
    }
    
    return true;
}

// Gerar token CSRF
export function generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Validar token CSRF
export function validateCSRFToken(token, expectedToken) {
    if (!token || !expectedToken) return false;
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

// Rate limiting simples
const rateLimitMap = new Map();

export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimitMap.has(identifier)) {
        rateLimitMap.set(identifier, []);
    }
    
    const requests = rateLimitMap.get(identifier);
    
    // Remove requisições antigas
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
        logSecurityEvent(SECURITY_EVENTS.RATE_LIMIT_EXCEEDED, { identifier, maxRequests, windowMs });
        return false; // Rate limit excedido
    }
    
    validRequests.push(now);
    rateLimitMap.set(identifier, validRequests);
    
    return true;
}

// Limpar dados antigos do rate limit
setInterval(() => {
    const now = Date.now();
    const oneHourAgo = now - 3600000; // 1 hora
    
    for (const [key, requests] of rateLimitMap.entries()) {
        const validRequests = requests.filter(time => time > oneHourAgo);
        if (validRequests.length === 0) {
            rateLimitMap.delete(key);
        } else {
            rateLimitMap.set(key, validRequests);
        }
    }
}, 300000); // Limpar a cada 5 minutos