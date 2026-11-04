async function test() {
    // Login
    const loginRes = await fetch("http://localhost:3001/api/v1/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: "rayapatiravitheja@gmail.com",
            password: "Theja@1822",
        }),
    });
    const loginData = await loginRes.json();
    console.log("Login success:", loginData.success);

    const cookie = loginRes.headers.get("set-cookie");
    const token = loginData.data?.accessToken;
    const headers = {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // 1. Status
    const statusRes = await fetch("http://localhost:3001/api/v1/scheduler/status", {
        headers,
    });
    console.log("Status response status:", statusRes.status);
    const statusData = await statusRes.json();
    console.log("Status Data:", JSON.stringify(statusData, null, 2));

    // 2. Trigger
    const triggerRes = await fetch("http://localhost:3001/api/v1/scheduler/trigger-alerts", {
        method: "POST",
        headers,
    });
    console.log("Trigger response status:", triggerRes.status);
    const triggerData = await triggerRes.json();
    console.log("Trigger Data:", JSON.stringify(triggerData, null, 2));
}

test().catch(console.error);
