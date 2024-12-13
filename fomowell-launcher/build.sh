cargo run --bin fomowell-launcher --features  $ENVIRONMENT
cargo build --target wasm32-unknown-unknown --release  --features  $ENVIRONMENT

#ic-cdk-optimizer target/wasm32-unknown-unknown/release/$PAC_NAME.wasm -o target/wasm32-unknown-unknown/release/$PAC_NAME-opt.wasm

version=$(ic-wasm --version | awk '{print $2}')

cargo build --target wasm32-unknown-unknown --release  --features local
ic-wasm target/wasm32-unknown-unknown/release/fomowell-launcher.wasm -o target/wasm32-unknown-unknown/release/fomowell-launcher.wasm shrink
gzip -f -c target/wasm32-unknown-unknown/release/fomowell-launcher.wasm > target/wasm32-unknown-unknown/release/fomowell-launcher.wasm.gz


if [[ "$(printf '%s\n' "0.5.0" "$version" | sort -V | head -n 1)" == "0.5.0" ]]; then
    echo "Executing because version is 0.5.0 or higher"
    ic-wasm ./target/wasm32-unknown-unknown/release/fomowell-launcher.wasm -o ./target/wasm32-unknown-unknown/release/fomowell-launcher-opt.wasm shrink
    ic-wasm ./target/wasm32-unknown-unknown/release/fomowell-launcher.wasm -o ./target/wasm32-unknown-unknown/release/fomowell-launcher-opt.wasm optimize O3
else
    echo "Executing because version is lower than 0.5.0"
    ic-wasm ./target/wasm32-unknown-unknown/release/fomowell-launcher.wasm -o ./target/wasm32-unknown-unknown/release/fomowell-launcher-opt.wasm shrink --optimize O3
fi

ic-wasm ./target/wasm32-unknown-unknown/release/fomowell-launcher-opt.wasm  -o ./target/wasm32-unknown-unknown/release/fomowell-launcher-opt-did.wasm  metadata candid:service -f  fomowell-launcher.did -v public

gzip -f -9 ./target/wasm32-unknown-unknown/release/fomowell-launcher-opt-did.wasm
