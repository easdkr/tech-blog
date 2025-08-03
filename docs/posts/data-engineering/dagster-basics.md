# Dagster 데이터 거버넌스 프로젝트 가이드

## Dagster 기초

### Dagster란?

데이터 파이프라인을 구축하고 관리하기 위한 오픈소스 데이터 오케스트레이션 플랫폼. Python으로 작성되며, 데이터 엔지니어링 워크플로우를 안정적이고 유지보수하기 쉽게 만들어 줌

 - **데이터 파이프라인** : 데이터를 한 곳에서 다른 곳으로 이동시키고 처리하는 일련의 과정 또는 시스템을 의미합니다. 즉, 데이터를 원천 시스템에서 최종 목적지(데이터 레이크, 데이터 웨어하우스 등)로 옮기면서 필요한 가공, 변환, 분석 등의 단계를 거치는 일련의 과정을 자동화하는 시스템

### 주요 특징

#### 1. 코드 우선 접근법 (Code-First Approach)
- 모든 파이프라인이 Python 코드로 정의
- 버전 관리 시스템과 통합이 용이

#### 2. 타입 안전성
- Python의 타입 힌트를 활용하여 데이터 검증을 수행
- 런타임 오류를 줄이고 데이터 품질을 보장

#### 3. DX
- 대시보드를 통해 파이프라인 모니터링이 가능
- 실시간 로그와 메트릭을 제공
- 디버깅과 문제 해결에 용이

### 핵심 개념


#### Dagster 핵심 개념 관계도

```mermaid
graph TB
    subgraph "Dagster 핵심 개념"
        A[Assets<br/>데이터 자산] --> B[Ops<br/>작업 단위]
        B --> C[Jobs<br/>워크플로우]
        C --> D[Schedules<br/>스케줄링]
        C --> E[Sensors<br/>이벤트 트리거]
        
        F[Resources<br/>외부 시스템 연결] --> A
        F --> B
        
        G[Config<br/>설정] --> A
        G --> B
        G --> C
    end
    
    subgraph "실행 흐름"
        H[데이터 소스] --> A
        A --> I[데이터 웨어하우스]
        B --> I
        C --> I
    end
    
    subgraph "모니터링"
        J[Dagster UI] --> A
        J --> B
        J --> C
        J --> D
        J --> E
    end
    
    style A fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#4ecdc4,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#45b7d1,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#96ceb4,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#feca57,stroke:#333,stroke-width:2px,color:#fff
    style F fill:#ff9ff3,stroke:#333,stroke-width:2px,color:#fff
    style G fill:#54a0ff,stroke:#333,stroke-width:2px,color:#fff
    style H fill:#5f27cd,stroke:#333,stroke-width:2px,color:#fff
    style I fill:#00d2d3,stroke:#333,stroke-width:2px,color:#fff
    style J fill:#ff9f43,stroke:#333,stroke-width:2px,color:#fff
```

#### Assets
Dagster의 핵심 개념으로, 데이터 파이프라인에서 생성되는 데이터를 나타내는 단위
- Asset은 실제 데이터 자체를 정의하는 것으로, 다음과 같은 것들을 나타낼 수 있습니다:
     - 데이터베이스 테이블
     - CSV 파일
     - JSON 파일
     - API 응답 데이터
     - 변환된 데이터셋

##### 기본 Assets
```python
from dagster import asset
import pandas as pd

@asset
def raw_data():
    """원시 데이터를 로드하는 asset"""
    return pd.read_csv("data/raw.csv")

@asset
def processed_data(raw_data):
    """전처리된 데이터를 생성하는 asset"""
    return raw_data.dropna()
```

##### Asset Dependency
- 데이터 파이프라인에서 어떤 asset이 다른 asset를 필요로 하는 관계를 정의 하는 것
    - Dagster 가 의존성을 분석하여 순서를 보장
    - 의존성이 없는 Asset 들은 병렬로 실행 가능
    - 증분 처리 : 변경된 Asset 과 그 의존 Asset 들만 재실행
    - 시각화 : Dagster UI 에서 의존성 그래프를 시각적으로 확인 가능

```python
@asset
def customer_orders(customer_data, order_data):
    """여러 asset을 결합하는 asset"""
    return customer_data.merge(order_data, on='customer_id')
```

##### Asset Metadata
```python
@asset(
    description="고객 주문 데이터",
    tags={"team": "analytics", "domain": "sales"},
    freshness_policy=FreshnessPolicy(maximum_lag_minutes=60)
)
def daily_orders():
    return pd.read_csv("data/daily_orders.csv")
```
#### Ops (작업)
Ops는 데이터 파이프라인에서 수행하는 **개별 작업 단위**입니다. 쉽게 말해서 "데이터를 가공하는 함수"라고 생각하면 됩니다.

##### Ops의 역할
- **데이터 추출**: API에서 데이터를 가져오기
- **데이터 변환**: 데이터 정제, 필터링, 집계 등
- **데이터 적재**: 데이터베이스에 저장하기
- **데이터 검증**: 데이터 품질 확인하기

