# OrderManagement

Sistema completo de Gerenciamento de Pedidos com backend ASP.NET Core Web API e frontend React Native (Expo). Desenvolvido como teste tecnico seguindo Clean Architecture, CQRS Light, autenticacao JWT, processamento assincrono e internacionalizacao em 3 idiomas.

---

## Tecnologias

### Backend
- **.NET 8** (ASP.NET Core Web API)
- **Entity Framework Core 8** (escrita / commands)
- **Dapper** (leitura / queries)
- **SQL Server 2022 Express**
- **BCrypt.Net** (hash de senhas via `IPasswordHasher`)
- **JWT Authentication** (Microsoft.AspNetCore.Authentication.JwtBearer via `ITokenService`)
- **xUnit + Moq** (testes unitarios — 35 testes)

### Frontend
- **React Native** (Expo SDK 54)
- **React Navigation** (navegacao com sidebar responsiva — desktop fixo, mobile drawer)
- **Axios** (HTTP client com timeout e interceptors)
- **AsyncStorage** (persistencia local)
- **@react-native-picker/picker** (seletores)

---

## Arquitetura

Clean Architecture com 4 camadas:

```
OrderManagement/
├── OrderManagement.sln
├── src/
│   ├── OrderManagement.Domain/           # Entidades, Enums, Constantes, Interfaces de repositorio
│   ├── OrderManagement.Application/      # Commands, DTOs (com validacao), Interfaces de query e servicos
│   ├── OrderManagement.Infrastructure/   # EF Core, Dapper, Repos, Worker, Fila, Services (Hash, Token)
│   └── OrderManagement.API/              # Controllers, JWT, CORS, Swagger, Middleware de excecoes
├── order-management-mobile/              # Frontend React Native (Expo)
├── order-management-web/                 # Frontend React Web (alternativo)
└── tests/
    └── OrderManagement.Tests/            # Testes unitarios (xUnit + Moq — 35 testes)
```

### Camada Domain
- Entidades: `Customer`, `PaymentCondition`, `Order`, `OrderItem`, `DeliveryTerm`, `User`
- Enums: `OrderStatus` (Criado, AguardandoAprovacao, Aprovado, Processando, Pago, Cancelado)
- Constantes: `Roles` (Admin, Manager, User) — centralizadas para type safety
- Interfaces: `IOrderRepository`, `ICustomerRepository`, `IPaymentConditionRepository`, `IUserRepository`, `IUnitOfWork`

### Camada Application
- Commands: `LoginCommandHandler`, `CreateOrderCommandHandler`, `ApproveOrderCommandHandler`, `CancelOrderCommandHandler`, `CreateCustomerCommandHandler`, `CreatePaymentConditionCommandHandler`, `CreateUserCommandHandler`, `UpdateUserCommandHandler`, `ChangePasswordCommandHandler`
- DTOs Request (com Data Annotations): `CreateOrderRequest`, `LoginRequest`, `CreateUserRequest`, `UpdateUserRequest`, `ChangePasswordRequest`
- DTOs Response: `OrderResponse`, `OrderDetailResponse`, `LoginResponse`, `UserResponse`
- Interfaces: `IOrderQueryService`, `ICustomerQueryService`, `IPaymentConditionQueryService`, `IUserQueryService`, `IOrderProcessingQueue`, `IPasswordHasher`, `ITokenService`

### Camada Infrastructure
- EF Core: `AppDbContext` com Fluent API mappings e seed data
- Repositorios com padrao UnitOfWork (incluindo `UserRepository`)
- Queries Dapper com SQL direto para leitura otimizada (com `CommandDefinition` para suporte a `CancellationToken`)
- `OrderProcessingWorker` (BackgroundService) + `InMemoryOrderProcessingQueue`
- Services: `PasswordHasher` (BCrypt via interface `IPasswordHasher`), `TokenService` (JWT via interface `ITokenService`)

### Camada API
- Controllers: `AuthController`, `OrdersController`, `CustomersController`, `PaymentConditionsController`, `UsersController`
- Todos os controllers seguem o padrao CQRS: command handlers para escrita, query services para leitura
- JWT + CORS + Swagger configurados em `Program.cs`
- `GlobalExceptionMiddleware` para tratamento uniforme de erros

---

## CQRS Light

O projeto adota um **CQRS leve** (sem MediatR nem event sourcing):

