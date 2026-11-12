# VetCare

Sistema de gestão para clínica veterinária — **Trabalho II (Etapa 2): implementação**.
Disciplina Engenharia de Software I · Instituto de Computação · UFBA · Profa. Dra. Larissa Barbosa Leôncio Pinheiro.

Esta etapa implementa 8 dos 17 requisitos funcionais do Documento de Requisitos (47,1%), formando um fluxo completo: a administração cadastra funcionários e veterinários; a recepção cadastra tutores e animais, agenda ou cancela consultas e acompanha tudo pela agenda.

| Requisito | Funcionalidade | Tela |
| --- | --- | --- |
| REQ 01 | Manter usuário | `/usuarios` |
| REQ 02 | Autenticar usuário | `/login` e `/senha` |
| REQ 04 | Manter tutor | `/tutores`, `/tutores/novo`, `/tutores/:id` |
| REQ 05 | Manter animal | `/tutores/:id/animais/novo` (ficha do tutor) |
| REQ 06 | Manter veterinário | `/veterinarios` |
| REQ 07 | Agendar consulta | `/agenda/novo` |
| REQ 08 | Cancelar consulta | `/agenda` |
| REQ 09 | Consultar agenda | `/agenda` e `/inicio` |

Detalhes, critérios de aceite e rastreabilidade: [docs/requisitos-sprint.md](docs/requisitos-sprint.md).

## Como rodar

Pré-requisito: **Node.js 22.13 ou mais recente** (o banco usa o módulo nativo `node:sqlite`). Não é preciso instalar banco de dados nem configurar variáveis de ambiente.

```bash
git clone <URL do repositório>
cd vetcare
npm install
npm run dev
```

Abra <http://localhost:3000>. Na primeira execução o sistema cria o banco em `data/vetcare.db` e carrega os dados de demonstração (usuários, veterinários, tutores, animais e consultas a partir do dia atual).

### Contas iniciais

O acesso é sempre por e-mail e senha. O banco começa com três contas, uma de cada perfil; a senha inicial das três é `vetcare123`.

| Perfil | E-mail | O que pode fazer nesta etapa |
| --- | --- | --- |
| Administrador | `beatriz.santos@clinica.com.br` | Tudo, incluindo cadastrar e desativar usuários |
| Recepcionista | `marina.lopes@clinica.com.br` | Cadastros de tutores e animais, agendamento e agenda completa |
| Veterinário | `paulo.reis@clinica.com.br` | Consulta a própria agenda e lê os cadastros |

Os demais usuários são criados pelo administrador em **Usuários e perfis**. Cada usuário novo recebe uma senha provisória e define a própria senha no primeiro acesso. Em **Veterinários**, a administração cadastra os dados profissionais e o sistema cria a conta vinculada com perfil Veterinário e senha provisória.

### Roteiro de demonstração

1. Entre como **Administrador**. Em **Usuários e perfis**, clique em **+ Novo usuário**, escolha o perfil Recepcionista e cadastre. Anote a senha provisória exibida.
2. Saia e entre com o usuário novo: o sistema pede a definição da senha antes de abrir qualquer tela.
3. Em **Tutores e animais**, clique em **+ Novo tutor**, preencha e salve. O formulário de animal abre em seguida; cadastre um animal.
4. No cartão do animal, clique em **Agendar**. Escolha veterinário, data e um horário livre e confirme. Clicar em um horário riscado mostra o aviso de conflito.
5. Clique em **Ver na agenda** e alterne entre **Dia**, **Semana** e **Por profissional**.
6. Saia e entre como **Veterinário** para ver a agenda restrita e os cadastros somente para leitura.

### Outros comandos

| Comando | O que faz |
| --- | --- |
| `npm run build` e `npm start` | Gera e executa a versão de produção |
| `npm test` | Testes automatizados dos serviços (banco em memória) |
| `npm run lint` e `npm run typecheck` | ESLint e verificação de tipos |
| `npm run db:reset` | Apaga o banco local; ele é recriado com os dados de demonstração na próxima execução |

Configurações opcionais (segredo JWT, caminho do banco, fuso horário, banco sem dados de demonstração) estão em [.env.example](.env.example).

## Arquitetura

