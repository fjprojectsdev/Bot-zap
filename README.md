# iMavyBot - WhatsApp Bot

Bot avançado para WhatsApp com sistema de segurança robusto e múltiplas funcionalidades.

## 🚀 Funcionalidades

### 🛡️ Sistema de Segurança
- Anti-spam automático
- Sistema de strikes (3 = expulsão)
- Bloqueio de links e palavras proibidas
- Rate limiting por usuário
- Logs de segurança completos
- Validação de URLs e paths

### 👮 Comandos Administrativos
- `/fechar` - Fecha o grupo
- `/abrir` - Abre o grupo
- `/fixar [mensagem]` - Fixa mensagem importante
- `/banir @membro [motivo]` - Remove e bane membro
- `/bloqueartermo [palavra]` - Bloqueia palavra
- `/bloquearlink [dominio]` - Bloqueia link/domínio
- `/removertermo [palavra]` - Remove palavra bloqueada
- `/removerlink [dominio]` - Remove link bloqueado
- `/listatermos` - Lista termos e links bloqueados

### 📊 Comandos de Informação
- `/status` - Status e estatísticas do grupo
- `/regras` - Exibe regras do grupo
- `/comandos` - Lista todos os comandos

### 🤖 Comandos do Bot
- `bot oi` - Saudação
- `bot ajuda` - Ajuda rápida
- `bot status` - Status do bot
- `bot info` - Informações do bot
- `/gpt [pergunta]` - Pergunte ao ChatGPT

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/fjprojectsdev/Bot-zap.git
cd Bot-zap
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo `.env`:
```env
HUGGING_FACE_API=sua_api_key_aqui
GROQ_API_KEY=sua_groq_api_key_aqui
OPENROUTER_API_KEY=sua_openrouter_api_key_aqui
```

4. Execute o bot:
```bash
npm start
```

## 📱 Como Usar

1. Execute o bot e escaneie o QR Code no WhatsApp
2. Adicione o bot ao seu grupo
3. Use `/comandos` para ver todos os comandos disponíveis
4. Configure as regras com `/regras`

## 🛡️ Segurança

- Todas as requisições são validadas
- Sistema de logs de segurança
- Rate limiting implementado
- Sanitização de entrada de usuário
- Validação de paths e URLs

## 📝 Licença

MIT License

## 👨‍💻 Desenvolvedor

Desenvolvido por iMavy Team