- **Commands**: utilizam Entity Framework Core via UnitOfWork e repositorios para **escrita**.
- **Queries**: utilizam **Dapper** com SQL direto e `CommandDefinition` (com `CancellationToken`) para **leitura**, permitindo consultas otimizadas e cancelaveis.
- Separacao logica entre leitura e escrita, sem introduzir infraestrutura de mensageria ou bibliotecas adicionais.
- **Todos os controllers** seguem o padrao consistentemente — incluindo Auth e Users.

---

## Regras de Negocio

- **Pedidos <= R$ 5.000**: criados com status **Pago** e `RequiresManualApproval = false`.
- **Pedidos > R$ 5.000**: criados com status **Criado** e `RequiresManualApproval = true`. Requerem aprovacao manual via `PUT /api/orders/{id}/approve`, que altera o status para **Pago**.
- **Todos os pedidos** sao publicados na fila de processamento para calculo de prazo de entrega (DeliveryTerm de 10 dias).
- **Cancelamento com ownership**: usuarios comuns so podem cancelar seus proprios pedidos; Admin/Manager podem cancelar qualquer pedido.

---

## Processamento Assincrono (Fila + Worker)

1. `POST /api/orders` cria o pedido e publica `OrderProcessingMessage(OrderId)` na fila in-memory.
2. `OrderProcessingWorker` (BackgroundService) consome a mensagem.
3. O worker simula processamento (delay 2s) e insere um `DeliveryTerm` com prazo de 10 dias.
4. Simulacao de message broker real (RabbitMQ/Azure Service Bus) sem dependencias externas.

---

## Autenticacao e Autorizacao

### JWT
- `POST /api/auth/login` via `LoginCommandHandler` retorna token JWT com claims: `Name`, `Role`, `Jti`.
- Todos os endpoints (exceto login) protegidos com `[Authorize]`.
- Senhas armazenadas com **BCrypt** via interface `IPasswordHasher` (desacoplado e testavel).
- Geracao de token extraida para `ITokenService` (desacoplada do controller).
- Autenticacao contra tabela `Users` no SQL Server via `IUserRepository`.

### 3 Perfis de Acesso (constantes centralizadas em `Roles`)

| Perfil | Descricao | Permissoes |
|--------|-----------|------------|
| **Admin** | Administrador do sistema | Tudo + Gerenciar usuarios (CRUD, ativar/desativar, trocar senha, alterar perfil) |
| **Manager** (Gerente) | Gerente comercial | Ver todos os pedidos + Aprovar pedidos + Ver fila de aprovacao |
| **User** (Usuario) | Operador comum | Criar pedidos + Ver apenas seus proprios pedidos + Cancelar apenas seus proprios pedidos |

### Usuarios Pre-cadastrados (Seed)

| Login | Senha | Perfil | Nome |
|-------|-------|--------|------|
| `admin` | `admin123` | Admin | Administrador do Sistema |
| `gerente` | `gerente123` | Manager | Carlos Gerente |
| `joao` | `joao123` | User | Joao Silva |
| `maria` | `maria123` | User | Maria Santos |

---

## Internacionalizacao (i18n)

O frontend suporta **3 idiomas** com troca instantanea:

- **Portugues (PT-BR)** — padrao
- **Ingles (EN-US)**
- **Espanhol (ES-ES)**

A preferencia de idioma e salva em AsyncStorage e persiste entre sessoes. O seletor de idioma esta disponivel na tela de login e no menu de configuracoes da sidebar.

---

## Validacao de Dados

Todos os DTOs de Request possuem **Data Annotations** para validacao automatica pelo ASP.NET Core:

- `[Required]` para campos obrigatorios
- `[EmailAddress]` para validacao de email
- `[MinLength]` para tamanho minimo (senhas, usernames)
- `[Range]` para valores numericos (quantidade > 0, preco > 0)
- Validacao de lista (`[MinLength(1)]` nos itens do pedido)

---

## Tratamento Global de Excecoes

O `GlobalExceptionMiddleware` trata todas as excecoes nao capturadas de forma uniforme:

| Tipo de Excecao | HTTP Status | Exemplo |
|-----------------|-------------|---------|
| `UnauthorizedAccessException` | 401 Unauthorized | Login invalido |
| `KeyNotFoundException` | 404 Not Found | Pedido nao encontrado |
| `ArgumentException` | 400 Bad Request | Dados invalidos |
| `InvalidOperationException` | 400 Bad Request | Regra de negocio violada |
| Demais excecoes | 500 Internal Error | Erro inesperado (sem stack trace) |

