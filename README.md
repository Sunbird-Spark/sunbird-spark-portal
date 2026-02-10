# Sunbird Portal

A modern, scalable educational platform built with React and Node.js, designed for national-scale deployment.Sunbird is a next-generation scalable open-source learning solution for teachers and tutors. Built for the 21st century with state-of-the-art technology, Sunbird runs natively in cloud/mobile environments. The open-source governance of Sunbird allows a massive community of nation-builders to co-create and extend the solution in novel ways.

## Tech Stack

### Frontend
- **React**: 19.2.1
- **TypeScript**: 5.9.3
- **Vite**: 7.3.1
- **Testing**: Vitest
- **HTTP Client**: Axios 1.13.2

### Backend
- **Node.js**: 24.12.0
- **Express**: 5.2.1
- **TypeScript**: 5.9.3
- **CORS**: 2.8.5

### Development Tools
- **ESLint**: 9.39.2 with TypeScript support
- **Prettier**: 3.7.4
- **SonarQube**: Integrated code quality analysis
- **GitHub Actions**: Automated CI/CD pipeline

## Prerequisites

- **Node.js**: 24.12.0
- **npm**: Latest version
- **Git**: For version control

### Using Node Version Manager (nvm)

```bash
# Install and use the correct Node.js version
nvm install 24.12.0
nvm use 24.12.0
```

## Project Structure

```
SunbirdEd-portal/
├── .github/                    # CI/CD workflows & GitHub config
│   ├── copilot-instructions.md
│   └── workflows/
│       └── pull-request.yml
├── frontend/                   # React application
│   ├── public/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── components/
│   │   └── configs/
│   │   └── hooks/
│   │   └── locales/
│   │   └── pages/
│   │   └── styles/
│   │   └── api/
│   │   └── types/
│   ├── .prettierrc            # Prettier configuration
│   ├── eslint.config.js       # ESLint configuration
│   ├── vitest.config.ts       # Vitest configuration
│   ├── package.json
│   ├── tsconfig.json          # TypeScript configuration
│   ├── tsconfig.node.json     # Node TypeScript config
│   └── vite.config.ts         # Vite build configuration
├── backend/                   # Express API server
│   ├── src/
│   │   ├── app.ts
│   │   └── server.ts
│   │   └── controllers
│   │   └── middlewares
│   │   └── proxies
│   │   └── routes
│   │   └── services
│   │   └── types
│   ├── .prettierrc            # Prettier configuration
│   ├── eslint.config.js       # ESLint configuration
│   ├── package.json
│   ├── tsconfig.json          # TypeScript configuration
├── .gitignore                 # Git ignore rules
├── README.md                  # This file
└── sonar-project.properties   # SonarQube configuration
```

##  Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sunbird-portal
```

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

#### Available Frontend Scripts

```bash

# Build for production
npm run build

# Start development server (http://localhost:5173)
npm run dev

# Preview production build
npm run preview

# Run tests
npm run test
npm run test:coverage  # With coverage report

# Code quality
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
npm run type-check    # TypeScript type checking
```

### 3. Backend Setup

Open a new terminal, navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```
#### i. Configure Environment Variables

**Before running the backend**, you must create and configure your `.env` file:

```bash
cd backend
cp .envExample .env
```

**Important**: After copying, edit `backend/.env` and make these changes for local development:

1. **Change `ENVIRONMENT`** from `test` to `local`:
   ```bash
   ENVIRONMENT=local
   ```

2. **Remove or comment out `NODE_ENV`**:
   ```bash
   # NODE_ENV=test  (comment out or delete this line)
   ```

3. **Update other values** with your actual configuration (database credentials, API tokens, etc.)

> **Note**: The `.envExample` file is configured for automated testing (CI/CD). For local development, you must change `ENVIRONMENT=test` to `ENVIRONMENT=local` and remove the `NODE_ENV` variable.

#### Environment Configuration Files

Three files manage environment configuration in the `backend` folder:

- **`backend/.env`** - Your local values (create from `.envExample`)
- **`backend/.envExample`** - Template with required variables
- **`backend/src/config/env.ts`** - TypeScript module with defaults

