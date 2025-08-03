# 서로게이트 키(Surrogate Key) 가이드

## 개요

서로게이트 키는 데이터베이스에서 레코드를 고유하게 식별하기 위해 시스템이 자동으로 생성하는 인공적인 키입니다. 자연 키(Natural Key)와 달리 비즈니스 의미가 없는 숫자나 UUID 형태로 구성됩니다.

**쉽게 설명하면:**
- 시스템이 자동으로 만들어주는 고유 번호
- 주민등록번호나 사번 같은 자연 키와는 다름
- 단순히 데이터를 구분하기 위한 용도

## 서로게이트 키가 필요한 이유

### 1. **성능 향상**
```sql
-- 자연 키 사용 (느림)
SELECT * FROM customers WHERE customer_id = 'CUST-2024-001234';

-- 서로게이트 키 사용 (빠름)
SELECT * FROM customers WHERE id = 12345;
```

**이유:**
- 숫자 기반 인덱스가 문자열보다 빠름
- 데이터베이스 엔진이 숫자를 더 효율적으로 처리
- 인덱스 크기가 작아져서 메모리 사용량 감소

### 2. **데이터 일관성 보장**
```sql
-- 문제 상황: 고객이 이메일을 변경하는 경우
UPDATE customers SET email = 'new@email.com' WHERE email = 'old@email.com';

-- 다른 테이블에서 이메일로 참조하는 경우 문제 발생
-- 서로게이트 키를 사용하면 이런 문제 없음
```

**이유:**
- 자연 키가 변경되어도 서로게이트 키는 변하지 않음
- 외래 키 관계가 안정적으로 유지됨
- 데이터 무결성 보장

### 3. **복합 키 문제 해결**
```sql
-- 복합 자연 키 (복잡함)
CREATE TABLE orders (
    customer_id VARCHAR(50),
    order_date DATE,
    product_id VARCHAR(50),
    quantity INT,
    PRIMARY KEY (customer_id, order_date, product_id)
);

-- 서로게이트 키 사용 (간단함)
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    customer_id VARCHAR(50),
    order_date DATE,
    product_id VARCHAR(50),
    quantity INT
);
```

**이유:**
- 복합 키보다 단순한 구조
- 외래 키 참조가 간단해짐
- 쿼리 작성이 용이

### 4. **데이터 마이그레이션 용이성**
```sql
-- 시스템 통합 시 자연 키 충돌 문제
-- 회사 A: 고객번호 'C001'
-- 회사 B: 고객번호 'C001' (충돌!)

-- 서로게이트 키 사용 시 충돌 없음
-- 회사 A: id = 1, customer_code = 'C001'
-- 회사 B: id = 2, customer_code = 'C001'
```

**이유:**
- 시스템 통합 시 키 충돌 방지
- 레거시 시스템과의 호환성 유지
- 점진적 마이그레이션 가능

## 실제 예시

### 고객 테이블 예시
```sql
-- 자연 키만 사용 (문제가 많은 방식)
CREATE TABLE customers (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP
);

-- 서로게이트 키 사용 (권장 방식)
CREATE TABLE customers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP
);
```

### 주문 테이블 예시
```sql
-- 자연 키만 사용
CREATE TABLE orders (
    customer_email VARCHAR(255),
    order_date DATE,
    order_number VARCHAR(50),
    total_amount DECIMAL(10,2),
    PRIMARY KEY (customer_email, order_date, order_number),
    FOREIGN KEY (customer_email) REFERENCES customers(email)
);

-- 서로게이트 키 사용
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT,
    order_date DATE,
    order_number VARCHAR(50),
    total_amount DECIMAL(10,2),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

## 장단점 비교

### 서로게이트 키의 장점
1. **성능**: 빠른 조인과 인덱싱
2. **안정성**: 키 변경에 영향받지 않음
3. **단순성**: 단일 컬럼으로 식별 가능
4. **확장성**: 시스템 통합 시 유연성

### 서로게이트 키의 단점
1. **추가 저장공간**: 추가 컬럼 필요
2. **의미 없음**: 비즈니스 의미가 없음
3. **중복 가능성**: 자연 키와 함께 관리 필요

## 모범 사례

### 1. **자연 키와 서로게이트 키 함께 사용**
```sql
CREATE TABLE customers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,  -- 서로게이트 키
    customer_code VARCHAR(20) UNIQUE,      -- 자연 키
    email VARCHAR(255) UNIQUE,
    name VARCHAR(100),
    created_at TIMESTAMP
);
```

### 2. **적절한 인덱스 설정**
```sql
-- 서로게이트 키는 자동으로 인덱스됨
-- 자연 키도 인덱스 필요
CREATE INDEX idx_customer_code ON customers(customer_code);
CREATE INDEX idx_email ON customers(email);
```

### 3. **명명 규칙**
```sql
-- 일관된 명명 규칙 사용
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY,      -- user_id
    product_id BIGINT PRIMARY KEY,   -- product_id
    order_id BIGINT PRIMARY KEY      -- order_id
);
```

## 사용 시 주의사항

### 1. **자연 키도 함께 관리**
```sql
-- 서로게이트 키만 사용하면 중복 데이터 발생 가능
-- 자연 키의 UNIQUE 제약조건 필요
CREATE TABLE customers (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,  -- 중복 방지
    name VARCHAR(100)
);
```

### 2. **적절한 데이터 타입 선택**
```sql
-- 작은 테이블: INT
-- 큰 테이블: BIGINT
-- 분산 시스템: UUID
CREATE TABLE small_table (
    id INT PRIMARY KEY AUTO_INCREMENT
);

CREATE TABLE large_table (
    id BIGINT PRIMARY KEY AUTO_INCREMENT
);
```

### 3. **시퀀스 관리**
```sql
-- 데이터베이스별 시퀀스 설정
-- MySQL
CREATE TABLE table_name (
    id BIGINT PRIMARY KEY AUTO_INCREMENT
);

-- PostgreSQL
CREATE TABLE table_name (
    id BIGINT PRIMARY KEY DEFAULT nextval('sequence_name')
);
```

## 결론

서로게이트 키는 현대 데이터베이스 설계에서 필수적인 요소입니다. 성능, 안정성, 확장성을 모두 고려할 때 자연 키만 사용하는 것보다 훨씬 유리합니다. 다만 자연 키의 의미와 제약조건도 함께 관리해야 완전한 설계가 됩니다.

**핵심 포인트:**
- 성능을 위해 서로게이트 키 사용
- 안정성을 위해 자연 키 변경 시 영향 최소화
- 확장성을 위해 시스템 통합 시 유연성 확보
- 일관성을 위해 자연 키의 제약조건도 함께 관리 