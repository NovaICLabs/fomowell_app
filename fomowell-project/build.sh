cargo run --bin fomowell-project
cargo build --target wasm32-unknown-unknown --release

#ic-cdk-optimizer target/wasm32-unknown-unknown/release/$PAC_NAME.wasm -o target/wasm32-unknown-unknown/release/$PAC_NAME-opt.wasm

ic-wasm ./target/wasm32-unknown-unknown/release/fomowell-project.wasm   -o ./target/wasm32-unknown-unknown/release/fomowell-project-opt.wasm shrink --optimize O3

ic-wasm ./target/wasm32-unknown-unknown/release/fomowell-project-opt.wasm  -o ./target/wasm32-unknown-unknown/release/fomowell-project-opt-did.wasm  metadata candid:service -f  fomowell-project.did -v public

gzip -f -9 ./target/wasm32-unknown-unknown/release/fomowell-project-opt-did.wasm
#cp to wasm dir
cp -r target/wasm32-unknown-unknown/release/fomowell-project-opt-did.wasm.gz ../wasm/fomowell-project-opt-did.wasm.gz