---

## Endpoints da API

| Metodo | Endpoint | Descricao | Acesso |
|--------|----------|-----------|--------|
| POST | `/api/auth/login` | Login (retorna JWT) | Publico |
| GET | `/api/customers` | Listar clientes | Autenticado |
| POST | `/api/customers` | Criar cliente | Autenticado |
| GET | `/api/paymentconditions` | Listar condicoes de pagamento | Autenticado |
| POST | `/api/paymentconditions` | Criar condicao de pagamento | Autenticado |
| GET | `/api/orders` | Listar pedidos (Admin/Manager: todos; User: proprios) | Autenticado |
| GET | `/api/orders/pending` | Pedidos pendentes de aprovacao | Admin, Manager |
| GET | `/api/orders/{id}` | Detalhe do pedido | Autenticado |
| POST | `/api/orders` | Criar pedido | Autenticado |
| PUT | `/api/orders/{id}/approve` | Aprovar pedido | Admin, Manager |
| PUT | `/api/orders/{id}/cancel` | Cancelar pedido (owner ou Admin/Manager) | Autenticado |
| GET | `/api/users` | Listar usuarios | Admin |
| GET | `/api/users/{id}` | Detalhe do usuario | Admin |
| POST | `/api/users` | Criar usuario | Admin |
| PUT | `/api/users/{id}` | Atualizar usuario (nome, email, role, ativo) | Admin |
| PUT | `/api/users/{id}/password` | Trocar senha do usuario | Admin |

Swagger: **http://localhost:5000/swagger**

---

## Seed Data (Dados Pre-cadastrados)

### Condicoes de Pagamento

| ID | Descricao | Parcelas |
|----|-----------|----------|
| 1 | A Vista | 1 |
| 2 | 7 DDL | 1 |
| 3 | 14 DDL | 1 |
| 4 | 28 DDL | 1 |
| 5 | 30 DDL | 1 |
| 6 | 30/60 DDL | 2 |
| 7 | 30/60/90 DDL | 3 |
| 8 | 30/60/90/120 DDL | 4 |

*DDL = Dias Da data de Liberacao (faturamento/entrega)*

### Clientes

| ID | Nome | Email |
|----|------|-------|
| 1 | Atacadao S.A. | compras@atacadao.com.br |
| 2 | Carrefour Comercio e Industria Ltda | compras@carrefour.com.br |
| 3 | GPA - Grupo Pao de Acucar | compras@gpabr.com |
| 4 | Assai Atacadista | compras@assai.com.br |
| 5 | Makro Atacadista S.A. | compras@makro.com.br |
| 6 | Distribuidora Redfox Alimentos | pedidos@redfox.com.br |
| 7 | Frigorifico Silva Exportacao | comercial@frigsilva.com.br |
| 8 | Saudi Agricultural & Livestock Investment Co. | import@salic.com.sa |

---

## Frontend React Native (Expo)

### Telas

| Tela | Descricao | Acesso |
|------|-----------|--------|
| **Login** | Autenticacao com seletor de idioma | Publico |
| **Meus Pedidos** | Lista de pedidos com botao de aprovar inline e pull-to-refresh | Todos |
| **Novo Pedido** | Formulario com cliente, condicao de pagamento e itens | Todos |
| **Detalhe do Pedido** | Informacoes completas + aprovar/cancelar | Todos |
| **Fila de Aprovacao** | Pedidos pendentes de aprovacao manual (> R$ 5.000) | Admin, Manager |
| **Clientes** | Listagem e cadastro de clientes | Todos |
| **Cond. Pagamento** | Listagem e cadastro de condicoes | Todos |
| **Usuarios** | Gerenciamento completo de usuarios | Admin |

### Navegacao

- **Layout responsivo**: sidebar fixa em telas >= 768px, drawer overlay em telas menores (mobile-friendly)
- Hamburger menu para telas mobile
- Menu de **Configuracoes** (engrenagem) no rodape com: Perfil, Idioma (PT/US/ES), Sair
- Badge dinamico na Fila de Aprovacao (atualiza a cada 10s)

### Utilitarios Compartilhados

- `helpers.js`: `formatCurrency`, `formatDate`, `showAlert` (cross-platform), `showConfirm` (cross-platform com Promise), `statusColors`, `statusTextColors`
- Alertas e confirmacoes funcionam em **web e mobile nativo** (`window.alert` + `Alert.alert` com fallback automatico)

---

## Como Executar (Passo a Passo)

