import { describe, expect, it } from "vitest";
import { expiryState, venueToday } from "./qualifications";

describe("expiryState", () => {
  const warn = [60, 30];
  it("handles missing expiry", () => {
    expect(expiryState(null, "2026-10-03", warn).status).toBe("none");
  });
  it("is ok outside the warning window", () => {
    expect(expiryState("2027-01-01", "2026-10-03", warn)).toEqual({ status: "ok", daysLeft: 90, warnDay: null });
  });
  it("flags the tightest threshold crossed", () => {
    expect(expiryState("2026-11-27", "2026-10-03", warn)).toEqual({ status: "due", daysLeft: 55, warnDay: 60 });
    expect(expiryState("2026-10-23", "2026-10-03", warn)).toEqual({ status: "due", daysLeft: 20, warnDay: 30 });
    expect(expiryState("2026-10-03", "2026-10-03", warn)).toEqual({ status: "due", daysLeft: 0, warnDay: 30 });
  });
  it("flags expired", () => {
    expect(expiryState("2026-10-02", "2026-10-03", warn).status).toBe("expired");
  });
});

describe("venueToday", () => {
  it("uses the venue's timezone, not UTC", () => {
    // 2026-10-03 15:30 UTC is already 2026-10-04 in Brisbane (UTC+10).
    expect(venueToday("Australia/Brisbane", new Date("2026-10-03T15:30:00Z"))).toBe("2026-10-04");
    expect(venueToday("UTC", new Date("2026-10-03T15:30:00Z"))).toBe("2026-10-03");
  });
});
