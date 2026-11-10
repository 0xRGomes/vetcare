# ADR-009 — Tecnologias de implementação e mapeamento das camadas

- **Status:** Proposta — implementada na Etapa 2, aguardando validação do grupo
- **Data:** 10/11/2026
- **Origem:** Implementação da Etapa 2 do VetCare.

## Contexto

A [ADR-005](ADR-005-monolito-modular.md) definiu o estilo arquitetural (monolito modular em quatro camadas, com uma base de dados relacional), mas as ADRs da Etapa 1 não fixam linguagem, framework nem sistema gerenciador de banco de dados. A Etapa 2 exige um sistema em funcionamento, executável a partir do repositório público com instruções simples.

O repositório já havia sido iniciado como um projeto Next.js com TypeScript. O sistema é usado por navegador em computadores e em dispositivos móveis ([ADR-006](ADR-006-autenticacao-jwt-rbac.md)).

## Decisão

1. **Uma única aplicação Next.js (App Router) em TypeScript** contém a interface e a interface de serviços (rotas HTTP em `/api`). É a unidade única de implantação prevista na ADR-005.
2. **SQLite como base relacional**, acessada pelo módulo nativo `node:sqlite` do Node.js (versão 22.13 ou superior), com SQL escrito à mão nos repositórios. O banco fica no arquivo `data/vetcare.db`.
3. **As quatro camadas são pastas do código-fonte**, com as dependências da seção 7 do documento de arquitetura:

| Camada | Pasta | Observação |
| --- | --- | --- |
| Apresentação (`ui`) | `src/app`, `src/ui`, `src/server/http` | `src/app` é a pasta de rotas exigida pelo Next.js e pertence à Apresentação, apesar do nome. As rotas `/api` são adaptadores finos: validam a sessão e chamam um serviço. |
| Aplicação (`app`) | `src/server/app/{auth,cadastros,agendamento}` | Um subpacote por módulo, com os serviços nomeados na ADR-005. |
| Domínio (`domain`) | `src/server/domain` | Entidades, erros e interfaces de repositório. Não importa nenhuma outra camada. |
| Infraestrutura (`infra`) | `src/server/infra/{db,security}` | Implementa as interfaces do Domínio. |

4. **Raiz de composição única**: `src/server/app/container.ts` é o único arquivo em que serviços de Aplicação recebem as implementações concretas da Infraestrutura. Os serviços dependem apenas das interfaces do Domínio.
5. **Regras de integridade também no banco**: índices únicos impedem duas consultas ativas no mesmo horário para o mesmo profissional ou animal, e dois tutores ativos com o mesmo CPF.

## Alternativas consideradas

1. **Front-end e API em projetos separados.** Descartada: duas implantações e dois processos para uma equipe pequena, contrariando a simplicidade operacional que motivou a ADR-005.
2. **PostgreSQL ou MySQL.** São as opções naturais para produção, mas exigem instalar e configurar um servidor para rodar o sistema. Como os repositórios isolam o SQL atrás das interfaces do Domínio, a troca futura fica restrita a `src/server/infra/db`.
3. **ORM (Prisma, Drizzle).** Descartado nesta etapa para não acrescentar geração de código e dependências a um esquema de seis tabelas.

## Consequências

### Positivas

- O sistema roda com `npm install` e `npm run dev`, sem serviços externos.
- Chamadas entre módulos no mesmo processo e transações locais, como previsto na ADR-005.
- A mesma interface de serviços (`/api`) pode atender a um aplicativo móvel no futuro.

### Negativas

- SQLite aceita um único processo de escrita: adequado a uma clínica, mas impede a redundância de instâncias citada nas táticas de disponibilidade da seção 8.1. A adoção dessas táticas exigirá migrar para um SGBD cliente-servidor.
- O módulo `node:sqlite` ainda é marcado como experimental no Node.js 22 e emite um aviso ao iniciar.
- As fronteiras entre camadas são mantidas por convenção e revisão de código; não há verificação automática de dependências.

## Notas e pontos para revisão

- Este registro foi redigido a partir das ADRs 001–007 presentes no repositório. Se o documento original da Etapa 1 indicar tecnologias diferentes em alguma seção não migrada, esta ADR deve ser tratada como registro do desvio e a justificativa acima, revisada pelo grupo.