### Pre-requisitos

1. **.NET 8 SDK** — https://dotnet.microsoft.com/download/dotnet/8.0
2. **SQL Server 2022 Express** — https://www.microsoft.com/sql-server/sql-server-downloads
3. **Node.js 20+** — https://nodejs.org/
4. **EF Core CLI** (se nao tiver):
   ```bash
   dotnet tool install --global dotnet-ef
   ```

### 1. Clonar o repositorio

```bash
git clone <url-do-repositorio>
cd OrderManagement
```

### 2. Configurar o SQL Server

Verifique se o SQL Server Express esta rodando. A connection string padrao esta em `src/OrderManagement.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=OrderManagementDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
}
```

Se sua instancia do SQL Server tiver nome diferente, ajuste o valor de `Server=`.

### 3. Restaurar pacotes e criar o banco de dados

```bash
cd OrderManagement
dotnet restore
```

Aplicar todas as migrations (cria o banco, tabelas e seed data):

```bash
dotnet ef database update --project src/OrderManagement.Infrastructure --startup-project src/OrderManagement.API
```

Isso criara automaticamente:
- Banco `OrderManagementDb`
- Tabelas: `Customers`, `PaymentConditions`, `Orders`, `OrderItems`, `DeliveryTerms`, `Users`
- Dados seed: 8 condicoes de pagamento, 8 clientes, 4 usuarios

### 4. Iniciar o Backend

```bash
dotnet run --project src/OrderManagement.API
```

API disponivel em: **http://localhost:5000**
Swagger em: **http://localhost:5000/swagger**

### 5. Iniciar o Frontend (React Native / Expo)

Em outro terminal:

```bash
cd order-management-mobile
npm install
npx expo start --web --port 8081
```

Frontend disponivel em: **http://localhost:8081**

### 6. Acessar o sistema

1. Abra **http://localhost:8081** no navegador
2. Faca login com `admin` / `admin123`
3. Navegue pela sidebar: Pedidos, Novo Pedido, Fila de Aprovacao, Clientes, Cond. Pagamento, Usuarios
4. Teste trocar o idioma no menu de Configuracoes (engrenagem)
5. Teste com outros usuarios: `gerente/gerente123` (Manager), `joao/joao123` (User)

### 7. Testes unitarios

```bash
dotnet test
```

Resultado esperado: **35 testes aprovados** (Domain: 14, Application: 21)

---

## Estrategia de Persistencia

**ORM / Acesso a Dados:** Entity Framework Core 8 (escrita) + Dapper (leitura).

A escolha de dois ORMs lado a lado segue o principio de separacao de responsabilidades do CQRS:

- **EF Core** gerencia o ciclo de vida das entidades, change tracking, transacoes e migrations. E ideal para operacoes de escrita que exigem integridade referencial e atomicidade.
- **Dapper** executa queries SQL otimizadas diretamente para DTOs de leitura, sem overhead de materializar grafos de entidades. O uso de `CommandDefinition` garante propagacao correta de `CancellationToken` em todas as queries.

**Justificativa**: EF Core sozinho introduziria overhead desnecessario nas leituras (change tracking, proxies); Dapper sozinho demandaria gerenciar manualmente transacoes e mapeamentos complexos. A combinacao extrai o melhor de cada ferramenta.

---

## Transacoes e Consistencia

- **Escrita**: UnitOfWork com `SaveChangesAsync` garante atomicidade nas operacoes transacionais (ex: Order + OrderItems criados em uma unica transacao).
- **Consistencia eventual**: DeliveryTerm criado assincronamente pelo Worker. Se o Worker falhar, o pedido permanece criado corretamente — o prazo de entrega pode ser recalculado em uma reexecucao.
- **Isolamento**: cada request HTTP usa um escopo DI proprio (`Scoped`), garantindo que DbContext e UnitOfWork sao isolados entre requests concorrentes.

---

## Possivel Separacao de Leitura e Escrita (CQRS)

A separacao entre leitura (Dapper) e escrita (EF Core) permite evoluir para um CQRS completo, com banco read-only otimizado e cache distribuido (Redis) sem impactar o dominio. As queries Dapper podem ser direcionadas para uma replica de leitura.

O projeto ja implementa um **CQRS Light funcional**: command handlers para escrita e query services para leitura, com interfaces desacopladas. A evolucao para CQRS completo exigiria apenas trocar as implementacoes das interfaces sem alterar Application ou Domain.

---

