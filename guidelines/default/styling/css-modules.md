---
title: CSS Modules Guidelines
type: style
category: styling
tags: [css-modules, styles, conventions]
---

# CSS Modules Guidelines

## File Naming Convention

CSS Module files should follow this naming pattern:
- Component styles: `ComponentName.module.css`
- Page styles: `PageName.module.css`
- Shared styles: `shared.module.css`

## Class Naming Conventions

### Use camelCase for class names
```css
/* Good */
.containerWrapper { }
.primaryButton { }
.isActive { }

/* Bad */
.container-wrapper { }
.primary_button { }
.is-active { }
```

### Prefix state classes
```css
/* States */
.isActive { }
.isDisabled { }
.hasError { }
.isLoading { }
```

## Component Structure

### Container Pattern
```css
/* Component container */
.container {
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

/* Component sections */
.header {
  margin-bottom: 1rem;
}

.content {
  flex: 1;
}

.footer {
  margin-top: auto;
}
```

## Composition

### Use composes for shared styles
```css
/* shared.module.css */
.button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Button.module.css */
.primaryButton {
  composes: button from './shared.module.css';
  background-color: var(--primary-color);
  color: white;
}
```

## Responsive Design

### Mobile-first approach
```css
.container {
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 3rem;
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

## Variables and Theming

### Use CSS custom properties
```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --error-color: #dc3545;
  --success-color: #28a745;
  
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
}

.button {
  background-color: var(--primary-color);
  padding: var(--spacing-sm) var(--spacing-md);
}
```

## Best Practices

1. **Keep specificity low** - Avoid deep nesting and complex selectors
2. **Use semantic class names** - Names should describe purpose, not appearance
3. **Avoid global styles** - All styles should be scoped to components
4. **Group related properties** - Keep layout, typography, and decoration properties together
5. **Comment complex styles** - Add comments for non-obvious styling decisions