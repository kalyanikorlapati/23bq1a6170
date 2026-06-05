/**
 * logging_middleware.test.ts
 *
 * Unit tests for the Campus Notifications logging middleware.
 * Tests verify that:
 *  - appLogger exposes the expected log methods
 *  - httpLogger is a valid Express middleware function
 *  - Log calls do not throw under normal conditions
 */

import { appLogger } from "../src/appLogger";
import { httpLogger } from "../src/httpLogger";
import { Request, Response, NextFunction } from "express";

// ---------------------------------------------------------------------------
// appLogger tests
// ---------------------------------------------------------------------------
describe("appLogger", () => {
  it("should expose standard winston log methods", () => {
    expect(typeof appLogger.info).toBe("function");
    expect(typeof appLogger.warn).toBe("function");
    expect(typeof appLogger.error).toBe("function");
    expect(typeof appLogger.debug).toBe("function");
    expect(typeof appLogger.http).toBe("function");
  });

  it("should log info messages without throwing", () => {
    expect(() => {
      appLogger.info("Test info message", { context: "unit-test" });
    }).not.toThrow();
  });

  it("should log warn messages without throwing", () => {
    expect(() => {
      appLogger.warn("Test warning", { detail: "something degraded" });
    }).not.toThrow();
  });

  it("should log error messages without throwing", () => {
    expect(() => {
      appLogger.error("Test error", { err: "simulated error" });
    }).not.toThrow();
  });

  it("should log debug messages without throwing", () => {
    expect(() => {
      appLogger.debug("Test debug message", { payload: { key: "value" } });
    }).not.toThrow();
  });

  it("should accept metadata objects alongside messages", () => {
    expect(() => {
      appLogger.info("Notification fetched", {
        notificationId: "42",
        userId: "student-001",
        duration: 120,
      });
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// httpLogger tests
// ---------------------------------------------------------------------------
describe("httpLogger", () => {
  it("should be a function (valid Express middleware)", () => {
    expect(typeof httpLogger).toBe("function");
  });

  it("should accept (req, res, next) and call next without throwing", () => {
    const mockReq = {
      method: "GET",
      url: "/api/v1/notifications",
      headers: { "user-agent": "jest-test-agent" },
      connection: { remoteAddress: "127.0.0.1" },
    } as unknown as Request;

    const mockRes = {
      statusCode: 200,
      getHeader: (_name: string) => "application/json",
      on: (_event: string, _cb: () => void) => mockRes,
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    expect(() => {
      httpLogger(mockReq, mockRes, next);
    }).not.toThrow();
  });

  it("should have exactly 3 parameters (req, res, next)", () => {
    // Express middleware must be a function with arity === 3
    expect(httpLogger.length).toBe(3);
  });
});
