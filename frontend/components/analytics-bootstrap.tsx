"use client";

import { useEffect } from "react";
import { bootstrapFromStoredConsent } from "@/lib/analytics";

/**
 * Fires once on client mount and restores analytics consent from localStorage.
 * This ensures GA4 / Meta Pixel work correctly on page loads after the user
 * has already made a consent choice.
 */
export default function AnalyticsBootstrap() {
  useEffect(() => {
    bootstrapFromStoredConsent();
  }, []);

  return null;
}
