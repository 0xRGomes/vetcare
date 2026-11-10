# ADR-006 — Autenticação por token JWT e autorização baseada em papéis (RBAC)

- **Status:** Aceito
- **Data:** 05/10/2026
- **Origem:** *Arquitetura do Sistema VetCare*, Etapa 1, seção 9.1 e Quadro 4, páginas 22–23. Fonte consultada: `Arquitetura_do_Sistema_VetCare.docx.pdf`.

## Contexto

A [ADR-002](ADR-002-seguranca.md) definiu a segurança como característica prioritária, e os REQ 01, REQ 02 e REQ 03 exigem a gestão de usuários, a autenticação por credenciais e a recuperação de senha. O sistema será acessado por navegador em computadores e em dispositivos móveis, e cada perfil deve enxergar somente as funcionalidades e os dados de sua responsabilidade.

## Decisão

O login será feito com e-mail e senha. As senhas serão armazenadas apenas na forma de hash com algoritmo adaptativo, no pacote `infra.security`.

Após a autenticação, o sistema emitirá um token JWT de curta duração contendo a identificação e o perfil do usuário, enviado em todas as requisições por HTTPS. O `RBACManager`, no módulo `app.auth`, verificará a permissão do perfil antes de cada operação, conforme a matriz de permissões abaixo, reproduzida do Quadro 4.

A recuperação de senha usará um link de uso único com validade de 30 minutos. Tentativas de login malsucedidas repetidas bloquearão temporariamente o usuário, e os acessos e alterações em prontuários e pagamentos serão registrados na trilha de auditoria.

### Matriz de permissões por perfil (RBAC)

| Módulo | Administrador | Recepcionista | Veterinário |
| --- | --- | --- | --- |
| Usuários e perfis | Total | Sem acesso | Sem acesso |
| Tutores e animais | Total | Total | Leitura |
| Veterinários | Total | Leitura | Leitura |
| Agenda | Total | Total | Própria agenda |
| Atendimento e prontuário | Leitura | Sem acesso | Total |
| Pagamentos | Total | Registrar | Sem acesso |
| Dashboard e relatórios | Total | Sem acesso | Sem acesso |
| Notificações | Configurar | Enviar | Sem acesso |

Fonte: Quadro 4 do documento original, elaborado pelos autores (2026).

## Alternativas consideradas

A alternativa de sessões mantidas no servidor foi considerada viável, mas o token permite que a mesma interface de serviços atenda às versões web e móvel sem estado de sessão no servidor.

## Consequências

### Positivas

- Controle de acesso uniforme para as versões web e móvel.
- Permissões centralizadas e documentadas por perfil.
- Credenciais protegidas por hash e dados protegidos em trânsito por TLS.

### Negativas

- A revogação de um token antes do vencimento é mais difícil, o que exige validade curta e invalidação ao desativar um usuário.
- Toda nova funcionalidade precisa ter suas permissões declaradas na matriz de perfis.

## Notas de migração e pontos para revisão

- Este registro documenta uma decisão arquitetural da Etapa 1; sua aceitação não comprova implementação.
- A fonte não especifica o algoritmo adaptativo de hash, a duração exata do JWT, o limite de tentativas de login, a duração do bloqueio temporário nem o mecanismo de invalidação ao desativar um usuário. Esses detalhes não foram definidos nesta migração.
- As permissões **Total**, **Leitura**, **Registrar**, **Própria agenda**, **Configurar** e **Enviar** mantêm a terminologia do Quadro 4, sem ampliar ou reinterpretar seus alcances.

## Referências

- *Arquitetura do Sistema VetCare*. Salvador, 2026. Seção 9.1 e Quadro 4, páginas 22–23. Documento original consultado em PDF, mantido fora do repositório.
- [ADR-002 — Priorização da segurança do sistema](ADR-002-seguranca.md).
