# 날씨 대시보드 프로젝트

TypeScript + Spring Boot 3.x (Kotlin) 기반의 날씨 대시보드 애플리케이션입니다.

## 프로젝트 구조

```
claude_tutorial/
├── front/                  # TypeScript + React + Vite
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── services/      # API 서비스
│   │   ├── types/         # TypeScript 타입 정의
│   │   ├── App.tsx
│   │   └── App.css
│   └── package.json
└── back/                   # Spring Boot 3.x + Kotlin
    ├── src/main/kotlin/com/weather/api/
    │   ├── config/        # 설정 파일
    │   ├── controller/    # REST API 컨트롤러
    │   ├── dto/          # 데이터 전송 객체
    │   └── service/      # 비즈니스 로직
    └── build.gradle.kts
```

## 기술 스택

### Backend
- **Spring Boot 3.2.0**
- **Kotlin 1.9.20**
- **Java 21**
- **Gradle (Kotlin DSL)**
- **Spring WebFlux** (비동기 API 호출)

### Frontend
- **React 18**
- **TypeScript**
- **Vite**
- **Axios**

## 시작하기

### 1. OpenWeather API 키 발급

1. [OpenWeather](https://openweathermap.org/api) 웹사이트 접속
2. 무료 계정 생성
3. API 키 발급 (무료 플랜 사용 가능)

### 2. Backend 설정

```bash
cd back

# .env 파일 생성
cp .env.example .env

# .env 파일에 API 키 추가
echo "OPENWEATHER_API_KEY=your_actual_api_key_here" > .env
```

### 3. Backend 실행

```bash
cd back

# Gradle 빌드 및 실행
./gradlew bootRun

# 또는 빌드 후 실행
./gradlew build
java -jar build/libs/weather-api-0.0.1-SNAPSHOT.jar
```

서버는 `http://localhost:8080`에서 실행됩니다.

### 4. Frontend 실행

```bash
cd front

# 의존성 설치 (처음 한 번만)
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드는 `http://localhost:5173`에서 실행됩니다.

## API 엔드포인트

### Health Check
```
GET /api/weather/health
```

### 도시 이름으로 날씨 조회
```
GET /api/weather/city/{city}
예: /api/weather/city/Seoul
```

### 좌표로 날씨 조회
```
GET /api/weather/coordinates?lat={latitude}&lon={longitude}
예: /api/weather/coordinates?lat=37.5665&lon=126.9780
```

## 응답 예시

```json
{
  "city": "Seoul",
  "country": "KR",
  "temperature": 15.5,
  "feelsLike": 14.2,
  "description": "맑음",
  "icon": "01d",
  "humidity": 65,
  "windSpeed": 3.5,
  "timestamp": 1701234567
}
```

## 주요 기능

- 도시 이름으로 날씨 검색
- 현재 위치 기반 날씨 조회 (Geolocation API)
- 실시간 날씨 정보 표시
  - 온도 (섭씨)
  - 체감 온도
  - 날씨 설명
  - 습도
  - 풍속
- 반응형 디자인 (모바일 지원)
- 아름다운 그라데이션 UI

## 개발 모드

### Backend Hot Reload
Spring Boot DevTools가 포함되어 있어 코드 변경 시 자동으로 재시작됩니다.

### Frontend Hot Reload
Vite의 HMR(Hot Module Replacement)로 빠른 개발이 가능합니다.

## 프로덕션 빌드

### Backend
```bash
cd back
./gradlew build
```

### Frontend
```bash
cd front
npm run build
```

빌드된 파일은 `front/dist` 폴더에 생성됩니다.

## 트러블슈팅

### CORS 오류
- `back/src/main/kotlin/com/weather/api/config/WebConfig.kt`에서 CORS 설정 확인
- 프론트엔드 URL이 허용 목록에 있는지 확인

### API 키 오류
- `.env` 파일에 올바른 API 키가 설정되어 있는지 확인
- 환경 변수가 제대로 로드되는지 확인

### 포트 충돌
- Backend: `application.yml`에서 포트 변경 가능 (기본: 8080)
- Frontend: `vite.config.ts`에서 포트 변경 가능 (기본: 5173)

## 라이센스

ISC
