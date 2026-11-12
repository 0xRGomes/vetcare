# Requisitos da Sprint — Etapa 2

O VetCare tem 17 requisitos funcionais. Esta Sprint implementa **8 deles (47,1%)**, escolhidos para formar um fluxo completo, do cadastro de quem acessa o sistema até a consulta na agenda. A justificativa da seleção está na [ADR-008](adrs/ADR-008-selecao-escopo-etapa-2.md).

## Requisitos implementados

### REQ 01 — Manter usuário

O administrador inclui, altera, desativa e consulta quem acessa o sistema e com qual perfil.

- Nome, e-mail e perfil são obrigatórios; o e-mail não pode se repetir. Nesta tela, o administrador cadastra perfis Administrador e Recepcionista. A conta Veterinário e sua agenda são criadas juntas na tela Veterinários (ADR-012).
- O usuário novo recebe uma senha provisória, exibida uma única vez ao administrador, e é obrigado a definir a própria senha no primeiro acesso.
- "Excluir acesso" desativa o usuário e encerra a sessão dele na hora; o que ele registrou permanece. O acesso pode ser reativado.
- O administrador pode gerar nova senha provisória, o que também desfaz o bloqueio por tentativas.
- Ninguém altera o próprio perfil nem exclui o próprio acesso, e o sistema mantém ao menos um administrador ativo.
- A tela mostra a situação (Ativo, Bloqueado, Inativo), o último acesso, a matriz de permissões por perfil e a trilha de auditoria das ações de gestão de acesso.
- Somente o perfil Administrador abre a tela e as rotas.

### REQ 02 — Autenticar usuário

O usuário entra com e-mail e senha e passa a ver apenas o que seu perfil permite.

- O acesso é sempre por e-mail e senha. Credenciais corretas abrem o sistema na tela do perfil; credenciais incorretas mostram uma mensagem única, sem revelar se o e-mail existe.
- Quem entra com senha provisória só consegue definir a nova senha; qualquer usuário pode alterar a própria senha depois.
- Após 5 senhas incorretas seguidas, o acesso fica bloqueado por 15 minutos.
- Telas e rotas internas exigem sessão válida; sem sessão, o usuário é levado ao login. "Sair" encerra a sessão.
- As permissões seguem a matriz por perfil (Administrador, Recepcionista, Veterinário) e são verificadas no servidor.

### REQ 04 — Manter tutor

A recepção cadastra, consulta, altera e exclui tutores.

- Nome, CPF (11 dígitos) e telefone são obrigatórios; o CPF não pode se repetir entre tutores ativos.
- A lista pode ser filtrada por nome, CPF, telefone ou nome de animal.
- Lista, ficha e formulários têm endereço próprio (`/tutores`, `/tutores/:id`, `/tutores/novo`, `/tutores/:id/editar`).
- O CPF é exibido mascarado e não pode ser alterado depois do cadastro.
- A exclusão pede confirmação, remove o tutor e seus animais dos cadastros e cancela as consultas futuras.
- O perfil Veterinário apenas consulta.

### REQ 05 — Manter animal

A recepção cadastra, altera e exclui animais na ficha do tutor.

- Todo animal é vinculado a um tutor existente.
- Nome, espécie, sexo e data de nascimento são obrigatórios; a data não pode estar no futuro.
- Depois de cadastrar um tutor, o formulário de animal abre na própria ficha.
- A exclusão pede confirmação e cancela as consultas futuras do animal.

### REQ 06 — Manter veterinário

A administração cadastra, consulta, altera e remove veterinários da agenda.

- Nome, CRMV, especialidade, dias e horários de atendimento são obrigatórios; o CRMV não pode se repetir.
- Ao cadastrar um veterinário, o sistema cria uma conta vinculada com perfil Veterinário, e-mail e senha provisória que deve ser informada ao profissional.
- A alteração do cadastro atualiza também o nome da conta vinculada.
- A remoção desativa o cadastro e o acesso, preservando o histórico; consultas futuras devem ser canceladas ou remanejadas antes.
- Recepção e veterinários podem consultar a equipe, mas somente a administração pode manter cadastros.

### REQ 07 — Agendar consulta

A recepção agenda uma consulta escolhendo tutor, animal, veterinário, data e horário.

- Os horários seguem a jornada e os dias de atendimento do veterinário, em intervalos de 30 minutos; os ocupados aparecem riscados.
- Não é possível agendar em horário ocupado, passado ou fora da jornada. O conflito é verificado de novo no servidor e garantido por índice único no banco.
- O mesmo animal não pode ter duas consultas no mesmo horário.
- A consulta confirmada aparece imediatamente na agenda. O agendamento pode partir da ficha do tutor ou de um horário livre da agenda, com os dados já preenchidos.

