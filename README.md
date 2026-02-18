# OrderManagement

## Projeto

**OrderManagement** — API de Gerenciamento de Pedidos. Projeto de teste tecnico que implementa uma API REST para cadastro de clientes, condicoes de pagamento e pedidos, com aprovacao automatica ou manual conforme valor, processamento assincrono via fila in-memory e autenticacao JWT.

---

## Tecnologias

- **.NET 8** (ASP.NET Core Web API)
- **Entity Framework Core 8** (escrita)
- **Dapper** (leitura)
- **SQL Server 2022 Express**
- **xUnit + Moq** (testes)
- **React Native (Expo)** (frontend mobile)
- **React 18 + Vite + Tailwind CSS** (frontend web alternativo)
- **JWT Authentication**

---

## Arquitetura

Clean Architecture com 4 camadas:

- **OrderManagement.Domain**
  - Entidades: `Customer`, `PaymentCondition`, `Order`, `OrderItem`, `DeliveryTerm`
  - Enums: `OrderStatus`
  - Interfaces de repositorio: `IOrderRepository`, `ICustomerRepository`, `IPaymentConditionRepository`, `IUnitOfWork`

- **OrderManagement.Application**
  - Commands: `CreateOrderCommandHandler`, `ApproveOrderCommandHandler`, `CancelOrderCommandHandler`, `CreateCustomerCommandHandler`, `CreatePaymentConditionCommandHandler`
  - DTOs (Request/Response)
  - Interfaces de query: `IOrderQueryService`, `ICustomerQueryService`, `IPaymentConditionQueryService`, `IOrderProcessingQueue`

- **OrderManagement.Infrastructure**
  - EF Core: `AppDbContext`, mapeamentos Fluent API
  - Repositorios (padrao UnitOfWork)
  - Queries com Dapper (SQL direto para leitura)
  - Background Worker: `OrderProcessingWorker`
  - Fila in-memory: `InMemoryOrderProcessingQueue`
  - `DependencyInjection`

- **OrderManagement.API**
  - Controllers: Auth, Customers, PaymentConditions, Orders
  - Configuracao JWT, CORS, Swagger

### Estrutura de pastas

```
OrderManagement/
├── OrderManagement.sln
├── src/
│   ├── OrderManagement.API/
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── CustomersController.cs
│   │   │   ├── OrdersController.cs
│   │   │   └── PaymentConditionsController.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── OrderManagement.Application/
│   │   ├── Commands/
│   │   │   ├── ApproveOrderCommandHandler.cs
│   │   │   ├── CancelOrderCommandHandler.cs
│   │   │   ├── CreateCustomerCommandHandler.cs
│   │   │   ├── CreateOrderCommandHandler.cs
│   │   │   └── CreatePaymentConditionCommandHandler.cs
│   │   ├── DTOs/
│   │   │   ├── Request/
│   │   │   └── Response/
│   │   └── Interfaces/
│   │       ├── ICustomerQueryService.cs
│   │       ├── IOrderProcessingQueue.cs
│   │       ├── IOrderQueryService.cs
│   │       └── IPaymentConditionQueryService.cs
│   ├── OrderManagement.Domain/
│   │   ├── Entities/
│   │   │   ├── Customer.cs
│   │   │   ├── DeliveryTerm.cs
│   │   │   ├── Order.cs
│   │   │   ├── OrderItem.cs
│   │   │   └── PaymentCondition.cs
│   │   ├── Enums/
│   │   │   └── OrderStatus.cs
│   │   └── Interfaces/
│   │       ├── ICustomerRepository.cs
│   │       ├── IOrderRepository.cs
│   │       ├── IPaymentConditionRepository.cs
│   │       └── IUnitOfWork.cs
│   └── OrderManagement.Infrastructure/
│       ├── BackgroundServices/
│       │   ├── InMemoryOrderProcessingQueue.cs
│       │   └── OrderProcessingWorker.cs
│       ├── Data/
│       │   ├── AppDbContext.cs
│       │   └── Mappings/
│       │       ├── CustomerMapping.cs
│       │       ├── DeliveryTermMapping.cs
│       │       ├── OrderItemMapping.cs
│       │       ├── OrderMapping.cs
│       │       └── PaymentConditionMapping.cs
│       ├── Migrations/
│       ├── Queries/
│       │   ├── CustomerQueryService.cs
│       │   ├── OrderQueryService.cs
│       │   └── PaymentConditionQueryService.cs
│       ├── Repositories/
│       │   ├── CustomerRepository.cs
│       │   ├── OrderRepository.cs
│       │   ├── PaymentConditionRepository.cs
│       │   └── UnitOfWork.cs
│       └── DependencyInjection.cs
├── order-management-mobile/       # Frontend React Native (Expo)
│   ├── App.js
│   └── src/
│       ├── context/
│       │   └── AuthContext.js
│       ├── navigation/
│       │   └── AppNavigator.js
│       ├── screens/
│       │   ├── LoginScreen.js
│       │   ├── OrdersScreen.js
│       │   ├── OrderDetailScreen.js
│       │   ├── CreateOrderScreen.js
│       │   ├── CustomersScreen.js
│       │   └── PaymentConditionsScreen.js
│       └── services/
│           └── api.js
├── order-management-web/          # Frontend React + Vite + Tailwind (alternativo)
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── main.jsx
└── tests/
    └── OrderManagement.Tests/
```

