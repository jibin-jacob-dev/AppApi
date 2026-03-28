# Empower Fitness Studio — Implementation Plan

A cross-platform gym mobile app (Android & iOS) with a scalable backend.

| Layer      | Technology                          | Status |
|------------|-------------------------------------|--------|
| Mobile App | React Native + Expo (JavaScript)    | 🟢 Active |
| Backend    | .NET 8 Web API (C#)                 | 🟢 Active |
| Database   | SQL Server + Entity Framework Core  | 🟢 Active |
| Auth       | JWT + Google Sign-In + Biometrics   | 🟢 Active |
| Design     | Premium Card-Based Design System    | 🟢 Active |

---

## 1. Project Structure

```
c:\Users\jibin\source\repos\empower\
├── assets/                    # Logo & shared assets
├── EmpowerAPI/                # .NET 8 Web API
│   ├── Controllers/           # API controllers
│   ├── Models/                # Entity models
│   ├── DTOs/                  # Data transfer objects
│   ├── Data/                  # DbContext & migrations
│   ├── Services/              # Business logic
│   ├── Middleware/            # Custom middleware
│   └── Program.cs
└── EmpowerApp/                # Expo React Native app
    ├── app/                   # Expo Router file-based routing
    │   ├── (auth)/            # Auth screens (Login, Register)
    │   ├── (tabs)/            # Main tab screens
    │   │   ├── home.jsx
    │   │   ├── products.jsx
    │   │   ├── trainings.jsx
    │   │   └── profile.jsx
    │   ├── admin/             # Manage Portal & Training Editor (Admin Only)
    │   └── _layout.jsx        # Root Layout with ThemeProvider
    ├── components/            # Reusable UI components
    ├── services/              # API client & auth helpers
    ├── hooks/                 # Custom hooks
    ├── constants/             # Theme, colors, config
    └── assets/                # App-specific images & icons
```

---

## 2. Database Schema (SQL Server)

### Users
| Column          | Type           | Notes                              |
|-----------------|----------------|-------------------------------------|
| Id              | uniqueidentifier | PK, default `NEWID()`             |
| Email           | nvarchar(256)  | Unique, required                    |
| PasswordHash    | nvarchar(max)  | Nullable (for Google Auth users)    |
| FullName        | nvarchar(200)  | Required                            |
| ProfileImageUrl | nvarchar(500)  | Nullable                            |
| Phone           | nvarchar(20)   | Nullable                            |
| Address         | nvarchar(500)  | Nullable                            |
| DateOfBirth     | date           | Nullable                            |
| Gender          | nvarchar(10)   | Nullable                            |
| HeightCm        | decimal(5,2)   | Nullable                            |
| WeightKg        | decimal(5,2)   | Nullable                            |
| Role            | nvarchar(20)   | `Admin` / `Trainer` / `Client`      |
| GoogleId        | nvarchar(256)  | Nullable, for Google-linked users   |
| IsActive        | bit            | Default `1`                         |
| CreatedAt       | datetime2      | Default `GETUTCDATE()`              |
| UpdatedAt       | datetime2      | Nullable                            |

### Products
| Column          | Type           | Notes                              |
|-----------------|----------------|-------------------------------------|
| Id              | int            | PK, Identity                        |
| Name            | nvarchar(200)  | Required                            |
| Description     | nvarchar(max)  | Nullable                            |
| Price           | decimal(10,2)  | Required                            |
| ImageUrl        | nvarchar(500)  | Nullable                            |
| Category        | nvarchar(100)  | e.g., Supplement, Clothing, Accessory |
| StockQuantity   | int            | Default `0`                         |
| IsActive        | bit            | Default `1`                         |
| CreatedAt       | datetime2      | Default `GETUTCDATE()`              |
| UpdatedAt       | datetime2      | Nullable                            |

### Trainings
| Column          | Type           | Notes                              |
|-----------------|----------------|-------------------------------------|
| Id              | int            | PK, Identity                        |
| Title           | nvarchar(200)  | Required                            |
| Description     | nvarchar(max)  | Nullable                            |
| VideoUrl        | nvarchar(500)  | Required (URL to video)             |
| ThumbnailUrl    | nvarchar(500)  | Nullable                            |
| Category        | nvarchar(100)  | e.g., Strength, Cardio, Yoga        |
| DurationMinutes | int            | Nullable                            |
| Difficulty      | nvarchar(20)   | Easy / Medium / Hard                |
| TrainerId       | uniqueidentifier | FK → Users.Id                     |
| IsActive        | bit            | Default `1`                         |
| CreatedAt       | datetime2      | Default `GETUTCDATE()`              |
| UpdatedAt       | datetime2      | Nullable                            |

> [!NOTE]
> Tables are designed to be extensible. New columns and related tables (e.g., Orders, Favorites, WorkoutLogs) can be added later without breaking changes.

---

## 3. Backend API (.NET 8)

### Setup
- **Project template**: `dotnet new webapi`
- **Packages**: `Microsoft.EntityFrameworkCore.SqlServer`, `Microsoft.AspNetCore.Authentication.JwtBearer`, `Microsoft.AspNetCore.Identity.EntityFrameworkCore`, `Swashbuckle.AspNetCore`
- **Connection string** stored in `appsettings.json` (user configurable)
- **Automated Admin Seeding**: System automatically creates `jacob@gmail.com` / `Admin@1234` as 'Sys Admin' on startup via `Program.cs`.

### API Endpoints

#### Auth Controller (`/api/auth`)
| Method | Endpoint           | Description                    | Access    |
|--------|--------------------|--------------------------------|-----------|
| POST   | `/register`        | Register a new client          | Public    |
| POST   | `/login`           | Login (email + password)       | Public    |
| POST   | `/google-login`    | Login/register via Google token| Public    |
| GET    | `/me`              | Get current user info          | Logged-in |

#### Profile Controller (`/api/profile`)
| Method | Endpoint           | Description                    | Access    |
|--------|--------------------|--------------------------------|-----------|
| GET    | `/`                | Get own profile                | Logged-in |
| PUT    | `/`                | Update own profile             | Logged-in |
| POST   | `/upload-image`    | Upload profile image           | Logged-in |

#### Products Controller (`/api/products`)
| Method | Endpoint           | Description                    | Access    |
|--------|--------------------|--------------------------------|-----------|
| GET    | `/`                | List all products (paginated)  | Logged-in |
| GET    | `/{id}`            | Get product by ID              | Logged-in |
| POST   | `/`                | Create a product               | Admin     |
| PUT    | `/{id}`            | Update a product               | Admin     |
| DELETE | `/{id}`            | Soft-delete a product          | Admin     |

#### Trainings Controller (`/api/trainings`)
| Method | Endpoint           | Description                    | Access    |
|--------|--------------------|--------------------------------|-----------|
| GET    | `/`                | List all trainings (paginated) | Logged-in |
| GET    | `/{id}`            | Get training by ID             | Logged-in |
| POST   | `/`                | Create a training              | Admin/Trainer |
| PUT    | `/{id}`            | Update a training              | Admin/Trainer |
| DELETE | `/{id}`            | Soft-delete a training         | Admin/Trainer |

---

## 4. Mobile App (Expo + React Native)

### Navigation Structure
```
Root Layout
├── (auth)              # Unauthenticated stack
│   ├── login.jsx       # Email/pass + Google button
│   └── register.jsx    # Registration form
└── (tabs)              # Authenticated bottom tabs
    ├── home.jsx        # Dashboard overview
    ├── products.jsx    # Product listing
    ├── trainings.jsx   # Training video listing
    └── profile.jsx     # User profile
```

### Theming
- Use `useColorScheme()` from React Native to detect system dark/light mode
- Define brand colors derived from logo:
  - **Primary**: `#E5A912` (gold/yellow)
  - **Secondary**: `#333333` (dark grey)
  - **Accent**: `#8B7A2E` (olive gold)
- Separate light & dark palettes with consistent semantic tokens
- **ThemeContext**: Global theme management supporting System Default, Light, and Dark modes.
- **Premium Card Standards**: All screens use 20px radius cards, 1.5px borders, and tinted icon backgrounds (`color + '15'`).
- **Fixed-Focus Pattern**: Sub-components defined outside main bodies to preserve keyboard focus during state updates.

### Screen Details

#### Home Screen
- Welcome banner with user's name
- **Quick Profile** card showing avatar, name, membership info
- **Featured Products** horizontal scroll (top 5 products from API)
- **Latest Trainings** horizontal scroll (latest 5 training videos from API)

#### Products Screen
- Category filter chips (All, Supplements, Clothing, Accessories)
- Product grid/list with image, name, price
- Tap to view product detail (modal or new screen)

#### Trainings Screen
- Category filter (All, Strength, Cardio, Yoga, etc.)
- Difficulty filter (Easy, Medium, Hard)
- Training card with thumbnail, title, duration, difficulty
- Tap to view details & play video

#### Profile Screen
- Profile image (tap to change)
- Editable fields: name, email, phone, address, DOB, gender, height, weight
- Save button to update via API
- Logout button

### Authentication Flow
1. **Email/Password**: Standard login → JWT token stored in `expo-secure-store`
2. **Google Sign-In**: Use `expo-auth-session` for Google OAuth → send token to backend → JWT returned
3. **Biometrics**: Use `expo-local-authentication` to lock/unlock the app (after initial login, biometrics protect stored JWT)

---

## 5. Key Packages

### Backend (.NET 8)
- `Microsoft.EntityFrameworkCore.SqlServer` — SQL Server ORM
- `Microsoft.AspNetCore.Authentication.JwtBearer` — JWT auth
- `Microsoft.AspNetCore.Identity.EntityFrameworkCore` — Identity management
- `Swashbuckle.AspNetCore` — Swagger docs

### Mobile (Expo)
- `expo-router` — File-based navigation
- `expo-secure-store` — Secure token storage
- `expo-auth-session` — Google OAuth
- `expo-local-authentication` — Biometrics
- `expo-image-picker` — Profile photo
- `expo-video` — Training video playback
- `@react-native-async-storage/async-storage` — Local storage
- `axios` — HTTP client

---

## 6. Scalability Considerations

- **Modular folder structure**: Each feature is isolated, easy to add new tabs/sections
- **Repository pattern** in backend for clean data access
- **Paginated APIs** to handle growing data
- **Role-based access** built in from day one
- **Soft deletes** to preserve data integrity
- **Separate DTOs** from entity models for API contracts
- **File-based routing** in Expo makes adding new screens trivial

---

## User Review Required

> [!IMPORTANT]
> **SQL Server Connection**: You will need to provide the SQL Server connection string (server name, database name, credentials) before we can run migrations. I'll use a placeholder in `appsettings.json` that you can update.

> [!IMPORTANT]
> **Google OAuth Client ID**: To enable Google Sign-In, you'll need a Google Cloud project with OAuth 2.0 credentials configured for both Android and iOS. I can set up the code with a placeholder config.

---

## Verification Plan

### Automated Testing
1. **Backend API**: Run the project with `dotnet run` and test endpoints via Swagger UI at `https://localhost:{port}/swagger`
2. **Database Migrations**: Verify with `dotnet ef migrations add Initial` and `dotnet ef database update`

### Manual Testing
1. **Mobile App**: Start with `npx expo start`, scan QR code with Expo Go on phone (or use emulator) to test:
   - Login / Register flow
   - Home screen loads profile summary, products, trainings
   - Products screen displays items with filtering
   - Trainings screen shows videos with filtering
   - Profile screen allows editing and saving
   - Dark/light theme switches correctly
2. **API Integration**: Use the app to create/edit/view data and verify it persists in SQL Server via SSMS or Swagger
