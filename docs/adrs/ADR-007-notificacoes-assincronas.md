# ADR-007 — Processamento assíncrono das notificações aos tutores

- **Status:** Aceito
- **Data:** 05/10/2026
- **Origem:** *Arquitetura do Sistema VetCare*, Etapa 1, seção 9.2, páginas 23–24. Fonte consultada: `Arquitetura_do_Sistema_VetCare.docx.pdf`.

## Contexto

O REQ 16 exige o envio de notificações aos tutores sobre consultas agendadas e datas previstas de vacinação, por canais externos como WhatsApp e e-mail. Esses serviços podem ser lentos ou ficar indisponíveis, e operações da recepção, como agendar ou cancelar uma consulta, não podem esperar pelo envio nem falhar por causa dele.

## Decisão

O `NotificationService` registrará cada notificação em uma fila persistida na base de dados, e um processo em segundo plano, no pacote `infra.messaging`, fará o envio.

Lembretes programados (24 horas antes da consulta e 7 dias antes da próxima dose de vacina) serão gerados por uma rotina periódica. Envios que falharem ficarão com a situação **"Falhou"**, terão novas tentativas automáticas e poderão ser reenviados manualmente.

## Consequências

### Positivas

- O agendamento e o cancelamento não aguardam o envio da mensagem, favorecendo o desempenho.
- A indisponibilidade de um provedor externo não interrompe o atendimento, favorecendo a disponibilidade.
- Cada notificação tem situação rastreável (na fila, enviada ou com falha).

### Negativas

- Existência de um processo adicional a ser monitorado.
- Entrega não instantânea das mensagens.
- Necessidade de evitar o envio duplicado em caso de novas tentativas.

## Notas de migração e pontos para revisão

- Este registro documenta uma decisão arquitetural da Etapa 1; sua aceitação não comprova implementação.
- A fonte não define a frequência da rotina periódica, os intervalos e limites das novas tentativas nem o mecanismo para evitar duplicidade. Nenhuma solução técnica adicional foi introduzida.
- A fonte utiliza **"Falhou"** na decisão e **"com falha"** ao descrever a rastreabilidade nas consequências. As duas formulações foram preservadas, sem definir novos estados.

## Referências

- *Arquitetura do Sistema VetCare*. Salvador, 2026. Seção 9.2, páginas 23–24. Documento original consultado em PDF, mantido fora do repositório.
