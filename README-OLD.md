# NKI Industrial Automation Website

## 프로젝트 개요
NKI - Industrial Automation Solutions 웹사이트는 산업 자동화 솔루션을 제공하는 회사의 현대적이고 반응형 웹사이트입니다.

## 프로젝트 구조
```
홈페이지 제작 실습/
│
├── reception/list.html     # 수신 목록 페이지 (이전 reception/index.html)
├── README.md              # 프로젝트 설명서
│
├── css/                   # 스타일시트 폴더
│   ├── reset.css         # CSS 리셋
│   ├── style.css         # 전역 스타일
│   ├── header.css        # 헤더 스타일
│   ├── hero.css          # 히어로 섹션 스타일
│   └── features.css      # 특징 섹션 스타일
│
├── js/                   # JavaScript 폴더
│   └── main.js          # 메인 JavaScript 파일
│
└── images/              # 이미지 폴더 (향후 사용)
```

## 주요 기능

### 1. 반응형 디자인
- 모바일, 태블릿, 데스크톱 모든 기기에서 최적화
- CSS Grid와 Flexbox를 활용한 레이아웃

### 2. 모던 UI/UX
- 부드러운 애니메이션과 전환 효과
- 그라데이션과 그림자를 활용한 현대적 디자인
- 사용자 친화적인 인터페이스

### 3. 성능 최적화
- 모듈화된 CSS 구조
- 최적화된 JavaScript 코드
- 빠른 로딩 속도

## 섹션 구성

### Header
- 고정 네비게이션 바
- 회사 로고 (NKI)
- 주요 메뉴 (홈, 서비스, 회사소개, 포트폴리오)
- 미팅 예약 버튼

### Hero Section
- 인상적인 배경과 그라데이션
- 회사 소개 메시지
- 행동 유도 버튼 (상담 문의, 우리의 서비스)

### Features Section
- 3개의 주요 서비스 카드
  1. 로봇 조립 라인
  2. 컨베이어 시스템
  3. 품질 관리 자동화
- 각 카드마다 고유한 아이콘과 색상

### 추가 요소
- 우하단 채팅 위젯
- 부드러운 스크롤 효과
- 인터랙티브 애니메이션

## 기술 스택

### Frontend
- **HTML5**: 시맨틱 마크업
- **CSS3**: 
  - Flexbox & Grid Layout
  - CSS Variables
  - Animations & Transitions
  - Media Queries (반응형)
- **JavaScript (Vanilla)**:
  - DOM 조작
  - 이벤트 처리
  - 스크롤 애니메이션
  - Intersection Observer API

### 외부 라이브러리
- **Google Fonts**: Noto Sans KR
- **Font Awesome**: 아이콘

## 브라우저 지원
- Chrome (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- Edge (최신 버전)

## 설치 및 실행

1. 프로젝트 다운로드
2. `reception/list.html` 파일을 웹 브라우저에서 열기
3. 또는 로컬 서버 실행:
   ```bash
   # Python 3을 사용하는 경우
   python -m http.server 8000
   
   # Node.js를 사용하는 경우
   npx http-server
   ```

## 향후 개선 사항
- [ ] 백엔드 API 연동
- [ ] 실제 채팅 기능 구현
- [ ] 포트폴리오 페이지 추가
- [ ] 회사소개 페이지 추가
- [ ] 다국어 지원
- [ ] SEO 최적화
- [ ] PWA 기능 추가

## 라이센스
이 프로젝트는 교육 목적으로 제작되었습니다.

## 연락처
프로젝트 관련 문의사항이 있으시면 언제든지 연락주세요.