Monolito modular em camadas ([ADR-005](docs/adrs/ADR-005-monolito-modular.md)), implementado como uma única aplicação Next.js em TypeScript com banco relacional SQLite ([ADR-009](docs/adrs/ADR-009-tecnologias-de-implementacao.md)).

| Camada (Etapa 1) | Onde está | Conteúdo |
| --- | --- | --- |
| Apresentação (`ui`) | `src/app`, `src/ui`, `src/server/http` | Páginas, componentes React e rotas HTTP (`/api/*`), que só chamam serviços de Aplicação |
| Aplicação (`app`) | `src/server/app` | `auth` (`AuthService`, `UsuarioService`, `RBACManager`, `TokenSessionService`), `cadastros` (`TutorService`, `AnimalService`, `ProfissionalService`) e `agendamento` (`AgendamentoService`, `SlotConflictManager`, `AgendaQueryEngine`) |
| Domínio (`domain`) | `src/server/domain` | Entidades, erros de negócio e interfaces de repositório |
| Infraestrutura (`infra`) | `src/server/infra` | Repositórios SQLite, hash de senha (scrypt), tokens JWT e relógio |

As dependências seguem Apresentação → Aplicação → Domínio; a Infraestrutura implementa as interfaces do Domínio e é ligada aos serviços em um único ponto, `src/server/app/container.ts`.

Segurança ([ADR-006](docs/adrs/ADR-006-autenticacao-jwt-rbac.md) e [ADR-010](docs/adrs/ADR-010-detalhamento-da-autenticacao.md)): senha com hash scrypt, token JWT em cookie `httpOnly`, bloqueio temporário após 5 tentativas incorretas, senha provisória com troca obrigatória no primeiro acesso, trilha de auditoria das ações de gestão de acesso e permissões por perfil verificadas no servidor a cada operação, conforme a matriz do Quadro 4.

### API

Todas as rotas, exceto o login, exigem sessão válida.

| Método e rota | Requisito | Descrição |
| --- | --- | --- |
| `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/sessao` | REQ 02 | Entrar, sair e consultar a sessão |
| `POST /api/auth/senha` | REQ 02 | O próprio usuário define ou altera a senha |
| `GET /api/usuarios?busca=` · `POST /api/usuarios` | REQ 01 | Listar/buscar e cadastrar usuários (gera senha provisória) |
| `PUT /api/usuarios/:id` · `PUT /api/usuarios/:id/ativo` · `POST /api/usuarios/:id/senha` | REQ 01 | Alterar, excluir ou reativar o acesso e gerar nova senha provisória |
| `GET /api/tutores?busca=` · `POST /api/tutores` | REQ 04 | Listar/buscar e cadastrar tutores |
| `GET` · `PUT` · `DELETE /api/tutores/:id` | REQ 04 | Consultar, alterar e excluir tutor |
| `POST /api/tutores/:id/animais` | REQ 05 | Cadastrar animal vinculado ao tutor |
| `PUT` · `DELETE /api/animais/:id` | REQ 05 | Alterar e excluir animal |
| `GET /api/profissionais` | REQ 06 | Listar veterinários ativos para leitura e agendamento |
| `POST /api/profissionais` · `PUT` · `DELETE /api/profissionais/:id` | REQ 06 | Cadastrar, editar e remover veterinário da agenda |
| `GET /api/agenda/horarios?profissional=&data=` | REQ 07 | Horários livres e ocupados |
| `POST /api/consultas` | REQ 07 | Agendar consulta (409 em caso de conflito) |
| `DELETE /api/consultas?id=` | REQ 08 | Cancelar consulta futura sem remover o histórico |
| `GET /api/agenda?de=&ate=&profissional=` | REQ 09 | Consultas do período |
| `GET /api/inicio` | REQ 09 | Resumo do dia da recepção |

## Documentação

- [Requisitos da Sprint e rastreabilidade](docs/requisitos-sprint.md)
- [Registros de decisão de arquitetura (ADRs)](docs/adrs/README.md) — decisões da Etapa 1 (001–007) e registros da Etapa 2 (008–011), incluindo os desvios em relação à arquitetura original
- [Protótipo de interface](docs/prototipo/index.html) — abra o arquivo no navegador; as telas do sistema reproduzem o protótipo em desktop e em celular
