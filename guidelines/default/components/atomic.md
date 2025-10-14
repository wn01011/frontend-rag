---
title: Atomic Design Pattern
type: pattern
category: components
tags: [atomic, design-pattern, architecture]
---

# Atomic Design Pattern

## Overview

Atomic Design is a methodology for creating design systems with five distinct levels:

1. **Atoms** - Basic building blocks
2. **Molecules** - Simple combinations of atoms
3. **Organisms** - Complex UI components
4. **Templates** - Page-level layouts
5. **Pages** - Specific instances of templates

## Directory Structure

```
src/components/
  atoms/
    Button/
      Button.tsx
      Button.module.css
      Button.test.tsx
      index.ts
    Input/
    Icon/
    Text/
  molecules/
    SearchBar/
    FormField/
    Card/
  organisms/
    Header/
    NavigationMenu/
    UserProfile/
  templates/
    PageTemplate/
    DashboardTemplate/
  pages/
    HomePage/
    ProfilePage/
```

## Atoms

Basic HTML elements with minimal styling:

```tsx
// atoms/Button/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

## Molecules

Combinations of atoms working together:

```tsx
// molecules/SearchBar/SearchBar.tsx
import { Input } from '../../atoms/Input';
import { Button } from '../../atoms/Button';
import { Icon } from '../../atoms/Icon';

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  return (
    <div className={styles.searchBar}>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <Button onClick={() => onSearch(query)}>
        <Icon name="search" />
      </Button>
    </div>
  );
};
```

## Organisms

Complex components composed of molecules and atoms:

```tsx
// organisms/Header/Header.tsx
import { Logo } from '../../atoms/Logo';
import { NavigationMenu } from '../../molecules/NavigationMenu';
import { SearchBar } from '../../molecules/SearchBar';
import { UserMenu } from '../../molecules/UserMenu';

export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className={styles.header}>
      <Logo />
      <NavigationMenu />
      <SearchBar />
      <UserMenu />
    </header>
  );
};
```

## Templates

Page layouts without real content:

```tsx
// templates/PageTemplate/PageTemplate.tsx
interface PageTemplateProps {
  header: React.ReactNode;
  sidebar?: React.ReactNode;
  content: React.ReactNode;
  footer: React.ReactNode;
}

export const PageTemplate: React.FC<PageTemplateProps> = ({
  header,
  sidebar,
  content,
  footer,
}) => {
  return (
    <div className={styles.pageLayout}>
      <div className={styles.headerSection}>{header}</div>
      <div className={styles.mainSection}>
        {sidebar && <aside className={styles.sidebar}>{sidebar}</aside>}
        <main className={styles.content}>{content}</main>
      </div>
      <div className={styles.footerSection}>{footer}</div>
    </div>
  );
};
```

## Best Practices

### 1. Single Responsibility
Each component should have one clear purpose.

### 2. Composition over Inheritance
Build complex components by composing simpler ones.

### 3. Props Interface
Always define clear prop interfaces:

```tsx
interface ComponentProps {
  // Required props
  id: string;
  title: string;
  
  // Optional props
  description?: string;
  className?: string;
  
  // Callback props
  onClick?: (id: string) => void;
  
  // Children
  children?: React.ReactNode;
}
```

### 4. Atomic Design Benefits
- **Consistency** - Reusable components ensure UI consistency
- **Modularity** - Easy to maintain and update
- **Scalability** - Clear hierarchy for growing applications
- **Testing** - Easier to test isolated components
- **Documentation** - Natural component library structure