##### 기본 Op 예시
```python
from dagster import op

@op
def extract_customer_data(context):
    """고객 데이터를 API에서 추출하는 Op"""
    context.log.info("고객 데이터 추출 시작")
    # API 호출 로직
    customers = api.get_customers()
    context.log.info(f"{len(customers)}명의 고객 데이터 추출 완료")
    return customers

@op
def clean_customer_data(context, customers):
    """고객 데이터를 정제하는 Op"""
    context.log.info("고객 데이터 정제 시작")
    # 이메일 형식 검증, 중복 제거 등
    cleaned_customers = remove_duplicates(customers)
    context.log.info(f"{len(cleaned_customers)}명의 고객 데이터 정제 완료")
    return cleaned_customers

@op
def load_customer_data(context, cleaned_customers):
    """정제된 고객 데이터를 데이터베이스에 저장하는 Op"""
    context.log.info("고객 데이터 저장 시작")
    # 데이터베이스 저장 로직
    database.insert_customers(cleaned_customers)
    context.log.info("고객 데이터 저장 완료")
```

##### Op Configuration
Op가 실행될 때 필요한 설정값들을 정의하는 방법

```python
from dagster import op, Config

class CleanOrdersConfig(Config):
    """주문 데이터 정제를 위한 설정"""
    threshold: int = 100  # 최소 주문 금액
    remove_duplicates: bool = True  # 중복 제거 여부
    validate_email: bool = True  # 이메일 검증 여부

@op(
    description="주문 데이터 정제 및 검증",
    tags={"domain": "sales", "team": "data-engineering"},
    config_schema=CleanOrdersConfig
)
def clean_orders(context, orders_df):
    """주문 데이터를 정제하는 Op"""
    config = context.op_config
    
    context.log.info(f"정제 시작: {len(orders_df)}개 주문")
    
    # 설정값에 따른 데이터 정제
    if config.remove_duplicates:
        orders_df = orders_df.drop_duplicates()
        context.log.info("중복 주문 제거 완료")
    
    if config.validate_email:
        orders_df = orders_df[orders_df['email'].str.contains('@')]
        context.log.info("이메일 검증 완료")
    
    # 최소 주문 금액 필터링
    filtered_orders = orders_df[orders_df["amount"] > config.threshold]
    context.log.info(f"정제 완료: {len(filtered_orders)}개 주문")
    
    return filtered_orders
```

##### Op Dependencies
여러 Op가 어떤 순서로 실행되어야 하는지를 정의

###### 기본 의존성
```python
@op
def extract_customer_data(context):
    """고객 데이터 추출"""
    context.log.info("고객 데이터 추출 시작")
    customers = pd.read_csv("data/customers.csv")
    context.log.info(f"{len(customers)}명 고객 데이터 추출 완료")
    return customers

@op
def extract_order_data(context):
    """주문 데이터 추출"""
    context.log.info("주문 데이터 추출 시작")
    orders = pd.read_csv("data/orders.csv")
    context.log.info(f"{len(orders)}개 주문 데이터 추출 완료")
    return orders

@op
def merge_customer_orders(context, customers, orders):
    """고객과 주문 데이터 병합"""
    context.log.info("고객-주문 데이터 병합 시작")
    merged_data = customers.merge(orders, on='customer_id', how='left')
    context.log.info(f"{len(merged_data)}개 병합 데이터 생성 완료")
    return merged_data

@op
def load_to_warehouse(context, merged_data):
    """병합된 데이터를 웨어하우스에 저장"""
    context.log.info("데이터 웨어하우스 저장 시작")
    merged_data.to_csv("warehouse/customer_orders.csv", index=False)
    context.log.info("데이터 웨어하우스 저장 완료")
```

###### 복잡한 의존성 예시
```python
@op
def extract_data(context):
    """여러 소스에서 데이터 추출"""
    context.log.info("다중 소스 데이터 추출 시작")
    
    # 여러 데이터 소스에서 동시에 추출
    customers = pd.read_csv("data/customers.csv")
    orders = pd.read_csv("data/orders.csv")
    products = pd.read_csv("data/products.csv")
    
    context.log.info("다중 소스 데이터 추출 완료")
    return customers, orders, products

@op
def transform_customers(context, customers):
    """고객 데이터 변환"""
    context.log.info("고객 데이터 변환 시작")
    # 고객 데이터 정제 로직
    cleaned_customers = customers.dropna(subset=['email'])
    context.log.info("고객 데이터 변환 완료")
    return cleaned_customers

@op
def transform_orders(context, orders):
    """주문 데이터 변환"""
    context.log.info("주문 데이터 변환 시작")
    # 주문 데이터 정제 로직
    cleaned_orders = orders[orders['amount'] > 0]
    context.log.info("주문 데이터 변환 완료")
    return cleaned_orders

@op
def transform_products(context, products):
    """상품 데이터 변환"""
    context.log.info("상품 데이터 변환 시작")
    # 상품 데이터 정제 로직
    active_products = products[products['status'] == 'active']
    context.log.info("상품 데이터 변환 완료")
    return active_products

@op
def create_final_dataset(context, cleaned_customers, cleaned_orders, active_products):
    """최종 데이터셋 생성"""
    context.log.info("최종 데이터셋 생성 시작")
    
    # 고객-주문 병합
    customer_orders = cleaned_customers.merge(
        cleaned_orders, on='customer_id', how='left'
    )
    
    # 주문-상품 병합
    final_dataset = customer_orders.merge(
        active_products, on='product_id', how='left'
    )
    
    context.log.info(f"최종 데이터셋 생성 완료: {len(final_dataset)}개 레코드")
    return final_dataset
```

