# DBT (Data Build Tool) 기초 설명

## DBT란?

DBT(Data Build Tool)는 데이터 분석가와 엔지니어가 데이터 웨어하우스에서 변환을 수행할 수 있게 해주는 오픈소스 도구입니다. **Python 환경**에서 실행되며, SQL을 사용하여 데이터를 변환하고, 버전 관리, 테스트, 문서화를 통해 데이터 파이프라인을 관리할 수 있습니다.

DBT는 Jinja2 템플릿 엔진을 사용하여 동적 SQL을 생성하고, 다양한 데이터베이스(Snowflake, BigQuery, Redshift, PostgreSQL 등)와 연결할 수 있는 어댑터를 제공합니다.

## DBT 실행 환경

### Python 기반 실행

DBT는 **Python 환경**에서 실행되는 도구입니다. Python 패키지로 설치되며, Python의 가상환경(virtual environment)이나 conda 환경에서 관리하는 것이 권장됩니다.

#### Python 환경 설정
```bash
# 가상환경 생성
python -m venv dbt_env

# 가상환경 활성화 (Windows)
dbt_env\Scripts\activate

# 가상환경 활성화 (macOS/Linux)
source dbt_env/bin/activate

# DBT 설치
pip install dbt-core
pip install dbt-snowflake  # Snowflake 사용시
```

#### 데이터베이스별 DBT 어댑터
DBT는 다양한 데이터베이스와 연결하기 위해 어댑터를 사용합니다:

```bash
# Snowflake
pip install dbt-snowflake

# BigQuery
pip install dbt-bigquery

# Redshift
pip install dbt-redshift

# PostgreSQL
pip install dbt-postgres

# Databricks
pip install dbt-databricks

# Spark
pip install dbt-spark
```

#### DBT 실행 흐름
1. **Python 환경**: DBT 명령어는 Python 스크립트로 실행
2. **SQL 생성**: Jinja 템플릿을 통해 SQL 코드 생성
3. **데이터베이스 연결**: 어댑터를 통해 대상 데이터베이스에 연결
4. **SQL 실행**: 생성된 SQL을 데이터베이스에서 실행
5. **결과 반환**: 실행 결

## 주요 특징

### 1. SQL 기반 변환
- SQL을 사용하여 데이터를 변환합니다
- 데이터 분석가가 쉽게 접근할 수 있습니다
- 복잡한 비즈니스 로직을 구현할 수 있습니다

### 2. 버전 관리
- Git과 통합하여 코드 버전 관리를 수행합니다
- 협업과 코드 리뷰가 가능합니다
- 롤백과 변경 이력을 추적할 수 있습니다

### 3. 테스트와 문서화
- 데이터 품질 테스트를 자동화합니다
- 자동 문서화 기능을 제공합니다
- 데이터 카탈로그 역할을 수행합니다

## 핵심 개념

### Models
```sql
-- models/staging/stg_orders.sql
SELECT 
    order_id,
    customer_id,
    order_date,
    total_amount
FROM raw_orders
WHERE order_date >= '2023-01-01'
```

### Sources
```yaml
# models/sources.yml
version: 2

sources:
  - name: raw_data
    database: analytics
    schema: raw
    tables:
      - name: orders
      - name: customers
```

### Tests
```sql
-- models/schema.yml
version: 2

models:
  - name: stg_orders
    columns:
      - name: order_id
        tests:
          - unique
          - not_null
```

## DBT 기본 문법

### 1. Jinja 템플릿 문법

DBT는 Jinja2 템플릿 엔진을 사용하여 동적 SQL을 생성합니다.

#### Jinja란?
Jinja는 Python 기반의 템플릿 엔진으로, 정적 텍스트에 동적 요소를 삽입할 수 있게 해주는 도구입니다. DBT에서는 SQL 코드에 변수, 조건문, 반복문 등을 추가하여 더 유연하고 재사용 가능한 코드를 작성할 수 있게 해줍니다.

**Jinja의 주요 특징:**
- **변수 삽입**: `{{ 변수명 }}` 형태로 변수를 SQL에 삽입
- **제어 구조**: `{% if %}`, `{% for %}` 등으로 조건문과 반복문 사용
- **매크로**: 재사용 가능한 코드 블록 정의
- **필터**: 데이터 변환 및 가공 기능