---

## CQRS Light

O projeto adota um **CQRS leve** (sem MediatR nem event sourcing):

- **Commands**: utilizam Entity Framework Core via UnitOfWork e repositorios para **escrita**. Cada comando e tratado por um handler que orquestra repositorios e publica mensagens na fila quando aplicavel.
- **Queries**: utilizam **Dapper** com SQL direto para **leitura**, permitindo consultas otimizadas e projecoes especificas (ex.: detalhe do pedido com itens).
- Separacao logica entre leitura e escrita, sem introduzir infraestrutura de mensageria ou bibliotecas adicionais de CQRS.

---

## Estrategia de Persistencia

- **EF Core** para escrita: mapeamentos via Fluent API, transacoes garantidas pelo UnitOfWork.
- **Dapper** para leitura: consultas SQL otimizadas e uso de `QueryMultiple` para visoes de detalhe (ex.: pedido + itens).
- **SQL Server 2022 Express** como banco de dados.

---

## Regras de Negocio

- **Pedidos com valor <= R$ 5.000**: criados com status **Pago** e `RequiresManualApproval = false`.
- **Pedidos com valor > R$ 5.000**: criados com status **Criado** e `RequiresManualApproval = true`. Requerem aprovacao manual via `PUT /api/orders/{id}/approve`, que altera o status diretamente para **Pago**.
- **Todos os pedidos**, independentemente do valor, sao publicados na fila de processamento apos a criacao para calculo do prazo de entrega.

---

## Processamento Assincrono (Fila + Worker)

Fluxo simulado sem dependencias externas (sem RabbitMQ/Azure Service Bus):

1. **POST /api/orders** - Cria o pedido e publica uma mensagem `OrderProcessingMessage(OrderId, DeliveryDays)` na fila in-memory, **independentemente do status** do pedido.
2. **OrderProcessingWorker** (BackgroundService) consome a mensagem da fila.
3. O worker simula o calculo do prazo de entrega (delay de 2s) e insere um registro `DeliveryTerm` com prazo de 10 dias a partir da data do pedido.
4. Trata-se de uma simulacao de um barramento de mensagens real (ex.: RabbitMQ, Azure Service Bus), sem dependencias externas.

---

## Eventos de Dominio

Os eventos de dominio sao simulados pelo mecanismo da fila: quando um pedido e criado, uma mensagem `OrderProcessingMessage` e publicada na fila independentemente do status. O **OrderProcessingWorker** atua como "handler" desse evento, calculando e inserindo o prazo de entrega (`DeliveryTerm`). Em producao, essa fila in-memory pode ser substituida por um message broker real (RabbitMQ, Azure Service Bus, etc.), mantendo a mesma ideia de evento assincrono.

---

## Autenticacao JWT

- **POST /api/auth/login** com `username` e `password`.
- Retorna um token JWT com claims: `Name`, `Role`, `Jti`.
- Todos os demais endpoints sao protegidos com `[Authorize]`.
- Swagger configurado com suporte a Bearer token (botao "Authorize").
- **Credenciais de teste**: `admin` / `admin123`.

---

## Endpoints da API

| Metodo | Endpoint | Descricao | Autenticacao |
|--------|----------|-----------|--------------|
| POST   | `/api/auth/login` | Login (retorna JWT) | Publico |
| GET    | `/api/customers` | Listar clientes | Protegido |
| POST   | `/api/customers` | Criar cliente | Protegido |
| GET    | `/api/paymentconditions` | Listar condicoes de pagamento | Protegido |
| POST   | `/api/paymentconditions` | Criar condicao de pagamento | Protegido |
| GET    | `/api/orders` | Listar pedidos | Protegido |
| GET    | `/api/orders/{id}` | Detalhe do pedido | Protegido |
| POST   | `/api/orders` | Criar pedido | Protegido |
| PUT    | `/api/orders/{id}/approve` | Aprovar pedido (manual) | Protegido |
| PUT    | `/api/orders/{id}/cancel` | Cancelar pedido | Protegido |

---

## Como Executar

### Pre-requisitos

- .NET 8 SDK
- SQL Server 2022 Express
- Node.js 20+ (para o frontend)

