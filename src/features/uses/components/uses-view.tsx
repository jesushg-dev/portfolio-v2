"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";

import { UsesHero } from "./uses-hero";
import UsesFilterTabs, { USES_FILTER } from "./uses-filter-tabs";
import type { UsesWorkspacePublicTag } from "./uses-workspace-hotspots";

interface UsesViewProps {
  hero: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    description: string;
    tabsLabel: string;
    workspaceCaption: string;
    workspaceAlt: string;
    workspaceImage?: string | null;
    workspaceTags?: UsesWorkspacePublicTag[];
  };
  tabLabels: {
    all: string;
    everyday: string;
    software: string;
    browser: string;
    coding: string;
  };
  everyday: ReactNode;
  software: ReactNode;
  browser: ReactNode;
  coding: ReactNode;
  note: ReactNode;
}

const fadeEase = [0.16, 0.8, 0.3, 1] as const;

export function UsesView({
  hero,
  tabLabels,
  everyday,
  software,
  browser,
  coding,
  note,
}: UsesViewProps) {
  const [tab, setTab] = useState<number>(USES_FILTER.all);
  const shouldReduceMotion = useReducedMotion();

  const showEveryday = tab === USES_FILTER.all || tab === USES_FILTER.everyday;
  const showSoftware = tab === USES_FILTER.all || tab === USES_FILTER.software;
  const showBrowser = tab === USES_FILTER.all || tab === USES_FILTER.browser;
  const showCoding = tab === USES_FILTER.all || tab === USES_FILTER.coding;
  const showWorkspace = tab === USES_FILTER.all;

  function handleTabChange(next: number) {
    setTab(next);
  }

  const sections = (
    <>
      {showEveryday ? everyday : null}
      {showSoftware ? software : null}
      {showBrowser ? browser : null}
      {showCoding ? coding : null}
    </>
  );

  return (
    <>
      <UsesHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        titleHighlight={hero.titleHighlight}
        description={hero.description}
        workspaceCaption={hero.workspaceCaption}
        workspaceAlt={hero.workspaceAlt}
        workspaceImage={hero.workspaceImage}
        workspaceTags={hero.workspaceTags}
        showWorkspace={showWorkspace}
        filter={
          <UsesFilterTabs
            value={tab}
            onChange={handleTabChange}
            ariaLabel={hero.tabsLabel}
            labels={tabLabels}
          />
        }
      />

      <motion.div
        layout
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { layout: { duration: 0.45, ease: fadeEase } }
        }
      >
        {shouldReduceMotion ? (
          sections
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.32, ease: fadeEase }}
            >
              {sections}
            </motion.div>
          </AnimatePresence>
        )}

        <motion.div
          layout
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { layout: { duration: 0.45, ease: fadeEase } }
          }
        >
          {note}
        </motion.div>
      </motion.div>
    </>
  );
}
