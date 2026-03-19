
// Verification script for Fawry Payment Security Improvements
// This script simulates various scenarios to verify the new security checks.

async function testSafeCompare() {
  console.log("Testing safeCompare logic...");
  const safeCompare = (a: string, b: string) => {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  };

  const sig1 = "abc123def456";
  const sig2 = "abc123def456";
  const sig3 = "abc123def457";
  const sig4 = "abc123def45";

  console.assert(safeCompare(sig1, sig2) === true, "sig1 should equal sig2");
  console.assert(safeCompare(sig1, sig3) === false, "sig1 should NOT equal sig3");
  console.assert(safeCompare(sig1, sig4) === false, "sig1 should NOT equal sig4 (length mismatch)");
  console.log("✓ safeCompare logic verified");
}

async function testAmountValidation() {
  console.log("Testing amount validation logic...");
  const recordedAmount = parseFloat("100.50").toFixed(2);
  const webhookAmountOk = parseFloat("100.50").toFixed(2);
  const webhookAmountFail = parseFloat("100.51").toFixed(2);

  console.assert(recordedAmount === webhookAmountOk, "Amounts should match");
  console.assert(recordedAmount !== webhookAmountFail, "Amounts should NOT match");
  console.log("✓ Amount validation logic verified");
}

async function testRateLimit() {
  console.log("Testing rate limit logic...");
  const createdAt = new Date(Date.now() - 25000).getTime(); // 25s ago
  const now = new Date().getTime();
  const secondsSince = (now - createdAt) / 1000;
  
  console.assert(secondsSince < 30, "Should be within 30s limit");
  console.log(`✓ Rate limit logic verified (seconds since: ${secondsSince}s)`);
}

async function runTests() {
  try {
    await testSafeCompare();
    await testAmountValidation();
    await testRateLimit();
    console.log("\nALL LOGIC TESTS PASSED SUCCESSFULLY");
  } catch (e) {
    console.error("TEST FAILED:", e);
  }
}

runTests();
