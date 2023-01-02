YQ_VERSION=${YQ_VERSION:-4.30.6}

case $(uname -sm) in
"Linux aarch64")
  target="linux_arm64"
  ;;
"Linux x86_64")
  target="linux_amd64"
  ;;
"Darwin aarch64")
  target="darwin_arm64"
  ;;
"Darwin x86_64")
  target="darwin_arm64"
  ;;
*)
  echo "unsupported platform requested"
  exit 1
  ;;
esac

echo "installing yq version ${YQ_VERSION} for ${target}"

download_uri="https://github.com/mikefarah/yq/releases/download/v${YQ_VERSION}/yq_${target}"

curl --fail --location --progress-bar --output /usr/local/bin/yq "$download_uri" \
    && chmod +x /usr/local/bin/yq

echo "yq was installed successfully to /usr/local/bin/yq"
