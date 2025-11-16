// groupResponder.js

import { getGroupStatus } from './groupStats.js';
import { addBlockedWord, addBlockedLink, removeBlockedWord, removeBlockedLink, getCustomBlacklist } from './customBlacklist.js';
import { askChatGPT } from './chatgpt.js';
import { getGroupRules } from './groupRules.js';

const TARGET_GROUP = '120363420952651026@g.us';
const BOT_TRIGGER = 'bot';

// Respostas pré-definidas
const RESPONSES = {
    'oi': '👋 Olá! Como posso ajudar?',
    'ajuda': '📋 Comandos disponíveis:\n- oi\n- ajuda\n- status\n- info\n- /fechar\n- /abrir\n- /fixar\n- /regras\n- /status\n- /comandos\n- /gpt',
    'status': '✅ Bot online e funcionando!',
    'info': '🤖 iMavyBot v1.0 - Bot simples para WhatsApp'
};

export async function handleGroupMessages(sock, message) {
    const groupId = message.key.remoteJid;
    const isGroup = groupId.endsWith('@g.us');
    const senderId = message.key.participant || message.key.remoteJid;

    const contentType = Object.keys(message.message)[0];
    let text = '';
    
    // Permitir /comandos no PV
    switch(contentType) {
        case 'conversation':
            text = message.message.conversation;
            break;
        case 'extendedTextMessage':
            text = message.message.extendedTextMessage.text;
            break;
    }
    
    // Verificar se é resposta a uma mensagem do bot
    const quotedMessage = message.message?.extendedTextMessage?.contextInfo;
    if (isGroup && quotedMessage && quotedMessage.participant && text) {
        // Verificar se a mensagem citada é do bot
        const quotedFromBot = quotedMessage.fromMe || quotedMessage.participant.includes('bot');
        
        if (quotedFromBot || message.message?.extendedTextMessage?.contextInfo?.stanzaId) {
            console.log('🔄 Resposta detectada para mensagem do bot');
            const resposta = await askChatGPT(text, senderId);
            await sock.sendMessage(groupId, { 
                text: resposta,
                quoted: message
            });
            return;
        }
    }
    
    if (!isGroup && text.toLowerCase().includes('/comandos')) {
        const comandosMsg = `🤖 *LISTA COMPLETA DE COMANDOS - iMavyBot* 🤖\r\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n\r\n👮 *COMANDOS ADMINISTRATIVOS:*\r\n\r\n• 🔒 */fechar* - Fecha o grupo\r\n• 🔓 */abrir* - Abre o grupo\r\n• 📌 */fixar [mensagem]* - Fixa mensagem importante\r\n• 🚫 */banir @membro [motivo]* - Remove e bane membro\r\n• 🚫 */bloqueartermo [palavra]* - Bloqueia palavra\r\n• 🔗 */bloquearlink [dominio]* - Bloqueia link/domínio\r\n• ✏️ */removertermo [palavra]* - Remove palavra bloqueada\r\n• 🔓 */removerlink [dominio]* - Remove link bloqueado\r\n• 📝 */listatermos* - Lista termos e links bloqueados\r\n\r\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n\r\n📊 *COMANDOS DE INFORMAÇÃO:*\r\n\r\n• 📊 */status* - Status e estatísticas do grupo\r\n• 📋 */regras* - Exibe regras do grupo\r\n• 📱 */comandos* - Lista todos os comandos\r\n\r\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n\r\n🤖 *COMANDOS DO BOT:*\r\n\r\n• 👋 *bot oi* - Saudação\r\n• ❓ *bot ajuda* - Ajuda rápida\r\n• ✅ *bot status* - Status do bot\r\n• ℹ️ *bot info* - Informações do bot\r\n• 🤖 */gpt [pergunta]* - Pergunte ao ChatGPT\r\n\r\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n🔒 *Sistema de Segurança Ativo*\r\n• Anti-spam automático\r\n• Sistema de strikes (3 = expulsão)\r\n• Bloqueio de links e palavras proibidas\r\n• Notificação automática aos admins\r\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n🤖 *iMavyBot v2.0* - Protegendo seu grupo 24/7`;
        
        await sock.sendMessage(senderId, { text: comandosMsg });
        return;
    }

    // Verificar comando /regras em qualquer grupo
    if (isGroup && text.toLowerCase().includes('/regras')) {
        console.log(`🔍 Buscando descrição do grupo: ${groupId}`);
        const groupMetadata = await sock.groupMetadata(groupId);
        const groupDescription = groupMetadata.desc || 'Nenhuma descrição disponível para este grupo.';
        
        const msgRegras = await sock.sendMessage(groupId, { text: groupDescription });
        console.log(msgRegras ? '✅ Descrição do grupo enviada' : '❌ Falha ao enviar descrição');
        return;
    }

    // Restringir outros comandos ao TARGET_GROUP
    if (!isGroup || groupId !== TARGET_GROUP) return;

    text = '';

    switch(contentType) {
        case 'conversation':
            text = message.message.conversation;
            break;
        case 'extendedTextMessage':
            text = message.message.extendedTextMessage.text;
            break;
        default:
            return;
    }

    console.log(`💬 Mensagem de ${senderId}: "${text}"`);

    // Comandos /fechar, /abrir, /fixar, /status, /banir, /bloqueartermo, /bloquearlink, /removertermo, /removerlink, /listatermos, /comandos, /gpt
    if (text.toLowerCase().includes('/fechar') || text.toLowerCase().includes('/abrir') || text.toLowerCase().includes('/fixar') || text.toLowerCase().includes('/status') || text.toLowerCase().includes('/banir') || text.toLowerCase().includes('/bloqueartermo') || text.toLowerCase().includes('/bloquearlink') || text.toLowerCase().includes('/removertermo') || text.toLowerCase().includes('/removerlink') || text.toLowerCase().includes('/listatermos') || text.toLowerCase().includes('/comandos') || text.toLowerCase().includes('/gpt')) {
        try {
            if (text.toLowerCase().includes('/fechar')) {
                await sock.groupSettingUpdate(groupId, 'announcement');
                const closeMessage = `🕛 Mensagem de Fechamento (00:00)\r\n\r\n🌙 Encerramento do Grupo 🌙\r\n🔒 O grupo está sendo fechado agora (00:00)!\r\nAgradecemos a participação de todos 💬\r\nDescansem bem 😴💤\r\nVoltamos com tudo às 07:00 da manhã! ☀️💪`;
                const msgFechar = await sock.sendMessage(groupId, { text: closeMessage });
                console.log(msgFechar ? '✅ Grupo fechado e mensagem enviada' : '❌ Falha ao enviar mensagem de fechamento');
            } else if (text.toLowerCase().includes('/abrir')) {
                await sock.groupSettingUpdate(groupId, 'not_announcement');
                const openMessage = `🌅 Mensagem de Abertura (07:00)\r\n\r\n☀️ Bom dia, pessoal! ☀️\r\n🔓 O grupo foi reaberto (07:00)!\r\nDesejamos a todos um ótimo início de dia 💫\r\nVamos com foco, energia positiva e boas conversas 💬✨`;
                const msgAbrir = await sock.sendMessage(groupId, { text: openMessage });
                console.log(msgAbrir ? '✅ Grupo aberto e mensagem enviada' : '❌ Falha ao enviar mensagem de abertura');
            } else if (text.toLowerCase().includes('/fixar')) {
                // Extrair menções da mensagem original
                const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                
                // Remover apenas o comando /fixar
                let messageToPin = text.replace(/\/fixar/i, '').trim();
                
                if (messageToPin) {
                    const dataHora = new Date().toLocaleString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                    
                    const pinnedMsg = `📌 *MENSAGEM IMPORTANTE* 📌\r\n━━━━━━━━━━━━━━━━━━━━━━━━━\r\n${messageToPin}\r\n━━━━━━━━━━━━━━━━━━━━━━━━━\r\n🤖 Fixado por iMavyBot | 📅 ${dataHora}`;
                    
                    const sentMsg = await sock.sendMessage(groupId, { 
                        text: pinnedMsg,
                        mentions: mentionedJids
                    });
                    console.log(sentMsg ? '✅ Mensagem fixada enviada' : '❌ Falha ao enviar mensagem fixada');
                } else {
                    const msgErroFixar = await sock.sendMessage(groupId, { text: '❌ *Uso incorreto!*\n\n📝 Use: `/fixar sua mensagem aqui`\n\nExemplo: `/fixar Reunião amanhã às 15h`' }, { quoted: message });
                    console.log(msgErroFixar ? '✅ Mensagem de erro fixar enviada' : '❌ Falha ao enviar erro fixar');
                }

            } else if (text.toLowerCase().includes('/status')) {
                console.log('📊 ➜ Comando /status executado');
                const statusMessage = await getGroupStatus(sock, groupId);
                console.log('📊 ➜ Mensagem de status gerada');
                const msgStatus = await sock.sendMessage(groupId, { text: statusMessage });
                console.log(msgStatus ? '✅ Status enviado com sucesso' : '❌ Falha ao enviar status');
            }
        } catch (err) {
            console.error('❌ Erro ao executar comando:', err);
        }
        return;
    }

    if (!text || !text.toLowerCase().includes(BOT_TRIGGER)) return;

    // Busca resposta pré-definida
    const command = text.toLowerCase().replace(BOT_TRIGGER, '').trim();
    const reply = RESPONSES[command] || '❓ Comando não reconhecido. Digite "bot ajuda" para ver os comandos.';

    const msgResposta = await sock.sendMessage(groupId, { text: reply }, { quoted: message });
    console.log(msgResposta ? `✅ Resposta enviada: ${reply}` : `❌ Falha ao enviar: ${reply}`);
}