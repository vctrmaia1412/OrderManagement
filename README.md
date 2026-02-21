# OrderManagement

Sistema completo de Gerenciamento de Pedidos com backend ASP.NET Core Web API e frontend React Native (Expo). Desenvolvido como teste tecnico seguindo Clean Architecture, CQRS Light, autenticacao JWT, processamento assincrono e internacionalizacao em 3 idiomas.

---

## Tecnologias

### Backend
- **.NET 8** (ASP.NET Core Web API)
- **Entity Framework Core 8** (escrita / commands)
- **Dapper** (leitura / queries)
- **SQL Server 2022 Express**
- **BCrypt.Net** (hash de senhas)
- **JWT Authentication** (Microsoft.AspNetCore.Authentication.JwtBearer)
- **xUnit + Moq** (testes unitarios)

### Frontend
- **React Native** (Expo SDK 54)
- **React Navigation** (navegacao com sidebar customizada)
- **Axios** (HTTP client)
- **AsyncStorage** (persistencia local)
- **@react-native-picker/picker** (seletores)

---

## Arquitetura

Clean Architecture com 4 camadas:

```
OrderManagement/
├── OrderManagement.sln
├── src/
│   ├── OrderManagement.Domain/           # Entidades, Enums, Interfaces de repositorio
│   ├── OrderManagement.Application/      # Commands, DTOs, Interfaces de query
│   ├── OrderManagement.Infrastructure/   # EF Core, Dapper, Repos, Worker, Fila, Hash
│   └── OrderManagement.API/              # Controllers, JWT, CORS, Swagger
├── order-management-mobile/              # Frontend React Native (Expo)
├── order-management-web/                 # Frontend React Web (alternativo)
└── tests/
    └── OrderManagement.Tests/            # Testes unitarios (xUnit + Moq)
```

### Camada Domain
- Entidades: `Customer`, `PaymentCondition`, `Order`, `OrderItem`, `DeliveryTerm`, `User`
- Enums: `OrderStatus` (Criado, AguardandoAprovacao, Aprovado, Processando, Pago, Cancelado)
- Interfaces: `IOrderRepository`, `ICustomerRepository`, `IPaymentConditionRepository`, `IUnitOfWork`

### Camada Application
- Commands: `CreateOrderCommandHandler`, `ApproveOrderCommandHandler`, `CancelOrderCommandHandler`, `CreateCustomerCommandHandler`, `CreatePaymentConditionCommandHandler`
- DTOs Request: `CreateOrderRequest`, `LoginRequest`, `CreateUserRequest`, `UpdateUserRequest`, `ChangePasswordRequest`
- DTOs Response: `OrderResponse`, `OrderDetailResponse`, `LoginResponse`, `UserResponse`
- Interfaces: `IOrderQueryService`, `ICustomerQueryService`, `IPaymentConditionQueryService`, `IOrderProcessingQueue`

### Camada Infrastructure
- EF Core: `AppDbContext` com Fluent API mappings e seed data
- Repositorios com padrao UnitOfWork
- Queries Dapper com SQL direto para leitura otimizada
- `OrderProcessingWorker` (BackgroundService) + `InMemoryOrderProcessingQueue`
- `HashHelper` (BCrypt wrapper)

### Camada API
- Controllers: `AuthController`, `OrdersController`, `CustomersController`, `PaymentConditionsController`, `UsersController`
- JWT + CORS + Swagger configurados em `Program.cs`

---

## CQRS Light

O projeto adota um **CQRS leve** (sem MediatR nem event sourcing):

- **Commands**: utilizam Entity Framework Core via UnitOfWork e repositorios para **escrita**.
- **Queries**: utilizam **Dapper** com SQL direto para **leitura**, permitindo consultas otimizadas.
- Separacao logica entre leitura e escrita, sem introduzir infraestrutura de mensageria ou bibliotecas adicionais.

---

## Regras de Negocio

