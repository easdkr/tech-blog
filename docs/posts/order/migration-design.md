# 빅커머스 의존성 분리 및 주문 시스템 내재화 아키텍처 설계

## 📋 개요

현재 빅커머스에 완전히 의존하고 있는 주문 시스템을 점진적으로 분리하여 100% 내재화를 목표로 하는 아키텍처 설계입니다.

**기본 전략:**

- 프론트엔드 주문 로직을 내재화된 API로 변경
- PG사 결제 프로세스 완전 분리 (결제 검증 필수)
- SNS-SQS 팬아웃 패턴으로 높은 처리량 확보
- 이벤트 기반 아키텍처로 빅커머스 동기화 및 후속 처리 분리
- 점진적 마이그레이션으로 리스크 최소화

**결제 보안 강화:**

- 프론트엔드 결제 완료 후 백엔드에서 반드시 PG사 검증
- 결제 금액/정보 불일치 시 자동 취소 처리
- 위조 결제 데이터 감지 및 차단
- 웹훅을 통한 이중 검증 체계

## 🏗️ 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph FrontendLayer[Frontend Layer]
        A1[사용자]
        A2[프론트엔드<br/>주문/결제 화면]
        A3[PG 결제<br/>컴포넌트]
    end

    subgraph APIGateway[API Gateway Layer]
        B1[POST /orders<br/>주문 생성]
        B2[POST /orders/:id/complete<br/>결제 완료]
        B3[POST /orders/:id/fail<br/>결제 실패]
        B4[GET /orders/:id<br/>주문 조회]
        B5[Webhook Endpoint<br/>PG 결제 알림]
    end

    subgraph CoreServices[Core Services Layer]
        C1[주문 서비스<br/>주문 생성/관리]
        C2[결제 서비스<br/>검증/승인/취소]
    end

    subgraph Database[Database Layer]
        D1[(주문 DB<br/>status: PENDING/PAID/FAILED)]
        D2[(결제 DB<br/>결제 정보/이력)]
    end

    subgraph EventSystem[Event System]
        E1[SNS 주문 이벤트<br/>ORDER_COMPLETED]
        E2[SNS 결제 이벤트<br/>PAYMENT_COMPLETED]
    end

    subgraph MessageQueues[Message Queues]
        F1[빅커머스 동기화 Queue]
        F2[알림톡 발송 Queue]
        F4[포인트 적립 Queue]
    end

    subgraph WorkerServices[Worker Services]
        G1[빅커머스 동기화<br/>Lambda]
        G2[알림톡 발송<br/>Lambda]
        G4[포인트 적립<br/>Lambda]
    end

    subgraph ExternalSystems[External Systems]
        H1[빅커머스 API]
        H2[토스페이먼츠 API]
        H3[알림톡 서비스]
    end

    subgraph DLQ[Dead Letter Queues]
        I1[빅커머스 DLQ]
        I2[알림톡 DLQ]
        I4[포인트 DLQ]
    end

    %% 주문 생성 플로우
    A1 --> A2
    A2 --> B1
    B1 --> C1
    C1 --> D1
    C1 -->|주문 생성 응답| A2

    %% 결제 플로우
    A2 --> A3
    A3 --> H2
    H2 -->|결제 결과| A3
    A3 -->|성공| B2
    A3 -->|실패| B3

    %% 결제 완료 처리
    B2 --> C2
    C2 -->|검증| H2
    C2 --> D1
    C2 --> D2
    C2 --> E2

    %% 결제 실패 처리
    B3 --> C1
    C1 --> D1

    %% 웹훅 처리
    H2 -.->|웹훅| B5
    B5 -.-> C2

        %% 이벤트 처리
    E1 --> F1
    E1 --> F2
    E1 --> F4

    E2 --> E1

    %% 워커 처리
    F1 --> G1
    F2 --> G2
    F4 --> G4

    G1 --> H1
    G2 --> H3

    %% DLQ 처리
    G1 -.->|실패| I1
    G2 -.->|실패| I2
    G4 -.->|실패| I4

