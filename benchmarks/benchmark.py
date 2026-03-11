#!/usr/bin/env python3
"""
VEIL — Crypto Performance Benchmark
Tests AES-256-GCM encryption throughput and Argon2id key derivation time.

Requirements (install once):
    pip install cryptography argon2-cffi psutil

Usage:
    python benchmarks/benchmark.py
    python benchmarks/benchmark.py --sizes 10 100 500 1024
"""

import argparse
import os
import sys
import time
import hashlib
from typing import List

# Third-party
try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    HAS_CRYPTO = True
except ImportError:
    HAS_CRYPTO = False
    print("⚠️  pip install cryptography")

try:
    from argon2 import PasswordHasher
    from argon2.low_level import hash_secret_raw, Type
    HAS_ARGON2 = True
except ImportError:
    HAS_ARGON2 = False
    print("⚠️  pip install argon2-cffi")

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False


# ─────────────────────────────────────────────────────────────────────────────
# AES-256-GCM Benchmarks
# ─────────────────────────────────────────────────────────────────────────────

def benchmark_aes_gcm(size_mb: int, iterations: int = 3) -> dict:
    """
    Benchmark AES-256-GCM encrypt + decrypt for a given file size.
    Returns dict with encrypt_ms, decrypt_ms, throughput_mbps.
    """
    if not HAS_CRYPTO:
        return {}

    size_bytes = size_mb * 1024 * 1024
    key = os.urandom(32)          # AES-256 = 32-byte key
    nonce = os.urandom(12)        # GCM nonce = 12 bytes
    plaintext = os.urandom(size_bytes)

    aesgcm = AESGCM(key)

    # Warm-up
    _ = aesgcm.encrypt(nonce, b"warmup", None)

    # Encrypt benchmark
    enc_times = []
    ciphertext = None
    for _ in range(iterations):
        t0 = time.perf_counter()
        ciphertext = aesgcm.encrypt(nonce, plaintext, None)
        enc_times.append((time.perf_counter() - t0) * 1000)

    avg_enc_ms = sum(enc_times) / len(enc_times)

    # Decrypt benchmark
    dec_times = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        _ = aesgcm.decrypt(nonce, ciphertext, None)
        dec_times.append((time.perf_counter() - t0) * 1000)

    avg_dec_ms = sum(dec_times) / len(dec_times)
    throughput = size_mb / (avg_enc_ms / 1000)  # MB/s

    return {
        "size_mb": size_mb,
        "encrypt_ms": round(avg_enc_ms, 1),
        "decrypt_ms": round(avg_dec_ms, 1),
        "throughput_mbps": round(throughput, 1),
        "overhead_pct": round(((len(ciphertext) - size_bytes) / size_bytes) * 100, 3),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Argon2id Benchmark (key derivation)
# ─────────────────────────────────────────────────────────────────────────────

def benchmark_argon2id(memory_kb: int = 65536, iterations: int = 3, parallelism: int = 1) -> dict:
    """
    Benchmark Argon2id key derivation — mirrors VEIL WebCrypto config.
    Default: 64MB RAM, 3 iterations (same as browser Argon2-WASM).
    """
    if not HAS_ARGON2:
        return {}

    password = b"hunter2_veil_demo_password"
    salt = os.urandom(16)
    times_ms = []

    for _ in range(3):
        t0 = time.perf_counter()
        _ = hash_secret_raw(
            secret=password,
            salt=salt,
            time_cost=iterations,
            memory_cost=memory_kb,
            parallelism=parallelism,
            hash_len=64,
            type=Type.ID
        )
        times_ms.append((time.perf_counter() - t0) * 1000)

    avg_ms = sum(times_ms) / len(times_ms)
    mem_mb = memory_kb / 1024

    return {
        "memory_mb": int(mem_mb),
        "iterations": iterations,
        "parallelism": parallelism,
        "avg_ms": round(avg_ms, 1),
        "min_ms": round(min(times_ms), 1),
        "max_ms": round(max(times_ms), 1),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Main — pretty-print results
# ─────────────────────────────────────────────────────────────────────────────

def print_table(headers: List[str], rows: List[List[str]]):
    """Pretty-print an ASCII table."""
    widths = [max(len(h), max((len(str(r[i])) for r in rows), default=0))
              for i, h in enumerate(headers)]
    sep = "─" * (sum(widths) + 3 * len(widths) + 1)
    fmt = " | ".join(f"{{:<{w}}}" for w in widths)
    print(sep)
    print(" " + fmt.format(*headers))
    print(sep)
    for row in rows:
        print(" " + fmt.format(*[str(v) for v in row]))
    print(sep)


def main():
    parser = argparse.ArgumentParser(description="VEIL crypto benchmark")
    parser.add_argument("--sizes", nargs="+", type=int,
                        default=[1, 10, 50, 100, 500, 1024],
                        help="File sizes in MB to benchmark")
    args = parser.parse_args()

    print("\n" + "═" * 62)
    print("  🔒 VEIL — Cryptography Performance Benchmark")
    print("  Author: SalimYami | github.com/SalimYami/veil")
    print("═" * 62)

    # System info
    if HAS_PSUTIL:
        mem = psutil.virtual_memory()
        print(f"\n  System: {os.cpu_count()} vCPUs | {mem.total // (1024**3)}GB RAM")

    # ── AES-256-GCM ────────────────────────────────────────────────
    if HAS_CRYPTO:
        print("\n  📊 AES-256-GCM (encrypt + decrypt per size)")
        rows = []
        for size_mb in args.sizes:
            print(f"  Testing {size_mb}MB...", end="\r")
            result = benchmark_aes_gcm(size_mb)
            if result:
                ok = "✅ <5s" if result["encrypt_ms"] < 5000 else "⚠️ >5s"
                rows.append([
                    f"{size_mb} MB",
                    f"{result['encrypt_ms']} ms",
                    f"{result['decrypt_ms']} ms",
                    f"{result['throughput_mbps']} MB/s",
                    ok
                ])
        print_table(["Size", "Encrypt", "Decrypt", "Throughput", "Goal"], rows)

    # ── Argon2id ────────────────────────────────────────────────────
    if HAS_ARGON2:
        print("\n  🔑 Argon2id Key Derivation (mirrors browser WASM config)")
        configs = [
            (32768,  3, 1),   # 32MB (low-end devices)
            (65536,  3, 1),   # 64MB VEIL default
            (131072, 3, 1),   # 128MB (high-security)
        ]
        rows = []
        for mem_kb, iters, par in configs:
            print(f"  Testing Argon2id {mem_kb//1024}MB...", end="\r")
            result = benchmark_argon2id(mem_kb, iters, par)
            if result:
                rows.append([
                    f"{result['memory_mb']} MB",
                    str(result['iterations']),
                    f"{result['avg_ms']} ms",
                    f"{result['min_ms']}–{result['max_ms']} ms",
                ])
        print_table(["Memory", "Iters", "Avg Time", "Min–Max"], rows)
        print(f"\n  💡 VEIL uses 64MB/3 iterations → ~{rows[1][2]} per login")
        print("  (Intentionally slow — prevents GPU brute-force)")

    print("\n  ✅ Benchmark complete — results reflect Python cryptography lib.")
    print("  Browser WebCrypto is hardware-accelerated (faster AES, WASM Argon2).\n")


if __name__ == "__main__":
    main()
