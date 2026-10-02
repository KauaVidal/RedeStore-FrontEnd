const MENSAGENS_COMUNS: Record<string, string> = {
  SEM_CONEXAO: 'Não conseguimos falar com o servidor. Confere sua conexão e tenta de novo.',
  VALIDACAO: 'Algum campo não passou na validação do servidor. Confere os dados.',
};

/** Traduz o código de um `Error` da API na mensagem da tela; a específica vence a comum. */
export function mensagemDeErro(erro: unknown, especificas: Record<string, string>, padrao: string): string {
  const codigo = erro instanceof Error ? erro.message : '';
  return especificas[codigo] ?? MENSAGENS_COMUNS[codigo] ?? padrao;
}
