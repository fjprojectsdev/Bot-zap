// secureFetch.js - Wrapper seguro para fetch
import fetch from 'node-fetch';
import { validateUrl, checkRateLimit } from './security.js';
import { logSecurityEvent, SECURITY_EVENTS } from './securityLogger.js';

// Timeout padrão para requisições
const DEFAULT_TIMEOUT = 10000;

// Wrapper seguro para fetch
export async function secureFetch(url, options = {}) {
    try {
        // Validar URL
        if (!validateUrl(url)) {
            throw new Error('URL não permitida');
        }
        
        // Rate limiting por domínio
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        if (!checkRateLimit(`fetch_${domain}`, 30, 60000)) {
            logSecurityEvent(SECURITY_EVENTS.RATE_LIMIT_EXCEEDED, { domain, url });
            throw new Error('Rate limit excedido para este domínio');
        }
        
        // Configurações de segurança padrão
        const secureOptions = {
            timeout: DEFAULT_TIMEOUT,
            ...options,
            headers: {
                'User-Agent': 'iMavyBot/1.0',
                ...options.headers
            }
        };
        
        // Remover headers perigosos
        delete secureOptions.headers['X-Forwarded-For'];
        delete secureOptions.headers['X-Real-IP'];
        
        // Validação adicional antes do fetch
        if (!validateUrl(url)) {
            throw new Error('URL bloqueada por política de segurança');
        }
        
        const response = await fetch(url, secureOptions);
        
        // Log de sucesso
        logSecurityEvent(SECURITY_EVENTS.API_ERROR, { 
            url, 
            status: response.status, 
            success: true 
        });
        
        return response;
        
    } catch (error) {
        // Log de erro
        logSecurityEvent(SECURITY_EVENTS.API_ERROR, { 
            url, 
            error: error.message, 
            success: false 
        });
        throw error;
    }
}

// Wrapper para requisições JSON
export async function secureFetchJSON(url, options = {}) {
    const response = await secureFetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
}

// Wrapper para requisições POST
export async function securePost(url, data, options = {}) {
    return await secureFetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
}