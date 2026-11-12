# ADR-012 — Cadastro de veterinários em fluxo dedicado

- **Status:** Aceito
- **Data:** 12/11/2026
- **Origem:** Decisão de produto durante a implementação do REQ 06.

## Contexto

O REQ 06 introduziu um fluxo próprio para cadastrar veterinários. Esse fluxo cria, em uma única operação, o cadastro profissional, a conta de acesso vinculada e a senha provisória, com gestão restrita à administração. A tela genérica `/usuarios/novo` também permitia escolher o perfil Veterinário e associar manualmente uma agenda, duplicando a criação e separando dados que precisam permanecer vinculados.

## Decisão

- O cadastro em `/veterinarios` é o único fluxo para criar veterinários e suas contas de acesso. Somente administradores podem executá-lo.
- `/usuarios/novo` cadastra apenas perfis Administrador e Recepcionista; não exibe perfil Veterinário nem seletor de agenda.
- A API genérica de usuários rejeita a criação de contas Veterinário e a conversão de outros perfis para Veterinário. Em contas existentes de veterinários, o perfil e o vínculo profissional não podem ser alterados pela gestão genérica de usuários.
- A tela de usuários pode continuar exibindo e editando os demais dados de contas veterinárias existentes; o vínculo de agenda é preservado.

## Consequências

### Positivas

- Evita duplicidade entre o cadastro profissional e a criação da conta de acesso.
- Mantém a conta e a agenda vinculadas desde a criação, em uma transação e sob autorização administrativa.
- Deixa a tela de usuários dedicada a perfis genéricos, sem lógica de seleção de agenda.

### Negativas

- Para cadastrar ou gerenciar o perfil e a agenda de um veterinário, é necessário usar a tela Veterinários.
- Administradores não podem converter contas genéricas em contas veterinárias pela tela de usuários; devem cadastrar o veterinário pelo fluxo dedicado.
