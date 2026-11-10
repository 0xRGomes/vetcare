# VetCare

Sistema de gestão para clínica veterinária — **Trabalho II (Etapa 2): implementação**.
Disciplina Engenharia de Software I · Instituto de Computação · UFBA · Profa. Dra. Larissa Barbosa Leôncio Pinheiro.

Esta etapa implementa 5 dos 17 requisitos funcionais do Documento de Requisitos (29,4%), formando um fluxo completo de recepção: entrar no sistema, cadastrar o tutor, cadastrar o animal, agendar a consulta e vê-la na agenda.

| Requisito | Funcionalidade | Tela |
| --- | --- | --- |
| REQ 02 | Autenticar usuário | `/login` |
| REQ 04 | Manter tutor | `/tutores` |
| REQ 05 | Manter animal | `/tutores` (ficha do tutor) |
| REQ 07 | Agendar consulta | `/agenda/novo` |
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

### Usuários de demonstração

A tela de login tem os atalhos **Demonstração · entrar como**, que usam as contas abaixo. A senha de todas é `vetcare123`.

| Perfil | E-mail | O que pode fazer nesta etapa |
| --- | --- | --- |
| Recepcionista | `marina.lopes@clinica.com.br` | Tudo: cadastros, agendamento e agenda completa |
| Veterinário | `paulo.reis@clinica.com.br` | Consulta a própria agenda e lê os cadastros |
| Administrador | `beatriz.santos@clinica.com.br` | Tudo, como a recepção |

Usuários e veterinários são pré-cadastrados porque REQ 01 (Manter usuário) e REQ 06 (Manter veterinário) ficaram fora desta etapa — ver [ADR-008](docs/adrs/ADR-008-selecao-escopo-etapa-2.md).

### Roteiro de demonstração

1. Entre como **Recepcionista**.
2. Em **Tutores e animais**, clique em **+ Novo tutor**, preencha e salve. O formulário de animal abre em seguida; cadastre um animal.
3. No cartão do animal, clique em **Agendar**. Escolha veterinário, data e um horário livre e confirme. Clicar em um horário riscado mostra o aviso de conflito.
4. Clique em **Ver na agenda** e alterne entre **Dia**, **Semana** e **Por profissional**.
5. Saia e entre como **Veterinário** para ver a agenda restrita e os cadastros somente para leitura.

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
| Aplicação (`app`) | `src/server/app` | `auth` (`AuthService`, `RBACManager`, `TokenSessionService`), `cadastros` (`TutorService`, `AnimalService`, `ProfissionalService`) e `agendamento` (`AgendamentoService`, `SlotConflictManager`, `AgendaQueryEngine`) |
| Domínio (`domain`) | `src/server/domain` | Entidades, erros de negócio e interfaces de repositório |
| Infraestrutura (`infra`) | `src/server/infra` | Repositórios SQLite, hash de senha (scrypt), tokens JWT e relógio |

As dependências seguem Apresentação → Aplicação → Domínio; a Infraestrutura implementa as interfaces do Domínio e é ligada aos serviços em um único ponto, `src/server/app/container.ts`.

Segurança ([ADR-006](docs/adrs/ADR-006-autenticacao-jwt-rbac.md) e [ADR-010](docs/adrs/ADR-010-detalhamento-da-autenticacao.md)): senha com hash scrypt, token JWT em cookie `httpOnly`, bloqueio temporário após 5 tentativas incorretas e permissões por perfil verificadas no servidor a cada operação, conforme a matriz do Quadro 4.

### API

Todas as rotas, exceto o login, exigem sessão válida.

| Método e rota | Requisito | Descrição |
| --- | --- | --- |
| `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/sessao` | REQ 02 | Entrar, sair e consultar a sessão |
| `GET /api/tutores?busca=` · `POST /api/tutores` | REQ 04 | Listar/buscar e cadastrar tutores |
| `GET` · `PUT` · `DELETE /api/tutores/:id` | REQ 04 | Consultar, alterar e excluir tutor |
| `POST /api/tutores/:id/animais` | REQ 05 | Cadastrar animal vinculado ao tutor |
| `PUT` · `DELETE /api/animais/:id` | REQ 05 | Alterar e excluir animal |
| `GET /api/profissionais` | — | Veterinários disponíveis para agendamento |
| `GET /api/agenda/horarios?profissional=&data=` | REQ 07 | Horários livres e ocupados |
| `POST /api/consultas` | REQ 07 | Agendar consulta (409 em caso de conflito) |
| `GET /api/agenda?de=&ate=&profissional=` | REQ 09 | Consultas do período |
| `GET /api/inicio` | REQ 09 | Resumo do dia da recepção |

## Documentação

- [Requisitos da Sprint e rastreabilidade](docs/requisitos-sprint.md)
- [Registros de decisão de arquitetura (ADRs)](docs/adrs/README.md) — decisões da Etapa 1 (001–007) e registros da Etapa 2 (008–011), incluindo os desvios em relação à arquitetura original
- [Protótipo de interface](docs/prototipo/index.html) — abra o arquivo no navegador; as telas do sistema reproduzem o protótipo em desktop e em celular
