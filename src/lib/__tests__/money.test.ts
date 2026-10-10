import { describe, expect, it } from "vitest";
import { MINUS, formatCompact, formatPaise, groupIndian, paiseToDecimal, parseAmountToPaise } from "../money";

describe("parseAmountToPaise", () => {
  it("parses whole rupees", () => {
    expect(parseAmountToPaise("1250")).toEqual({ ok: true, paise: 125000 });
  });
  it("parses two decimals exactly, without float drift", () => {
    expect(parseAmountToPaise("0.1")).toEqual({ ok: true, paise: 10 });
    expect(parseAmountToPaise("0.2")).toEqual({ ok: true, paise: 20 });
    expect(parseAmountToPaise("1234.56")).toEqual({ ok: true, paise: 123456 });
    expect(parseAmountToPaise("19.99")).toEqual({ ok: true, paise: 1999 });
  });
  it("accepts grouping, symbol and whitespace", () => {
    expect(parseAmountToPaise("₹ 1,25,000.50")).toEqual({ ok: true, paise: 12500050 });
  });
  it("rejects zero, negatives, three decimals and junk", () => {
    expect(parseAmountToPaise("0").ok).toBe(false);
    expect(parseAmountToPaise("-5").ok).toBe(false);
    expect(parseAmountToPaise("1.234").ok).toBe(false);
    expect(parseAmountToPaise("abc").ok).toBe(false);
    expect(parseAmountToPaise("").ok).toBe(false);
  });
  it("enforces the upper limit", () => {
    expect(parseAmountToPaise("1000000000").ok).toBe(true);
    expect(parseAmountToPaise("1000000000.01").ok).toBe(false);
  });
});

describe("groupIndian", () => {
  it("groups in the Indian style", () => {
    expect(groupIndian("0")).toBe("0");
    expect(groupIndian("999")).toBe("999");
    expect(groupIndian("1000")).toBe("1,000");
    expect(groupIndian("125000")).toBe("1,25,000");
    expect(groupIndian("12345678")).toBe("1,23,45,678");
    expect(groupIndian("1000000000")).toBe("1,00,00,00,000");
  });
});

describe("formatPaise", () => {
  it("formats with symbol, grouping and two decimals", () => {
    expect(formatPaise(12500000)).toBe("₹1,25,000.00");
    expect(formatPaise(5)).toBe("₹0.05");
    expect(formatPaise(0)).toBe("₹0.00");
  });
  it("uses a true minus sign for negatives", () => {
    expect(formatPaise(-123456)).toBe(`${MINUS}₹1,234.56`);
  });
  it("can force a sign", () => {
    expect(formatPaise(100, { sign: "always" })).toBe("+₹1.00");
    expect(formatPaise(-100, { sign: "always" })).toBe(`${MINUS}₹1.00`);
    expect(formatPaise(0, { sign: "always" })).toBe("₹0.00");
    expect(formatPaise(-100, { sign: "never" })).toBe("₹1.00");
  });
  it("supports PDF-safe symbol and minus", () => {
    expect(formatPaise(-123456, { symbol: "INR ", minus: "-" })).toBe("-INR 1,234.56");
  });
});

describe("paiseToDecimal", () => {
  it("writes plain decimals for CSV", () => {
    expect(paiseToDecimal(123456)).toBe("1234.56");
    expect(paiseToDecimal(-5)).toBe("-0.05");
  });
});

describe("formatCompact", () => {
  it("uses lakh and crore", () => {
    expect(formatCompact(85000)).toBe("₹850");
    expect(formatCompact(1250000)).toBe("₹12.5k");
    expect(formatCompact(12500000)).toBe("₹1.25L");
    expect(formatCompact(350000000)).toBe("₹35L");
    expect(formatCompact(1_00_00_000 * 100 * 3.5)).toBe("₹3.5Cr");
  });
});
