---
title: React Form Component Template
type: template
category: component
componentType: form
tags: form,component,react
---

# Form Component Template

## Component Code

```tsx
import React, { useState } from 'react';
import styles from './FormName.module.css';

interface FormNameProps {
  onSubmit: (data: FormData) => void;
}

interface FormData {
  // Define your form fields here
  field1: string;
  field2: string;
}

export const FormName: React.FC<FormNameProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    field1: '',
    field2: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="field1">Field 1</label>
        <input
          type="text"
          id="field1"
          name="field1"
          value={formData.field1}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit" className={styles.submitButton}>
        Submit
      </button>
    </form>
  );
};
```

## Style Template

```css
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 500px;
}

.formGroup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.formGroup label {
  font-weight: 500;
  color: #333;
}

.formGroup input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.formGroup input:focus {
  outline: none;
  border-color: #007bff;
}

.submitButton {
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.submitButton:hover {
  background-color: #0056b3;
}
```

## Test Template

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormName } from './FormName';

describe('FormName', () => {
  it('renders form fields', () => {
    const handleSubmit = jest.fn();
    render(<FormName onSubmit={handleSubmit} />);
    expect(screen.getByLabelText('Field 1')).toBeInTheDocument();
  });

  it('handles form submission', () => {
    const handleSubmit = jest.fn();
    render(<FormName onSubmit={handleSubmit} />);
    
    const input = screen.getByLabelText('Field 1');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    expect(handleSubmit).toHaveBeenCalled();
  });
});
```
