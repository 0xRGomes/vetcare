# ADR-010 — Detalhamento e desvios da autenticação definida na ADR-006

- **Status:** Proposta — implementada na Etapa 2, aguardando validação do grupo
- **Data:** 10/11/2026
- **Origem:** Implementação do REQ 02 (Autenticar usuário) na Etapa 2.

## Contexto

A [ADR-006](ADR-006-autenticacao-jwt-rbac.md) definiu login com e-mail e senha, hash adaptativo, token JWT de curta duração, RBAC conforme o Quadro 4, bloqueio temporário após tentativas malsucedidas, recuperação de senha e trilha de auditoria. Suas notas registram que a fonte não especifica o algoritmo de hash, a duração do token, o limite de tentativas, a duração do bloqueio nem o mecanismo de invalidação. A implementação precisou fixar esses valores e, em dois pontos, afastou-se do texto original.

## Decisão

### Parâmetros que a ADR-006 deixou em aberto

| Item | Valor adotado | Onde |
| --- | --- | --- |
| Hash adaptativo de senha | scrypt (N = 16384, r = 8, p = 1), sal aleatório por senha | `infra/security/senha.ts` |
| Assinatura do token | JWT HS256, segredo em `JWT_SECRET` ou gerado em `data/jwt-secret` | `infra/security/jwt.ts` |
| Limite de tentativas | 5 senhas incorretas seguidas | `app/auth/AuthService.ts` |
| Duração do bloqueio | 15 minutos | `app/auth/AuthService.ts` |
| Invalidação ao desativar usuário | A cada requisição o `TokenSessionService` confirma no banco que o usuário continua ativo e relê seu perfil | `app/auth/TokenSessionService.ts` |

A mensagem de erro é a mesma para e-mail inexistente e senha incorreta, para não revelar quais e-mails estão cadastrados.

### Desvios em relação à ADR-006

1. **Transporte do token.** A ADR-006 prevê o token "enviado em todas as requisições". Na versão web ele é entregue em um cookie `httpOnly`, `SameSite=Lax` (e `Secure` sob HTTPS), que o navegador envia sozinho; a página não lê nem armazena o token, o que reduz o risco de roubo por XSS. Como o cookie é enviado automaticamente, as rotas de escrita recusam requisições cuja origem seja outro site (proteção contra CSRF). O cabeçalho `Authorization: Bearer` continua aceito, para o cliente móvel previsto na ADR-006.
2. **Validade do token.** A ADR-006 pede "curta duração". Foi adotada a validade de **8 horas** (um expediente), sem renovação, para que a recepção não seja desconectada no meio do atendimento. O risco da validade mais longa é compensado pela checagem do usuário a cada requisição, descrita acima.

### Itens da ADR-006 não implementados nesta etapa

- **Recuperação de senha por link de 30 minutos**: pertence ao REQ 03, fora do escopo ([ADR-008](ADR-008-selecao-escopo-etapa-2.md)). A tela de login não exibe o atalho "Esqueci minha senha".
- **Trilha de auditoria de prontuários e pagamentos**: os módulos auditados não existem nesta etapa.
- **HTTPS/TLS**: depende do ambiente de implantação. Em execução local o sistema usa HTTP em `localhost`.
- **Matriz de permissões**: foram implementadas as linhas do Quadro 4 que correspondem aos módulos existentes (Tutores e animais, Veterinários e Agenda), em `app/auth/RBACManager.ts`.

## Consequências

### Positivas

- Os pontos em aberto da ADR-006 passam a ter valores explícitos e testados (`tests/servicos.test.ts`).
- O token da sessão web fica em cookie inacessível a scripts da página.
- Um usuário desativado ou com perfil alterado perde o acesso anterior imediatamente, mesmo com token ainda válido.

### Negativas

- Cada requisição autenticada faz uma leitura adicional no banco.
- Sem renovação de token, a sessão termina após 8 horas mesmo em uso.
- O bloqueio por tentativas permite que alguém bloqueie temporariamente a conta de outra pessoa conhecendo apenas o e-mail.