## Estrategia para Eventos de Dominio

Pedidos publicam `OrderProcessingMessage(OrderId)` em uma fila in-memory (`ConcurrentQueue<T>`). O `OrderProcessingWorker` (BackgroundService) consome assincronamente e cria o DeliveryTerm.

A interface `IOrderProcessingQueue` serve como contrato — trocar a implementacao para RabbitMQ, Azure Service Bus ou AWS SQS nao exige mudancas nos handlers. O padrao `IServiceScopeFactory` dentro do Worker garante que scoped dependencies (DbContext, UnitOfWork) sao criadas corretamente dentro de um Singleton.

---

## Microservicos

A solucao atual e um monolito com camadas bem definidas, projetado para facilitar extracao como microsservicos:

- **Domain isolado**: zero dependencias externas, pode ser extraido como pacote NuGet compartilhado.
- **Interfaces desacopladas**: `IPasswordHasher`, `ITokenService`, `IOrderProcessingQueue` — trocar implementacoes nao impacta a logica de negocio.
- **Fila abstrata**: substituir `InMemoryOrderProcessingQueue` por RabbitMQ permite separar o Worker em um servico autonomo.
- **Queries independentes**: query services com Dapper podem apontar para um banco de leitura separado sem alterar a API.

---

## Decisoes Tecnicas

- **Sem MediatR**: CQRS Light sem complexidade adicional. Command handlers sao classes simples injetadas via DI.
- **Sem mensageria real**: fila in-memory com `ConcurrentQueue<T>` para simplicidade.
- **Sem microsservicos**: monolito com camadas bem definidas e interfaces desacopladas.
- **Sem Event Sourcing**: persistencia em estado atual.
- **BCrypt via interface** (`IPasswordHasher`): desacoplado, testavel e substituivel.
- **JWT via interface** (`ITokenService`): geracao de token extraida do controller para servico dedicado.
- **UnitOfWork** para consistencia transacional nas escritas.
- **Records** para DTOs (imutabilidade e concisao) com **Data Annotations** para validacao.
- **Fluent API** (EF Core) para separacao de mapeamentos.
- **Constantes `Roles`** centralizadas no Domain para type safety.
- **`GlobalExceptionMiddleware`** para tratamento uniforme de erros em toda a API.
- **React Native (Expo)**: conforme requisito do edital, com suporte web e layout responsivo.
- **Sidebar responsiva**: layout desktop-like em telas largas, drawer overlay em telas mobile.
- **Alertas cross-platform**: `showAlert`/`showConfirm` funcionam em web e mobile nativo.

---

## Consideracoes Arquiteturais e Evolucao

### Escalabilidade

A separacao entre leitura (Dapper) e escrita (EF Core) permite evoluir para um CQRS completo, com banco read-only otimizado e cache distribuido (Redis) sem impactar o dominio. As queries Dapper podem ser direcionadas para uma replica de leitura.

### Evolucao para Microsservicos

A fila in-memory pode ser substituida por **RabbitMQ** ou **Azure Service Bus**. A interface `IOrderProcessingQueue` serve como contrato — trocar a implementacao nao exige mudancas nos handlers. A camada Domain, isolada e sem dependencias externas, facilita extracao como servico autonomo.

### Consistencia

Escritas transacionadas via UnitOfWork (atomicidade entre Order e OrderItems). DeliveryTerm criado de forma assincrona pelo worker (consistencia eventual).

### Seguranca

- JWT com chave simetrica em `appsettings.json` (apenas para teste).
- Em producao: segredo em Azure Key Vault, refresh token com rotacao, Identity Provider real.
- Senhas com BCrypt via `IPasswordHasher` (custo 11).
- Usuarios desativaveis sem exclusao (soft disable).
- Cancelamento de pedidos com verificacao de ownership.
- Validacao de dados em todos os endpoints via Data Annotations.
- Middleware global de excecoes impede vazamento de stack traces.

### Observabilidade

Base para evolucao com:
- Logs estruturados (Serilog + Seq/Elasticsearch)
- Health Checks (`/health`)
- Metricas (Prometheus/Grafana)
- Distributed Tracing (OpenTelemetry)

---

## Estrutura Completa de Pastas

