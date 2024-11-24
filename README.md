# 콕스웨이브 과제: RAG 기반 스마트스토어 FAQ 챗봇

## 개요

**스마트스토어 FAQ 챗봇**은 스마트스토어 플랫폼에 대한 사용자 질문에 대해 정확하고 효율적인 답변을 제공합니다.

- 응답 메뉴얼: RAG (Retrieval-Augmented Generation), BM25, LLM 등을 활용하여 높은 품질의 응답을 보장

## 요구 사항

[요구 사항 확인하기](./docs/README.md)

---

## 아키텍처

### 1. API 서버 영역
  - **Routes**: RESTful API 엔드포인트 정의. 사용자가 질문을 입력하고 답변을 확인하는 인터페이스 제공.
  - **Controllers**: 라우트에서 호출되는 함수. 내부에는 LLM 인스턴스를 호출.

### 2. 도메인 (LLMChain) 영역 (아키텍쳐는 LLM 오케스트레이션 프레임워크에서 착안)
  1. **Preprocess 모듈**:
     - load: 데이터를 로드, 저장.
     - split: 중복 제거 및 불필요한 텍스트 삭제. row 데이터를 **해시테이블**로 구성.
  2. **Vector Store 및 Retrieval 모듈**:
     - store: 임베딩 저장.
     - query 메서드: RAG를 기반으로 질문에 적합한 데이터를 검색.
  3. **LLMGenerator 모듈**:
     - generateQueryPrompt 메서드: 쿼리 수정. 쿼리 문장 중, 키워드를 재생성. 스마트스토어와 관련 없는 질문에는 아래와 같은 기본 응답 제공:
      ```
      저는 스마트 스토어 FAQ를 위한 챗봇입니다. 스마트 스토어에 대한 질문을 부탁드립니다.
      ```
     - generateStream 메서드: 해시 테이블로 맵핑된 FAQ 답변 데이터(`processed_data.json`) 를 기반으로 고품질 답변 생성.
     - 대화 기록을 저장하여 맥락 기반 답변 제공.
     - 질문-답변 맥락에서 사용자가 궁금해할만한 추가 질문을 제안.
   4. **LLM Chain 모듈**:
	    - 3가지 모듈을 조합하는 인터페이스 클래스. Controllers에서 인스턴스를 생성.

---

## 아키텍쳐 테스트

- 기본적으로 **가설 검증**의 **실험 방법**으로 접근하고자 했습니다.
- 대조군, 실험군을 만들고, 하나의 원인에 따라, 어떤 변화가 일어나는지를 테스트했습니다.

### 1. 답변 정확도를 위한 시도

- **Pre RAG**: 쿼리를 llm으로 재생성. BM25에서 아이디어 얻음. 키워드를 추가해 검색 정확도 향상.
- **Post RAG**: 
	- **prompt**: post RAG 형태의 프롬프트를 구성. 10개 검색 결과를 프롬프트에 모두 넣어 진행. 정확도 향상. 프롬프트가 길어져 느려짐. 특히, 이전 대화를 같이 넣을 경우, 점점 느려짐.
	- **openai assistant**: openai 파이프라인에 추가. 답변 형태가 유지되는 장점. 그러나, 최초 예시 데이터를 높은 가중치로 기억하는 탓에, 맥락이 흐려짐. 사용불가 판단.
	
- *결론*: Pre RAG 적용. Post RAG의 prompt 2개를 routes로 2가지 아키텍쳐로 분리. assistant에 예시 넣지 않고, 프롬프트에 예시를 구분해서 넣음.

### 2. 부적절한 질문 필터를 위한 시도

