# 이번에 측정한 임베딩 원자료

`vectors.zip`에는 `corpus_vectors.npy`(5,170 × 1,024), `queries_vectors.npy`(1,000 × 1,024)가 들어 있습니다. ZIP 내부 파일은 EC2가 저장한 NPY와 바이트까지 동일하며 모델 가중치가 아닙니다.

- [벡터 파일 해시·행 순서](vector_manifest.json)
- [검색 자료 임베딩 메타데이터](corpus_embedding_metadata.json)
- [질문 임베딩 메타데이터](queries_embedding_metadata.json)
- [벡터 ZIP 다운로드](vectors.zip)
- [실행 상세와 한계](../../../report/execution_report.md)

벡터의 질문 원문과 순서는 버전 `inputs/dataset.json`에 보관했습니다. 과거 seed의 저장 벡터를 재사용한 결과가 아닙니다.
