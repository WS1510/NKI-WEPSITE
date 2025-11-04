# NKI Industrial Automation Website

## 프로젝트 개요
NKI(엔케이아이) - Industrial Automation Solutions 웹사이트는 산업 자동화 솔루션을 제공하는 회사의 현대적이고 반응형 웹사이트입니다.

## 프로젝트 구조
```
NKI-WEPSITE/
├── server.js                 # 서버 진입점
├── package.json              # 프로젝트 dependencies
├── .env.example              # 환경변수 예시
├── ecosystem.config.js       # PM2 설정
├── vercel.json              # Vercel 배포 설정
│
├── src/                     # 서버 소스코드
│   ├── app.js              # Express 앱 설정
│   ├── controllers/        # 컨트롤러
│   │   └── quoteController.js
│   ├── routes/            # 라우터
│   │   └── quote.js
│   ├── services/          # 비즈니스 로직
│   │   ├── emailService.js
│   │   ├── logService.js
│   │   └── attachmentService.js
│   ├── middleware/        # 미들웨어
│   │   ├── cors.js
│   │   ├── bodyParser.js
│   │   └── staticFiles.js
│   └── utils/            # 유틸리티
│       └── helpers.js
│
├── public/               # 정적 파일들
│   ├── index.html       # 메인 페이지
│   ├── company.html     # 회사소개 페이지
│   ├── css/            # 스타일시트
│   ├── js/             # 클라이언트 JavaScript
│   ├── images/         # 이미지 파일들
│   └── api/            # Legacy API (호환성)
│
├── config/              # 설정 파일들
│   └── config.js       # 통합 설정
│
├── logs/               # 로그 파일들
│   └── backups/       # 로그 백업
│
├── docs/               # 프로젝트 문서
├── scripts/            # 유틸리티 스크립트들
└── backup/             # 백업 파일들
```

## 주요 기능

### 1. 반응형 웹사이트
- 모바일, 태블릿, 데스크톱 최적화
- 현대적인 UI/UX 디자인
- 부드러운 애니메이션과 전환 효과

### 2. 견적 문의 시스템
- 실시간 견적 요청 처리
- 이메일 알림 기능
- 첨부파일 지원 (S3 업로드 옵션)
- 관리자 로그 시스템

### 3. 백엔드 API
- RESTful API 설계
- 모듈화된 구조
- 에러 핸들링
- 로그 관리 시스템

## 기술 스택

### Backend
- **Node.js & Express**: 서버 프레임워크
- **Nodemailer**: 이메일 전송
- **PostgreSQL**: 데이터베이스 (옵션)
- **AWS S3**: 파일 저장 (옵션)

### Frontend
- **HTML5**: 시맨틱 마크업
- **CSS3**: 모던 스타일링 (Grid, Flexbox, Animations)
- **JavaScript**: Vanilla JS로 인터랙티비티

### DevOps
- **PM2**: 프로세스 관리
- **Vercel**: 배포 플랫폼
- **PowerShell**: 자동화 스크립트

## 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd NKI-WEPSITE
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 실제 값 입력
```

### 4. 개발 서버 실행
```bash
# 개발 모드 (nodemon)
npm run dev

# 프로덕션 모드
npm start
```

### 5. PM2로 배포
```bash
npm run pm2:start
```

## API 문서

### 견적 요청 API
```http
POST /api/quote
Content-Type: application/json

{
  "name": "홍길동",
  "company": "ABC 컴퍼니",
  "email": "test@example.com",
  "phone": "010-1234-5678",
  "service": "자동화 설비",
  "message": "견적 요청 내용",
  "attachments": []
}
```

### 견적 로그 관리
```http
GET /api/quote-logs?limit=50        # 로그 조회
PATCH /api/quote-logs/:id           # 로그 업데이트
DELETE /api/quote-logs/:id          # 로그 삭제
```

## 환경변수 설정

필수 환경변수:
- `PORT`: 서버 포트 (기본값: 3000)
- `SALES_EMAIL`: 견적 요청 수신 이메일

SMTP 설정 (이메일 전송용):
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

S3 설정 (첨부파일용):
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`

## 배포

### Vercel 배포
```bash
vercel --prod
```

### PM2 배포
```bash
pm2 start ecosystem.config.js --env production
```

## 브라우저 지원
- Chrome (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- Edge (최신 버전)

## 라이센스
MIT License

## 연락처
- 회사: NKI(엔케이아이)
- 이메일: gg6532@nki-1.co.kr
- 전화: 041) 583-8598