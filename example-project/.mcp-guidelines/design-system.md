---
title: Design System Guidelines
type: design-system
category: styling
priority: 1
---

# 우리 프로젝트 디자인 시스템

## 🎨 Color Palette

### Primary Colors
```css
--color-primary: #1a73e8;
--color-primary-hover: #1765cc;
--color-primary-light: #e8f0fe;

--color-secondary: #f8f9fa;
--color-secondary-dark: #e9ecef;
```

### Semantic Colors
```css
--color-success: #28a745;
--color-warning: #ffc107;
--color-error: #dc3545;
--color-info: #17a2b8;
```

## 📐 Spacing System

8px 기반 그리드 시스템 사용:
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
```

## 🔤 Typography

### Font Family
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'Fira Code', monospace;
```

### Font Sizes
```css
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 24px;
--text-2xl: 32px;
--text-3xl: 48px;
```

## 🧩 Component Patterns

### Button Component
```tsx
// 모든 버튼은 이 패턴을 따라야 함
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  isDisabled?: boolean;
}

// Tailwind 클래스 사용 예시
const buttonClasses = {
  base: 'rounded-lg font-medium transition-all duration-200',
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'hover:bg-gray-100 text-gray-700'
};
```

### Card Component
```tsx
// 카드 컴포넌트 스타일
const cardStyles = {
  container: 'bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow',
  header: 'flex justify-between items-center mb-4',
  title: 'text-xl font-semibold text-gray-900',
  content: 'text-gray-600'
};
```

## 🔄 State Management

### Loading States
```tsx
// 로딩 상태는 항상 Skeleton UI 사용
<Skeleton className="h-4 w-full mb-2" />
<Skeleton className="h-4 w-3/4" />
```

### Error States
```tsx
// 에러 상태 표시 패턴
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
  <p className="text-red-800">에러 메시지</p>
</div>
```

## 📱 Responsive Design

### Breakpoints
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Mobile-First Approach
```css
/* 모바일 기본 */
.container {
  padding: 16px;
}

/* 태블릿 이상 */
@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
}

/* 데스크톱 */
@media (min-width: 1024px) {
  .container {
    padding: 32px;
    max-width: 1280px;
    margin: 0 auto;
  }
}
```