#### Configuration Types

**Required Variables** - Must be set in `.env`:
- Listed in `.envExample`
- Examples: Database credentials, API tokens, session secrets

**Optional Variables** - Have defaults, don't need to be in `.env`:
- NOT listed in `.envExample`
- Defined only in `env.ts` with default values
- Examples: `PORT`, `SUNBIRD_PORTAL_LOG_LEVEL`

#### Adding New Configuration

**Optional Variable** (has a default):
Add ONLY to `env.ts`:
```typescript
//Optional ENVIRONMENT VARIABLES
NEW_OPTIONAL_CONFIG: env.NEW_OPTIONAL_CONFIG || 'default-value',
```

**Required Variable** (must be configured):
1. Add to `env.ts`:
```typescript
NEW_REQUIRED_CONFIG: env.NEW_REQUIRED_CONFIG || 'fallback-value',
```
2. Add to `.envExample`:
```bash
NEW_REQUIRED_CONFIG=your-value-here
```
3. Add to your `.env` and notify team members

#### Available Backend Scripts

```bash

# Start server
npm run start

# Code quality
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
```

### 4. Running Both Services

#### Option 1: Separate Terminals
1. **Terminal 1 (Backend)**:
   ```bash
   cd backend
   npm run start
   ```

2. **Terminal 2 (Frontend)**:
   ```bash
   cd frontend
   npm run dev
   ```


## Application URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## Testing

### Frontend Testing
The frontend uses vitest with React Testing Library:

```bash
cd frontend
npm run test           # Run all tests
npm run test:coverage  # Generate coverage report
```

### Backend Testing
Backend testing setup is ready but tests need to be implemented:

```bash
cd backend
npm run test           # Run all tests
npm run test:coverage  # Generate coverage report
```

## Code Quality

This project enforces strict code quality standards:

### TypeScript Configuration
- **Strict mode enabled** across both frontend and backend
- **Comprehensive type checking** with `noUncheckedIndexedAccess`

### ESLint Rules
- TypeScript-first linting configuration
- Prettier integration for consistent formatting

### Pre-commit Quality Checks
```bash
# Frontend
cd frontend
npm run lint && npm run type-check

# Backend
cd backend
npm run lint && npm run type-check
```
## Code Formatting (Prettier)

This repository uses Prettier to enforce consistent code formatting.

```bash
cd frontend
npm run format       # formats files
npm run format:check # checks formatting (CI)
```

```bash
cd backend
npm run format       # formats files
npm run format:check # checks formatting (CI)
```
### Build

#### Frontend
```bash
cd frontend
npm run build
# Output: frontend/dist/
```

#### Backend
```bash
cd backend
npm run start
# Output: backend/dist/
```

## CI/CD Pipeline

The project includes a GitHub Actions workflow ([.github/workflows/pull-request.yml](.github/workflows/pull-request.yml)) that runs on every pull request:

-  **Linting** (ESLint)
-  **Type checking** (TypeScript)
-  **Testing** (Vitest)
-  **SonarQube analysis** (Code quality & security)

## Development Workflow

1. **Create feature branch**: `git checkout -b feature/your-feature-name`
2. **Make changes** following TypeScript strict guidelines
3. **Run quality checks**:
   ```bash
   cd frontend && npm run lint && npm run type-check
   cd ../backend && npm run lint && npm run type-check
   ```
4. **Commit changes**: Follow conventional commit format
5. **Create pull request**: CI pipeline will run automatically

## Additional Resources

- [React 19.2.1 Documentation](https://react.dev/)
- [Vite 7+ Guide](https://vite.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Troubleshooting

### Common Issues

1. **Node.js version mismatch**: Ensure you're using Node.js 24.12.0
   ```bash
   nvm install 24.12.0
   nvm use 24.12.0

   ```

2. **Port conflicts**:
   - Frontend (5173) and Backend (3000) ports should be available
   - Change ports in [vite.config.ts](frontend/vite.config.ts) or [server.ts](backend/src/server.ts) if needed

3. **TypeScript errors**: Run type check to identify issues
   ```bash
   npm run type-check
   ```

## License

MIT License - see LICENSE file for details.

---
