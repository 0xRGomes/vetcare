# ADR-005 — Adoção do estilo monolito modular em camadas

- **Status:** Aceito
- **Data:** 28/09/2026
- **Origem:** *Arquitetura do Sistema VetCare*, Etapa 1, seção 6.1, páginas 15–16. Organização complementar descrita na seção 7, páginas 17–18. Fonte consultada: `Arquitetura_do_Sistema_VetCare.docx.pdf`.

## Contexto

O VetCare atende à operação de uma clínica veterinária, com um único ambiente de implantação, uma equipe de desenvolvimento pequena e 17 requisitos funcionais organizados em seis domínios (acesso, cadastros, agenda, clínico, financeiro e comunicação e gestão).

As características priorizadas exigem disponibilidade durante o expediente, respostas rápidas em agenda e prontuário e controle de acesso por perfil, enquanto a manutenibilidade exige que novas funcionalidades sejam incluídas sem grandes alterações nos componentes existentes.

## Decisão

O sistema adotará o estilo monolito modular em camadas. A aplicação será implantada como uma única unidade, organizada em quatro camadas e uma base de dados relacional:

- Apresentação;
- Aplicação/Serviços;
- Domínio;
- Infraestrutura.

Dentro da camada de Aplicação, cada domínio funcional forma um módulo próprio (`auth`, `cadastros`, `agendamento`, `prontuario`, `financeiro`, `notificacao` e `relatorios`), correspondente aos componentes candidatos da seção 4 do documento original.

As dependências seguem apenas de cima para baixo; a Infraestrutura implementa as interfaces definidas no Domínio, aplicando o princípio da inversão de dependência (MARTIN, 2017); e um módulo só acessa outro por meio de suas interfaces de serviço, nunca diretamente pelas tabelas ou classes internas do outro módulo.

### Organização de pacotes e dependências

A seção 7 do documento original complementa a decisão: cada camada corresponde a um pacote, e a camada de Aplicação contém um subpacote por domínio funcional, alinhado aos componentes candidatos da seção 4.

| Origem | Destino | Relação e finalidade |
| --- | --- | --- |
| Apresentação (`ui`) | Aplicação (`app`) | «use»: chamada dos serviços de aplicação. |
| Aplicação (`app`) | Domínio (`domain`) | «import»: manipulação das entidades do modelo de negócio. |
| Aplicação (`app`) | Infraestrutura (`infra`) | «use»: acesso a recursos de segurança e de mensageria. |
| Infraestrutura (`infra`) | Domínio (`domain`) | «implements»: aplicação do princípio da inversão de dependência (DIP). |
| Infraestrutura (`infra`) | Base de dados | «access»: persistência relacional. |

Os principais serviços de cada módulo de aplicação, conforme a seção 7, são:

| Módulo | Serviços |
| --- | --- |
| `app.auth` | `AuthService`, `RBACManager` e `TokenSessionService` |
| `app.cadastros` | `CadastroService`, `TutorService`, `AnimalService` e `ProfissionalService` |
| `app.agendamento` | `AgendamentoService`, `SlotConflictManager` e `AgendaQueryEngine` |
| `app.prontuario` | `ClinicalRecordService`, `PrescriptionEngine` e `VaccineManager` |
| `app.financeiro` | `FaturamentoService` e `DashboardService` |
| `app.notificacao` | `NotificationService` |
| `app.relatorios` | `ReportEngine` |

## Alternativas consideradas

1. **Monolito em camadas sem fronteiras explícitas entre domínios.** Descartado por favorecer o acoplamento entre funcionalidades, contrariando a manutenibilidade (RICHARDS; FORD, 2020).
2. **Microsserviços, com um serviço por domínio.** Descartados porque a escalabilidade e a implantação independente que oferecem não são exigidas pelo VetCare. Trariam custos de comunicação em rede, de consistência distribuída (crítica em agendamentos e pagamentos) e de monitoramento de vários serviços, prejudicando disponibilidade e desempenho.
3. **Monolito modular em camadas, com módulos por domínio dentro de uma única aplicação.** Alternativa adotada.

## Consequências

### Positivas

- Implantação e operação simples, com menos pontos de falha, favorecendo a disponibilidade.
- Chamadas entre módulos dentro do mesmo processo, favorecendo o desempenho.
- Transações locais na base relacional, preservando a integridade de agendamentos e pagamentos.
- Módulos com responsabilidades claras, favorecendo a manutenibilidade e os testes.
- Possibilidade de extrair um módulo para um serviço separado no futuro, se necessário.

### Negativas

- A aplicação escala como um todo, e não por módulo.
- Uma falha grave pode afetar todo o sistema, o que é mitigado pelas táticas de disponibilidade da seção 8 do documento original.
- Exigência de disciplina da equipe para respeitar as fronteiras entre módulos.
- Qualquer alteração exige uma nova implantação completa, realizada na janela de manutenção fora do expediente.

### Táticas de disponibilidade referenciadas

A seção 8.1 do documento original descreve as seguintes táticas para mitigar indisponibilidades:

- **Detecção de falhas:** monitoramento e *heartbeat* da API e da base de dados para detectar indisponibilidade ou degradação antes de afetarem a operação.
- **Prevenção de falhas:** atualizações, backups e manutenções em janela programada fora do expediente.
- **Recuperação de falhas:** redundância e reinicialização automática, permitindo redirecionar o tráfego ou restabelecer rapidamente o serviço se uma instância falhar.

## Notas de migração e pontos para revisão

- Este registro documenta uma decisão arquitetural da Etapa 1; sua aceitação não comprova que os mecanismos descritos estejam implementados.
- O contexto original menciona **seis domínios**, enquanto a decisão enumera **sete módulos** na camada de Aplicação. A fonte não explicita o mapeamento completo entre essas duas classificações; ambas foram preservadas.
- A expressão original “dependências seguem apenas de cima para baixo” deve ser lida junto às relações específicas da seção 7, incluindo `app` → `infra` e `infra` → `domain`. A fonte não detalha como conciliar a expressão geral com todas essas relações; a migração preserva as duas descrições sem redefinir a arquitetura.
- A organização complementar acima transcreve as descrições textuais da seção 7. A Figura 2, apresentada como imagem no PDF, não foi reproduzida nem validada visualmente nesta migração.

## Referências

- ALMEIDA, Eduarda; SACRAMENTO, Henrique; MELO, João Guilherme; GOMES, Ruan. *Arquitetura do Sistema VetCare*. Salvador, 2026. Seções 6.1, 7 e 8.1. Documento original consultado em PDF, mantido fora do repositório.
- MARTIN, R. C. *Clean architecture: a craftsman's guide to software structure and design*. Upper Saddle River: Prentice Hall, 2017. Referência citada na decisão original.
- RICHARDS, M.; FORD, N. *Fundamentals of software architecture: an engineering approach*. Sebastopol: O'Reilly Media, 2020. Referência citada na decisão original.