#### 변수 사용
```sql
-- dbt_project.yml에서 정의된 변수 사용
SELECT * FROM {{ var('my_variable', 'default_value') }}

-- 매크로 변수 사용
{% set my_table = 'orders' %}
SELECT * FROM {{ ref(my_table) }}
```

#### 조건문
```sql
{% if target.name == 'prod' %}
    SELECT * FROM production_table
{% else %}
    SELECT * FROM development_table
{% endif %}
```

#### 반복문
```sql
{% set tables = ['orders', 'customers', 'products'] %}

{% for table in tables %}
    SELECT * FROM {{ ref(table) }}
    {% if not loop.last %} UNION ALL {% endif %}
{% endfor %}
```

### 2. 참조 함수들

DBT에서는 `ref()`와 `source()` 함수를 사용하여 다른 모델이나 소스 테이블을 참조합니다. 이는 DBT의 의존성 그래프를 구성하고, 실행 순서를 자동으로 결정하는 핵심 기능입니다.

#### ref() - 모델 참조
`ref()` 함수는 DBT 프로젝트 내의 다른 모델을 참조할 때 사용합니다.

**기본 사용법:**
```sql
-- 다른 모델을 참조할 때
SELECT * FROM {{ ref('stg_orders') }}

-- 스키마가 다른 경우
SELECT * FROM {{ ref('staging', 'stg_orders') }}
```

**ref()의 특징:**
- **의존성 관리**: DBT가 자동으로 모델 간 의존성을 파악
- **실행 순서**: 의존성에 따라 자동으로 실행 순서 결정
- **스키마 추상화**: 개발/프로덕션 환경에 따라 스키마 자동 변경
- **테이블명 추상화**: 모델명으로 테이블 참조 (실제 테이블명 숨김)

**동적 참조:**
```sql
{% set model_name = 'stg_orders' %}
SELECT * FROM {{ ref(model_name) }}

-- 조건부 참조
{% if target.name == 'prod' %}
    SELECT * FROM {{ ref('prod_orders') }}
{% else %}
    SELECT * FROM {{ ref('dev_orders') }}
{% endif %}
```

#### source() - 소스 테이블 참조
`source()` 함수는 외부 데이터 소스(원본 테이블)를 참조할 때 사용합니다.

**기본 사용법:**
```sql
-- sources.yml에 정의된 소스 테이블 참조
SELECT * FROM {{ source('raw_data', 'orders') }}

-- 조건부 소스 참조
{% if target.name == 'prod' %}
    SELECT * FROM {{ source('raw_data', 'orders') }}
{% else %}
    SELECT * FROM {{ source('raw_data_dev', 'orders') }}
{% endif %}
```

**source()의 특징:**
- **소스 정의**: `sources.yml` 파일에서 소스 테이블 정의 필요
- **환경별 관리**: 개발/프로덕션 환경에 따라 다른 소스 사용 가능
- **테이블 검증**: 소스 테이블의 존재 여부와 스키마 검증
- **문서화**: 소스 테이블에 대한 메타데이터 관리

**sources.yml 예시:**
```yaml
version: 2

sources:
  - name: raw_data
    description: "원본 데이터 소스"
    database: analytics
    schema: raw
    tables:
      - name: orders
        description: "주문 데이터"
        columns:
          - name: order_id
            description: "주문 ID"
            tests:
              - unique
              - not_null
      - name: customers
        description: "고객 데이터"
        columns:
          - name: customer_id
            description: "고객 ID"
            tests:
              - unique
              - not_null
```

**환경별 소스 관리:**
```yaml
# sources.yml
sources:
  - name: raw_data
    database: analytics
    schema: raw
    tables:
      - name: orders
  - name: raw_data_dev  # 개발 환경용
    database: analytics_dev
    schema: raw
    tables:
      - name: orders
```

**ref() vs source() 비교:**

| 특징 | ref() | source() |
|------|--------|----------|
| **용도** | DBT 모델 간 참조 | 외부 소스 테이블 참조 |
| **정의 위치** | models/ 디렉토리 | sources.yml |
| **의존성** | DBT가 자동 관리 | 수동으로 정의 |
| **실행 순서** | 자동 결정 | 소스는 항상 먼저 실행 |
| **환경별 관리** | config로 관리 | sources.yml에서 관리 |

#### var() - 변수 참조
```sql
-- dbt_project.yml에서 정의된 변수
SELECT * FROM {{ var('orders_table', 'default_orders') }}

-- 런타임에 변수 전달
-- dbt run --vars '{"my_var": "value"}'
SELECT * FROM {{ var('my_var') }}
```

