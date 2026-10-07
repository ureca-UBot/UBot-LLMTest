FROM lmsysorg/sglang@sha256:2ddbfb97fc8e40ad78df22b29cab0207818e03f68b2248a514e7eeefe62d188f
# Historical recipe for the locally repaired image. Transitive wheels were not
# hash-locked at build time. Exact reproduction uses the saved image archive,
# NOT a fresh execution of this recipe.
RUN python3 -m pip install --no-cache-dir 'vllm==0.8.4'
