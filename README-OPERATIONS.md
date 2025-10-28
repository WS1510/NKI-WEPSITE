# 운영 가이드 (간략)

이 문서는 간단히 서버를 운영하기 위한 명령과 점검 방법을 정리합니다.

필수 환경변수 (.env)
- SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
- SALES_EMAIL
- DATABASE_URL (postgres://user:pass@host:port/dbname)
- (옵션) S3_* 설정들

시스템 준비
1. Node.js 설치 (권장 LTS)
2. Docker(선택) — local Postgres 컨테이너 사용 시

서버 시작
- 개발: npm run dev
- 프로덕션(간단): scripts/start-server.ps1
- PM2(권장):
  - 로컬 pm2 사용: npx pm2 start ecosystem.config.js --env production
  - 프로세스 저장: npx pm2 save
  - PM2 자동 재시작(Windows 서비스 등) 구성 권장

  Windows에서 자동 복구 (서비스 등록)
  - 간단 방법: `scripts/install-nssm-service.ps1` 스크립트를 관리자 권한으로 실행하면 NSSM을 다운로드하고 `nki-server`라는 Windows 서비스를 생성합니다.
  - 사용법(관리자 PowerShell에서):
    - Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
    - .\scripts\install-nssm-service.ps1
    - 서비스 시작/중지: Start-Service/Stop-Service -Name nki-server

로그
- Node stdout/stderr 리다이렉트 파일: `server.log`, `server.err`
- 문의 로그(이전 파일 기반): `quote-logs.log`, 백업은 `logbackups/`

헬스체크
- 간단 HTTP 체크: GET /api/quote-logs?limit=1
- DB 체크: docker exec -i nki-postgres psql -U postgres -d quotes -c "SELECT count(*) FROM quote_logs;"
- 제공되는 헬스 스크립트: `scripts/healthcheck.ps1`

백업 및 마이그레이션
- `quote-logs.log`는 이미 `logbackups/`에 백업되어 있습니다. 마이그레이션 스크립트는 `scripts/migrate-quote-logs.js`.

문제 해결
- 메일 전송 실패: `server.log`에서 `메일 전송 오류` 메시지 확인, SMTP 설정 확인
- DB 연결 실패: `DATABASE_URL` 확인 및 Postgres 컨테이너가 실행 중인지 확인

연락처
- 운영 담당자 이메일: SALES_EMAIL 값 (env 파일 참조)

## 서비스 설치 체크리스트 (Windows, NSSM 사용)
아래 단계는 관리자 권한 PowerShell에서 실행해야 합니다. 스크립트는 `scripts/install-nssm-service.ps1`을 사용합니다.

1. 작업 디렉터리로 이동
  - cd 'C:\Users\gg653\Desktop\홈페이지 제작 실습'

2. 관리자 PowerShell 열기
  - 시작 메뉴 → PowerShell → 마우스 오른쪽 → '관리자 권한으로 실행'

3. 실행 정책 허용 (현재 세션)
  - Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

4. 서비스 설치(스크립트 실행)
  - .\scripts\install-nssm-service.ps1
  - 스크립트가 NSSM을 다운로드하고 `nki-server` 서비스를 생성합니다.

5. 설치 후 확인
  - 서비스 상태: Get-Service -Name nki-server
  - 로그 확인: Get-Content .\server.log -Tail 200 ; Get-Content .\server.err -Tail 200
  - DB 확인: docker exec -i nki-postgres psql -U postgres -d quotes -c "SELECT count(*) FROM quote_logs;"

6. 문제 발생 시
  - NSSM 다운로드 실패: 네트워크 또는 방화벽 확인. 수동 다운로드 후 동일 경로에 배치 가능.
  - 서비스 시작 실패: Windows 이벤트 뷰어(응용 프로그램 로그) 확인 및 `server.err` 파일 확인.

7. 서비스 제거(예시)
  - nssm remove nki-server confirm

