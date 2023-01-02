# [Choice] Debian OS version: bullseye, buster
FROM mcr.microsoft.com/devcontainers/base:jammy

COPY install-deno.sh /deno/install-deno.sh
RUN chown -R vscode /deno \
    && chmod +x /deno/install-deno.sh \
    && DENO_INSTALL=/deno /deno/install-deno.sh \
    && mv /deno/bin/deno /usr/local/bin/deno \
    && rm -rf /deno/install-deno.sh

ENV DENO_DIR=/deno/.cache/deno


COPY install-yq.sh /yq/install-yq.sh
RUN chown -R vscode /yq \
    && chmod +x /yq/install-yq.sh \
    && /yq/install-yq.sh \
    && rm -rf /yq

# [Optional] Uncomment this section to install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
   && apt-get -y install --no-install-recommends \
        make lcov
