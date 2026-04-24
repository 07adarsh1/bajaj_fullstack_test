function parseEdge(rawEntry) {
  if (typeof rawEntry !== "string") {
    return { isValid: false, reason: "Entry must be a string", normalized: rawEntry };
  }

  const edgeText = rawEntry.trim();
  if (!edgeText) {
    return { isValid: false, reason: "Empty string", normalized: edgeText };
  }

  const pattern = /^([A-Z])->([A-Z])$/;
  const match = edgeText.match(pattern);

  if (!match) {
    return { isValid: false, reason: "Format must be X->Y using uppercase letters", normalized: edgeText };
  }

  const [, parent, child] = match;

  if (parent === child) {
    return { isValid: false, reason: "Self-loop is not allowed", normalized: edgeText };
  }

  return {
    isValid: true,
    parent,
    child,
    normalized: `${parent}->${child}`
  };
}

module.exports = {
  parseEdge
};
