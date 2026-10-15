const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;

async function req(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
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
  });
  assert(createRes.status === 200, "Create household returns 200");
  const caregiverToken = (createRes.data as { token?: string })?.token;
  const household = (createRes.data as { household?: { id: string } })?.household;
  assert(typeof caregiverToken === "string", "Returns caregiver token");
  assert(!!household?.id, "Returns household");

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
  const otherMedGet = await req(
    "GET",
    `/api/v1/medicines`,
    undefined,
    otherToken
  );
  // There's no GET /medicines list route, but state already proved isolation.
  // Try deleting a medicine from first household with second household's token
  const otherDelete = await req(
    "DELETE",
    `/api/v1/medicines/${medicineId}`,
    undefined,
    otherToken
  );
  assert(otherDelete.status === 404, "Other household DELETE returns 404");

  // 9. Expired or reused code fails
  console.log("9. Reused code fails");
  const reuseRes = await req("POST", "/api/v1/join", { code: shortCode });
  assert(reuseRes.status === 400, "Reused code returns 400");

  // Expired code: create a code, manually expire it, try to join
  const pairRes2 = await req(
    "POST",
    "/api/v1/pairing-codes",
    { role: "senior" },
    caregiverToken
  );
  assert(pairRes2.status === 200, "Create second pairing code returns 200");
  const shortCode2 = (pairRes2.data as { shortCode?: string })?.shortCode;

  // Since we can't manipulate the DB directly easily here, let's just verify the expiry is set
  const expiresAt = (pairRes2.data as { expiresAt?: string })?.expiresAt;
  assert(!!expiresAt, "Pairing code has expiresAt");
  const expiryDate = new Date(expiresAt!);
  const now = new Date();
  assert(expiryDate > now, "Expires in the future");
  const approx24h = expiryDate.getTime() - now.getTime();
  assert(approx24h > 23 * 60 * 60 * 1000 && approx24h < 25 * 60 * 60 * 1000, "Expires in ~24h");

  // Use the code, then verify it fails on second use (already tested above)
  const join2Res = await req("POST", "/api/v1/join", { code: shortCode2 });
  assert(join2Res.status === 200, "First use of second code returns 200");
  const join2Reuse = await req("POST", "/api/v1/join", { code: shortCode2 });
  assert(join2Reuse.status === 400, "Second use of second code returns 400");

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