###### 의존성의 장점
1. **자동 순서 보장**: Dagster가 의존성을 분석하여 올바른 순서로 실행
2. **병렬 처리**: 의존성이 없는 Op들은 동시에 실행 가능
3. **재실행 최적화**: 변경된 Op와 그 의존 Op들만 재실행
4. **시각화**: Dagster UI에서 의존성 그래프를 시각적으로 확인 가능

#### Jobs (작업)
Jobs는 여러 Op를 조합하여 완전한 워크플로우를 만듭니다.

##### 기본 Job
```python
from dagster import job

@job
def etl_job():
    load_data(transform_data(extract_data()))
```

##### Job 구성
```python
@job(
    description="일일 ETL 파이프라인",
    tags={"team": "data-engineering"},
    config={
        "ops": {
            "extract_data": {"config": {"source": "database"}},
            "transform_data": {"config": {"threshold": 100}}
        }
    }
)
def daily_etl_job():
    load_data(transform_data(extract_data()))
```

#### Resources (리소스)
Resources는 **외부 시스템과의 연결을 관리하는 도구**입니다. 쉽게 말해서 "데이터베이스 연결", "API 클라이언트", "클라우드 서비스 연결" 등을 의미합니다.

##### Resource 예시
```python
from dagster import resource, asset

@resource
def database_connection():
    """PostgreSQL 데이터베이스 연결"""
    return create_postgres_connection()

@resource
def bigcommerce_api():
    """BigCommerce API 클라이언트"""
    return BigCommerceClient(
        access_token="your_token",
        store_hash="your_store"
    )

@resource
def slack_notification():
    """Slack 알림 클라이언트"""
    return SlackClient(token="your_slack_token")

# Asset에서 Resource 사용
@asset(required_resource_keys={"database", "bigcommerce_api"})
def customer_data(context):
    """고객 데이터를 수집하는 Asset"""
    # Resource 사용
    api_client = context.resources.bigcommerce_api
    db_connection = context.resources.database
    
    # API에서 데이터 가져오기
    customers = api_client.get_customers()
    
    # 데이터베이스에 저장
    db_connection.insert_customers(customers)
    
    return customers

@asset(required_resource_keys={"slack_notification"})
def notify_success(context, customer_data):
    """성공 시 Slack 알림"""
    slack = context.resources.slack_notification
    slack.send_message(
        channel="#data-alerts",
        text=f"고객 데이터 수집 완료: {len(customer_data)}명"
    )
```

##### Resource의 장점
1. **재사용성**: 여러 Asset에서 같은 Resource 사용 가능
2. **관리 용이성**: 연결 설정을 한 곳에서 관리
3. **보안**: 민감한 정보(API 키, 비밀번호)를 안전하게 관리
4. **테스트**: 테스트 시 Mock Resource로 쉽게 교체 가능

#### Schedules (스케줄)
정기적인 작업 실행을 위한 스케줄을 정의합니다.

```python
from dagster import schedule, job

@job
def daily_job():
    daily_etl_job()

@schedule(
    job=daily_job,
    cron_schedule="0 2 * * *",  # 매일 오전 2시
    execution_timezone="Asia/Seoul"
)
def daily_schedule(_context):
    return {}
```

#### Sensors (센서)
Sensors는 **외부 이벤트를 감지하여 자동으로 Job을 실행**하는 트리거 메커니즘입니다. 예를 들어, 새 파일이 생성되거나, API 응답이 변경되거나, 특정 조건이 만족될 때 파이프라인을 자동으로 실행합니다.

##### Sensor의 주요 특징
- **이벤트 기반**: 외부 이벤트에 반응하여 실행
- **실시간 감지**: 주기적으로 조건을 확인
- **중복 방지**: 같은 이벤트에 대해 중복 실행 방지
- **조건부 실행**: 특정 조건이 만족될 때만 실행

##### 기본 Sensor 예시
```python
from dagster import sensor, job, RunRequest, SensorResult

@job
def process_new_files_job():
    process_new_files()

@sensor(job=process_new_files_job)
def file_sensor(context):
    """새 파일이 생성되면 Job을 실행하는 Sensor"""
    new_files = check_for_new_files()
    
    if new_files:
        for file in new_files:
            yield RunRequest(
                run_key=f"file_{file}",  # 중복 방지를 위한 고유 키
                run_config={
                    "ops": {
                        "process_new_files": {
                            "config": {"file_path": file}
                        }
                    }
                }
            )
        context.log.info(f"새 파일 감지: {len(new_files)}개")
```

##### 다양한 Sensor 예시

###### 1. 파일 시스템 Sensor
```python
import os
from pathlib import Path

@sensor(job=process_new_files_job)
def csv_file_sensor(context):
    """CSV 파일이 생성되면 Job을 실행"""
    watch_directory = Path("/data/incoming")
    
    # 감시 디렉토리에서 새 CSV 파일 확인
    csv_files = list(watch_directory.glob("*.csv"))
    
    for csv_file in csv_files:
        # 파일이 완전히 쓰여졌는지 확인 (파일 크기가 1분간 변하지 않음)
        if is_file_complete(csv_file):
            yield RunRequest(
                run_key=f"csv_{csv_file.name}",
                run_config={
                    "ops": {
                        "process_new_files": {
                            "config": {"file_path": str(csv_file)}
                        }
                    }
                }
            )
            context.log.info(f"새 CSV 파일 감지: {csv_file.name}")

def is_file_complete(file_path):
    """파일이 완전히 쓰여졌는지 확인"""
    import time
    size1 = file_path.stat().st_size
    time.sleep(1)
    size2 = file_path.stat().st_size
    return size1 == size2
```

