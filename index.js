// index.js
import 'dotenv/config';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, getContentType } from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// import { sendWelcomeMessage } from './functions/welcomeMessage.js';
import { checkViolation, notifyAdmins, notifyUser, logViolation } from './functions/antiSpam.js';
import { addStrike, applyPunishment } from './functions/strikeSystem.js';
import { incrementViolation, getGroupStatus } from './functions/groupStats.js';
import { sanitizeInput, checkRateLimit, validateUrl } from './functions/security.js';
import { logSecurityEvent, SECURITY_EVENTS } from './functions/securityLogger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { handleGroupMessages } from './functions/groupResponder.js';
import { scheduleGroupMessages } from './functions/scheduler.js';

async function startBot() {
    console.log("===============================================");
    console.log("🚀 Iniciando iMavyBot - Respostas Pré-Definidas");
    console.log("===============================================");



    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && connection !== 'open') {
            console.log("🚨 Escaneie este QR code no WhatsApp:");
            qrcode.generate(qr, { small: true });
        }

        console.log('📡 Status da conexão:', connection);

        if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp com sucesso!');
            botStartTime = Date.now();
            console.log('⏰ Ignorando mensagens anteriores a:', new Date(botStartTime).toLocaleString('pt-BR'));
            // Ativa o agendador (fechar e abrir grupo)
            scheduleGroupMessages(sock);
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log('Motivo do fechamento:', reason);

            if (reason === DisconnectReason.loggedOut) {
                console.log('⚠️ Sessão desconectada. Escaneie o QR novamente.');
            } else {
                console.log('🔄 Reconectando em 5 segundos...');
                setTimeout(() => startBot(), 5000);
            }
        }
    });

    let botStartTime = Date.now();

    // Evento de mensagens recebidas
    sock.ev.on('messages.upsert', async (msgUpsert) => {
        const messages = msgUpsert.messages;

        for (const message of messages) {
            try {
                if (!message.key.fromMe && message.message) {
                    const messageTime = message.messageTimestamp * 1000;

                    // Ignorar mensagens antigas (anteriores ao bot iniciar)
                    if (messageTime < botStartTime) {
                        // console.log('⏭️ Mensagem antiga ignorada'); // Log muito verboso, pode ser comentado
                        continue;
                    }

                    const senderId = message.key.participant || message.key.remoteJid;
                    const isGroup = message.key.remoteJid.endsWith('@g.us');
                    const groupId = isGroup ? message.key.remoteJid : null;

                    const contentType = getContentType(message.message);
                    const content = message.message[contentType];
                    let messageText = content?.text || content;

                    // Não processar mensagens sem texto ou conteúdo relevante
                    if (!messageText) continue;
                    
                    // Sanitizar entrada do usuário
                    const originalText = messageText;
                    messageText = sanitizeInput(messageText);
                    if (originalText !== messageText) {
                        logSecurityEvent(SECURITY_EVENTS.MALICIOUS_INPUT_DETECTED, { 
                            senderId, 
                            original: originalText, 
                            sanitized: messageText 
                        });
                    }
                    
                    // Rate limiting por usuário
                    if (!checkRateLimit(senderId, 20, 60000)) {
                        console.log('⚠️ Rate limit excedido para:', senderId);
                        continue;
                    }

                    console.log('\n╔════════════════════════════════════════════════════════════╗');
                    console.log('║           📨 NOVA MENSAGEM RECEBIDA                       ║');
                    console.log('╠════════════════════════════════════════════════════════════╣');
                    console.log('║ 📋 Tipo:', contentType.padEnd(45), '║');
                    console.log('║ 👤 De:', senderId.substring(0, 45).padEnd(47), '║');
                    if (groupId) console.log('║ 👥 Grupo:', groupId.substring(0, 42).padEnd(44), '║');
                    console.log('║ 💬 Texto:', (String(messageText)).substring(0, 43).padEnd(45), '║');
                    console.log('╚════════════════════════════════════════════════════════════╝\n');

                    // --- Refatoração: Centralizar listas de comandos ---
                    const adminCommands = ['/removertermo', '/removerlink', '/bloqueartermo', '/bloquearlink', '/listatermos'];
                    
                    const isTextCommand = typeof messageText === 'string';
                    const lowerCaseMessage = isTextCommand ? messageText.toLowerCase() : '';

                    const isAdminCommand = isTextCommand && adminCommands.some(cmd => lowerCaseMessage.includes(cmd));

                    if (isAdminCommand) {
                        console.log('⚙️ Comando administrativo detectado, pulando anti-spam');
                        await handleGroupMessages(sock, message);
                        continue;
                    }

                    // --- Refatoração: Lógica de Anti-Spam ---
                    if (isGroup && isTextCommand) {
                        const violation = checkViolation(messageText);
                        if (violation.violated) {
                            console.log('\n🚨 VIOLAÇÃO DETECTADA! Processando...');
                            // Deletar mensagem
                            try {
                                await sock.sendMessage(groupId, { delete: message.key });
                                console.log('✅ ➜ Mensagem deletada com sucesso');
                            } catch (e) {
                                console.error('❌ ➜ Erro ao deletar mensagem:', e.message);
                            }

                            const userNumber = senderId.split('@')[0];
                            const violationData = {
                                userName: userNumber,
                                userId: senderId,
                                userNumber: userNumber,
                                dateTime: new Date().toLocaleString('pt-BR'),
                                message: messageText
                            };

                            // Notificações e Punições
                            await notifyAdmins(sock, groupId, violationData);
                            await notifyUser(sock, senderId, groupId, messageText);
                            logViolation(violationData);
                            incrementViolation(violation.type);

                            const strikeCount = addStrike(senderId, { type: violation.type, message: messageText });
                            console.log(`📊 ➜ Usuário agora tem ${strikeCount} strike(s)`);
                            await applyPunishment(sock, groupId, senderId, strikeCount);

                            console.log('✅ ➜ Violação processada completamente\n');
                            continue; // Pular processamento normal
                        }
                    }

                    await handleGroupMessages(sock, message);
                }
            } catch (error) {
                console.error('❌ Erro catastrófico ao processar mensagem:', error);
                console.error('Mensagem problemática:', JSON.stringify(message, null, 2));
                // Opcional: notificar um admin sobre a falha crítica
            }
        }
    });

    // Evento para detectar novos membros no grupo (removido)
    /*
    sock.ev.on('group-participants.update', async (update) => {
        try {
            console.log('📋 Atualização de participantes:', JSON.stringify(update, null, 2));
            const { id: groupId, participants, action } = update;
            
            if (action === 'add') {
                console.log('\n🎉 ═══════════════════════════════════════════════════════');
                console.log('🎉 NOVO MEMBRO DETECTADO');
                console.log('🎉 Grupo:', groupId);
                console.log('🎉 ═══════════════════════════════════════════════════════\n');
                
                for (const participant of participants) {
                    console.log('👤 ➜ Enviando boas-vindas para:', participant);
                    await sendWelcomeMessage(sock, groupId, participant);
                    console.log('✅ ➜ Boas-vindas enviada\n');
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay de 1s
                }
            }
        } catch (error) {
            console.error('❌ Erro no evento de participantes:', error);
        }
    });
    */

    // Evento alternativo para capturar mudanças no grupo
    sock.ev.on('groups.update', async (updates) => {
        console.log('🔄 Atualização de grupos:', JSON.stringify(updates, null, 2));
    });
}

startBot();
