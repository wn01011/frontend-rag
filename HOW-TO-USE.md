# MCP RAG 서버를 통한 일관된 코드 생성

## 🎯 사용 시나리오

### 1. Claude에게 컴포넌트 생성 요청
```
"ProductCard 컴포넌트를 만들어줘"
```

### 2. MCP 도구 자동 호출
Claude가 자동으로:
1. `get_styling_guide` 호출 → 프로젝트 디자인 시스템 확인
2. `get_component_template` 호출 → 컴포넌트 템플릿 가져오기
3. 프로젝트 설정에 맞춰 코드 생성

### 3. 생성되는 코드 예시
```tsx
// src/components/molecules/ProductCard/ProductCard.tsx
import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Text } from '@/components/atoms/Text';
import * as S from './ProductCard.styles';

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
  };
  onAddToCart: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
}) => {
  return (
    <S.CardContainer>
      <S.ImageWrapper>
        <S.ProductImage src={product.image} alt={product.name} />
      </S.ImageWrapper>
      
      <S.ContentWrapper>
        <Text variant="h3" className="text-xl font-semibold text-gray-900">
          {product.name}
        </Text>
        
        <Text variant="body" className="text-gray-600 mt-2">
          {product.description}
        </Text>
        
        <S.PriceSection>
          <Text variant="h4" className="text-2xl font-bold text-blue-600">
            ₩{product.price.toLocaleString()}
          </Text>
        </S.PriceSection>
        
        <Button
          variant="primary"
          size="medium"
          onClick={() => onAddToCart(product.id)}
          className="w-full mt-4"
        >
          장바구니에 추가
        </Button>
      </S.ContentWrapper>
    </S.CardContainer>
  );
};
```

```ts
// ProductCard.styles.ts
import styled from 'styled-components';

export const CardContainer = styled.div`
  background: white;
  border-radius: 16px;  // 프로젝트 설정의 borderRadius
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);  // 프로젝트 설정의 boxShadow
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  }
`;

export const ImageWrapper = styled.div`
  width: 100%;
  height: 200px;
  overflow: hidden;
`;

export const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const ContentWrapper = styled.div`
  padding: 24px;  // 프로젝트 설정의 spacing.lg
`;

export const PriceSection = styled.div`
  margin-top: 16px;  // 프로젝트 설정의 spacing.md
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
`;
```

## 🔄 작업 흐름

1. **프로젝트 시작 시**
   ```bash
   # 프로젝트 폴더에 .mcp-project.json 생성
   # .mcp-guidelines/ 폴더에 가이드라인 작성
   ```

2. **가이드라인 인덱싱**
   ```bash
   npm run index  # ChromaDB에 가이드라인 저장
   ```

3. **Claude Desktop에서 코딩**
   - Claude가 자동으로 프로젝트 감지
   - MCP 도구로 가이드라인 참조
   - 일관된 스타일로 코드 생성

4. **코드 검증**
   ```
   "이 코드가 우리 스타일 가이드에 맞는지 확인해줘"
   → validate_code_style 도구 실행
   ```

## 📊 프로젝트별 차별화 예시

### 프로젝트 A: E-Commerce
- 디자인: Material Design 3
- 스타일: Tailwind CSS
- 구조: Atomic Design
- 색상: 파란색 계열

### 프로젝트 B: Admin Dashboard
- 디자인: Ant Design
- 스타일: CSS-in-JS (Emotion)
- 구조: Feature-based
- 색상: 그레이 계열

### 프로젝트 C: Marketing Site
- 디자인: Custom Design System
- 스타일: CSS Modules
- 구조: Page-based
- 색상: 브랜드 컬러

각 프로젝트마다 다른 설정을 가지고 있어도,
Claude는 현재 프로젝트의 가이드라인을 자동으로 따릅니다!