### Backend

```bash
cd OrderManagement
dotnet restore
dotnet ef database update --project src/OrderManagement.Infrastructure --startup-project src/OrderManagement.API
dotnet run --project src/OrderManagement.API
```

API disponivel em: **http://localhost:5000**

### Frontend React Native (Expo)

```bash
cd OrderManagement/order-management-mobile
npm install
npx expo start --web
```

App disponivel em: **http://localhost:8081** (web) ou via Expo Go no celular.

**Telas**: Login -> Pedidos (listagem) -> Detalhe do Pedido (aprovar/cancelar) -> Novo Pedido -> Clientes -> Condicoes de Pagamento.

### Frontend Web (alternativo)

```bash
cd OrderManagement/order-management-web
npm install
npm run dev
```

Frontend disponivel em: **http://localhost:3000**

### Testes

```bash
dotnet test
```

---

## Decisoes Tecnicas

- **Sem MediatR**: CQRS Light sem complexidade adicional de biblioteca de mediator.
- **Sem mensageria real**: fila in-memory com `ConcurrentQueue` para simular processamento assincrono.
- **Sem microsservicos**: aplicacao monolitica com camadas bem definidas.
- **Sem Event Sourcing**: persistencia em estado atual (EF Core + Dapper).
- **UnitOfWork** para consistencia transacional nas escritas.
- **Records** para DTOs (imutabilidade e concisao).
- **Fluent API** em vez de Data Annotations no EF Core (melhor separacao e controle dos mapeamentos).
- **React Native (Expo)**: conforme requisito do edital. O frontend web (Vite) foi mantido como alternativa.

---

## Consideracoes Arquiteturais e Evolucao

### Escalabilidade

A separacao entre leitura (Dapper) e escrita (EF Core) permite evoluir naturalmente para um modelo CQRS completo, com banco read-only otimizado e eventual cache distribuido (ex.: Redis) sem impactar o dominio. As queries Dapper podem ser direcionadas para uma replica de leitura, enquanto os commands continuam operando no banco principal — bastando alterar a connection string de leitura, sem tocar na logica de negocio.

### Evolucao para Microsservicos

A fila in-memory (`ConcurrentQueue<T>`) foi utilizada apenas para simplificacao do teste. Em um ambiente produtivo, poderia ser substituida por **RabbitMQ** ou **Azure Service Bus**, permitindo que o processamento de pedidos fosse isolado em um microsservico independente.

A camada Domain permanece isolada e sem dependencias externas, o que facilitaria a extracao do modulo de Orders como servico autonomo. A interface `IOrderProcessingQueue` serve como contrato de abstracao — trocar a implementacao de `InMemoryOrderProcessingQueue` para um adapter de RabbitMQ nao exigiria mudancas nos handlers de comando.

### Estrategia de Consistencia

As escritas sao transacionadas via **UnitOfWork**, garantindo **atomicidade** entre `Order` e `OrderItems` — ambos sao persistidos na mesma transacao ou nenhum e salvo.

O `DeliveryTerm` e criado de forma **assincrona** pelo worker, seguindo o principio de **consistencia eventual** (*eventual consistency*). Isso significa que, por um breve periodo apos a criacao do pedido, o prazo de entrega ainda nao existe — mas sera processado e vinculado ao pedido assim que o worker consumir a mensagem da fila. Esse modelo e o padrao em sistemas distribuidos e orientados a eventos.

### Seguranca

O token JWT e gerado com chave simetrica configurada em `appsettings.json` apenas para fins de teste. Em producao:

- O segredo JWT seria armazenado em **Azure Key Vault** ou em **variaveis de ambiente** protegidas, nunca em arquivos versionados.
- O tempo de expiracao seria configurado conforme politica de seguranca corporativa.
- Seria adicionado **refresh token** com rotacao automatica para sessoes de longa duracao.
- As credenciais de usuario seriam validadas contra um Identity Provider real (ex.: ASP.NET Identity, Azure AD).

### Observabilidade

Em um ambiente real, o sistema seria instrumentado com:

- **Logs estruturados** via Serilog (com sinks para Seq, Elasticsearch ou Application Insights), permitindo correlacao entre requisicoes HTTP e processamento assincrono do worker.
- **Health Checks** (`/health`) para monitoramento de disponibilidade do banco e da fila.
- **Metricas** de tempo de processamento de pedidos e profundidade da fila, exportadas para Prometheus/Grafana ou Azure Monitor.
- **Distributed Tracing** (OpenTelemetry) para rastreabilidade ponta a ponta em cenarios de microsservicos.

O `OrderProcessingWorker` ja emite logs informativos a cada etapa do processamento, servindo como base para essa evolucao.

---

*Projeto de teste tecnico — Order Management API.*
