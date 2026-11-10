# ADR-003 — Priorização do desempenho do sistema

- **Status:** Aceito
- **Data:** 28/09/2026
- **Origem:** *Arquitetura do Sistema VetCare*, Etapa 1, seção 3.3, página 8. Fonte consultada: `Arquitetura_do_Sistema_VetCare.docx.pdf`.

## Contexto

O VetCare apoia atividades realizadas durante o atendimento, incluindo a consulta da agenda, o registro de atendimentos e a manutenção de prontuários. Essas funcionalidades fazem parte do fluxo de trabalho dos profissionais e possuem prioridade Alta.

O documento de requisitos determina que as principais operações, como as consultas de agendas e prontuários, apresentem resposta em tempo adequado para não comprometer o atendimento. O tempo de resposta está, portanto, diretamente ligado à utilização do sistema no dia a dia da clínica.

## Decisão

O desempenho será considerado uma das quatro principais características de qualidade do VetCare. A arquitetura e a implementação deverão priorizar tempos de resposta adequados nas operações usadas durante o atendimento, especialmente a consulta de agendas e prontuários.

## Consequências

### Positivas

- Respostas mais rápidas nas operações usadas durante o atendimento.
- Menor impacto do sistema sobre o fluxo de trabalho dos profissionais.
- Melhor experiência na consulta da agenda e no acesso aos prontuários.

### Negativas

- Necessidade de considerar o desempenho desde as decisões de arquitetura.
- Aumento da complexidade de alguns componentes em razão de otimizações.
- Necessidade de monitorar o tempo de resposta das operações críticas.

## Notas de migração e pontos para revisão

- Este registro documenta uma decisão arquitetural da Etapa 1; sua aceitação não comprova implementação.
- A ADR original não quantifica o “tempo adequado” de resposta nem define metas numéricas de desempenho. Nenhum valor foi acrescentado.

## Referências

- *Arquitetura do Sistema VetCare*. Salvador, 2026. Seção 3.3, página 8. Documento original consultado em PDF, mantido fora do repositório.
- PINHEIRO, L. B. L. *Documento de requisitos: VetCare – sistema de gestão para clínica veterinária*. Versão 01.00. Salvador: Instituto de Computação, Universidade Federal da Bahia, 2026a. Referência do documento de arquitetura; não consultada separadamente nesta migração.