- **Pre RAG**: 쿼리 llm 재생성 시, 부적절한 질문을 필터링하는 기능을 추가. RAG 이전에 차단해, 비용 절감.
- **RAG distance**: pre RAG가 없을 경우, distance를 측정. 가장 유사도가 높은 distance가 대략 0.31인 경우, 관계 없는 질문으로 판단.
- **Post RAG**: 
	- **프롬프트** :RAG 이후, 프롬프트로 부적절한 질문을 필터링하는 기능을 추가. 프롬프트가 길어질 뿐, 필터링이 정확히 이뤄지지 못함.
	- **openai assistant**: openai 파이프라인에 추가. 가중치가 너무 높은 탓인지, 대부분의 질문에 "적절하지 못한 질문"이라고 판단. 사용불가 판단.

- *결론*: Pre RAG 적용, 얼리 리턴으로 비용 절감. RAG distance 0.31 기준으로 부적절한 질문으로 판단. Post RAG는 성능 저하 초래하므로 제외.

### 3. 맥락 이해도를 위한 시도 

- **post RAG**: 
	- **prompt**: 프롬프트에 맥락을 넣을 경우, 맥락 이해도 향상. 다만, 점점 길어질 경우, 느려짐. 따라서, 인스턴스 필드에서 최근 5개 대화만 기억하도록 적용.
	- **openai assistant**: openai 파이프라인에 추가. 답변 형태가 유지되는 장점. 그러나, 데이터를 높은 가중치로 기억함. 사용불가 판단.

- 결론: prompt 5개 대화만 적용. openai assistant는 넣지 않는 것으로 함. (추가 테스트 필요)

### 4. 예상 질문 생성을 위한 시도

- **PreProcess**: 전처리 과정 중에 **관련 도움말/키워드**로 예상 질문이 미리 제시. 이를 메타데이터로 분리.
- **Post RAG**: 
	- **prompt**: 프롬프트에서 이를 참고하도록 적용. 만약, **관련 도움말/키워드**가 없을 경우는 자체적으로 맥락에 맞게 생성하도록 유도.
	
- *의문점*:
  - **관련 도움말/키워드**가 없는 경우는 제시된 json 파일 안에, 예상 질문이 존재하지 않는 것으로 판단되었습니다.
  - 그럼, *굳이 예상 질문을 생성할 필요가 있는가?* 하는 의문이 들었습니다.
  - 이유: 이번 앱의 목적이 데이터를 기반으로 한, 질문입니다. 그러나, 예상 질문이 맥락을 기준으로 생성한다면, 생성된 예상 질문이 과연 쓸모가 있을지는 의문입니다.

- *실험 결과*: **관련 도움말/키워드**가 없을 경우 생성된 예상 질문을 다시 넣었더니, json 파일 안에 유의미하게 관련된 질문이 존재하지 않아, 앱의 사용성이 떨어지는 것을 관찰했습니다.

---

## 적용한 개선 방안

### 0. **접근 아이디어**

- **AI 프로덕트의 3가지 성능 방법**:
  - 프롬프트 엔지니어링, RAG (필수), Fine-tuning
  - 그 중, 빠르게 구축할 수 있는 **프롬프트 엔지니어링** 역시 적극적으로 이용.
- **모듈 계층에 따라, 성능 개선 연구**
	- 기본 아키텍쳐는 LLM 오케스트레이션 프레임워크에서 착안:
		- 전처리: AI 성능에서 가장 중요한 것은 데이터. 따라서, 데이터 전처리가 매우 중요.
		- 저장 및 검색: **질문** 데이터만 저장하고, 답변은 질문과 해시테이블로 연동. 비용 절감.
		- 답변 생성: **프롬프트 엔지니어링** 적극 이용.


### 1. **전처리 개선**

- 중복 제거 및 불필요한 텍스트 (답변 평정 관련) 삭제.
- **데이터 해시 테이블화**: 질문, 답변 형태의 해시테이블로 구성. 사용자 쿼리에 대한 유사도는 **질문 데이터**만 집중해, 비용 절감 유도.
- **관련 도움말/키워드 메타 데이터 분리**: 미리 제공되는 **관련 도움말/키워드**를 따로 메타 데이터로 분리. 추후, 문장 생성 비용 절감.
- 답변 데이터를 유사도 검색 및 답변 생성에 유용하게 이용할 수 있도록 chunks 단위로 분리.

