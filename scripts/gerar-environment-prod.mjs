// Gera src/environments/environment.prod.ts a partir da variável de ambiente API_URL.
// Roda automaticamente antes de `npm run build` (script "prebuild"), inclusive na Vercel.
import { writeFileSync } from 'node:fs';

const LOCAIS = ['localhost', '127.0.0.1'];
const bruta = (process.env.API_URL ?? '').trim().replace(/\/+$/, '');

function falhar(mensagem) {
  console.error(`\n[gerar-environment-prod] ${mensagem}`);
  console.error('Exemplo: API_URL=https://redestore-api.vercel.app npm run build\n');
  process.exit(1);
}

if (!bruta) falhar('API_URL não definida. Informe a URL pública da API (na Vercel: Settings → Environment Variables).');

let url;
try {
  url = new URL(bruta);
} catch {
  falhar(`API_URL inválida: "${bruta}".`);
}

if (url.protocol !== 'https:' && !LOCAIS.includes(url.hostname)) {
  falhar(`API_URL precisa usar https (recebido "${bruta}"); o token JWT trafega nas requisições.`);
}

const conteudo = `// Arquivo gerado por scripts/gerar-environment-prod.mjs a partir de API_URL. Não edite nem commite.
export const environment = {
  apiUrl: ${JSON.stringify(bruta)},
};
`;

writeFileSync(new URL('../src/environments/environment.prod.ts', import.meta.url), conteudo);
console.log(`[gerar-environment-prod] apiUrl = ${bruta}`);
