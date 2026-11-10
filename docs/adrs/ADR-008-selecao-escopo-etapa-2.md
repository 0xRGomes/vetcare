# ADR-008 — Seleção do escopo funcional da Etapa 2

- **Status:** Proposta — aguardando validação do grupo
- **Data:** 08/11/2026
- **Origem:** Discussão de planejamento da Etapa 2 do VetCare.

## Contexto

A Etapa 2 exige implementar aproximadamente 30% dos requisitos funcionais do VetCare. Considerando os 17 requisitos funcionais, foi proposta a implementação de cinco requisitos, equivalentes a aproximadamente **29,4%** do total (5 ÷ 17 × 100).

O objetivo é entregar um fluxo operacional integrado, evitando a implementação de funcionalidades isoladas e priorizando dependências importantes entre componentes.

O documento de arquitetura da Etapa 1 sustenta o total de 17 requisitos, sua associação aos componentes e a identificação de quatro componentes críticos. A exigência de aproximadamente 30% para a Etapa 2, o recorte abaixo e seu estado de validação são informações de planejamento fornecidas pelo responsável pelo projeto, complementares ao documento histórico.

## Decisão proposta

O recorte inicial contempla:

| Requisito | Funcionalidade |
| --- | --- |
| REQ 02 | Autenticar usuário |
| REQ 04 | Manter tutor |
| REQ 05 | Manter animal |
| REQ 07 | Agendar consulta |
| REQ 09 | Consultar agenda |

O fluxo esperado é:

1. Autenticação do usuário.
2. Cadastro do tutor.
3. Cadastro de um animal vinculado ao tutor.
4. Agendamento de consulta com um profissional.
5. Visualização da consulta na agenda.

Os cinco requisitos constituem uma proposta de implementação; este registro não os apresenta como implementados.

## Justificativa

- Permite demonstrar um fluxo funcional de recepção.
- Integra autenticação, cadastros e agendamento.
- Contempla funcionalidades associadas a três dos quatro componentes críticos da Etapa 1: Autenticação e Gestão de Acesso, Gestão de Cadastros (Tutores e Animais) e Agendamento e Consultas.
- Estabelece uma base para futuras funcionalidades clínicas e financeiras.
- Evita antecipar o componente financeiro antes da consolidação das operações básicas.

O quarto componente crítico identificado na Etapa 1, Gestão Financeira e Pagamentos, fica fora deste recorte.

## Dependências e restrições

### REQ 01 — Manter usuário

A autenticação necessita de usuários existentes. Inicialmente, poderão ser utilizados usuários previamente registrados no banco de dados, sem contabilizar a implementação completa do REQ 01.

### REQ 06 — Manter profissional

O agendamento necessita de profissionais existentes. Inicialmente, poderão ser utilizados profissionais previamente registrados no banco de dados, sem contabilizar a implementação completa do REQ 06.

Essas soluções são provisórias e constituem restrições do escopo proposto. A existência de dados de exemplo não significa que os requisitos de manutenção de usuários e profissionais estejam implementados ou concluídos.

A implementação deverá continuar respeitando as decisões arquiteturais aceitas na Etapa 1, incluindo o [monolito modular em camadas](ADR-005-monolito-modular.md) e os [mecanismos de autenticação JWT e autorização RBAC](ADR-006-autenticacao-jwt-rbac.md).

## Consequências esperadas

### Positivas

- Fluxo operacional demonstrável.
- Integração entre componentes críticos.
- Base reutilizável para funcionalidades posteriores.
- Escopo delimitado em aproximadamente 30% dos requisitos.

### Negativas e limitações

- O módulo financeiro não será implementado nesse incremento.
- A manutenção completa de usuários e profissionais ficará fora do escopo.
- Algumas funcionalidades dependerão de dados previamente preparados.
- O grupo ainda precisará confirmar a seleção e os critérios de aceite.

## Estado da decisão

O recorte foi discutido e proposto em **08/11/2026**. A proposta já foi compartilhada com o grupo, mas ainda não existe confirmação formal dos demais integrantes. Portanto, o status permanece **Proposta — aguardando validação do grupo**, até que exista confirmação.

A data registrada representa o momento em que a proposta foi formulada, não a data de criação do arquivo.

Esta ADR é um **registro complementar de decisão de escopo de implementação**. Ela não altera automaticamente a arquitetura da Etapa 1 nem substitui suas decisões aceitas.

## Revisão de 10/11/2026 — inclusão do REQ 01

Com os cinco requisitos implementados, o sistema dependia de contas criadas direto no banco de dados, o que o deixava com aparência de protótipo: não havia como dar ou retirar o acesso de alguém pela interface. O recorte foi ampliado para incluir o **REQ 01 — Manter usuário**.

| Requisito | Funcionalidade |
| --- | --- |
| REQ 01 | Manter usuário |
| REQ 02 | Autenticar usuário |
| REQ 04 | Manter tutor |
| REQ 05 | Manter animal |
| REQ 07 | Agendar consulta |
| REQ 09 | Consultar agenda |

O escopo passa a **6 de 17 requisitos (35,3%)**, ainda dentro de "aproximadamente 30%". A seção "REQ 01 — Manter usuário" acima deixa de valer como restrição: os usuários são mantidos pela tela "Usuários e perfis", e a carga inicial traz apenas as contas necessárias para o primeiro acesso. A restrição do REQ 06 continua: os veterinários são pré-cadastrados.

## Situação da implementação

Em **10/11/2026** os seis requisitos foram implementados no repositório. A lista de requisitos da Sprint, os critérios de aceite e a rastreabilidade para telas, rotas, serviços e testes estão em [requisitos-sprint.md](../requisitos-sprint.md).

As tecnologias adotadas e os desvios em relação à arquitetura da Etapa 1 estão registrados nas ADRs [009](ADR-009-tecnologias-de-implementacao.md), [010](ADR-010-detalhamento-da-autenticacao.md) e [011](ADR-011-itens-adiados-e-ajustes-de-interface.md).

A implementação e esta revisão não alteram o estado da decisão: a confirmação formal do grupo continua pendente.

## Notas e pontos para revisão

- O planejamento denomina o REQ 06 **Manter profissional**. O Quadro 5 do documento de arquitetura (seção 10.3, página 33) utiliza **Manter veterinário**, enquanto a seção 4.3 utiliza **Gestão de Profissionais** e descreve médicos veterinários. As denominações foram explicitadas sem alterar o requisito histórico.
- A seleção e os critérios de aceite permanecem pendentes de confirmação do grupo. Não foram registradas aprovações, reuniões ou avaliações formais de alternativas além das informações fornecidas pelo responsável pelo projeto.

## Referências

- Discussão de planejamento da Etapa 2, em 08/11/2026, conforme informações fornecidas pelo responsável pelo projeto para este registro.
- *Arquitetura do Sistema VetCare*. Salvador, 2026. Introdução, página 3; componentes candidatos, seção 4, páginas 10–12; componentes críticos, seções 5 e 5.1, páginas 13–14; rastreabilidade dos requisitos, seção 10.3, páginas 33–34. Fonte consultada: `Arquitetura_do_Sistema_VetCare.docx.pdf`, mantida fora do repositório.
