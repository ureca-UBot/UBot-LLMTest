# try2의 실제 임베딩 원자료

검색용 원본·유사 질문 5,170개와 입력 가드 처리 후 질문 1,000개를 EC2의 `BAAI/bge-m3`로 새로 임베딩했습니다. 차원은 1,024, 저장 배열은 float64입니다.

- [벡터 ZIP](vectors.zip): `corpus_vectors.npy`, `queries_vectors.npy`, `query_mapping.json`.
- [ZIP과 각 파일의 SHA-256·배열 크기](vector_manifest.json).
- [검색 자료 계측](corpus_embedding_metadata.json) · [질문 계측](queries_embedding_metadata.json).

원문 질문이 검색 자료에도 포함됩니다. 원본 FAQ 1위 1,000건은 자체 일치 확인이며 새로운 질문의 검색 정확도 100%를 뜻하지 않습니다.
