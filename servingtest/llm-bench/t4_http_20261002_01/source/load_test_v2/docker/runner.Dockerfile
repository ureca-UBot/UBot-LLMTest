FROM docker:29.7.2-cli@sha256:3f4743208d2338c934d7b8bcfbe1bb54c0b2355c510ad5e0f31c0c4a54bd704e AS docker_cli
FROM node:24.17.0-bookworm-slim@sha256:862263c612aa437e3037674b85419622a9d93bff80aa1eee5398dfe686375532
COPY --from=docker_cli /usr/local/bin/docker /usr/local/bin/docker
# The NVIDIA runtime supplies the host driver utilities. This image runs the
# HTTP load generator and controls only benchmark-owned sibling containers.
ENV NVIDIA_VISIBLE_DEVICES=all NVIDIA_DRIVER_CAPABILITIES=utility
WORKDIR /workspace
ENTRYPOINT ["node"]
