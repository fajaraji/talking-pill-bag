const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;

async function req(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
  extraHeaders?: Record<string, string>
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-test-run": "1",
    ...extraHeaders,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }
  return { status: res.status, data };
}

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

async function run() {
  console.log(`API tests against ${BASE_URL}\n`);

  // 1. Create household
  console.log("1. Create household");
  const createRes = await req("POST", "/api/v1/households", {
    displayName: "Test Family",
    language: "en",
    isDemo: true,
  });
  assert(createRes.status === 200, "Create household returns 200");
  const caregiverToken = (createRes.data as { token?: string })?.token;
  const household = (createRes.data as { household?: { id: string; is_demo?: boolean } })?.household;
  assert(typeof caregiverToken === "string", "Returns caregiver token");
  assert(!!household?.id, "Returns household");
  assert(household?.is_demo === true, "Household is flagged is_demo");

  // 2. Create pairing code
  console.log("2. Create pairing code");
  const pairRes = await req(
    "POST",
    "/api/v1/pairing-codes",
    { role: "senior" },
    caregiverToken
  );
  assert(pairRes.status === 200, "Create pairing code returns 200");
  const shortCode = (pairRes.data as { shortCode?: string })?.shortCode;
  const joinUrl = (pairRes.data as { joinUrl?: string })?.joinUrl;
  assert(typeof shortCode === "string" && shortCode.length === 6, "Returns 6-digit short code");
  assert(typeof joinUrl === "string" && joinUrl.includes("?c="), "Returns join URL");

  // Verify joinUrl does not contain localhost when forwarded host is set
  console.log("2b. joinUrl respects forwarded host");
  const pairForwardedRes = await req(
    "POST",
    "/api/v1/pairing-codes",
    { role: "senior" },
    caregiverToken,
    {
      "x-forwarded-host": "talking-pill-bag.vercel.app",
      "x-forwarded-proto": "https",
    }
  );
  assert(pairForwardedRes.status === 200, "Create pairing code with forwarded host returns 200");
  const forwardedJoinUrl = (pairForwardedRes.data as { joinUrl?: string })?.joinUrl;
  assert(typeof forwardedJoinUrl === "string" && !forwardedJoinUrl.includes("localhost"), "joinUrl does not contain localhost when forwarded host is set");
  assert(typeof forwardedJoinUrl === "string" && forwardedJoinUrl.startsWith("https://talking-pill-bag.vercel.app/"), "joinUrl uses forwarded origin");

  // Verify expiry times
  const shortExpiresAt = (pairRes.data as { shortExpiresAt?: string })?.shortExpiresAt;
  const longExpiresAt = (pairRes.data as { longExpiresAt?: string })?.longExpiresAt;
  assert(!!shortExpiresAt, "Short code has shortExpiresAt");
  assert(!!longExpiresAt, "Long code has longExpiresAt");
  const shortExpiry = new Date(shortExpiresAt!);
  const longExpiry = new Date(longExpiresAt!);
  const now = new Date();
  const approx15m = shortExpiry.getTime() - now.getTime();
  const approx24h = longExpiry.getTime() - now.getTime();
  assert(approx15m > 14 * 60 * 1000 && approx15m < 16 * 60 * 1000, "Short code expires in ~15 min");
  assert(approx24h > 23 * 60 * 60 * 1000 && approx24h < 25 * 60 * 60 * 1000, "Long code expires in ~24h");

  // 3. Join as senior with short code
  console.log("3. Join as senior");
  const joinRes = await req("POST", "/api/v1/join", { code: shortCode });
  assert(joinRes.status === 200, "Join returns 200");
  const seniorToken = (joinRes.data as { token?: string })?.token;
  const seniorRole = (joinRes.data as { role?: string })?.role;
  assert(typeof seniorToken === "string", "Returns senior token");
  assert(seniorRole === "senior", "Returns senior role");

  // 4. Senior can POST a dose
  console.log("4. Senior POST dose");
  // First, caregiver adds a medicine so senior can dose it
  const medRes = await req(
    "POST",
    "/api/v1/medicines",
    {
      drugName: "Aspirin",
      strength: "100 mg",
      dosePerTime: "1 tablet",
      timesPerDay: 1,
      timeSlots: ["morning"],
      food: "after_food",
    },
    caregiverToken
  );
  assert(medRes.status === 200, "Caregiver adds medicine returns 200");
  const medicineId = (medRes.data as { medicine?: { id: string } })?.medicine?.id;
  assert(!!medicineId, "Medicine created");

  const today = new Date().toISOString().slice(0, 10);
  const doseRes = await req(
    "POST",
    "/api/v1/doses",
    { medicineId, date: today, slot: "morning" },
    seniorToken
  );
  assert(doseRes.status === 200, "Senior POST dose returns 200");

  // 5. Senior gets 403 on POST medicines
  console.log("5. Senior forbidden on medicines");
  const forbiddenRes = await req(
    "POST",
    "/api/v1/medicines",
    {
      drugName: "Paracetamol",
      strength: "500 mg",
      dosePerTime: "1 tablet",
      timesPerDay: 1,
      timeSlots: ["morning"],
      food: "any",
    },
    seniorToken
  );
  assert(forbiddenRes.status === 403, "Senior POST medicines returns 403");

  // 6. Caregiver adds another medicine
  console.log("6. Caregiver adds medicine");
  const med2Res = await req(
    "POST",
    "/api/v1/medicines",
    {
      drugName: "Vitamin D",
      strength: "1000 IU",
      dosePerTime: "1 tablet",
      timesPerDay: 1,
      timeSlots: ["morning"],
      food: "with_food",
    },
    caregiverToken
  );
  assert(med2Res.status === 200, "Caregiver adds second medicine");

  // 7. GET state from both devices shows same data
  console.log("7. GET state from both devices");
  const caregiverState = await req("GET", "/api/v1/state", undefined, caregiverToken);
  const seniorState = await req("GET", "/api/v1/state", undefined, seniorToken);
  assert(caregiverState.status === 200, "Caregiver GET state returns 200");
  assert(seniorState.status === 200, "Senior GET state returns 200");

  const cgMeds = (caregiverState.data as { medicines?: unknown[] })?.medicines ?? [];
  const srMeds = (seniorState.data as { medicines?: unknown[] })?.medicines ?? [];
  assert(cgMeds.length === 2, "Caregiver sees 2 medicines");
  assert(srMeds.length === 2, "Senior sees 2 medicines");

  const cgDoses = (caregiverState.data as { doseLogs?: unknown[] })?.doseLogs ?? [];
  const srDoses = (seniorState.data as { doseLogs?: unknown[] })?.doseLogs ?? [];
  assert(cgDoses.length === 1, "Caregiver sees 1 dose");
  assert(srDoses.length === 1, "Senior sees 1 dose");

  const cgDoseDate = (cgDoses[0] as { date?: string })?.date;
  const srDoseDate = (srDoses[0] as { date?: string })?.date;
  assert(cgDoseDate === today, `Caregiver dose date is exactly "${today}"`);
  assert(srDoseDate === today, `Senior dose date is exactly "${today}"`);

  // 7b. Dose records who marked it (device id + label)
  console.log("7b. Dose taken-by device");
  const cgDose = cgDoses[0] as { taken_by_device?: string | null; taken_by_label?: string | null };
  assert(typeof cgDose?.taken_by_device === "string", "Dose records the marking device id");
  assert(
    cgDose?.taken_by_label === "Test Family's phone",
    "Dose taken_by_label is the marking device label"
  );

  // 8. Second household cannot read first household's data
  console.log("8. Cross-household isolation");
  const create2Res = await req("POST", "/api/v1/households", {
    displayName: "Other Family",
    language: "en",
  });
  assert(create2Res.status === 200, "Create second household returns 200");
  const otherToken = (create2Res.data as { token?: string })?.token;

  const otherState = await req("GET", "/api/v1/state", undefined, otherToken);
  const otherMeds = (otherState.data as { medicines?: unknown[] })?.medicines ?? [];
  assert(otherMeds.length === 0, "Other household sees 0 medicines");

  // Try to access first household's medicine with other token (should be isolated by household)
  // Since the API scopes by token's household, any ID will return not-found or empty
  const otherDelete = await req(
    "DELETE",
    `/api/v1/medicines/${medicineId}`,
    undefined,
    otherToken
  );
  assert(otherDelete.status === 404, "Other household DELETE returns 404");

  // 9. Reused code fails with generic error
  console.log("9. Reused code fails");
  const reuseRes = await req("POST", "/api/v1/join", { code: shortCode });
  assert(reuseRes.status === 400, "Reused code returns 400");
  const reuseError = (reuseRes.data as { error?: string })?.error;
  assert(reuseError === "Invalid or expired code.", "Reused code returns generic error");

  // 10. Second code reuse and expiry
  const pairRes2 = await req(
    "POST",
    "/api/v1/pairing-codes",
    { role: "senior" },
    caregiverToken
  );
  assert(pairRes2.status === 200, "Create second pairing code returns 200");
  const shortCode2 = (pairRes2.data as { shortCode?: string })?.shortCode;

  const join2Res = await req("POST", "/api/v1/join", { code: shortCode2 });
  assert(join2Res.status === 200, "First use of second code returns 200");
  const join2Reuse = await req("POST", "/api/v1/join", { code: shortCode2 });
  assert(join2Reuse.status === 400, "Second use of second code returns 400");
  const join2Error = (join2Reuse.data as { error?: string })?.error;
  assert(join2Error === "Invalid or expired code.", "Second use returns generic error");

  // 11. Household creation returns a recovery code (hash stored server-side)
  console.log("11. Recovery code generated on household creation");
  const recoveryCode = (createRes.data as { recoveryCode?: string })?.recoveryCode;
  assert(
    typeof recoveryCode === "string" && /^[A-Z0-9]{5}(-[A-Z0-9]{5}){3}$/.test(recoveryCode),
    "Household creation returns a formatted recovery code"
  );

  // 12. Regenerating invalidates the old code; a recovery code joins as caregiver
  console.log("12. Recovery code regenerate + join");
  const regenRes = await req("POST", "/api/v1/recovery-codes", {}, caregiverToken);
  assert(regenRes.status === 200, "Regenerate recovery code returns 200");
  const newRecoveryCode = (regenRes.data as { recoveryCode?: string })?.recoveryCode;
  assert(
    typeof newRecoveryCode === "string" && newRecoveryCode !== recoveryCode,
    "New recovery code differs from the old one"
  );

  const oldRecoveryJoin = await req("POST", "/api/v1/join", { code: recoveryCode });
  assert(oldRecoveryJoin.status === 400, "Old recovery code is invalidated");

  const recoveryJoin = await req("POST", "/api/v1/join", {
    code: newRecoveryCode,
    name: "Mei (daughter)",
  });
  assert(recoveryJoin.status === 200, "Recovery code joins successfully");
  const recoveryRole = (recoveryJoin.data as { role?: string })?.role;
  assert(recoveryRole === "caregiver", "Recovery code joins as caregiver");

  const recoveryReuse = await req("POST", "/api/v1/join", { code: newRecoveryCode });
  assert(recoveryReuse.status === 400, "Recovery code is single use");

  // 12b. The name sent when joining is stored as the device label
  console.log("12b. Join name stored as device label");
  const recoveryToken = (recoveryJoin.data as { token?: string })?.token;
  const recoveryState = await req("GET", "/api/v1/state", undefined, recoveryToken);
  const recoveryDevices =
    (recoveryState.data as { devices?: Array<{ label?: string | null; is_current?: boolean }> })
      ?.devices ?? [];
  const currentDevice = recoveryDevices.find((d) => d.is_current);
  assert(currentDevice?.label === "Mei (daughter)", "Join name is stored as the device label");

  // Summary
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
