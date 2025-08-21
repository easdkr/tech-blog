# 빅커머스 의존성 분리 및 주문 시스템 내재화 아키텍처 설계

## 📋 개요

현재 빅커머스에 완전히 의존하고 있는 주문 시스템을 점진적으로 분리하여 100% 내재화를 목표로 하는 아키텍처 설계입니다.

**기본 전략:**

- 프론트엔드 주문 로직을 내재화된 API로 변경
- SNS-SQS 팬아웃 패턴으로 높은 처리량 확보
- 이벤트 기반 아키텍처로 빅커머스 동기화 및 후속 처리 분리
- 점진적 마이그레이션으로 리스크 최소화

## 🏗️ 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "Frontend Layer"
        A1[프론트엔드 주문 버튼]
    end

    subgraph "API Gateway Layer"
        B1[주문 생성 API]
        B2[결제 완료 API]
        B3[주문 조회 API]
    end

    subgraph "Core Services Layer"
        C1[주문 서비스]
        C2[결제 서비스]
    end

    subgraph "Database Layer"
        D1[(내재화 주문 DB)]
    end

    subgraph "Event System"
        E1[SNS 토픽<br/>주문 이벤트]
    end

    subgraph "Message Queues"
        F1[빅커머스 동기화<br/>SQS Queue]
        F2[알림톡 발송<br/>SQS Queue]
        F4[포인트 적립<br/>SQS Queue]
    end

    subgraph "Worker Services"
        G1[빅커머스 동기화<br/>Lambda]
        G2[알림톡 발송<br/>Lambda]
        G4[포인트 적립<br/>Lambda]
    end

    subgraph "External Systems"
        H1[빅커머스 API]
        H2[토스페이먼츠]
        H3[알림톡 서비스]
    end

    subgraph "Dead Letter Queues"
        I1[빅커머스 DLQ]
        I2[알림톡 DLQ]
        I4[포인트 DLQ]
    end

    A1 --> B1

    B1 --> C1
    B2 --> C2
    B3 --> C1

    C1 --> D1
    C2 --> D1

    C1 --> E1
    C2 --> E1

    E1 --> F1
    E1 --> F2
    E1 --> F4

    F1 --> G1
    F2 --> G2
    F4 --> G4

    G1 --> H1
    G2 --> H3
    C2 --> H2
    H2 -->|웹훅| B2

    G1 -.-> I1
    G2 -.-> I2
    G4 -.-> I4

```

## 🔄 주문 처리 플로우

### 1. 주문 생성 플로우

```mermaid
flowchart TD
    A[사용자 주문 버튼 클릭] --> B[주문 생성 API 호출]
    B --> C{입력 검증}
    C -->|실패| D[400 에러 응답]
    C -->|성공| G[주문 번호 생성]
    G --> H[DB 트랜잭션 시작]
    H --> I[내부 주문 레코드 생성]
    I --> J[주문 아이템 저장]
    J --> K[DB 트랜잭션 커밋]
    K --> L{결제 필요?}
    L -->|예| M[토스페이먼츠 URL 생성]
    L -->|아니오| N[0원 주문 완료]
    M --> O[결제 URL 응답]
    N --> P[주문 완료 이벤트 발행]
    O --> Q[결제 페이지로 리다이렉트]

```

### 2. 결제 완료 처리 플로우

```mermaid
flowchart TD
    A[토스페이먼츠 콜백] --> B[결제 완료 API 호출]
    B --> C[토스페이먼츠 결제 승인]
    C -->|실패| D[결제 실패 처리]
    C -->|성공| E[주문 상태 업데이트]
    E --> F[결제 정보 저장]
    F --> G[SNS 이벤트 발행]
    G --> H[이벤트 로그 저장]
    H --> I[성공 응답]
    I --> J[주문 완료 페이지]

    D --> K[에러 로그 저장]
    K --> L[실패 응답]

```

## 📡 SNS-SQS 이벤트 시스템

### SNS 토픽 구조

```mermaid
graph TB
    A[주문 완료 SNS 토픽] --> B[이벤트 메시지]

    B --> C[메시지 속성]
    C --> C1[eventType: ORDER_COMPLETED]
    C --> C2[paymentMethod: toss/points]
    C --> C4[totalAmount: 금액]
    C --> C5[customerId: 고객ID]

    B --> D[메시지 본문]
    D --> D1[주문 기본 정보]
    D --> D2[고객 정보]
    D --> D3[상품 목록]
    D --> D4[배송 주소]
    D --> D5[결제 정보]

```

### SQS 구독 및 필터링

```mermaid
graph TB
    A[SNS 주문 이벤트] --> B{메시지 필터링}

    B --> |eventType=ORDER_COMPLETED| C[빅커머스 동기화 큐]
    B --> |eventType=ORDER_COMPLETED| D[알림톡 발송 큐]
    B --> |eventType=ORDER_COMPLETED| F[포인트 적립 큐]

    C --> C1[배치 크기: 50]
    C --> C2[동시성: 100]
    C --> C3[타임아웃: 5분]

    D --> D1[배치 크기: 30]
    D --> D2[동시성: 50]
    D --> D3[타임아웃: 3분]

    F --> F1[배치 크기: 100]
    F --> F2[동시성: 50]
    F --> F3[타임아웃: 2분]