###### 2. API 응답 Sensor
```python
import requests
from dagster import sensor, job, RunRequest

@job
def api_data_sync_job():
    sync_api_data()

@sensor(job=api_data_sync_job)
def api_response_sensor(context):
    """API 응답이 변경되면 Job을 실행"""
    api_url = "https://api.example.com/data"
    
    try:
        response = requests.get(api_url)
        current_hash = hash(response.content)
        
        # 이전 해시값과 비교
        previous_hash = context.cursor_sensor_value
        
        if previous_hash != current_hash:
            yield RunRequest(
                run_key=f"api_update_{current_hash}",
                run_config={
                    "ops": {
                        "sync_api_data": {
                            "config": {"api_url": api_url}
                        }
                    }
                }
            )
            context.log.info("API 데이터 변경 감지")
        
        # 현재 해시값 저장
        return SensorResult(cursor=str(current_hash))
        
    except Exception as e:
        context.log.error(f"API Sensor 오류: {str(e)}")
```

###### 3. 데이터베이스 변경 Sensor
```python
from dagster import sensor, job, RunRequest
import psycopg2

@job
def sync_database_changes_job():
    sync_database_changes()

@sensor(job=sync_database_changes_job)
def database_change_sensor(context):
    """데이터베이스 테이블이 변경되면 Job을 실행"""
    db_config = {
        "host": "localhost",
        "database": "my_database",
        "user": "my_user",
        "password": "my_password"
    }
    
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # 테이블의 마지막 수정 시간 확인
        cursor.execute("""
            SELECT MAX(updated_at) 
            FROM orders 
            WHERE updated_at > %s
        """, (context.cursor_sensor_value or "1970-01-01",))
        
        latest_update = cursor.fetchone()[0]
        
        if latest_update:
            yield RunRequest(
                run_key=f"db_update_{latest_update}",
                run_config={
                    "ops": {
                        "sync_database_changes": {
                            "config": {"since": str(latest_update)}
                        }
                    }
                }
            )
            context.log.info(f"데이터베이스 변경 감지: {latest_update}")
        
        cursor.close()
        conn.close()
        
        return SensorResult(cursor=str(latest_update))
        
    except Exception as e:
        context.log.error(f"데이터베이스 Sensor 오류: {str(e)}")
```

###### 4. 조건부 Sensor
```python
from dagster import sensor, job, RunRequest
import datetime

@job
def conditional_job():
    process_conditional_data()

@sensor(job=conditional_job)
def time_based_sensor(context):
    """특정 시간에만 Job을 실행"""
    now = datetime.datetime.now()
    
    # 오전 9시부터 오후 6시까지만 실행
    if 9 <= now.hour < 18:
        # 평일만 실행
        if now.weekday() < 5:  # 0=월요일, 4=금요일
            yield RunRequest(
                run_key=f"time_based_{now.strftime('%Y%m%d_%H%M')}",
                run_config={
                    "ops": {
                        "process_conditional_data": {
                            "config": {"execution_time": str(now)}
                        }
                    }
                }
            )
            context.log.info(f"시간 기반 실행: {now}")
```

##### Sensor 설정 옵션
```python
@sensor(
    job=my_job,
    minimum_interval_seconds=30,  # 최소 30초 간격으로 실행
    description="파일 변경 감지 센서",
    tags={"team": "data-engineering", "domain": "file-processing"}
)
def configured_sensor(context):
    # Sensor 로직
    pass
```

##### Sensor의 장점
1. **자동화**: 수동 개입 없이 자동 실행
2. **실시간성**: 이벤트 발생 즉시 반응
3. **효율성**: 필요한 때만 실행하여 리소스 절약
4. **확장성**: 다양한 이벤트 타입 지원
5. **모니터링**: Dagster UI에서 Sensor 상태 확인 가능

### DBT와 함께 사용하기

Dagster와 DBT는 상호 보완적인 관계로, 함께 사용하면 더욱 강력한 데이터 파이프라인을 구축할 수 있습니다.

#### Dagster + DBT 아키텍처

```mermaid
graph LR
    A[Dagster<br/>Orchestration] --> B[DBT<br/>Transformation]
    B --> C[Data Warehouse<br/>Snowflake/BigQuery/Redshift]
    
    A1[스케줄링] --> A
    A2[모니터링] --> A
    A3[알림] --> A
    A4[리소스 관리] --> A
    
    B1[SQL 변환] --> B
    B2[테스트] --> B
    B3[문서화] --> B
    B4[버전 관리] --> B
```

#### DBT 실행 방식

DBT는 **Dagster Asset 내부에서 실행**됩니다. 즉, Dagster가 DBT를 호출하는 구조입니다.

##### 1. DBT Asset 방식 (권장)
```python
from dagster import dbt_assets, AssetExecutionContext
from dagster_dbt import DbtCliResource

@dbt_assets(
    manifest=transformer_project.manifest_path,
    dagster_dbt_translator=CustomDagsterDbtTranslator(),
)
def transformer_dbt_assets(
    context: AssetExecutionContext, 
    dbt: DbtCliResource, 
    config: DbtConfig
):
    """DBT 모델을 실행하는 Asset"""
    dbt_args = ["build"]
    if config.full_refresh:
        dbt_args.append("--full-refresh")
    yield from dbt.cli(dbt_args, context=context).stream()
```

