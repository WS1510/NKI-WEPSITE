# API 문서

## 개요
NKI 웹사이트의 백엔드 API 문서입니다.

## Base URL
```
Local: http://localhost:3000
Production: https://your-domain.com
```

## 인증
현재 API는 인증이 필요하지 않습니다.

## 견적 요청 API

### POST /api/quote
견적 요청을 제출합니다.

#### Request Body
```json
{
  "name": "string (required)",
  "company": "string (optional)",
  "email": "string (required, email format)",
  "phone": "string (optional)",
  "service": "string (required)",
  "message": "string (optional)",
  "attachments": [
    {
      "name": "string",
      "dataUrl": "string (base64 data URL)",
      "type": "string (MIME type)",
      "url": "string (optional)"
    }
  ]
}
```

#### Response
**Success (200)**
```json
{
  "ok": true,
  "messageId": "string",
  "preview": "string (test mode only)"
}
```

**Error (400)**
```json
{
  "error": "필수 필드 누락"
}
```

**Error (500)**
```json
{
  "error": "메일 전송 실패",
  "message": "error details"
}
```

## 견적 로그 관리 API

### GET /api/quote-logs
견적 로그 목록을 조회합니다.

#### Query Parameters
- `limit` (optional): 조회할 로그 수 (기본값: 50, 최대: 100)

#### Response
```json
{
  "ok": true,
  "logs": [
    {
      "id": 1,
      "name": "string",
      "company": "string",
      "email": "string",
      "phone": "string",
      "service": "string",
      "message": "string",
      "to": "string",
      "timestamp": "ISO 8601 string",
      "sent": true,
      "handled": false,
      "note": "string"
    }
  ]
}
```

### PATCH /api/quote-logs/:id
견적 로그를 업데이트합니다.

#### Request Body
```json
{
  "handled": true,
  "note": "처리 완료"
}
```

#### Response
```json
{
  "ok": true,
  "entry": {
    "id": 1,
    "handled": true,
    "note": "처리 완료"
  }
}
```

### DELETE /api/quote-logs/:id
견적 로그를 삭제합니다.

#### Response
```json
{
  "ok": true,
  "removed": {
    "id": 1,
    "name": "삭제된 항목"
  }
}
```

## 에러 코드

| 코드 | 설명 |
|------|------|
| 400 | 잘못된 요청 (필수 필드 누락, 잘못된 형식) |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 내부 오류 |

## 첨부파일 처리

### S3 업로드 (설정된 경우)
- 파일이 S3에 업로드되고 URL이 이메일에 포함됩니다.
- 지원 형식: 모든 파일 형식
- 최대 크기: 환경설정에 따름

### 직접 첨부 (S3 미설정 시)
- 작은 파일은 이메일에 직접 첨부됩니다.
- Base64 인코딩된 데이터 URL 사용

## 제한사항

- 최대 첨부파일 수: 5개
- 요청 크기 제한: 12MB (기본값)
- 로그 파일 최대 크기: 10MB (자동 압축 및 백업)