# DBT (Data Build Tool) 기초 설명

## DBT란?

DBT(Data Build Tool)는 데이터 분석가와 엔지니어가 데이터 웨어하우스에서 변환을 수행할 수 있게 해주는 오픈소스 도구입니다. SQL을 사용하여 데이터를 변환하고, 버전 관리, 테스트, 문서화를 통해 데이터 파이프라인을 관리할 수 있습니다.

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

## 설치 및 시작

```bash
pip install dbt-core
pip install dbt-snowflake  # Snowflake 사용시
```

### 프로젝트 초기화
```bash
dbt init my_project
cd my_project
```

### 첫 번째 모델 실행
```bash
dbt run
```

## DBT 프로젝트 구조

```
my_project/
├── dbt_project.yml
├── models/
│   ├── staging/
│   ├── intermediate/
│   └── marts/
├── tests/
├── macros/
├── snapshots/
└── seeds/
```

## 주요 명령어

### 모델 실행
```bash
dbt run                    # 모든 모델 실행
dbt run --select model_name  # 특정 모델만 실행
dbt run --exclude model_name # 특정 모델 제외하고 실행
```

### 테스트 실행
```bash
dbt test                    # 모든 테스트 실행
dbt test --select model_name  # 특정 모델의 테스트만 실행
```

### 문서 생성
```bash
dbt docs generate
dbt docs serve
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