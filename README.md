# Unknown App - DM Demo

Instagram 스타일의 DM 채팅 데모 애플리케이션입니다. Next.js와 TypeScript로 구축되었습니다.

## 기능

- ✅ 사용자 인증 (회원가입/로그인)
- ✅ 실시간 DM 채팅
- ✅ SSE (Server-Sent Events)를 통한 메시지 스트리밍
- ✅ 입력 중 표시 (Typing indicator)
- ✅ Instagram 스타일 UI

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Date Formatting**: date-fns
- **Styling**: CSS Modules

## 빠른 시작

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 백엔드 API URL을 설정하세요:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. 캐릭터 UID 설정

`src/lib/constants.ts` 파일을 열어 실제 캐릭터 Profile UID로 변경하세요:

```typescript
export const CHARACTER_CONFIG = {
  PROFILE_UID: '실제_캐릭터_UID', // ⚠️ 백엔드에서 확인 필요
  NAME: '유우카',
  STATUS: '온라인',
} as const;
```

### 3. 개발 서버 실행

```powershell
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

브라우저에서 http://localhost:3000 을 열어 확인하세요.

## 프로젝트 구조

```
front/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   │   ├── login/             # 로그인 페이지
│   │   ├── signup/            # 회원가입 페이지
│   │   ├── home/              # 홈/피드 페이지
│   │   ├── dm/                # DM 채팅 페이지
│   │   ├── globals.css        # 전역 스타일
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   └── page.tsx           # 랜딩 페이지
│   ├── lib/
│   │   ├── api.ts             # API 클라이언트
│   │   ├── constants.ts       # 상수 및 설정
│   │   └── utils.ts           # 유틸리티 함수
│   ├── stores/
│   │   └── authStore.ts       # 인증 상태 관리 (Zustand)
│   └── types/
│       └── api.ts             # TypeScript 타입 정의
├── docs/                       # 프로젝트 문서
│   ├── 기획서.md              # 프로젝트 기획서
│   ├── API_DOCS.md            # 백엔드 API 문서
│   ├── CONFIGURATION.md       # 상세 설정 가이드
│   └── PROJECT_SUMMARY.md     # 프로젝트 요약
├── .eslintrc.json             # ESLint 설정
├── .prettierrc                # Prettier 설정
├── tsconfig.json              # TypeScript 설정
└── next.config.js             # Next.js 설정
```

## 중요 사항

### 필수 설정

1. **캐릭터 프로필 UID**: `src/lib/constants.ts`에서 실제 캐릭터 UID로 변경
2. **환경 변수**: `.env.local` 파일 생성 및 API URL 설정

### SSE 인증

EventSource는 커스텀 헤더를 지원하지 않습니다. 백엔드가 다음 중 하나를 지원해야 합니다:

1. Query parameter로 토큰 전달 (`/dm/stream?token=...`)
2. Cookie 기반 인증

자세한 내용은 `docs/CONFIGURATION.md`를 참조하세요.

## 사용 방법

1. **회원가입**: `/signup` 페이지에서 새 계정을 생성합니다.
2. **로그인**: `/login` 페이지에서 로그인합니다.
3. **홈 화면**: 로그인 후 피드 화면이 표시됩니다 (현재는 빈 상태).
4. **DM 시작**: 헤더의 메시지 아이콘을 클릭하거나 `/dm`으로 이동합니다.
5. **채팅**: 캐릭터와 실시간으로 메시지를 주고받을 수 있습니다.

## 스크립트

- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run start`: 프로덕션 서버 실행
- `npm run lint`: ESLint 실행
- `npm run format`: Prettier로 코드 포맷팅

## API 엔드포인트

### 인증

- `POST /auth/signup`: 회원가입
- `POST /auth/login`: 로그인
- `GET /auth/me`: 현재 사용자 정보

### DM

- `POST /dm/send`: 메시지 전송
- `GET /dm/messages`: 메시지 히스토리 조회
- `GET /dm/stream`: SSE 메시지 스트림
- `POST /dm/typing`: 입력 중 상태 전송

자세한 API 문서는 `docs/API_DOCS.md`를 참조하세요.

## 개발 시 참고사항

### 코드 스타일

프로젝트는 ESLint와 Prettier를 사용합니다. 커밋 전에 코드를 포맷팅하세요:

```bash
npm run format
npm run lint
```

### TypeScript

모든 파일에 적절한 타입을 지정하세요. `any` 타입 사용은 피하고, `src/types/api.ts`에 타입 정의를 추가하세요.

### CSS Modules

각 페이지/컴포넌트는 CSS Modules를 사용합니다. 전역 스타일은 `src/app/globals.css`에 정의되어 있습니다.

## 트러블슈팅

### 의존성 설치 오류

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### API 연결 오류

- `.env.local` 파일이 존재하는지 확인
- 백엔드 서버가 실행 중인지 확인 (`http://localhost:8000`)
- CORS 설정이 올바른지 확인
- 브라우저 개발자 도구(F12)에서 네트워크 탭 확인

자세한 내용은 `docs/CONFIGURATION.md`를 참조하세요.

## 문서

- **기획서**: `docs/기획서.md` - 프로젝트 기획 및 아키텍처
- **API 문서**: `docs/API_DOCS.md` - 백엔드 API 스펙
- **설정 가이드**: `docs/CONFIGURATION.md` - 상세 설정 및 트러블슈팅
- **프로젝트 요약**: `docs/PROJECT_SUMMARY.md` - 전체 구조 및 데이터 플로우

## 라이선스

이 프로젝트는 데모 목적으로 제작되었습니다.
