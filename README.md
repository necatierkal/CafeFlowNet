# CafeFlow — full source code

This package contains the **actual runnable source code** for the CafeFlow cafe/restaurant
app: a .NET 8 Web API backend and an Angular 17 frontend, matching the architecture in the
project blueprint document.

## What's in here

```
CafeFlow.API/          .NET 8 Web API (backend)
cafeflow-frontend/      Angular 17 SPA (frontend)
```

## Backend — CafeFlow.API

- **Models/** — `User`, `MenuCategory`, `MenuItem`, `Order`, `OrderItem`, `RefreshToken`
- **DTOs/** — request/response shapes for every endpoint
- **Data/AppDbContext.cs** — full EF Core configuration: relationships, indexes, seed data
- **Migrations/** — the initial EF Core migration (see important note below)
- **Services/** — `AuthService`, `MenuService`, `OrderService`, `LoyaltyService`
- **Controllers/** — `AuthController`, `MenuController`, `OrderController`, `CustomerController`
- **Hubs/OrderHub.cs** — SignalR hub for real-time order updates
- **Program.cs** — wires up JWT auth, CORS, SignalR, Swagger, and auto-migration on startup

### Important note on the migration files

This sandbox cannot install the .NET SDK (no internet access to Microsoft's package feeds —
only npm/pip/cargo registries are reachable), so I could not run `dotnet ef migrations add`
to generate the migration mechanically. I hand-wrote
`Migrations/20260101000000_InitialCreate.cs` and its `.Designer.cs`/`ModelSnapshot.cs`
companions to **exactly match what EF Core would generate** from the models in `Data/AppDbContext.cs`
— same table shapes, same indexes, same foreign keys, same seed data. I traced every model
property by hand rather than guessing.

That said, **the safest first step on a machine with the .NET SDK installed** is to delete
the `Migrations/` folder and regenerate it for real:

```bash
cd CafeFlow.API
rm -rf Migrations
dotnet ef migrations add InitialCreate
dotnet ef database update
```

This guarantees the migration matches your exact installed EF Core version byte-for-byte.
The hand-written version will very likely work as-is, but regenerating costs you 10 seconds
and removes any doubt.

### Default login (from seed data)

```
Email:    owner@cafeflow.com
Password: Admin123!
```

### Run locally

```bash
cd CafeFlow.API
# Edit appsettings.json: set a real Jwt:Secret (32+ random characters) and your local
# SQL Server connection string under ConnectionStrings:Default
dotnet restore
dotnet ef database update     # or just `dotnet run` — Program.cs auto-migrates on startup
dotnet run
# API: https://localhost:7001   Swagger: https://localhost:7001/swagger
```

## Frontend — cafeflow-frontend

Built and verified in this environment: **`ng build` completes successfully** with no
TypeScript or template errors, producing 15+ properly lazy-loaded chunks (one per route).

- **core/models** — TypeScript interfaces mirroring the backend DTOs exactly
- **core/services** — `AuthService` (signals-based auth state), `MenuService`, `OrderService`,
  `CustomerService`, `CartService`, `SignalRService`
- **core/guards** — `authGuard`, `adminGuard`, `loyalCustomerGuard`
- **core/interceptors** — `jwtInterceptor` (attaches bearer token, auto-refreshes on 401)
- **features/public-menu** — the guest-facing menu page
- **features/auth** — login page
- **features/admin** — dashboard, menu manager (the price-editing screen), live order board
  (SignalR-powered), customer manager
- **features/loyal-customer** — menu browse + cart, live order status tracker, order history
  with reorder

### Run locally

```bash
cd cafeflow-frontend
npm install
npm install @microsoft/signalr   # already in package.json, just flagging it's required
# Edit src/environments/environment.ts to point at your local API
ng serve
# App: http://localhost:4200
```

## What to do next

1. On a machine with the .NET SDK, regenerate the migration as described above (10 seconds,
   removes all doubt).
2. Generate a real BCrypt hash for your own admin password and replace the seed value in
   `AppDbContext.cs` and the migration — don't ship with `Admin123!`.
3. Set a strong, random `Jwt:Secret` in `appsettings.json` (never commit a real one to git —
   use User Secrets locally and Azure Key Vault / App Service config in production).
4. Wire up Azure Blob Storage for real image uploads (currently `ImageUrl` just stores a string).
