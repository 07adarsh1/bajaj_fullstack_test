const API_BASE_URL = "http://localhost:3000";

const edgeInput = document.getElementById("edgeInput");
const submitBtn = document.getElementById("submitBtn");
const statusMessage = document.getElementById("statusMessage");
const responseOutput = document.getElementById("responseOutput");

submitBtn.addEventListener("click", async () => {
  const data = extractEdgesFromInput(edgeInput.value);

  setStatus("Submitting request...", "");
  submitBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/bfhl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ data })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "API call failed");
    }

    showResponse(payload);
    setStatus("Success: response received.", "success");
  } catch (error) {
    showResponse({ error: error.message });
    setStatus(`Error: ${error.message}`, "error");
  } finally {
    submitBtn.disabled = false;
  }
});

function extractEdgesFromInput(rawText) {
  const input = rawText.trim();
  if (!input) {
    return [];
  }

  const fromJson = tryParseAsJsonPayload(input);
  if (fromJson) {
    return fromJson;
  }

  return parseAsLineEntries(input);
}

function tryParseAsJsonPayload(input) {
  try {
    const parsed = JSON.parse(input);

    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }

    if (parsed && Array.isArray(parsed.data)) {
      return parsed.data.map((item) => String(item));
    }
  } catch (error) {
    return null;
  }

  return null;
}

function parseAsLineEntries(input) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/,$/, "").replace(/^['\"]|['\"]$/g, ""));
}

function showResponse(payload) {
  responseOutput.textContent = JSON.stringify(payload, null, 2);
}

function setStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status ${type}`.trim();
}