- **Pedidos <= R$ 5.000**: criados com status **Pago** e `RequiresManualApproval = false`.
- **Pedidos > R$ 5.000**: criados com status **Criado** e `RequiresManualApproval = true`. Requerem aprovacao manual via `PUT /api/orders/{id}/approve`, que altera o status para **Pago**.
- **Todos os pedidos** sao publicados na fila de processamento para calculo de prazo de entrega (DeliveryTerm de 10 dias).

---

## Processamento Assincrono (Fila + Worker)

1. `POST /api/orders` cria o pedido e publica `OrderProcessingMessage(OrderId)` na fila in-memory.
2. `OrderProcessingWorker` (BackgroundService) consome a mensagem.
3. O worker simula processamento (delay 2s) e insere um `DeliveryTerm` com prazo de 10 dias.
4. Simulacao de message broker real (RabbitMQ/Azure Service Bus) sem dependencias externas.

---

## Autenticacao e Autorizacao

### JWT
- `POST /api/auth/login` retorna token JWT com claims: `Name`, `Role`, `Jti`.
- Todos os endpoints (exceto login) protegidos com `[Authorize]`.
- Senhas armazenadas com **BCrypt** (hash no banco de dados).
- Autenticacao contra tabela `Users` no SQL Server (nao mais hardcoded).

### 3 Perfis de Acesso

| Perfil | Descricao | Permissoes |
|--------|-----------|------------|
| **Admin** | Administrador do sistema | Tudo + Gerenciar usuarios (CRUD, ativar/desativar, trocar senha, alterar perfil) |
| **Manager** (Gerente) | Gerente comercial | Ver todos os pedidos + Aprovar pedidos + Ver fila de aprovacao |
| **User** (Usuario) | Operador comum | Criar pedidos + Ver apenas seus proprios pedidos |

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
| PUT | `/api/orders/{id}/cancel` | Cancelar pedido | Autenticado |
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
| **Meus Pedidos** | Lista de pedidos com botao de aprovar inline | Todos |
| **Novo Pedido** | Formulario com cliente, condicao de pagamento e itens | Todos |
| **Detalhe do Pedido** | Informacoes completas + aprovar/cancelar | Todos |
| **Fila de Aprovacao** | Pedidos pendentes de aprovacao manual (> R$ 5.000) | Admin, Manager |
| **Clientes** | Listagem e cadastro de clientes | Todos |
| **Cond. Pagamento** | Listagem e cadastro de condicoes | Todos |
| **Usuarios** | Gerenciamento completo de usuarios | Admin |

### Navegacao

- **Sidebar lateral** (layout profissional desktop-like)
- Menu de **Configuracoes** (engrenagem) no rodape com: Perfil, Idioma (PT/US/ES), Sair
- Badge dinamico na Fila de Aprovacao (atualiza a cada 10s)

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

---

## Decisoes Tecnicas

- **Sem MediatR**: CQRS Light sem complexidade adicional.
- **Sem mensageria real**: fila in-memory com `ConcurrentQueue<T>`.
- **Sem microsservicos**: monolito com camadas bem definidas.
- **Sem Event Sourcing**: persistencia em estado atual.
- **BCrypt** para hash de senhas (nao texto puro).
- **UnitOfWork** para consistencia transacional nas escritas.
- **Records** para DTOs (imutabilidade e concisao).
- **Fluent API** (EF Core) para separacao de mapeamentos.
- **React Native (Expo)**: conforme requisito do edital, com suporte web.
- **Sidebar navigation**: layout profissional adaptado para web.

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
- Senhas com BCrypt (custo 11).
- Usuarios desativaveis sem exclusao (soft disable).

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
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── OrderManagement.Application/
│   │   ├── Commands/
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
│   ├── OrderManagement.Domain/
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
│       ├── Repositories/
│       ├── HashHelper.cs
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
│       └── services/
│           └── api.js
├── order-management-web/                 # Frontend React Web (alternativo)
└── tests/
    └── OrderManagement.Tests/
```

---

*Projeto de teste tecnico — Order Management System (Minerva Foods)*
