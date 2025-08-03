
# Wisely Data Mart Dagster Architecture

## 개요

wisely `data-governance` 의  Dagster 아키텍처

## 디렉터리 구조

- **orchestrator**: Dagster의 핵심 구성 요소로, 데이터 파이프라인의 전체적인 실행을 관리하고 조정
- **transformer**: dbt 프로젝트가 위치합니다.

### orchestrator

`orchestrator` 디렉터리는 다음과 같은 하위 디렉터리 및 파일로 구성됩니다.

- **assets**: 데이터 Asset을 정의
- **jobs**: 여러 asset들을 묶어 실행하는 job을 정의
- **sensors**: 외부 시스템의 변경을 감지하여 job을 실행하는 sensor를 정의
- **schedules**: 정해진 시간에 job을 실행하는 schedule을 정의
- **resources**: 외부 시스템과의 연결을 위한 resource를 정의
- **definitions.py**: asset, job, sensor, schedule 등을 Dagster에 등록

### transformer

`transformer` 디렉터리는 dbt 프로젝트로 구성되어 있으며, 다음과 같은 하위 디렉터리로 구성됩니다.

- **models**: dbt 모델이 위치합니다. 이 모델들은 데이터 마트의 테이블을 정의하고 변환하는 SQL 쿼리를 포함합니다.

## Dagster 아키텍처

`data-mart` 프로젝트는 Dagster를 사용하여 데이터 파이프라인을 오케스트레이션합니다. 주요 구성 요소는 다음과 같습니다.

1.  **dbt Assets**: `transformer/models` 디렉터리의 dbt 모델들은 Dagster의 `dbt_assets`로 정의됩니다. 각 dbt 모델은 Dagster asset에 해당하며, 데이터 마트의 테이블을 나타냅니다.

2.  **Jobs**: 관련된 dbt asset들을 그룹화하여 job으로 정의합니다. 예를 들어, 특정 데이터 도메인과 관련된 모든 dbt 모델을 실행하는 job을 생성할 수 있습니다.

3.  **Schedules/Sensors**: job을 정기적으로 실행하거나 특정 조건이 충족되었을 때 실행하도록 schedule 또는 sensor를 사용합니다. 예를 들어, 매일 아침 데이터 마트를 업데이트하는 schedule을 정의할 수 있습니다.

## 데이터 흐름

1.  외부 데이터 소스에서 원본 데이터를 수집합니다.
2.  dbt 모델을 사용하여 원본 데이터를 변환하고 데이터 마트의 테이블을 생성합니다.
3.  Dagster는 dbt 모델의 의존성을 파악하고 올바른 순서로 실행합니다.
4.  변환된 데이터는 데이터 웨어하우스에 저장되어 분석 및 시각화에 사용됩니다.
