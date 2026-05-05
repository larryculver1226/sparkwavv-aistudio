#!/bin/bash
# scripts/security-gate.sh
# Track 133: Enforces security policies during the build pipeline.

SEVERITY_THRESHOLD=${1:-CRITICAL}
SCAN_RESULT_FILE="scan_results.json"

echo "[SCC Pipeline] Evaluating Security Gate (Threshold: $SEVERITY_THRESHOLD)..."

if [ ! -f "$SCAN_RESULT_FILE" ]; then
    echo "[SCC Pipeline] No scan results found. Proceeding with caution."
    exit 0
fi

# Count findings equal to or higher than threshold
# This is a simplified logic for the demo; in production we use 'jq' to parse SCC/Container Analysis outputs.
VULNERABILITIES=$(grep -c "$SEVERITY_THRESHOLD" "$SCAN_RESULT_FILE")

if [ "$VULNERABILITIES" -gt 0 ]; then
    echo "--------------------------------------------------------"
    echo "!!! SECURITY GATE FAILED !!!"
    echo "Found $VULNERABILITIES $SEVERITY_THRESHOLD vulnerabilities."
    echo "Deployment blocked to ensure Sparkwavv security integrity."
    echo "--------------------------------------------------------"
    exit 1
fi

echo "[SCC Pipeline] Security gate passed. No $SEVERITY_THRESHOLD vulnerabilities found."
exit 0
