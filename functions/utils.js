export function getNumberFromJid(jid) {
    if (!jid || typeof jid !== 'string') return '';
    // Parte antes do @
    const prefix = jid.split('@')[0];
    // Remover tudo que não seja dígito
    const digits = prefix.replace(/\D/g, '');
    return digits;
}

export function formatNumberInternational(digits, defaultCountry = '') {
    if (!digits) return '';
    // Se já começar com código de país (ex.: 55...), manter
    if (defaultCountry && digits.length <= 11 && !digits.startsWith(defaultCountry)) {
        return `+${defaultCountry}${digits}`;
    }
    return `+${digits}`;
}
