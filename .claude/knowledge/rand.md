# rand

## rand 0.10 exposes random_range as a top-level free function

**Verified at:** rand 0.10.2
**Citation:** [I_6: ~/.cargo/registry/src/.../rand-0.10.2/src/lib.rs:235 — `pub fn random_range<T, R>(range: R) -> T`; also lib.rs:190 `pub fn random<T>()`]

`rand::random_range(0..=999_999u32)` samples from an inclusive range using the crate's default RNG — no explicit `Rng` handle needed. `rand::random::<T>()` is the equivalent free function for full-range sampling.
