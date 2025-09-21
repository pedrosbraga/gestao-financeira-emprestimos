# Gestão Financeira de Empréstimos - Source Code Structure

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Button, Input, etc.)
│   ├── auth/           # Authentication-related components
│   ├── summary/        # Summary module components
│   ├── clients/        # Client management components
│   ├── loans/          # Loan management components
│   └── payments/       # Payment management components
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   ├── summary/        # Summary screens
│   ├── clients/        # Client management screens
│   ├── loans/          # Loan management screens
│   ├── payments/       # Payment management screens
│   └── reports/        # Reports and dashboard screens
├── services/           # Business logic and API services
│   ├── auth/           # Authentication services
│   ├── supabase/       # Supabase client and configuration
│   ├── storage/        # Local storage services
│   └── sync/           # Data synchronization services
├── store/              # Redux store configuration
│   ├── slices/         # Redux slices
│   └── middleware/     # Custom middleware
├── navigation/         # Navigation configuration
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── constants/          # App constants and theme
└── config/             # Configuration files
```

## Architecture

This project follows a layered architecture:

1. **Presentation Layer**: React Native components and screens
2. **Business Logic Layer**: Services and Redux store
3. **Data Access Layer**: Supabase client and local storage

## Key Technologies

- **React Native**: Mobile app framework
- **TypeScript**: Type safety
- **Redux Toolkit**: State management
- **React Navigation**: Navigation
- **Supabase**: Backend as a Service
- **SQLite**: Local database for offline support

## Development Guidelines

1. Follow the established folder structure
2. Use TypeScript for all new files
3. Follow the naming conventions (PascalCase for components, camelCase for functions)
4. Write tests for business logic
5. Use the theme constants for consistent styling
6. Follow the Redux patterns established in the slices

## Next Steps

This is the initial project setup. The following tasks will implement:

1. Supabase configuration and authentication (Task 2)
2. Data models and synchronization (Task 3)
3. Navigation and UI structure (Task 4)
4. Individual modules (Tasks 5-8)
5. Testing and optimization (Tasks 9-11)