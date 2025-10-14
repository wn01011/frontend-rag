# ChromaDB 데이터 인덱싱 가이드

## 🎯 ChromaDB란?
- **벡터 데이터베이스**: 텍스트를 수치 벡터로 변환하여 저장
- **의미적 검색**: 단순 텍스트 매칭이 아닌 의미 유사도로 검색
- **RAG 시스템**: AI가 관련 정보를 찾아 답변할 수 있게 해줌

## 📚 데이터 인덱싱 방법

### 1. 기본 명령어

```bash
# ChromaDB 시작
docker-compose up -d

# 기존 가이드라인 인덱싱
npx tsx src/scripts/fixEmbedding.ts

# 커스텀 데이터 인덱싱
npx tsx src/scripts/indexCustomData.ts
```

### 2. 새 데이터 추가하기

#### 방법 1: Markdown 파일 추가
```
1. guidelines/default/ 폴더에 .md 파일 추가
2. npx tsx src/scripts/fixEmbedding.ts 실행
3. Dashboard에서 확인
```

#### 방법 2: 프로그래밍 방식
```typescript
const collection = await client.createCollection({
  name: 'my_collection',
  embeddingFunction: embedder
});

await collection.add({
  ids: ['doc1', 'doc2'],
  documents: ['내용1', '내용2'],
  metadatas: [
    { title: '제목1', type: 'guide' },
    { title: '제목2', type: 'tutorial' }
  ]
});
```

### 3. 다양한 데이터 소스

#### 📄 텍스트 파일
```typescript
const content = await fs.readFile('file.txt', 'utf-8');
await collection.add({
  ids: ['file1'],
  documents: [content],
  metadatas: [{ source: 'file.txt' }]
});
```

#### 📊 JSON 데이터
```typescript
const data = JSON.parse(await fs.readFile('data.json', 'utf-8'));
const documents = data.map(item => item.content);
await collection.add({ ids, documents, metadatas });
```

#### 🌐 웹 스크래핑
```typescript
// fetch로 웹 페이지 가져오기
const response = await fetch('https://example.com/docs');
const html = await response.text();
// HTML 파싱 후 인덱싱
```

#### 📝 CSV 파일
```typescript
import { parse } from 'csv-parse';
// CSV 파싱 후 각 행을 문서로 변환
```

### 4. 메타데이터 활용

메타데이터는 검색 필터링과 결과 표시에 중요합니다:

```typescript
metadata = {
  title: '문서 제목',      // 표시용
  source: '출처',          // 파일 경로나 URL
  type: 'guide',          // 문서 타입
  category: 'react',      // 카테고리
  date: '2025-01-14',     // 날짜
  tags: ['react', 'hooks'] // 태그
}
```

### 5. 대량 데이터 처리

```typescript
// 배치 처리 (메모리 효율적)
const batchSize = 50;
for (let i = 0; i < allDocs.length; i += batchSize) {
  const batch = allDocs.slice(i, i + batchSize);
  await collection.add({
    ids: batch.map(d => d.id),
    documents: batch.map(d => d.content),
    metadatas: batch.map(d => d.metadata)
  });
  console.log(`Progress: ${i}/${allDocs.length}`);
}
```

### 6. 컬렉션 관리

```typescript
// 컬렉션 목록 조회
const collections = await client.listCollections();

// 컬렉션 삭제
await client.deleteCollection({ name: 'old_collection' });

// 컬렉션 정보 조회
const count = await collection.count();
const peek = await collection.peek({ limit: 10 });
```

## 🔧 실전 예제

### 예제 1: 프로젝트 문서 인덱싱
```bash
# 1. 프로젝트 문서를 guidelines 폴더에 복사
cp -r ~/my-project/docs/* guidelines/default/

# 2. 인덱싱 실행
npx tsx src/scripts/fixEmbedding.ts

# 3. Dashboard에서 확인
npm run dashboard
```

### 예제 2: API 문서 인덱싱
```typescript
// API 문서를 ChromaDB에 추가
const apiDocs = [
  {
    endpoint: '/api/users',
    method: 'GET',
    description: 'Get all users',
    example: '...'
  }
];

const documents = apiDocs.map(doc => 
  `${doc.method} ${doc.endpoint}\n${doc.description}\n${doc.example}`
);

await collection.add({
  ids: apiDocs.map(d => `api_${d.endpoint}_${d.method}`),
  documents,
  metadatas: apiDocs.map(d => ({
    type: 'api',
    endpoint: d.endpoint,
    method: d.method
  }))
});
```

## 📊 검색 테스트

```typescript
// 검색 수행
const results = await collection.query({
  queryTexts: ['React hooks 사용법'],
  nResults: 5,
  where: { type: 'guide' }  // 필터링
});

// 결과 확인
results.documents[0].forEach((doc, i) => {
  console.log(`Score: ${results.distances[0][i]}`);
  console.log(`Document: ${doc}`);
  console.log(`Metadata: ${results.metadatas[0][i]}`);
});
```

## ⚠️ 주의사항

1. **중복 ID 피하기**: 각 문서는 고유한 ID 필요
2. **문서 크기**: 너무 긴 문서는 청크로 나누기
3. **임베딩 함수**: 컬렉션 생성 시 반드시 지정
4. **메모리 관리**: 대량 데이터는 배치 처리
5. **인코딩**: UTF-8 인코딩 확인

## 🚀 활용 시나리오

- **개발 문서**: 프로젝트 가이드라인, API 문서
- **지식 베이스**: FAQ, 매뉴얼, 튜토리얼
- **코드 검색**: 코드 스니펫, 함수 설명
- **로그 분석**: 에러 패턴, 디버깅 정보
- **제품 카탈로그**: 제품 설명, 스펙

## 💡 팁

1. **문서 분할**: 긴 문서는 섹션별로 나누어 인덱싱
2. **메타데이터 활용**: 검색 품질 향상
3. **정기 업데이트**: 스케줄러로 자동 인덱싱
4. **백업**: 중요 데이터는 원본 보관
5. **모니터링**: Dashboard로 상태 확인