### 2. **RAG 성능 개선 연구 및 적용**

- **쿼리 재생성**:
  - 유저의 쿼리에서 키워드를 추출하는 llm 프롬프트 작성.
  - 키워드 추출을 통해, 쿼리 정확도 향상. (BM25 엘라스틱 서치에서 아이디어 얻음.)
  - 부적절한 질문을 미리 점검해, 답변 조기 종료. Retreival 비용 절감.
- **Embedding 최소화**:
  - 유저 쿼리는 질문 형태이므로, 해당 질문이 기존 데이터의 **질문 데이터**와 얼마나 유사한가를 파악하면 됨. 
  - **질문 데이터**만 벡터 스토어에 저장. Retreival 비용 절감.
- **맥락 이해**:
  - llm Generator 에 대화 히스토리 저장 적용. 따로 벡터 스토어에 저장하지 않음. (비용 최소화)
  - 다양한 프롬프트 템플릿 실험을 통해 문맥 이해도 향상.
  
### 3. **프롬프트 연구**

- **프롬프트 엔지니어링 강수진 박사님 자료 참고**: (출처: https://www.youtube.com/watch?v=IstX_cGtGjw)
 - 프롬프트 구조화.
 - 대시, 슬래시 등을 이용해, 자료 구별.
 - 출력 예시를 넣을 것.
 - play ground를 통해, 실험. 직접 체감하는 것도 중요.

### 4. **추가 아키텍쳐 연구**
-  **Anthropic사에서 RAG성능을 향상시키기 위한 기법**: (출처: https://www.anthropic.com/news/contextual-retrieval)
	- BM25 + Embedding 모델의 앙상블 조합으로, 검색 정확도 향상
		- 실험 결과, BM25는 정확한 답변일 경우, 큰 값, Embedding 모델은 작은 값을 제시. 따라서 앙상블 시, 정규화를 도입해야 함.
		- 또한 JS에서, BM25 알고리즘은 **한국어 지원이 어려움**. 파이썬 코드를 혼합해야 함. (멀티 스레드 child_process 사용)
	- reRank 기법
		- 이 역시, JS에서 **한국어 지원이 어려움**.
		- 또한, 추가 비용 및, 속도 저하가 발생.
- **post, pre Retrieval을 및 Advanced RAG**:
	- 쿼리를 벡터 스토어로 넣기 이전, 쿼리를 재생성하여 검색 정확도 향상 (BM 25에서 키워드 추가에 대한 아이디어를 얻음.)
	- post Retrieval을 다양한 아키텍쳐 구상. 이 중, 빠르게 실험할 수 있는 것부터 실험에 넣음.
		- pre Retrieval을 및 RAG로 추출한 상위 10개 데이터 및 답변 데이터를 프롬프트에 넣어, 추가 점검 및 생성. (적용 O)
		- 미리 파인튜닝한 모델 적용. (MLOps까지 적용해야 하므로, 시간 오래 걸림. 적용 X)	
- **이러한 아키텍쳐 및 기법을 혼합해서, 가장 정확하게 답변을 생성하는 아키텍쳐를 선별할 수 있음**

---

## 추가 개선 방안

### 1. stream + websocket
- 현재 적용한 stream은 ``res.setHeader("Content-Type", "text/event-stream");``로 이벤트로 적용됨. 이를 websocket을 적용해, 사용성 개선 가능.
- python 마이그레이션 및, BM25,  reRank 도입: 현재 js 라이브러리 및, 모델에서는 한국어 지원이 어려움. python으로 마이그레이션을 진행하거나, child_process를 도입해, 2가지 언어로 하이브리드 가능.