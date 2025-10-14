---
title: React Modal Component Template
type: template
category: component
componentType: modal
tags: modal,component,react
---

# Modal Component Template

## Component Code

```tsx
import React from 'react';
import styles from './ModalName.module.css';

interface ModalNameProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const ModalName: React.FC<ModalNameProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className={styles.header}>
            <h2>{title}</h2>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>
        )}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};
```

## Style Template

```css
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.closeButton {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.content {
  padding: 1rem;
}
```

## Test Template

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalName } from './ModalName';

describe('ModalName', () => {
  it('renders when isOpen is true', () => {
    render(
      <ModalName isOpen={true} onClose={() => {}}>
        <p>Modal content</p>
      </ModalName>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ModalName isOpen={false} onClose={() => {}}>
        <p>Modal content</p>
      </ModalName>
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls onClose when overlay is clicked', () => {
    const handleClose = jest.fn();
    render(
      <ModalName isOpen={true} onClose={handleClose}>
        <p>Modal content</p>
      </ModalName>
    );
    fireEvent.click(screen.getByRole('presentation'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
```
