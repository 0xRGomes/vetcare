# ADR-011 — Itens da arquitetura adiados e ajustes em relação ao protótipo

- **Status:** Proposta — implementada na Etapa 2, aguardando validação do grupo
- **Data:** 10/11/2026
- **Origem:** Implementação da Etapa 2 do VetCare.

## Contexto

A Etapa 2 implementa seis requisitos ([ADR-008](ADR-008-selecao-escopo-etapa-2.md)). A arquitetura da Etapa 1 e o protótipo de interface (`docs/prototipo/index.html`) cobrem os 17 requisitos. Este registro lista o que da arquitetura ficou para etapas futuras e o que mudou nas telas implementadas para que elas mostrem apenas o que funciona.

## Decisão

### Itens da arquitetura adiados

| Item | Origem | Situação na Etapa 2 |
| --- | --- | --- |
| Módulos `prontuario`, `financeiro`, `notificacao` e `relatorios` | ADR-005 | Não implementados. Existem `auth` (com a gestão de usuários), `cadastros` e `agendamento`. |
| Fila persistida e envio assíncrono de notificações | ADR-007 | Não implementado (REQ 16 fora do escopo). Agendar uma consulta ou excluir um tutor não envia mensagens. |
| Monitoramento, redundância e reinicialização automática | ADR-005, seção 8.1 | Não implementados; dependem do ambiente de implantação. |
| Metas numéricas de desempenho | ADR-003 | Continuam sem definição. A agenda é consultada por período com índice em data e hora. |

### Regras definidas durante a implementação

- **Consulta com duração fixa de 30 minutos**, dentro da jornada e dos dias de atendimento de cada veterinário. Não é possível agendar em horário passado, fora da jornada ou já ocupado; o mesmo animal não pode ter duas consultas no mesmo horário.
- **Exclusão lógica de tutores e animais**: o registro é desativado e some dos cadastros, mas permanece no banco para preservar o histórico. As consultas futuras ainda não atendidas são marcadas como canceladas, liberando os horários.
- **CPF do tutor** é único entre os cadastros ativos, não pode ser alterado após o cadastro e é exibido sempre mascarado.
- **Veterinário** consulta apenas a própria agenda e lê os cadastros, conforme o Quadro 4.

### Ajustes nas telas em relação ao protótipo

As telas implementadas reproduzem o protótipo em desktop e em celular. Elementos que dependem de requisitos fora do escopo foram retirados ou substituídos:

| Tela | Protótipo | Sistema |
| --- | --- | --- |
| Login | Atalho "Esqueci minha senha" (REQ 03) e botões "Demonstração · entrar como", que entravam sem digitar senha | Retirados. O acesso é só por e-mail e senha; quem esquece a senha pede outra ao administrador. Foi acrescentada a tela de definição de senha (`/senha`). |
| Menu | Pagamentos, Notificações, Veterinários, Atendimento, Prontuários, Financeiro e Relatórios | Início, Agenda, Novo agendamento, Tutores e animais e Veterinários; Usuários e perfis apenas para o administrador |
| Início | Indicadores "Pagamentos pendentes" e "Lembretes enviados"; quadro "Vacinas a vencer"; botões "Fazer check-in" e "Registrar pagamento" | Indicadores "Tutores cadastrados" e "Animais cadastrados"; quadro "Consultas nos próximos dias"; botões retirados |
| Agenda | Botões "Remarcar" e "Cancelar consulta" (REQ 08) | Substituídos por "Ver ficha do tutor". Foram acrescentados o seletor de data e a navegação entre semanas. |
| Novo agendamento | Opção "Enviar confirmação e lembrete ao tutor" (REQ 16) | Retirada. O campo Tutor passou a ser uma busca por nome, CPF, telefone ou animal. |
| Tutores e animais | Botão "Prontuário" no cartão do animal (REQ 11) | Substituído por "Editar", que também permite excluir o animal (REQ 05). |
| Usuários e perfis | Senha provisória enviada por e-mail; matriz com os oito módulos; auditoria com eventos de prontuário e pagamento | Senha provisória exibida ao administrador; perfil Veterinário e agenda são vinculados no cadastro dedicado de Veterinários (ADR-012); botão "Gerar nova senha provisória"; matriz e auditoria só com o que existe nesta etapa |

No protótipo, cada tela troca de estado sem mudar de endereço. No sistema, lista, ficha e formulários têm endereço próprio (por exemplo `/tutores/12`, `/tutores/novo`, `/usuarios/4`, `/agenda?data=2026-11-12&visao=semana`), de modo que o botão Voltar do navegador, a recarga da página e os links diretos funcionam.

## Consequências

### Positivas

- Tudo o que aparece na interface funciona; nenhum botão leva a uma funcionalidade inexistente.
- As diferenças entre o protótipo e o sistema ficam documentadas para a avaliação e para as próximas etapas.

### Negativas

- Os estados "Confirmada", "Aguardando", "Em atendimento" e "Concluída" aparecem apenas nas consultas da carga inicial: check-in, atendimento e cancelamento pertencem a requisitos futuros. Consultas agendadas pelo sistema ficam como "Agendada".
- As telas precisarão ser reabertas quando os requisitos adiados forem implementados.
