---
title: Folder Structure Guidelines
type: architecture
category: structure
priority: 1
---

# 프로젝트 폴더 구조 가이드라인

## 📁 전체 구조

```
my-project/
├── .mcp-project.json          # MCP 프로젝트 설정
├── .mcp-guidelines/           # 프로젝트 가이드라인
├── src/
│   ├── components/           # 컴포넌트 (Atomic Design)
│   │   ├── atoms/           # 기본 구성 요소
│   │   ├── molecules/       # 조합된 컴포넌트
│   │   ├── organisms/       # 복잡한 컴포넌트
│   │   ├── templates/       # 페이지 레이아웃
│   │   └── pages/          # 페이지 컴포넌트
│   ├── hooks/              # Custom React Hooks
│   ├── utils/              # 유틸리티 함수
│   ├── services/           # API 서비스
│   ├── stores/             # 상태 관리 (Zustand/Redux)
│   ├── types/              # TypeScript 타입 정의
│   ├── styles/             # 글로벌 스타일
│   └── assets/             # 이미지, 폰트 등
├── public/                 # 정적 파일
└── tests/                  # 테스트 파일
```

## 🧩 컴포넌트 구조

### Atoms (원자)
```
atoms/
├── Button/
│   ├── Button.tsx
│   ├── Button.styles.ts    # styled-components 또는
│   ├── Button.module.css   # CSS modules
│   ├── Button.test.tsx
│   └── index.ts
├── Input/
├── Icon/
└── Text/
```

### Molecules (분자)
```
molecules/
├── SearchBar/
│   ├── SearchBar.tsx
│   ├── SearchBar.styles.ts
│   ├── SearchBar.test.tsx
│   └── index.ts
├── FormField/
└── Card/
```

### Organisms (유기체)
```
organisms/
├── Header/
│   ├── Header.tsx
│   ├── Header.styles.ts
│   ├── components/         # Header 전용 하위 컴포넌트
│   │   ├── NavMenu.tsx
│   │   └── UserMenu.tsx
│   └── index.ts
├── ProductList/
└── CheckoutForm/
```

## 📝 파일 명명 규칙

### 컴포넌트 파일
- React 컴포넌트: `PascalCase.tsx`
- 스타일 파일: `ComponentName.styles.ts` 또는 `ComponentName.module.css`
- 테스트 파일: `ComponentName.test.tsx`
- 스토리북: `ComponentName.stories.tsx`

### 기타 파일
- Hooks: `useHookName.ts`
- Utils: `camelCase.ts`
- Types: `PascalCase.types.ts`
- Constants: `UPPER_SNAKE_CASE.ts`

## 🔧 컴포넌트 템플릿

### 기본 컴포넌트 구조
```tsx
// components/atoms/Button/Button.tsx
import React from 'react';
import * as S from './Button.styles';
// 또는 CSS Modules 사용 시
// import styles from './Button.module.css';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
}) => {
  return (
    <S.StyledButton
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </S.StyledButton>
  );
};

// index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

## 🎯 Import 순서

```tsx
// 1. React 관련
import React, { useState, useEffect } from 'react';

// 2. 외부 라이브러리
import { useRouter } from 'next/router';
import axios from 'axios';

// 3. 내부 컴포넌트
import { Button } from '@/components/atoms';
import { Header } from '@/components/organisms';

// 4. Hooks
import { useAuth } from '@/hooks/useAuth';

// 5. Utils/Services
import { formatDate } from '@/utils/date';
import { apiClient } from '@/services/api';

// 6. Types
import type { User } from '@/types/user';

// 7. Styles
import * as S from './Component.styles';
// 또는
import styles from './Component.module.css';
```

## 📊 상태 관리 구조

### Store 구조 (Zustand 예시)
```
stores/
├── useAuthStore.ts        # 인증 관련
├── useCartStore.ts        # 장바구니
├── useUIStore.ts          # UI 상태
└── index.ts              # Store 통합 export
```

### Store 파일 예시
```tsx
// stores/useCartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  quantity: number;
  product: Product;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        // 로직 구현
      },
      removeItem: (id) => {
        // 로직 구현
      },
      clearCart: () => set({ items: [] }),
      totalAmount: () => {
        // 계산 로직
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
```