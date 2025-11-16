# 웹사이트 모니터링 도구

금연 시스템의 실시간 상태를 모니터링하는 웹 애플리케이션입니다.

## 🚀 배포 방법

### Vercel 배포
1. 이 저장소를 GitHub으로 푸시
2. [Vercel](https://vercel.com)에서 GitHub 계정 연결
3. 저장소 선택 및 배포

### GitHub Pages 배포
1. `gh-pages` 브랜치 생성
2. GitHub 설정에서 Pages 활성화
3. 소스로 `gh-pages` 브랜치 선택

## 📁 프로젝트 구조

```
URLMON/
├── index.html          # 메인 페이지
├── function.js         # 자바스크립트 로직
├── styles.css          # 스타일시트
├── sites.json          # 모니터링 사이트 목록
├── api/
│   ├── sites.js        # Vercel 서버리스 함수
│   └── server.js       # 로컬 개발 서버
├── vercel.json         # Vercel 배포 설정
├── package.json        # 의존성 관리
└── README.md           # 프로젝트 문서
```

## 🛠 기능

- 실시간 웹사이트 상태 모니터링
- 모니터링 간격 조절 (5초~1분)
- 상태 기록 및 히스토리 관리
- 반응형 디자인
- 로컬 스토리지 데이터 저장

## 🌐 지원되는 사이트

- Google
- 금연서비스 통합정보시스템
- 금연두드림 홈페이지
- 기관 대표 홈페이지

## 🔧 개발 환경

```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm run dev

# 빌드 (정적 파일)
npm run build
```

## 📄 라이선스

MIT License