```

## 🔄 주문 처리 플로우

### 1. 주문 생성 플로우

```mermaid
flowchart TD
    A[사용자 주문 버튼 클릭] --> B[주문 생성 API 호출<br/>POST /orders]
    B --> C{입력 검증}
    C -->|실패| D[400 에러 응답]
    C -->|성공| E[주문 번호 생성]
    E --> F[DB 트랜잭션 시작]
    F --> G[주문 레코드 생성<br/>status: PENDING]
    G --> H[주문 아이템 저장]
    H --> I[배송 정보 저장]
    I --> J[DB 트랜잭션 커밋]
    J --> K{결제 필요?}
    K -->|예| L[결제 정보 준비<br/>(주문ID, 금액, 상품명)]
    K -->|아니오| M[0원 주문 완료<br/>status: PAID]
    L --> N[주문 생성 응답<br/>(주문ID, 결제정보)]
    M --> O[주문 완료 이벤트 발행]
    N --> P[프론트엔드에서<br/>PG 결제 진행]
    O --> Q[주문 완료 응답]

```

### 2. 결제 플로우 (상세)

```mermaid
sequenceDiagram
    participant User as 사용자
    participant FE as Frontend
    participant BE as Backend
    participant PG as PG사
    participant DB as Database

    User->>FE: 1. 상품 선택 및 주문 요청
    FE->>BE: 2. POST /orders (상품정보, 수량, 배송지 등)

    BE->>DB: 3. 주문 데이터 생성 (status: PENDING)
    DB-->>BE: 4. 주문 ID 반환

    BE-->>FE: 5. 주문 생성 완료 응답 (주문ID, 금액, 상품명)

    FE->>PG: 6. PG 컴포넌트 로드 및 결제 시작 (주문ID, 금액, 상품명)
    Note over FE,PG: PG 결제 컴포넌트에서<br/>카드정보 입력, 본인인증 등

    PG->>PG: 7. 카드사 승인 처리
    PG-->>FE: 8. 결제 결과 (성공/실패)

    alt 결제 성공
        FE->>BE: 9a. POST /orders/{orderId}/complete (결제정보)
        BE->>PG: 10a. 결제 검증 요청 (결제ID 등)
        PG-->>BE: 11a. 결제 검증 응답

        alt 검증 성공
            BE->>DB: 12a. 주문 상태 업데이트 (status: PAID)
            BE->>DB: 13a. 결제 정보 저장
            BE-->>FE: 14a. 결제 완료 응답
            FE-->>User: 15a. 결제 완료 페이지 이동
        else 검증 실패 (결제 존재)
            Note over BE: 금액/정보 불일치 등
            BE->>PG: 12b. 결제 취소 요청 (환불)
            BE->>DB: 13b. 주문 상태 업데이트 (status: FAILED)
            BE-->>FE: 14b. 결제 실패 응답
            FE-->>User: 15b. 결제 실패 안내
        else 검증 실패 (결제 없음)
            Note over BE: 위조된 결제 데이터
            BE->>DB: 12c. 주문 상태 업데이트 (status: FAILED)
            BE-->>FE: 13c. 결제 실패 응답
            FE-->>User: 14c. 결제 실패 안내
        end

    else 결제 실패
        FE->>BE: 9c. POST /orders/{orderId}/fail (실패정보)
        BE->>DB: 10c. 주문 상태 업데이트 (status: FAILED)
        BE-->>FE: 11c. 실패 처리 완료 응답
        FE-->>User: 12c. 결제 실패 안내
    end

    Note over BE,PG: 백그라운드 웹훅 처리 (보완)
    PG--)BE: 웹훅: 최종 결제 결과 통지
    BE->>DB: 결제 상태 최종 검증 및 동기화
```

### 3. 결제 완료 처리 플로우 (간략)

```mermaid
flowchart TD
    A[토스페이먼츠 콜백] --> B[결제 완료 API 호출]
    B --> C[토스페이먼츠 결제 검증]
    C -->|검증 실패| D[결제 실패 처리]
    C -->|검증 성공| E[주문 상태 업데이트]
    E --> F[결제 정보 저장]
    F --> G[SNS 이벤트 발행]
    G --> H[이벤트 로그 저장]
    H --> I[성공 응답]
    I --> J[주문 완료 페이지]

    D --> K{결제 존재 여부}
    K -->|존재| L[결제 취소 요청]
    K -->|미존재| M[위조 결제 처리]
    L --> N[에러 로그 저장]
    M --> N
    N --> O[실패 응답]

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
