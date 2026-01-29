![669bb93b425b7a42bc6228fe_Natural-Language-Processing](https://github.com/user-attachments/assets/0e010f21-d32d-41e2-9e97-7d13f556abca)

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: [https://ai.studio/apps/drive/1-Gp_sx4X-SnhWp6KtFQ3J8N6L2giy8lu
](https://aistudio.google.com/apps/drive/1-Gp_sx4X-SnhWp6KtFQ3J8N6L2giy8lu?fullscreenApplet=true&showPreview=true&showAssistant=true)
## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

# 실시간 뉴스/트렌드 분석 대시보드 (LLM + RAG 기반)

## 1. 프로젝트 개요
본 프로젝트는 특정 키워드에 대한 최신 뉴스 및 SNS 데이터를 실시간으로 수집하고,  
LLM(Gemini)을 활용하여 요약, 개체명 인식(NER), 감성 분석(Sentiment Analysis),  
그리고 과거 데이터 기반 질의응답(RAG)을 제공하는 클라우드 기반 데이터 파이프라인이다.

---

## 2. 전체 아키텍처 개요

[Cloud Scheduler]  
        ↓ (1시간마다 트리거)  
[Cloud Functions - Ingestion (Python)]  
        ↓  
[Pub/Sub - Messaging]  
        ↓  
[Cloud Functions - Processing (Vertex AI / Gemini)]  
        ↓  
[BigQuery - Storage]  
        ↓  
[Looker Studio - Visualization]  
        ↓  
[RAG 기반 질의응답 시스템]

---

## 3. 단계별 처리 흐름

### STEP 1. 데이터 수집 (Ingestion)
- Cloud Scheduler
  - 정해진 주기(예: 1시간마다)로 Cloud Functions 트리거
- Cloud Functions (Python)
  - 외부 API 호출
    - Naver News API
    - NewsAPI
    - RSS Feed
    - SNS 데이터(선택)
  - 수집 데이터 정제
    - 제목(title)
    - 본문(content)
    - 작성 시간(published_at)
    - 출처(source)
    - URL(link)
    - 검색 키워드(keyword)
  - 정제된 텍스트를 Pub/Sub 토픽으로 발행(Publish)

---

### STEP 2. 메시지 전달 (Messaging)
- Google Pub/Sub
  - 수집된 데이터를 비동기 메시지 형태로 전달
  - 데이터 폭증 시에도 시스템 안정성 유지
  - Ingestion 단계와 Processing 단계 간 디커플링(Decoupling) 역할 수행

---

### STEP 3. AI 분석 (Processing)
- Cloud Functions (Consumer)
  - Pub/Sub 메시지 구독(Subscribe)
  - 수신한 뉴스 텍스트를 Vertex AI (Gemini 1.5 Flash / Pro)에 전달

#### Prompt Engineering
```text
다음 뉴스 기사에 대해 분석하시오.

1. 요약:
   기사를 한 문단으로 요약하시오.

2. NER:
   기사에서 언급된 주요 기업, 인물, 기관, 지역명을 추출하시오.

3. Sentiment:
   전반적인 뉴스 분위기를 0~1 사이의 점수로 표현하시오.
   (0 = 매우 부정, 1 = 매우 긍정)

4. Keywords:
   핵심 키워드 5~10개를 추출하시오.
```

---

### STEP 3-1. 처리 결과 (Processing Output Schema)
- Summary: 뉴스 요약 텍스트
- Entities:
  - Companies: [기업명 리스트]
  - People: [인물 리스트]
  - Organizations: [기관 리스트]
  - Locations: [지역 리스트]
- Sentiment Score: 0~1 범위의 실수값
- Keywords: [키워드 리스트]

---

### STEP 4. 저장 및 시각화 (Storage & BI)
- BigQuery
  - 저장 필드 스키마
    - timestamp (DATETIME)
    - keyword (STRING)
    - title (STRING)
    - summary (STRING)
    - entities (JSON)
    - sentiment_score (FLOAT)
    - source (STRING)
    - url (STRING)

- Looker Studio
  - BigQuery 연동
  - 시각화 대시보드 구성
    - 감성 지수 시계열 차트
    - 주요 키워드 워드 클라우드
    - 기업/인물 언급 빈도 TOP N 랭킹
    - 뉴스 출처별 트렌드 비교

---

## 4. RAG 기반 질의응답 확장

### 목적
과거 뉴스 및 분석 데이터를 벡터화하여  
사용자 질문에 대해 맥락 기반 응답(Context-Aware Answering)을 제공한다.

---

### RAG 파이프라인
1. 데이터 소스
   - BigQuery에 저장된 과거 뉴스 요약 및 분석 결과

2. 임베딩 생성
   - Vertex AI Embeddings 또는 Gemini Embeddings API 사용

3. 벡터 저장소
   - Vertex AI Vector Search
   - 또는 Pinecone / Weaviate / FAISS

4. 질의 처리 흐름
   - 사용자 질문 입력
   - 질문 임베딩 생성
   - 벡터 DB에서 유사 문서 Top-K 검색
   - 검색 결과를 Gemini 프롬프트에 삽입
   - 최종 답변 생성

---

### RAG 예시 질문
- "최근 일주일간 삼성전자 관련 뉴스 중 가장 부정적인 이슈는?"
- "지난 3개월 동안 가장 많이 언급된 기업 TOP 5는?"
- "이 키워드의 감성 점수가 급격히 하락한 시점과 원인은?"

---

## 5. 기술 스택

| 영역 | 기술 |
|------|------|
| 수집 | Cloud Scheduler, Cloud Functions (Python) |
| 메시징 | Google Pub/Sub |
| AI 분석 | Vertex AI (Gemini 1.5 Flash / Pro) |
| 저장 | BigQuery |
| 시각화 | Looker Studio |
| RAG | Vertex AI Embeddings, Vector DB |
| 프론트엔드 | React / Dashboard UI |
| 인프라 | Google Cloud Platform |

---

## 6. 프로젝트 차별성
- 실시간 뉴스 + SNS 기반 트렌드 감성 분석 자동화
- LLM 기반 요약 + NER + 감성 스코어링 통합 파이프라인
- RAG 기반 과거 데이터 질의응답 시스템
- Pub/Sub 기반 확장성 높은 이벤트 드리븐 아키텍처

---

## 7. 활용 시나리오
- 기업 브랜드 모니터링
- 주식/금융 시장 이슈 감성 추적
- 정책 및 사회 이슈 여론 분석
- 마케팅 트렌드 인사이트 자동 리포트
