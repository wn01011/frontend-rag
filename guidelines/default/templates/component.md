---
title: React Generic Component Template
type: template
category: component
componentType: component
tags: component,react,generic
---

# Generic Component Template

## Component Code

```tsx
import React from 'react';
import styles from './ComponentName.module.css';

interface ComponentNameProps {
  // Add props here
}

export const ComponentName: React.FC<ComponentNameProps> = (props) => {
  return (
    <div className={styles.container}>
      {/* Component content goes here */}
    </div>
  );
};
```

## Style Template

```css
.container {
  padding: 1rem;
}

/* Add more styles here */
```

## Test Template

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    // Add assertions here
  });
});
```