#### 실제 사용 예시

##### 전체 파이프라인 구조
```python
from dagster import asset, dbt_assets, define_asset_job, schedule

# 1. 원시 데이터 수집 Asset
@asset
def src_customer(context, bigcommerce, bigquery):
    """BigCommerce에서 고객 데이터 수집"""
    customers = bigcommerce.get_customers()
    bigquery.load_table_from_dataframe(customers, "raw_customers")
    return customers

@asset
def src_order(context, bigcommerce, bigquery):
    """BigCommerce에서 주문 데이터 수집"""
    orders = bigcommerce.get_orders()
    bigquery.load_table_from_dataframe(orders, "raw_orders")
    return orders

# 2. DBT 변환 Asset
@dbt_assets(manifest=transformer_project.manifest_path)
def transformer_dbt_assets(context, dbt):
    """DBT를 통한 데이터 변환"""
    yield from dbt.cli(["build"], context=context).stream()

# 3. 통합 Job 정의
etl_job = define_asset_job(
    name="etl_pipeline",
    selection=AssetSelection.assets(
        src_customer,
        src_order,
        transformer_dbt_assets,
    ),
)

# 4. 스케줄 정의
@schedule(
    job=etl_job,
    cron_schedule="0 2 * * *",  # 매일 오전 2시
    execution_timezone="Asia/Seoul"
)
def daily_etl_schedule(_context):
    return {}
```

#### 실행 순서

1. **원시 데이터 수집**: `src_customer`, `src_order` Asset 실행
2. **DBT 변환**: `transformer_dbt_assets` Asset 실행 (내부에서 DBT 실행)
3. **데이터 웨어하우스**: 변환된 데이터가 최종 테이블에 저장

#### DBT 변환 과정 상세 설명

```python
# 1. DBT Asset 정의
@dbt_assets(manifest=transformer_project.manifest_path)
def transformer_dbt_assets(context, dbt):
    """DBT를 통한 데이터 변환"""
    # 이 Asset이 실행되면 내부적으로 DBT 명령어가 실행됩니다
    yield from dbt.cli(["build"], context=context).stream()
```

**실제 실행 과정:**

1. **Dagster가 `transformer_dbt_assets` Asset을 실행**
2. **Asset 내부에서 DBT 명령어 실행**: `dbt build`
3. **DBT가 SQL 모델들을 실행**:
   ```sql
   -- dim_customer.sql
   SELECT customer_id, name, email FROM raw_customers
   
   -- fct_order.sql  
   SELECT order_id, customer_id, amount FROM raw_orders
   ```
4. **결과가 데이터 웨어하우스에 저장**:
   - `dim_customer` 테이블 생성
   - `fct_order` 테이블 생성

**즉, Dagster Asset이 DBT를 "호출"하는 구조입니다:**

```mermaid
graph TD
    A[Dagster Asset 실행] --> B[DBT 명령어 실행]
    B --> C[SQL 모델 실행]
    C --> D[데이터 웨어하우스에 저장]
    
    E[원시 데이터] --> C
    F[DBT 모델 정의] --> C
```

#### 장점

1. **통합된 모니터링**: Dagster UI에서 전체 파이프라인 모니터링
2. **의존성 관리**: 원시 데이터 → DBT 변환 순서 자동 보장
3. **에러 처리**: DBT 실행 실패 시 Dagster에서 에러 처리
4. **알림**: DBT 실행 결과를 Slack 등으로 알림
5. **재실행**: 특정 Asset만 선택적으로 재실행 가능

#### DBT Op 구현

```python
from dagster import op, Config
import subprocess
import os

class DBTConfig(Config):
    project_dir: str
    profiles_dir: str = "~/.dbt"
    target: str = "dev"

@op
def run_dbt_models(context, config: DBTConfig):
    """DBT 모델을 실행하는 Op"""
    context.log.info("Starting DBT model run")
    
    cmd = [
        "dbt", "run",
        "--project-dir", config.project_dir,
        "--profiles-dir", config.profiles_dir,
        "--target", config.target
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        raise Exception(f"DBT run failed: {result.stderr}")
    
    context.log.info("DBT model run completed successfully")
    return result.stdout

@op
def run_dbt_tests(context, config: DBTConfig):
    """DBT 테스트를 실행하는 Op"""
    context.log.info("Starting DBT tests")
    
    cmd = [
        "dbt", "test",
        "--project-dir", config.project_dir,
        "--profiles-dir", config.profiles_dir,
        "--target", config.target
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        context.log.warning(f"DBT tests failed: {result.stderr}")
    else:
        context.log.info("DBT tests passed")
    
    return result.stdout
```

#### 통합 Job 예시

```python
from dagster import job, asset

@asset
def raw_data():
    """원시 데이터 수집"""
    return extract_from_source()

@asset
def dbt_models(raw_data):
    """DBT를 통한 데이터 변환"""
    config = DBTConfig(project_dir="./dbt_project")
    return run_dbt_models(config)

@asset
def dbt_tests(dbt_models):
    """DBT 테스트 실행"""
    config = DBTConfig(project_dir="./dbt_project")
    return run_dbt_tests(config)

@job
def dbt_pipeline():
    """DBT 파이프라인"""
    dbt_tests(dbt_models(raw_data()))
```