### 3. 매크로 (Macros)

매크로는 재사용 가능한 SQL 코드 블록입니다.

#### 기본 매크로 정의
```sql
-- macros/generate_schema_name.sql
{% macro generate_schema_name(custom_schema_name, node) %}
    {% if custom_schema_name %}
        {{ custom_schema_name }}
    {% elif target.name == 'prod' %}
        {{ node.config.schema }}
    {% else %}
        {{ target.schema }}_{{ node.config.schema }}
    {% endif %}
{% endmacro %}
```

#### 매개변수가 있는 매크로
```sql
-- macros/currency_conversion.sql
{% macro currency_conversion(amount, from_currency, to_currency) %}
    CASE 
        WHEN {{ from_currency }} = 'USD' AND {{ to_currency }} = 'KRW' 
        THEN {{ amount }} * 1300
        WHEN {{ from_currency }} = 'USD' AND {{ to_currency }} = 'EUR' 
        THEN {{ amount }} * 0.85
        ELSE {{ amount }}
    END
{% endmacro %}

-- 사용법
SELECT 
    order_id,
    {{ currency_conversion('total_amount', 'currency', 'USD') }} as usd_amount
FROM orders
```

#### 조건부 매크로
```sql
-- macros/conditional_filter.sql
{% macro conditional_filter(column_name, filter_value) %}
    {% if filter_value %}
        WHERE {{ column_name }} = '{{ filter_value }}'
    {% endif %}
{% endmacro %}

-- 사용법
SELECT * FROM orders
{{ conditional_filter('status', var('order_status', none)) }}
```

### 4. 모델 설정

#### 모델별 설정
```sql
-- models/marts/dim_customers.sql
{{ config(
    materialized='table',
    schema='analytics',
    tags=['daily', 'dimension']
) }}

SELECT 
    customer_id,
    customer_name,
    email
FROM {{ ref('stg_customers') }}
```

#### 설정 옵션들
```sql
-- 테이블로 구체화
{{ config(materialized='table') }}

-- 뷰로 구체화
{{ config(materialized='view') }}

-- 증분 모델
{{ config(
    materialized='incremental',
    unique_key='order_id',
    on_schema_change='sync_all_columns'
) }}

-- 스냅샷
{{ config(materialized='snapshot') }}
```

### 5. 증분 모델 (Incremental Models)

```sql
-- models/marts/fct_orders_incremental.sql
{{ config(
    materialized='incremental',
    unique_key='order_id'
) }}

SELECT 
    order_id,
    customer_id,
    order_date,
    total_amount
FROM {{ ref('stg_orders') }}

{% if is_incremental() %}
    WHERE order_date >= (SELECT MAX(order_date) FROM {{ this }})
{% endif %}
```

### 6. 스냅샷 (Snapshots)

스냅샷은 데이터의 변경 이력을 추적하는 DBT의 기능입니다. 원본 테이블의 레코드가 변경될 때마다 이전 상태를 보존하고, 언제 어떤 값으로 변경되었는지 추적할 수 있습니다.

#### 스냅샷이란?
- **목적**: 데이터의 변경 이력(SCD - Slowly Changing Dimension) 추적
- **동작**: 원본 테이블의 레코드가 변경될 때마다 이전 상태를 보존
- **용도**: 감사(audit), 데이터 품질 모니터링, 변경 이력 분석

#### 스냅샷 전략
1. **timestamp 전략**: `updated_at` 컬럼을 기준으로 변경 감지
2. **check 전략**: 지정된 컬럼들의 값 변경을 감지

```sql
-- snapshots/orders_snapshot.sql
{% snapshot orders_snapshot %}

{{
    config(
        target_database='analytics',
        target_schema='snapshots',
        unique_key='order_id',
        strategy='timestamp',
        updated_at='updated_at',
    )
}}

SELECT * FROM {{ source('raw_data', 'orders') }}

{% endsnapshot %}
```

#### check 전략 예시
```sql
-- snapshots/customers_snapshot.sql
{% snapshot customers_snapshot %}

{{
    config(
        target_database='analytics',
        target_schema='snapshots',
        unique_key='customer_id',
        strategy='check',
        check_cols=['customer_name', 'email', 'phone'],
    )
}}

SELECT * FROM {{ source('raw_data', 'customers') }}

{% endsnapshot %}
```

