# Ploggo - 플로깅 경로 기록기 (Next.js & TypeScript)

플로깅(쓰레기 줍기/조깅) 시 실시간 GPS를 이용하거나 지도 위에 탭하여 이동 경로를 기록하고 나만의 플로깅 여정을 관리할 수 있는 모바일 우선 웹 애플리케이션입니다.

## 🚀 주요 기능

1. **지도 이중화 지원**: 
   - **Naver Maps JS SDK**: 기본적으로 네이버 지도를 기반으로 동작합니다.
   - **Leaflet + OpenStreetMap**: 네이버 지도 Client ID가 설정되지 않았거나 로드에 실패할 시, 자동으로 OSM 지도와 Leaflet 엔진으로 안전하게 전환(Fallback)되어 경로 탐색 및 그리기 기능이 동작합니다.
2. **모바일 최적화 UI**: 한 손 조작이 손쉬운 플로팅 글래스모피즘(Glassmorphism) 하단 제어 패널과 목록 서랍(Drawer)을 탑재했습니다.
3. **위치 추적 및 기록**:
   - **현재 위치로 이동**: 브라우저 Geolocation API를 사용하여 현재 지도 위에 현재 위치 마커를 띄우고 지도를 정렬합니다.
   - **수동 탭 그리기**: 지도 위 원하는 곳을 탭하여 길모퉁이마다 점을 찍고 Polyline으로 경로를 그릴 수 있습니다.
   - **GPS 기반 점 추가**: 실제 서 있는 위치에서 버튼을 눌러 GPS 좌표를 경로 점으로 직접 추가할 수 있습니다.
4. **로컬 데이터 보관**:
   - 저장한 경로는 로컬 스토리지에 자동 보관됩니다.
   - 추후 Supabase 나 Vercel Postgres 등으로 손쉽게 마이그레이션할 수 있도록 스토리지 인터페이스 구조(`src/lib/storage.ts`)를 완전히 격리하였습니다.
   - 저장된 경로 선택 시 지도 복원, 이름 변경(Rename), 삭제 기능을 제공합니다.

---

## 🛠 실행 방법

### 1. 패키지 설치
```bash
npm install
```

### 2. 로컬 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000`으로 접속하여 확인합니다. (위치 정보 기능을 정확히 모바일 기기 등에서 테스트하려면 HTTPS 터널링 혹은 Vercel 배포 본을 사용하는 것을 권장합니다.)

### 3. 프로덕션 빌드 및 실행
```bash
npm run build
npm run start
```

---

## 🔑 네이버 지도 API 키 발급 및 설정 방법

네이버 지도를 메인 지도로 사용하기 위해서는 Client ID 발급 및 애플리케이션 등록 과정이 필요합니다.

1. **네이버 클라우드 플랫폼**에 로그인합니다. (https://www.ncloud.com/)
2. **Services > AI·Naver API > Application** 메뉴로 이동합니다.
3. **Application 등록** 버튼을 클릭합니다.
4. 애플리케이션 이름을 지정한 후, 서비스 선택에서 **Maps > Web Dynamic Map**을 선택합니다.
5. **서비스 URL**에 아래와 같이 본인의 서비스 URL을 등록합니다:
   - 로컬 테스트용: `http://localhost:3000`
   - Vercel 배포용: `https://your-app-name.vercel.app` (본인의 Vercel 배포 도메인)
6. 등록이 완료되면 부여되는 **Client ID** 값을 복사합니다.
7. 프로젝트 루트 경로에 `.env.local` 파일을 생성하고 아래와 같이 환경변수를 작성합니다:
   ```env
   NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=복사한_클라이언트_ID_값
   ```

*참고: 환경변수 키가 없거나 스크립트 로드 실패 시 자동으로 OpenStreetMap(Leaflet) 지도로 대체 작동하므로, 키 입력 없이도 바로 개발 및 기능을 확인하실 수 있습니다.*

---

## ☁️ Vercel 배포 방법

Vercel은 Next.js 개발사인 Vercel에서 제공하는 최적의 배포 플랫폼입니다.

### 방법 1: Vercel CLI로 배포하기
1. 프로젝트 루트에서 다음 명령어를 실행합니다.
   ```bash
   npx vercel
   ```
2. 로그인 과정 및 프로젝트 생성 과정을 터미널 가이드에 따라 진행합니다.
3. 배포 설정 도중 **Environment Variables** 단계에서 다음 환경변수를 설정합니다:
   - Key: `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`
   - Value: `발급받은_네이버_지도_클라이언트_ID`
4. 최종 프로덕션 배포 시:
   ```bash
   npx vercel --prod
   ```

### 방법 2: GitHub 연동을 통한 자동 배포 (권장)
1. 코드를 GitHub, GitLab 등의 원격 저장소에 푸시합니다.
2. Vercel Dashboard(https://vercel.com/)로 이동하여 **Add New > Project**를 선택합니다.
3. 저장소를 가져온(Import) 후, 배포 설정 창의 **Environment Variables** 탭을 엽니다.
4. `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 환경 변수와 네이버 지도 Client ID 값을 추가합니다.
5. **Deploy** 버튼을 누르면 배포가 진행됩니다. 이후 main 브랜치에 코드를 push할 때마다 자동으로 빌드 및 배포가 수행됩니다.
