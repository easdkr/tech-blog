# 데이터 아키텍처 가이드

이 문서는 현대 기업의 데이터 전략에서 핵심이 되는 세 가지 데이터 아키텍처에 대한 포괄적인 가이드를 제공합니다.

## 주요 문서

### 1. [Data Mart](./posts/data-architecture/data-mart.md)
특정 비즈니스 영역이나 부서를 위한 데이터 저장소에 대한 상세한 가이드입니다.

**주요 내용:**
- Data Mart의 개념과 특징
- 유형별 분류 (Dependent, Independent, Hybrid)
- 구현 고려사항과 기술 스택
- 모니터링 및 유지보수 전략

### 2. [Data Warehouse](./posts/data-architecture/data-warehouse.md)
기업의 의사결정을 지원하는 중앙 집중식 데이터 저장소에 대한 포괄적인 설명입니다.

**주요 내용:**
- Data Warehouse의 4가지 특징 (주제 중심적, 통합적, 시계열적, 비휘발성)
- 아키텍처와 데이터 모델링
- ETL 프로세스와 성능 최적화
- 최신 트렌드와 구현 단계

### 3. [Data Lake](./posts/data-architecture/data-lake.md)
구조화된 데이터와 비구조화된 데이터를 원본 형태 그대로 저장하는 저장소에 대한 가이드입니다.

**주요 내용:**
- Data Lake의 특징과 아키텍처
- Bronze/Silver/Gold Zone 패턴
- 빅데이터 분석과 머신러닝 활용
- 데이터 늪 방지 전략

### 4. [데이터 아키텍처 비교](./posts/data-architecture/data-architecture-comparison.md)
세 가지 데이터 아키텍처의 상세한 비교 분석과 선택 가이드입니다.

**주요 내용:**
- 성능, 비용, 복잡도 비교
- 사용 사례별 선택 가이드
- 구현 체크리스트
- 하이브리드 전략 제안

## 빠른 참조

### 언제 어떤 아키텍처를 선택해야 할까요?

| 상황 | 추천 아키텍처 | 이유 |
|------|---------------|------|
| 특정 부서 분석 | **Data Mart** | 빠른 구현, 도메인 특화 |
| 전사적 통합 분석 | **Data Warehouse** | 중앙 집중식 관리, 데이터 품질 |
| 빅데이터/ML | **Data Lake** | 다양한 데이터 형식, 확장성 |
| 복잡한 요구사항 | **하이브리드** | 각 아키텍처의 장점 결합 |

### 기술 스택 비교

| 구분 | Data Mart | Data Warehouse | Data Lake |
|------|-----------|----------------|-----------|
| **데이터베이스** | PostgreSQL, MySQL | Redshift, Snowflake | S3, HDFS |
| **처리** | 간단한 ETL | 복잡한 ETL | Spark, Flink |
| **쿼리** | SQL | SQL | Hive, Presto |

## 데이터 엔지니어링 도구

### 1. [Dagster 기초](./posts/data-engineering/dagster-basics.md)
데이터 파이프라인 오케스트레이션을 위한 강력한 도구에 대한 가이드입니다.

**주요 내용:**
- Dagster의 개념과 특징
- Assets, Ops, Jobs 등 핵심 개념
- 설치 및 시작 방법
- 모니터링과 개발자 경험

### 2. [DBT 기초](./posts/data-engineering/dbt-basics.md)
데이터 웨어하우스에서 SQL 기반 변환을 수행하는 도구에 대한 설명입니다.

**주요 내용:**
- DBT의 개념과 특징
- Models, Sources, Tests 등 핵심 개념
- 프로젝트 구조와 명령어
- 데이터 품질 관리와 문서화

### 3. [Dagster와 DBT 통합 아키텍처](./posts/data-engineering/data-mart-dagster-architecture.md)
Dagster를 사용한 데이터 마트 구축 아키텍처에 대한 상세한 가이드입니다.

**주요 내용:**
- Dagster와 DBT의 통합 방법
- 데이터 마트 구축 전략
- 모니터링과 알림 설정
- 실제 구현 사례



---

*이 문서들은 지속적으로 업데이트되며, 최신 데이터 아키텍처 트렌드와 모범 사례를 반영합니다.*