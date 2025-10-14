---
title: React Page Component Template
type: template
category: component
componentType: page
tags: page,component,react
---

# Page Component Template

## Component Code

```tsx
import React from 'react';
import styles from './PageName.module.css';

interface PageNameProps {
  // Add props here
}

export const PageName: React.FC<PageNameProps> = (props) => {
  return (
    <div className={styles.container}>
      <h1>Page Title</h1>
      {/* Page content goes here */}
    </div>
  );
};

export default PageName;
```

## Style Template

```css
.container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #333;
}

/* Add more styles here */
```

## Test Template

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PageName } from './PageName';

describe('PageName', () => {
  it('renders correctly', () => {
    render(<PageName />);
    expect(screen.getByText('Page Title')).toBeInTheDocument();
  });
});
```