```

## 🔧 워커 서비스 처리 플로우

### 빅커머스 동기화 워커

```mermaid
flowchart TD
    A[SQS 메시지 수신] --> B[배치 메시지 처리]
    B --> C[메시지 파싱]
    C --> D{중복 처리 확인}
    D -->|중복| E[메시지 스킵]
    D -->|신규| F[빅커머스 주문 생성]
    F -->|성공| G[내부 주문 동기화 상태 업데이트]
    F -->|실패| H[재시도 로직]
    G --> I[처리 완료]
    H --> J{재시도 횟수 초과?}
    J -->|예| K[DLQ로 전송]
    J -->|아니오| F
    E --> I
    K --> L[수동 처리 대기]

```

### 알림톡 발송 워커

```mermaid
flowchart TD
    A[SQS 메시지 수신] --> B[배치 메시지 처리]
    B --> C[고객 정보 추출]
    C --> D[알림톡 템플릿 선택]
    D --> E{배송 방법 확인}
    E -->|일반 배송| F[배송 시작 템플릿]
    E -->|새벽 배송| G[새벽 배송 템플릿]
    E -->|픽업| H[픽업 준비 템플릿]
    F --> I[알림톡 API 호출]
    G --> I
    H --> I
    I -->|성공| J[발송 로그 저장]
    I -->|실패| K[재시도 또는 DLQ]
    J --> L[처리 완료]

```

## 🔍 모니터링 및 알림 시스템

### CloudWatch 메트릭 대시보드

```mermaid
graph TB
    subgraph "모니터링 시스템"
        A[CloudWatch 메트릭]

        A --> B[주문 생성 메트릭]
        B --> B1[초당 주문 수]
        B --> B2[평균 주문 금액]
        B --> B3[주문 성공률]

        A --> C[이벤트 처리 메트릭]
        C --> C1[SNS 발행 수]
        C --> C2[SQS 처리 지연시간]
        C --> C3[Lambda 에러율]

        A --> D[비즈니스 메트릭]
        D --> D1[빅커머스 동기화 성공률]
        D --> D2[알림톡 발송 성공률]
        D --> D3[평균 처리 시간]

        A --> E[알림 설정]
        E --> E1[에러율 5% 초과시]
        E --> E2[지연시간 30초 초과시]
        E --> E3[DLQ 메시지 축적시]
    end

```

### 장애 대응 플로우

```mermaid
flowchart TD
    A[장애 감지] --> B{장애 유형 분류}

    B -->|API 장애| C[주문 생성 실패]
    B -->|이벤트 장애| E[메시지 처리 실패]
    B -->|외부 API 장애| F[빅커머스/결제 실패]

    C --> G[Circuit Breaker 작동]
    G --> H[장애 페이지 표시]

    E --> K[DLQ로 메시지 이동]
    K --> L[수동 재처리 준비]

    F --> M[재시도 메커니즘 작동]
    M --> N[대체 처리 방법 사용]

```

<!--
## 🚀 단계별 마이그레이션 로드맵

### Phase 1: 기반 구축 (4주)

```mermaid
gantt
    title Phase 1: 기반 구축
    dateFormat  YYYY-MM-DD
    section 데이터베이스
    주문 스키마 설계     :db1, 2024-01-01, 1w
    테이블 생성 및 인덱스 :db2, after db1, 1w

    section API 개발
    주문 생성 API       :api1, 2024-01-08, 1w
    결제 완료 API       :api2, after api1, 1w

    section 이벤트 시스템
    SNS 토픽 설정       :event1, 2024-01-15, 1w
    SQS 큐 설정         :event2, after event1, 1w
```

### Phase 2: 워커 개발 (4주)

```mermaid
gantt
    title Phase 2: 워커 개발
    dateFormat  YYYY-MM-DD
    section 핵심 워커
    빅커머스 동기화 워커  :worker1, 2024-02-01, 2w
    알림톡 발송 워커     :worker2, 2024-02-08, 1w

    section 부가 워커
    포인트 적립 워커     :worker4, 2024-02-15, 1w
```

### Phase 3: 프론트엔드 전환 (2주)

```mermaid
gantt
    title Phase 3: 프론트엔드 전환
    dateFormat  YYYY-MM-DD
    section 프론트엔드
    주문 버튼 로직 변경   :fe1, 2024-03-01, 1w

    section 테스트
    통합 테스트         :test1, 2024-03-08, 1w
    성능 테스트         :test2, after test1, 1w
```

## 📈 예상 성능 및 효과

### 처리량 비교
-->