### REQ 08 — Cancelar consulta

A recepção ou administração pode cancelar consultas futuras Agendadas ou Confirmadas diretamente pela agenda.

- O cancelamento exige confirmação, preserva a consulta no histórico com situação Cancelada e libera o horário.
- Consultas passadas, em andamento, concluídas ou já canceladas não podem ser canceladas novamente.
- O perfil Veterinário apenas consulta a própria agenda; tutores não precisam de contas no sistema.

### REQ 09 — Consultar agenda

Recepção e administração consultam a agenda da clínica; o veterinário consulta a própria.

- Três visões: por dia (grade de horários por veterinário), por semana e por profissional.
- Navegação por dia ou semana, atalho "Hoje" e escolha direta de data. A data e a visão ficam no endereço (`/agenda?data=...&visao=...`).
- Selecionar uma consulta mostra horário, tutor, animal, veterinário, motivo e situação.
- A tela atualiza sozinha a cada 30 segundos. O Início resume as consultas do dia e as próximas chegadas.

## Rastreabilidade

| Requisito | Tela | Rotas da API | Serviços (camada de Aplicação) | Testes |
| --- | --- | --- | --- | --- |
| REQ 01 | `/usuarios` | `/api/usuarios`, `/api/usuarios/:id`, `/api/usuarios/:id/ativo`, `/api/usuarios/:id/senha` | `auth`: `UsuarioService`, `RBACManager` | "REQ 01 — Manter usuário" |
| REQ 02 | `/login`, `/senha` | `/api/auth/login`, `/api/auth/logout`, `/api/auth/sessao`, `/api/auth/senha` | `auth`: `AuthService`, `TokenSessionService`, `RBACManager` | "REQ 02 — Autenticar usuário" |
| REQ 04 | `/tutores` | `/api/tutores`, `/api/tutores/:id` | `cadastros`: `TutorService` | "REQ 04 — Manter tutor" |
| REQ 05 | `/tutores` | `/api/tutores/:id/animais`, `/api/animais/:id` | `cadastros`: `AnimalService` | "REQ 05 — Manter animal" |
| REQ 06 | `/veterinarios` | `/api/profissionais` | `cadastros`: `ProfissionalService` | "REQ 06 — Manter veterinário" |
| REQ 07 | `/agenda/novo` | `/api/consultas`, `/api/agenda/horarios`, `/api/profissionais` | `agendamento`: `AgendamentoService`, `SlotConflictManager` | "REQ 07 — Agendar consulta" |
| REQ 08 | `/agenda` | `DELETE /api/consultas?id=` | `agendamento`: `AgendamentoService` | "REQ 08 — Cancelar consulta" |
| REQ 09 | `/agenda`, `/inicio` | `/api/agenda`, `/api/inicio` | `agendamento`: `AgendaQueryEngine` | "REQ 09 — Consultar agenda" |

Os testes estão em `tests/servicos.test.ts` e rodam com `npm test`.

## Situação dos 17 requisitos

| Requisito | Funcionalidade | Etapa 2 |
| --- | --- | --- |
| **REQ 01** | **Manter usuário** | **Implementado** |
| **REQ 02** | **Autenticar usuário** | **Implementado** |
| REQ 03 | Recuperar senha | Não implementado |
| **REQ 04** | **Manter tutor** | **Implementado** |
| **REQ 05** | **Manter animal** | **Implementado** |
| **REQ 06** | **Manter veterinário** | **Implementado** |
| **REQ 07** | **Agendar consulta** | **Implementado** |
| **REQ 08** | **Cancelar consulta** | **Implementado** |
| **REQ 09** | **Consultar agenda** | **Implementado** |
| REQ 10 | Registrar atendimento | Não implementado |
| REQ 11 | Manter prontuário | Não implementado |
| REQ 12 | Registrar vacinação | Não implementado |
| REQ 13 | Emitir prescrição | Não implementado |
| REQ 14 | Registrar pagamento | Não implementado |
| REQ 15 | Dashboard financeiro | Não implementado |
| REQ 16 | Notificar tutor | Não implementado |
| REQ 17 | Relatórios gerenciais | Não implementado |

Os nomes dos requisitos seguem o protótipo de interface (`docs/prototipo/index.html`). As diferenças entre as telas do protótipo e as do sistema estão na [ADR-011](adrs/ADR-011-itens-adiados-e-ajustes-de-interface.md).
