# 🚀 Claude Desktop에 MCP RAG 서버 등록하기

## 📍 현재 상황
- RAG 서버 위치: `/Users/naron/Desktop/Personal/frontend-rag/`
- ChromaDB: Docker로 실행 중 (포트 8000)

## 🔧 설정 방법

### 1. Claude Desktop 설정 파일 열기

**파일 위치:**
```
/Users/naron/Library/Application Support/Claude/claude_desktop_config.json
```

### 2. MCP 서버 추가하기

현재 설정 파일의 `mcpServers` 섹션에 다음을 추가하세요:

```json
{
  "mcpServers": {
    // ... 기존 서버들 ...
    
    "frontend-rag": {
      "command": "node",
      "args": [
        "/Users/naron/Desktop/Personal/frontend-rag/dist/index.js"
      ],
      "env": {
        "CHROMA_DB_HOST": "localhost",
        "CHROMA_DB_PORT": "8000"
      }
    }
  }
}
```

또는 `npx` 방식으로:

```json
{
  "mcpServers": {
    // ... 기존 서버들 ...
    
    "frontend-rag": {
      "command": "npx",
      "args": [
        "tsx",
        "/Users/naron/Desktop/Personal/frontend-rag/src/index.ts"
      ],
      "env": {
        "CHROMA_DB_HOST": "localhost",
        "CHROMA_DB_PORT": "8000"
      }
    }
  }
}
```

### 3. 빌드 후 실행 방식 (권장)

먼저 TypeScript를 빌드:
```bash
cd /Users/naron/Desktop/Personal/frontend-rag
npm run build
```

그다음 설정:
```json
"frontend-rag": {
  "command": "node",
  "args": [
    "/Users/naron/Desktop/Personal/frontend-rag/dist/index.js"
  ]
}
```

## ⚠️ 실행 전 체크리스트

1. **ChromaDB 실행 확인**
   ```bash
   docker-compose up -d
   # 또는 http://localhost:8000 접속 확인
   ```

2. **데이터 인덱싱 확인**
   ```bash
   npx tsx src/scripts/fixEmbedding.ts
   ```

3. **Dependencies 설치**
   ```bash
   npm install
   ```

4. **빌드 (필요시)**
   ```bash
   npm run build
   ```

## 🎯 완전한 설정 예시

```json
{
  "globalShortcut": "",
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/naron"]
    },
    "fast-filesystem": {
      "command": "node",
      "args": ["/Users/naron/Desktop/Personal/fast-filesystem-mcp/dist/index.js"]
    },
    // ... 다른 서버들 ...
    
    "frontend-rag": {
      "command": "node",
      "args": [
        "/Users/naron/Desktop/Personal/frontend-rag/dist/index.js"
      ],
      "env": {
        "CHROMA_DB_HOST": "localhost",
        "CHROMA_DB_PORT": "8000",
        "NODE_ENV": "production"
      }
    }
  },
  "isUsingBuiltInNodeForMcp": true
}
```

## 🔄 Claude Desktop 재시작

설정 후 반드시 Claude Desktop을 **완전히 종료**하고 다시 시작:
1. Claude 메뉴 → Quit Claude
2. Claude 다시 실행
3. 새 대화 시작

## ✅ 작동 확인

새 대화에서 테스트:
```
"프론트엔드 가이드라인 중에서 CSS 모듈에 대해 알려줘"
"atomic design 패턴에 대해 설명해줘"
```

## 🐛 문제 해결

### 1. MCP 서버가 보이지 않을 때
- Claude 완전 종료 후 재시작
- 설정 파일 JSON 문법 확인 (쉼표, 괄호)

### 2. ChromaDB 연결 실패
```bash
# ChromaDB 상태 확인
docker ps | grep chroma

# 재시작
docker-compose down
docker-compose up -d
```

### 3. 로그 확인
```bash
# MCP 서버 직접 실행 테스트
node /Users/naron/Desktop/Personal/frontend-rag/dist/index.js
```

## 📊 사용 가능한 MCP Tools

등록 후 사용 가능한 도구들:
- `get_styling_guide` - 스타일링 가이드라인 검색
- `get_component_template` - 컴포넌트 템플릿 생성  
- `validate_code_style` - 코드 스타일 검증
- `search_guidelines` - 가이드라인 검색
- `index_guidelines` - 새 가이드라인 인덱싱

## 💡 팁
- 개발 중에는 `tsx` 직접 실행
- 프로덕션에서는 빌드 후 `node` 실행
- 환경변수는 `env` 섹션에 추가
