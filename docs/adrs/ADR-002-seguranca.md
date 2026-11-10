# ADR-002 — Priorização da segurança do sistema

- **Status:** Aceito
- **Data:** 28/09/2026
- **Origem:** *Arquitetura do Sistema VetCare*, Etapa 1, seção 3.2, páginas 7–8. Fonte consultada: `Arquitetura_do_Sistema_VetCare.docx.pdf`.

## Contexto

O VetCare gerencia informações de tutores, animais, profissionais, consultas, atendimentos, prontuários e pagamentos, entre elas dados pessoais e informações clínicas dos animais atendidos.

O documento de requisitos estabelece a segurança como atributo de qualidade e determina que o sistema possua diferentes perfis de acesso, de modo que informações clínicas e dados pessoais sejam acessados somente por usuários autorizados. Os perfis previstos inicialmente são Administrador, Recepcionista e Veterinário, o que exige níveis de acesso distintos às funcionalidades.

## Decisão

A segurança será considerada uma das quatro principais características de qualidade do VetCare. O sistema controlará o acesso às funcionalidades de acordo com o perfil do usuário (Administrador, Recepcionista e Veterinário), garantindo que informações clínicas e dados pessoais sejam acessíveis apenas por usuários autorizados.

A autenticação por credenciais de acesso, prevista no REQ 02, é a porta de entrada desse controle. Os mecanismos técnicos adotados estão detalhados na [ADR-006](ADR-006-autenticacao-jwt-rbac.md).

## Consequências

### Positivas

- Restrição do acesso às informações conforme o perfil do usuário.
- Maior proteção dos dados pessoais e clínicos armazenados.
- Redução do risco de acesso indevido às funcionalidades.
- Estrutura de acesso compatível com os papéis existentes na clínica.

### Negativas

- Necessidade de implementar e manter mecanismos de autenticação e autorização.
- Maior complexidade devido ao gerenciamento de perfis e permissões.
- Obrigação de definir as permissões de cada perfil em toda nova funcionalidade.

## Notas de migração

- Este registro documenta uma decisão arquitetural da Etapa 1; sua aceitação não comprova implementação.

## Referências

- *Arquitetura do Sistema VetCare*. Salvador, 2026. Seção 3.2, páginas 7–8. Documento original consultado em PDF, mantido fora do repositório.
- PINHEIRO, L. B. L. *Documento de requisitos: VetCare – sistema de gestão para clínica veterinária*. Versão 01.00. Salvador: Instituto de Computação, Universidade Federal da Bahia, 2026a. Referência do documento de arquitetura; não consultada separadamente nesta migração.
