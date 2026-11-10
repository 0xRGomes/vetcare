# ADR-001 — Priorização da disponibilidade do sistema

- **Status:** Aceito
- **Data:** 28/09/2026
- **Origem:** *Arquitetura do Sistema VetCare*, Etapa 1, seção 3.1, páginas 6–7. Fonte consultada: `Arquitetura_do_Sistema_VetCare.docx.pdf`.

## Contexto

O VetCare é um sistema de gestão para clínicas veterinárias que apoia atividades essenciais da operação da clínica, como o gerenciamento de tutores e animais, o agendamento e cancelamento de consultas, a consulta da agenda, o registro de atendimentos, a manutenção de prontuários e o registro de pagamentos. Grande parte dessas funcionalidades possui prioridade Alta no documento de requisitos.

O documento define explicitamente a disponibilidade como atributo de qualidade, estabelecendo que o sistema deve permanecer disponível durante o horário de funcionamento da clínica, com exceção dos períodos de manutenção programada. Assim, uma indisponibilidade durante o expediente pode impedir que os profissionais consultem a agenda ou acessem e registrem informações nos prontuários, prejudicando o fluxo de atendimento.

## Decisão

A disponibilidade será considerada uma das quatro principais características de qualidade do VetCare, juntamente com segurança, desempenho e usabilidade. O sistema deverá priorizar mecanismos que mantenham suas funcionalidades essenciais acessíveis durante o horário de funcionamento da clínica, permitindo indisponibilidades apenas em períodos de manutenção previamente programados.

## Consequências

### Positivas

- Maior continuidade das operações da clínica.
- Menor impacto de falhas sobre o atendimento aos tutores.
- Acesso consistente à agenda e aos prontuários durante o expediente.
- Alinhamento com o atributo de qualidade definido no projeto.

### Negativas

- Necessidade de investir em mecanismos para reduzir indisponibilidades.
- Possível exigência de recursos adicionais de monitoramento, recuperação de falhas e manutenção planejada.
- Organização das manutenções para não afetar o horário de funcionamento.

## Notas de migração

- Este registro documenta uma decisão arquitetural da Etapa 1; sua aceitação não comprova implementação.
- A seção 3 do documento justifica a priorização pelo impacto direto na operação diária da clínica. A manutenibilidade permanece como característica de suporte, atendida principalmente pela [ADR-005](ADR-005-monolito-modular.md) e pelas táticas da seção 8.5.

## Referências

- *Arquitetura do Sistema VetCare*. Salvador, 2026. Seções 3 e 3.1, páginas 6–7. Documento original consultado em PDF, mantido fora do repositório.
- PINHEIRO, L. B. L. *Documento de requisitos: VetCare – sistema de gestão para clínica veterinária*. Versão 01.00. Salvador: Instituto de Computação, Universidade Federal da Bahia, 2026a. Referência do documento de arquitetura; não consultada separadamente nesta migração.