### 설치 및 시작

```bash
pip install dagster dagit
```

#### 첫 번째 파이프라인 실행
```bash
dagit -f my_pipeline.py
```

### 장점

1. **유연성**: 다양한 데이터 소스와 도구와 통합 가능
2. **확장성**: 대규모 데이터 파이프라인 처리 가능
3. **모니터링**: 실시간 대시보드와 알림 기능
4. **테스트**: 단위 테스트와 통합 테스트 지원
5. **커뮤니티**: 활발한 오픈소스 커뮤니티

### 사용 사례

- ETL/ELT 파이프라인 구축
- 머신러닝 워크플로우 관리
- 데이터 웨어하우스 구축
- 실시간 데이터 처리
- 배치 작업 스케줄링

---

## 🎯 프로젝트 개요

이 프로젝트는 **Wisely**의 데이터 거버넌스를 위한 Dagster 기반 데이터 파이프라인입니다. BigCommerce, PostgreSQL, BigQuery 등 다양한 데이터 소스를 통합하여 일관된 데이터 웨어하우스를 구축합니다.

### 주요 특징
- ✅ **다중 데이터 소스 통합**: BigCommerce, PostgreSQL, BigQuery
- ✅ **실시간 모니터링**: Dagster UI를 통한 파이프라인 모니터링
- ✅ **데이터 품질 보장**: Asset 체크를 통한 데이터 검증
- ✅ **자동화된 스케줄링**: 정기적인 데이터 파이프라인 실행
- ✅ **에러 처리 및 알림**: Slack을 통한 실시간 알림

---

## 📁 프로젝트 구조

```
data-governance/
├── orchestrator/          # Dagster 오케스트레이션 코드
│   ├── assets/           # 데이터 자산 정의
│   │   ├── customer.py   # 고객 데이터 자산
│   │   ├── order.py      # 주문 데이터 자산
│   │   ├── product.py    # 상품 데이터 자산
│   │   └── dbt.py        # DBT 통합 자산
│   ├── resources/        # 외부 시스템 연결 리소스
│   │   ├── bigcommerce.py # BigCommerce API 리소스
│   │   ├── postgres.py   # PostgreSQL 리소스
│   │   └── gcs_resource.py # Google Cloud Storage 리소스
│   ├── jobs/             # 작업 정의
│   ├── schedules.py      # 스케줄 정의
│   └── definitions.py    # 메인 정의 파일
├── transformer/          # DBT 변환 프로젝트
│   ├── models/          # DBT 모델
│   │   ├── dim/         # 차원 테이블
│   │   ├── fct/         # 팩트 테이블
│   │   └── mart/        # 마트 테이블
│   └── dbt_project.yml  # DBT 프로젝트 설정
└── requirements.txt      # Python 의존성
```

---

## 🔧 핵심 구성 요소

### 1. Assets (데이터 자산)

#### 고객 데이터 자산
```python
@asset(group_name="customer")
def src_customer(
    context: AssetExecutionContext,
    config: CustomerConfig,
    bigcommerce: BigCommerceResource,
    bigquery: BigQueryResource,
) -> None:
    """BigCommerce에서 고객 데이터를 수집하여 BigQuery에 적재"""
```

#### 주문 데이터 자산
```python
@asset(group_name="order")
def src_order(
    context: AssetExecutionContext,
    bigcommerce: BigCommerceResource,
    bigquery: BigQueryResource,
) -> None:
    """BigCommerce에서 주문 데이터를 수집하여 BigQuery에 적재"""
```

#### 상품 데이터 자산
```python
@asset(group_name="product")
def src_product(
    context: AssetExecutionContext,
    bigcommerce: BigCommerceResource,
    bigquery: BigQueryResource,
) -> None:
    """BigCommerce에서 상품 데이터를 수집하여 BigQuery에 적재"""
```

### 2. Resources (리소스)

#### BigCommerce 리소스
```python
class BigCommerceResource(ConfigurableResource):
    access_token: str
    store_hash: str
    
    async def stream_all_customers(self, batch_size: int = 250):
        """모든 고객 데이터를 스트리밍으로 가져오기"""
    
    async def stream_all_orders(self, batch_size: int = 50):
        """모든 주문 데이터를 스트리밍으로 가져오기"""
```

#### PostgreSQL 리소스
```python
class PostgresResource(ConfigurableResource):
    postgres_url: str
    
    def execute_query_df(self, query: str) -> pd.DataFrame:
        """SQL 쿼리를 실행하고 DataFrame으로 반환"""
```

#### BigQuery 리소스
```python
# BigQuery 연결 설정
"bigquery": BigQueryResource(
    project="data-warehouse-455801",
    location="asia-northeast3",
    gcp_credentials=EnvVar("GCP_SERVICE_ACCOUNT_KEY"),
),
```

### 3. DBT 통합

#### DBT Assets
```python
@dbt_assets(
    manifest=transformer_project.manifest_path,
    dagster_dbt_translator=CustomDagsterDbtTranslator(),
)
def transformer_dbt_assets(
    context: AssetExecutionContext, 
    dbt: DbtCliResource, 
    config: DbtConfig
):
    """DBT 모델을 실행하는 Asset"""
    dbt_args = ["build"]
    if config.full_refresh:
        dbt_args.append("--full-refresh")
    yield from dbt.cli(dbt_args, context=context).stream()
```

