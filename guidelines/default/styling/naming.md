---
title: Component Naming Conventions
type: style
category: styling
tags: [naming, conventions, components]
---

# Component Naming Conventions

## File Naming

### Components
- **React Components**: PascalCase - `UserProfile.tsx`, `NavigationMenu.tsx`
- **Utilities**: camelCase - `formatDate.ts`, `apiClient.ts`
- **Constants**: UPPER_SNAKE_CASE in file - `API_CONFIG.ts`
- **Hooks**: camelCase with 'use' prefix - `useAuth.ts`, `useLocalStorage.ts`

### Directory Structure
```
src/
  components/
    common/           # Shared components
    features/         # Feature-specific components
    layouts/          # Layout components
  hooks/             # Custom hooks
  utils/             # Utility functions
  types/             # TypeScript type definitions
  styles/            # Global styles
```

## Component Naming

### React Components
```tsx
// Component file: UserProfile.tsx
export const UserProfile: React.FC<UserProfileProps> = () => { }

// Interface naming
interface UserProfileProps { }
interface UserProfileState { }

// Type naming
type UserRole = 'admin' | 'user' | 'guest';
```

### Event Handlers
```tsx
// Prefix with 'handle' or 'on'
const handleClick = () => { };
const handleSubmit = () => { };
const onUserSelect = () => { };
```

### Boolean Variables
```tsx
// Prefix with 'is', 'has', 'can', 'should'
const isLoading = true;
const hasError = false;
const canEdit = true;
const shouldRender = false;
```

## CSS Class Naming

### BEM-inspired naming for CSS Modules
```css
/* Block */
.userCard { }

/* Element */
.userCardTitle { }
.userCardContent { }

/* Modifier */
.userCardLarge { }
.userCardDisabled { }
```

## Props Naming

### Callback Props
```tsx
interface ButtonProps {
  onClick?: () => void;
  onHover?: (event: MouseEvent) => void;
  onFocus?: () => void;
}
```

### Boolean Props
```tsx
interface ComponentProps {
  isDisabled?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  showModal?: boolean;
}
```

### Data Props
```tsx
interface ListProps {
  items: Item[];
  selectedItem?: Item;
  defaultValue?: string;
}
```

## File Organization

### Component File Structure
```tsx
// 1. Imports
import React from 'react';
import styles from './Component.module.css';

// 2. Types/Interfaces
interface ComponentProps { }

// 3. Constants
const DEFAULT_VALUE = 10;

// 4. Component
export const Component: React.FC<ComponentProps> = () => { };

// 5. Helper components (if any)
const SubComponent = () => { };

// 6. Default export (if needed)
export default Component;
```

## Naming Conventions Summary

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile` |
| Functions | camelCase | `getUserData` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Interfaces | PascalCase with 'I' prefix optional | `IUserData` or `UserData` |
| Types | PascalCase | `UserRole` |
| Enums | PascalCase | `UserStatus` |
| Hooks | camelCase with 'use' | `useAuth` |
| Event Handlers | 'handle' or 'on' prefix | `handleClick` |
| Boolean | 'is', 'has', 'can' prefix | `isLoading` |