import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GLOSSARY_CONCEPTS,
  SOURCE_BADGES_LEGEND,
  MODULE_ABOUT_MAP,
} from "../src/lib/conceptGuideData.ts";

describe("Phase 8: Guided Understanding, Concept Guide & Clean Dashboard", () => {
  describe("8.1 Module Navigation & Header Number Removal", () => {
    it("ensures all modules in MODULE_ABOUT_MAP have clean names without numeric prefixes", () => {
      const numericPrefixRegex = /^(0\d|[1-9]\d?)\s*[-–—:.]|DESK\s*\d+/i;

      for (const [key, data] of Object.entries(MODULE_ABOUT_MAP)) {
        assert.equal(
          numericPrefixRegex.test(data.title),
          false,
          `Module title for '${key}' contains numeric prefix: '${data.title}'`
        );
      }
    });
  });

  describe("8.2 Concept Guide & Glossary Integrity", () => {
    const requiredConcepts = [
      "net-debt",
      "net-debt-ebitda",
      "interest-coverage",
      "current-ratio",
      "quick-ratio",
      "cash-ratio",
      "free-cash-flow",
      "margins",
      "roe-roa",
      "tol-tnw",
      "dscr",
      "altman-z",
      "beneish-m",
      "hhi",
      "covenant-headroom",
      "floating-debt",
      "as-of-dates",
      "nd-explainer",
    ];

    it("includes every mandatory credit concept in GLOSSARY_CONCEPTS", () => {
      const presentIds = GLOSSARY_CONCEPTS.map((c) => c.id);
      for (const id of requiredConcepts) {
        assert.ok(
          presentIds.includes(id),
          `Missing required glossary concept: '${id}'`
        );
      }
    });

    it("verifies every concept has plain meaning and explicit 'What this does NOT tell you'", () => {
      for (const c of GLOSSARY_CONCEPTS) {
        assert.ok(c.plainMeaning && c.plainMeaning.length > 20, `Plain meaning too short for '${c.id}'`);
        assert.ok(c.doesNotTellYou && c.doesNotTellYou.length > 15, `Missing 'doesNotTellYou' for '${c.id}'`);
      }
    });

    it("verifies the 5 source badges are accurately represented", () => {
      const expectedBadges = [
        "Disclosed in filing",
        "Calculated",
        "Estimated",
        "Simulated",
        "Demonstration/seed data",
      ];

      const presentBadges = SOURCE_BADGES_LEGEND.map((b) => b.badge);
      for (const b of expectedBadges) {
        assert.ok(presentBadges.includes(b), `Missing source badge: '${b}'`);
      }
      assert.equal(SOURCE_BADGES_LEGEND.length, 5);
    });

    it("verifies every module gets a complete 3-line 'About this module' panel description", () => {
      const modules = [
        "overview",
        "01_HUB",
        "02_HEALTH",
        "03_VULNERABILITY",
        "04_DEPENDENCIES",
        "05_CONCENTRATION",
        "06_SIMULATOR",
        "07_REPORTS",
      ];

      for (const m of modules) {
        const item = MODULE_ABOUT_MAP[m];
        assert.ok(item, `Missing MODULE_ABOUT_MAP entry for '${m}'`);
        assert.ok(item.whatItShows.length > 20, `whatItShows too short for '${m}'`);
        assert.ok(item.whereDataComesFrom.length > 20, `whereDataComesFrom too short for '${m}'`);
        assert.ok(item.howToReadIt.length > 20, `howToReadIt too short for '${m}'`);
      }
    });
  });

  describe("8.3 Claim & Tone Compliance", () => {
    it("ensures TOL/TNW definition is labeled as an illustrative reference level, not an RBI regulatory limit", () => {
      const tolConcept = GLOSSARY_CONCEPTS.find((c) => c.id === "tol-tnw");
      assert.ok(tolConcept);
      assert.match(
        tolConcept.thresholds ?? "",
        /Illustrative reference level \(3\.00x\), user-adjustable/i,
        "TOL/TNW threshold should clearly state it is an illustrative reference level"
      );
      assert.match(
        tolConcept.thresholds ?? "",
        /Not a statutory RBI limit/i,
        "TOL/TNW threshold must state it is not an RBI statutory limit"
      );
    });

    it("ensures N/D definition explicitly prohibits zero fabrication", () => {
      const ndConcept = GLOSSARY_CONCEPTS.find((c) => c.id === "nd-explainer");
      assert.ok(ndConcept);
      assert.match(
        ndConcept.plainMeaning,
        /refuses to guess|never zero/i,
        "N/D definition must state that N/D is never zero and the app refuses to guess"
      );
    });
  });
});