#### 스냅샷 결과
스냅샷이 실행되면 다음과 같은 컬럼들이 자동으로 추가됩니다:
- `dbt_scd_id`: 스냅샷 레코드의 고유 식별자
- `dbt_updated_at`: 레코드가 마지막으로 업데이트된 시간
- `dbt_valid_from`: 레코드가 유효하기 시작한 시간
- `dbt_valid_to`: 레코드가 유효하지 않게 된 시간 (NULL이면 현재 유효)

### 7. 테스트 작성

#### 일반 테스트
```yaml
# models/schema.yml
version: 2

models:
  - name: stg_orders
    columns:
      - name: order_id
        tests:
          - unique
          - not_null
      - name: total_amount
        tests:
          - not_null
          - positive_values:
              min_value: 0
```

#### 커스텀 테스트
```sql
-- tests/assert_positive_amount.sql
{% test positive_amount(model, column_name) %}

SELECT *
FROM {{ model }}
WHERE {{ column_name }} <= 0

{% endtest %}
```

#### 단일 테스트
```sql
-- tests/assert_order_date_not_future.sql
SELECT order_id, order_date
FROM {{ ref('stg_orders') }}
WHERE order_date > CURRENT_DATE
```

### 8. Seeds

CSV 파일을 데이터베이스에 로드할 때 사용합니다.

```yaml
# dbt_project.yml
seeds:
  +schema: "seeds"
  +materialized: table
```

```sql
-- seeds/country_codes.csv
country_code,country_name
US,United States
KR,South Korea
JP,Japan
```

### 9. 문서화

#### 모델 문서화
```sql
-- models/marts/dim_customers.sql
{{
    config(
        description="고객 차원 테이블"
    )
}}

/*
이 모델은 고객 정보를 정규화하여 차원 테이블로 만듭니다.
주요 컬럼:
- customer_id: 고객 고유 식별자
- customer_name: 고객 이름
- email: 고객 이메일
*/

SELECT 
    customer_id,
    customer_name,
    email
FROM {{ ref('stg_customers') }}
```

#### YAML 문서화
```yaml
# models/schema.yml
version: 2

models:
  - name: dim_customers
    description: "고객 차원 테이블"
    columns:
      - name: customer_id
        description: "고객 고유 식별자"
        tests:
          - unique
          - not_null
      - name: customer_name
        description: "고객 이름"
        tests:
          - not_null
      - name: email
        description: "고객 이메일 주소"
        tests:
          - not_null
```

## 장점

1. **SQL 친화적**: 데이터 분석가가 쉽게 사용 가능
2. **버전 관리**: Git과 통합하여 협업 가능
3. **테스트 자동화**: 데이터 품질 보장
4. **문서화**: 자동 문서 생성
5. **재사용성**: 매크로를 통한 코드 재사용
6. **확장성**: 대규모 데이터 처리 가능

## 사용 사례

- 데이터 웨어하우스 구축
- ETL/ELT 파이프라인 구현
- 데이터 마트 생성
- 데이터 품질 관리
- 분석용 데이터 모델링

## DBT와 Dagster 통합

DBT는 데이터 변환에 특화되어 있고, Dagster는 전체 파이프라인 오케스트레이션에 특화되어 있습니다. 두 도구를 함께 사용하면:

- Dagster: 전체 워크플로우 관리, 스케줄링, 모니터링
- DBT: 데이터 변환, 테스트, 문서화

```python
# Dagster에서 DBT 실행
@op
def run_dbt_models(context):
    subprocess.run(["dbt", "run"], cwd="path/to/dbt/project")
```

## 결론

DBT는 데이터 웨어하우스에서 데이터 변환을 수행하는 강력한 도구입니다. SQL 기반의 접근법과 버전 관리, 테스트 기능을 통해 안정적이고 유지보수하기 쉬운 데이터 파이프라인을 구축할 수 있습니다.

## 공식 리소스

- **공식 웹사이트**: [https://www.getdbt.com/](https://www.getdbt.com/)
- **공식 문서**: [https://docs.getdbt.com/](https://docs.getdbt.com/)
- **GitHub**: [https://github.com/dbt-labs/dbt-core](https://github.com/dbt-labs/dbt-core)
- **커뮤니티**: [https://community.getdbt.com/](https://community.getdbt.com/) 