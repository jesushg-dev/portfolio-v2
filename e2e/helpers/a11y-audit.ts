import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

/** WCAG 2.x tags exercised by axe — closest automated coverage for Shield (AAA). */
export const WCAG_AAA_AXE_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag2aaa",
  "wcag21a",
  "wcag21aa",
  "wcag21aaa",
  "wcag22aa",
] as const;

export interface AxeViolationSummary {
  id: string;
  impact: string | null | undefined;
  description: string;
  helpUrl: string;
  nodeCount: number;
}

export interface ShieldHouseRuleIssue {
  kind: "font-size" | "target-size";
  detail: string;
}

export const SHIELD_MIN_FONT_PX = 14;
export const SHIELD_MIN_TARGET_PX = 44;

export async function runAxeAudit(page: Page) {
  return new AxeBuilder({ page })
    .withTags([...WCAG_AAA_AXE_TAGS])
    .exclude('[aria-hidden="true"]')
    .analyze();
}

export function summarizeAxeViolations(
  violations: Awaited<ReturnType<typeof runAxeAudit>>["violations"],
): AxeViolationSummary[] {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    helpUrl: violation.helpUrl,
    nodeCount: violation.nodes.length,
  }));
}

/**
 * Shield house rules that axe does not enforce (14px min text, 44×44px targets).
 * Returns a capped sample so test output stays readable.
 */
export async function auditShieldHouseRules(
  page: Page,
  maxIssues = 25,
): Promise<ShieldHouseRuleIssue[]> {
  const issues = await page.evaluate(
    ({ minFontPx, minTargetPx, cap }) => {
      const problems: {
        kind: "font-size" | "target-size";
        detail: string;
      }[] = [];

      const isVisible = (element: Element) => {
        const style = window.getComputedStyle(element);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          Number.parseFloat(style.opacity) === 0
        ) {
          return false;
        }

        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };

      const push = (issue: {
        kind: "font-size" | "target-size";
        detail: string;
      }) => {
        if (problems.length < cap) problems.push(issue);
      };

      const isAccessibilityHidden = (element: Element) => {
        if (element.closest('[aria-hidden="true"]')) return true;
        if (element.getAttribute("aria-hidden") === "true") return true;
        if (element.classList.contains("sr-only")) return true;

        const style = window.getComputedStyle(element);
        if (style.position === "absolute" && style.clip !== "auto") return true;

        return false;
      };

      for (const element of document.querySelectorAll(
        "p, span, a, button, label, li, h1, h2, h3, h4, h5, h6, td, th, input, textarea",
      )) {
        if (!isVisible(element) || isAccessibilityHidden(element)) continue;

        const text = element.textContent?.trim();
        if (!text) continue;

        const fontSize = Number.parseFloat(
          window.getComputedStyle(element).fontSize,
        );
        if (fontSize < minFontPx) {
          push({
            kind: "font-size",
            detail: `${fontSize}px on <${element.tagName.toLowerCase()}>: "${text.slice(0, 48)}"`,
          });
        }
      }

      for (const element of document.querySelectorAll(
        'a, button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])',
      )) {
        if (!isVisible(element) || isAccessibilityHidden(element)) continue;

        if (
          element instanceof HTMLInputElement &&
          (element.type === "hidden" ||
            element.getAttribute("aria-hidden") === "true" ||
            element.classList.contains("sr-only"))
        ) {
          continue;
        }

        const rect = element.getBoundingClientRect();
        if (rect.width < minTargetPx || rect.height < minTargetPx) {
          push({
            kind: "target-size",
            detail: `${Math.round(rect.width)}×${Math.round(rect.height)}px on <${element.tagName.toLowerCase()}>`,
          });
        }
      }

      return problems;
    },
    {
      minFontPx: SHIELD_MIN_FONT_PX,
      minTargetPx: SHIELD_MIN_TARGET_PX,
      cap: maxIssues,
    },
  );

  return issues;
}

export function formatA11yReport(options: {
  path: string;
  axeViolations: AxeViolationSummary[];
  houseRuleIssues: ShieldHouseRuleIssue[];
}) {
  const lines = [`=== ${options.path} ===`];

  if (options.axeViolations.length === 0) {
    lines.push("Axe (WCAG AAA tags): no violations");
  } else {
    lines.push(
      `Axe (WCAG AAA tags): ${options.axeViolations.length} rule(s) failed`,
    );
    for (const violation of options.axeViolations) {
      lines.push(
        `  [${violation.impact ?? "unknown"}] ${violation.id} (${violation.nodeCount} nodes) — ${violation.helpUrl}`,
      );
    }
  }

  if (options.houseRuleIssues.length === 0) {
    lines.push("Shield house rules: no sampled issues");
  } else {
    lines.push(
      `Shield house rules: ${options.houseRuleIssues.length}+ sampled issue(s) (cap ${25})`,
    );
    for (const issue of options.houseRuleIssues) {
      lines.push(`  [${issue.kind}] ${issue.detail}`);
    }
  }

  return lines.join("\n");
}