```
OrderManagement/
├── OrderManagement.sln
├── README.md
├── .gitignore
├── src/
│   ├── OrderManagement.API/
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── CustomersController.cs
│   │   │   ├── OrdersController.cs
│   │   │   ├── PaymentConditionsController.cs
│   │   │   └── UsersController.cs
│   │   ├── Middleware/
│   │   │   └── GlobalExceptionMiddleware.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── OrderManagement.Application/
│   │   ├── Commands/
│   │   │   ├── LoginCommandHandler.cs
│   │   │   ├── CreateOrderCommandHandler.cs
│   │   │   ├── ApproveOrderCommandHandler.cs
│   │   │   ├── CancelOrderCommandHandler.cs
│   │   │   ├── CreateCustomerCommandHandler.cs
│   │   │   ├── CreatePaymentConditionCommandHandler.cs
│   │   │   ├── CreateUserCommandHandler.cs
│   │   │   ├── UpdateUserCommandHandler.cs
│   │   │   └── ChangePasswordCommandHandler.cs
│   │   ├── DTOs/
│   │   │   ├── Request/
│   │   │   │   ├── CreateOrderRequest.cs
│   │   │   │   ├── CreateUserRequest.cs
│   │   │   │   ├── UpdateUserRequest.cs
│   │   │   │   ├── ChangePasswordRequest.cs
│   │   │   │   └── LoginRequest.cs
│   │   │   └── Response/
│   │   │       ├── OrderResponse.cs
│   │   │       ├── OrderDetailResponse.cs
│   │   │       ├── LoginResponse.cs
│   │   │       └── UserResponse.cs
│   │   └── Interfaces/
│   │       ├── IOrderQueryService.cs
│   │       ├── ICustomerQueryService.cs
│   │       ├── IPaymentConditionQueryService.cs
│   │       ├── IUserQueryService.cs
│   │       ├── IPasswordHasher.cs
│   │       ├── ITokenService.cs
│   │       └── IOrderProcessingQueue.cs
│   ├── OrderManagement.Domain/
│   │   ├── Constants/
│   │   │   └── Roles.cs
│   │   ├── Entities/
│   │   │   ├── Customer.cs
│   │   │   ├── DeliveryTerm.cs
│   │   │   ├── Order.cs
│   │   │   ├── OrderItem.cs
│   │   │   ├── PaymentCondition.cs
│   │   │   └── User.cs
│   │   ├── Enums/
│   │   │   └── OrderStatus.cs
│   │   └── Interfaces/
│   │       ├── IOrderRepository.cs
│   │       ├── ICustomerRepository.cs
│   │       ├── IPaymentConditionRepository.cs
│   │       ├── IUserRepository.cs
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
│       │       ├── PaymentConditionMapping.cs
│       │       └── UserMapping.cs
│       ├── Migrations/
│       ├── Queries/
│       │   ├── OrderQueryService.cs
│       │   ├── CustomerQueryService.cs
│       │   ├── PaymentConditionQueryService.cs
│       │   └── UserQueryService.cs
│       ├── Repositories/
│       │   ├── OrderRepository.cs
│       │   ├── CustomerRepository.cs
│       │   ├── PaymentConditionRepository.cs
│       │   ├── UserRepository.cs
│       │   └── UnitOfWork.cs
│       ├── Services/
│       │   ├── PasswordHasher.cs
│       │   └── TokenService.cs
│       └── DependencyInjection.cs
├── order-management-mobile/
│   ├── App.js
│   ├── package.json
│   └── src/
│       ├── context/
│       │   ├── AuthContext.js
│       │   └── I18nContext.js
│       ├── i18n/
│       │   └── translations.js
│       ├── navigation/
│       │   └── AppNavigator.js
│       ├── screens/
│       │   ├── LoginScreen.js
│       │   ├── OrdersScreen.js
│       │   ├── OrderDetailScreen.js
│       │   ├── CreateOrderScreen.js
│       │   ├── ApprovalQueueScreen.js
│       │   ├── CustomersScreen.js
│       │   ├── PaymentConditionsScreen.js
│       │   └── UsersScreen.js
│       ├── services/
│       │   └── api.js
│       └── utils/
│           └── helpers.js
├── order-management-web/                 # Frontend React Web (alternativo)
└── tests/
    └── OrderManagement.Tests/
        ├── Application/
        │   ├── CreateOrderCommandHandlerTests.cs
        │   ├── ApproveOrderCommandHandlerTests.cs
        │   ├── CancelOrderCommandHandlerTests.cs
        │   └── LoginCommandHandlerTests.cs
        └── Domain/
            └── OrderTests.cs
```

---

*Projeto de teste tecnico — Order Management System (Minerva Foods)*
