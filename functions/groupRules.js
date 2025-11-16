// groupRules.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_FILE = path.join(__dirname, '..', 'group_rules.json');

export function getGroupRules(groupId) {
    try {
        if (!fs.existsSync(RULES_FILE)) {
            return getDefaultRules();
        }
        
        const rulesData = JSON.parse(fs.readFileSync(RULES_FILE, 'utf8'));
        return rulesData[groupId] || rulesData['default'] || getDefaultRules();
    } catch (error) {
        console.error('❌ Erro ao carregar regras do grupo:', error);
        return getDefaultRules();
    }
}

function getDefaultRules() {
    return {
        name: "Grupo Padrão",
        rules: "📋 *REGRAS DO GRUPO* 📋\n\n1️⃣ Seja respeitoso com todos os membros\n2️⃣ Não faça spam\n3️⃣ Mantenha o foco do grupo\n4️⃣ Siga as orientações dos administradores\n\n🤖 Gerenciado por iMavyBot"
    };
}