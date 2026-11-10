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

## Notas e pontos para revisão

- O planejamento denomina o REQ 06 **Manter profissional**. O Quadro 5 do documento de arquitetura (seção 10.3, página 33) utiliza **Manter veterinário**, enquanto a seção 4.3 utiliza **Gestão de Profissionais** e descreve médicos veterinários. As denominações foram explicitadas sem alterar o requisito histórico.
- A seleção e os critérios de aceite permanecem pendentes de confirmação do grupo. Não foram registradas aprovações, reuniões ou avaliações formais de alternativas além das informações fornecidas pelo responsável pelo projeto.

## Referências

- Discussão de planejamento da Etapa 2, em 08/11/2026, conforme informações fornecidas pelo responsável pelo projeto para este registro.
- *Arquitetura do Sistema VetCare*. Salvador, 2026. Introdução, página 3; componentes candidatos, seção 4, páginas 10–12; componentes críticos, seções 5 e 5.1, páginas 13–14; rastreabilidade dos requisitos, seção 10.3, páginas 33–34. Fonte consultada: `Arquitetura_do_Sistema_VetCare.docx.pdf`, mantida fora do repositório.