#### DBT 모델 구조
- **dim/**: 차원 테이블 (고객, 상품, SKU 등)
- **fct/**: 팩트 테이블 (주문, 배송, 클레임 등)
- **mart/**: 마트 테이블 (비즈니스 메트릭)

### 4. Jobs (작업)

#### 고객 동기화 작업
```python
sync_customer = define_asset_job(
    name="sync_customer",
    selection=AssetSelection.assets(
        src_customer,
        src_customer_metafields,
        ["dim", "dim_customer"],
    ),
)
```

#### 상품 알림 이벤트 생성
```python
create_product_notification_event = define_asset_job(
    name="create_product_notification_event",
    selection=AssetSelection.assets(
        src_customer,
        src_customer_metafields,
        ["dim", "dim_customer"],
        bigcommerce_onsale_product_inventory,
        fct_onsale_product_inventory,
        op_product_notification_event,
    ),
)
```

### 5. Schedules (스케줄)

#### 일일 스케줄
```python
@schedule(
    job=sync_customer,
    cron_schedule="0 2 * * *",  # 매일 오전 2시
    execution_timezone="Asia/Seoul"
)
def daily_customer_sync(_context):
    return {}
```

#### 매시간 스케줄
```python
@schedule(
    job=create_product_notification_event,
    cron_schedule="0 * * * *",  # 매시간
    execution_timezone="Asia/Seoul"
)
def hourly_product_notification(_context):
    return {}
```

---

## 🔄 데이터 파이프라인 플로우

### 1. 데이터 수집 단계

```mermaid
graph TD
    A[BigCommerce API] --> B[src_customer]
    A --> C[src_order]
    A --> D[src_product]
    E[PostgreSQL] --> F[src_point_transaction]
    E --> G[src_quotation]
    
    B --> H[BigQuery]
    C --> H
    D --> H
    F --> H
    G --> H
```

### 2. 데이터 변환 단계

```mermaid
graph TD
    A[BigQuery Raw Data] --> B[DBT Models]
    B --> C[dim_customer]
    B --> D[dim_product]
    B --> E[dim_sku]
    B --> F[fct_order]
    B --> G[fct_order_item]
    B --> H[mart_complete_purchase_order]
```

### 3. 전체 파이프라인

```mermaid
graph LR
    A[데이터 소스] --> B[Extract Assets]
    B --> C[BigQuery Raw]
    C --> D[DBT Transform]
    D --> E[Data Warehouse]
    
    F[Dagster Orchestration] --> B
    F --> D
    
    G[Monitoring] --> F
    H[Alerts] --> F
    
    I[Schedule] --> F
    J[Sensors] --> F
    
    style A fill:#e1f5fe
    style E fill:#c8e6c9
    style F fill:#fff3e0
    style D fill:#f3e5f5
```

---

## ⚡ 주요 기능

### 1. 비동기 데이터 수집
```python
async def src_customer(
    context: AssetExecutionContext,
    config: CustomerConfig,
    bigcommerce: BigCommerceResource,
    bigquery: BigQueryResource,
) -> None:
    """비동기로 BigCommerce 고객 데이터 수집"""
    customers = []
    async for customer in bigcommerce.stream_all_customers():
        customers.append(customer)
    
    # BigQuery에 적재
    df = pd.DataFrame(customers)
    bigquery.load_table_from_dataframe(df, "customers")
```

### 2. 증분 데이터 처리
```python
class CustomerConfig(Config):
    hours_lookback: Optional[int] = 12  # 12시간 전부터
    full_refresh: bool = False  # 전체 새로고침 여부
```

### 3. 데이터 품질 검사
```python
@asset_check(asset=products)
def required_columns_has_no_missing_values(context, products):
    """필수 컬럼에 결측값이 없는지 검사"""
    required_columns = ["id", "name", "price"]
    for col in required_columns:
        if products[col].isnull().any():
            raise CheckError(f"필수 컬럼 {col}에 결측값이 있습니다.")
```

### 4. 에러 처리 및 알림
```python
@asset
def src_customer(context, bigcommerce, bigquery):
    try:
        # 데이터 수집 로직
        pass
    except Exception as e:
        context.log.error(f"고객 데이터 수집 실패: {str(e)}")
        # Slack 알림 전송
        context.resources.slack.send_message(
            channel="#data-alerts",
            text=f"고객 데이터 수집 실패: {str(e)}"
        )
        raise
```

---

## ⚙️ 환경 설정

### 1. 환경 변수

```bash
# BigCommerce 설정
BIGCOMMERCE_ACCESS_TOKEN=your_access_token
BIGCOMMERCE_STORE_HASH=your_store_hash

# PostgreSQL 설정
WISE_POSTGRES_URL=postgresql://user:pass@host:port/db
COMMERCE_POSTGRES_URL=postgresql://user:pass@host:port/db

# BigQuery 설정
GCP_SERVICE_ACCOUNT_KEY=path/to/service-account.json
LEGACY_GCP_SERVICE_ACCOUNT_KEY=path/to/legacy-service-account.json

# Slack 설정
SLACK_BOT_TOKEN=xoxb-your-slack-token
```

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

### 3. DBT 설정

```bash
cd transformer
dbt deps
dbt debug
```

---

## 🚀 실행 방법

### 1. 개발 환경 실행

```bash
# Dagster UI 실행
dagit -f orchestrator/definitions.py

# 특정 Asset 실행
dagster asset materialize -f orchestrator/definitions.py -s src_customer

# 특정 Job 실행
dagster job execute -f orchestrator/definitions.py -j sync_customer
```

### 2. 프로덕션 배포

```bash
# Docker 이미지 빌드
docker build -t data-governance .

# Docker 컨테이너 실행
docker run -p 3000:3000 data-governance
```

---

## 📊 모니터링 및 알림

### 1. Dagster UI
- ✅ 실시간 파이프라인 상태 모니터링
- ✅ 실행 로그 및 메트릭 확인
- ✅ Asset 의존성 그래프 시각화

### 2. Slack 알림
```python
# 실패 시 Slack 알림
context.resources.slack.send_message(
    channel="#data-alerts",
    text=f"Asset {context.asset_key} 실행 실패: {error_message}"
)
```

### 3. 데이터 품질 모니터링
```python
@asset_check(asset=src_customer)
def customer_data_quality_check(context, src_customer):
    """고객 데이터 품질 검사"""
    # 데이터 검증 로직
    pass
```

---

## 👨‍💻 개발 가이드

### 1. 새로운 Asset 추가
```python
@asset(group_name="new_group")
def new_asset(
    context: AssetExecutionContext,
    bigcommerce: BigCommerceResource,
    bigquery: BigQueryResource,
) -> None:
    """새로운 데이터 자산"""
    # 데이터 수집 로직
    pass
```

### 2. 새로운 Resource 추가
```python
class NewResource(ConfigurableResource):
    api_key: str
    
    def fetch_data(self):
        """데이터 가져오기"""
        pass
```

### 3. 새로운 Job 추가
```python
new_job = define_asset_job(
    name="new_job",
    selection=AssetSelection.assets(
        "new_asset",
        "dependent_asset",
    ),
)
```

---

## 🔧 트러블슈팅

### 1. 일반적인 문제들

#### BigCommerce API 제한
```python
# 배치 크기 조정
async def stream_all_customers(self, batch_size: int = 100):
    # 더 작은 배치 크기 사용
```

#### BigQuery 연결 오류
```python
# 인증 파일 경로 확인
"bigquery": BigQueryResource(
    project="data-warehouse-455801",
    gcp_credentials=EnvVar("GCP_SERVICE_ACCOUNT_KEY"),
),
```

#### DBT 모델 실행 실패
```bash
# DBT 디버그
cd transformer
dbt debug

# 특정 모델만 실행
dbt run --select model_name
```

### 2. 로그 확인
```bash
# Dagster 로그 확인
dagster instance logs

# 특정 실행 로그 확인
dagster run logs <run_id>
```

---

## ⚡ 성능 최적화

### 1. 병렬 처리
```python
# 비동기 처리로 API 호출 최적화
async def stream_all_customers(self, concurrent_requests: int = 8):
    semaphore = asyncio.Semaphore(concurrent_requests)
    # 병렬 처리 로직
```

### 2. 증분 처리
```python
# 증분 데이터 처리로 성능 향상
class CustomerConfig(Config):
    hours_lookback: Optional[int] = 12  # 최근 12시간만 처리
```

### 3. 배치 처리
```python
# 대용량 데이터 배치 처리
def process_in_batches(df, batch_size=1000):
    for i in range(0, len(df), batch_size):
        batch = df[i:i+batch_size]
        # 배치 처리 로직
```

---

## 🔒 보안 고려사항

### 1. 환경 변수 관리
- ✅ 민감한 정보는 환경 변수로 관리
- ✅ 프로덕션에서는 시크릿 매니저 사용

### 2. 데이터 접근 제어
```python
# PostgreSQL 리소스에서 INSERT/DELETE 차단
def execute_query_df(self, query: str) -> pd.DataFrame:
    query_upper = query.upper()
    if "INSERT" in query_upper or "DELETE" in query_upper:
        raise ValueError("보안상의 이유로 INSERT와 DELETE 쿼리는 실행할 수 없습니다.")
```

### 3. API 키 관리
- ✅ BigCommerce API 키는 환경 변수로 관리
- ✅ 정기적인 키 로테이션

---

## 📚 결론

이 데이터 거버넌스 프로젝트는 Dagster를 사용하여 다양한 데이터 소스를 통합하고, DBT를 통해 데이터를 변환하여 일관된 데이터 웨어하우스를 구축합니다.

### 주요 특징
- **확장 가능한 아키텍처**: 새로운 데이터 소스와 변환 로직을 쉽게 추가
- **실시간 모니터링**: Dagster UI를 통한 실시간 파이프라인 모니터링
- **데이터 품질 보장**: Asset 체크를 통한 데이터 품질 검증
- **자동화된 스케줄링**: 정기적인 데이터 파이프라인 실행
- **에러 처리 및 알림**: 실패 시 즉시 알림으로 빠른 대응

---

## 📖 참고 자료

- **Dagster 공식 문서**: [https://docs.dagster.io/](https://docs.dagster.io/)
- **DBT 공식 문서**: [https://docs.getdbt.com/](https://docs.getdbt.com/)
- **BigCommerce API 문서**: [https://developer.bigcommerce.com/](https://developer.bigcommerce.com/)
- **BigQuery 문서**: [https://cloud.google.com/bigquery/docs](https://cloud.google.com/bigquery/docs)

---

<div align="center">

**Made with ❤️ for Wisely Data Team**

</div> 