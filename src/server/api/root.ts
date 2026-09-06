import { portfolioRouter } from "@/server/api/routers/portfolio";
import { cvRouter } from "@/features/cv/server/cv.router";
import { cvPublicRouter } from "@/features/cv/server/cv-public.router";
import { profileAdminRouter } from "@/features/profile/server/profile-admin.router";
import { terminalRouter } from "@/features/terminal/server/terminal.router";
import { contactRouter } from "@/server/api/routers/contact";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { spotifyRouter } from "@/server/api/routers/spotify";
import { spotifyAdminRouter } from "@/server/api/routers/spotify-admin";
import { googleCalendarAdminRouter } from "@/server/api/routers/google-calendar-admin";
import { appLanguagesAdminRouter } from "@/features/portfolio/server/app-languages-admin.router";
import { projectsAdminRouter } from "@/features/projects/server/projects-admin.router";
import { servicesAdminRouter } from "@/features/services/server/services-admin.router";
import { certificationsAdminRouter } from "@/features/certifications/server/certifications-admin.router";
import { skillsAdminRouter } from "@/features/skills/server/skills-admin.router";
import { softSkillsAdminRouter } from "@/features/soft-skills/server/soft-skills-admin.router";
import { timelineAdminRouter } from "@/features/timeline/server/timeline-admin.router";
import { usesAdminRouter } from "@/features/uses/server/uses-admin.router";
import { nowAdminRouter } from "@/features/now/server/now-admin.router";
import { processPagesAdminRouter } from "@/features/process-pages/server/process-pages-admin.router";
import { processPagesRouter } from "@/features/process-pages/server/process-pages.router";
import { jobTrackerAdminRouter } from "@/features/job-tracker/server/job-tracker-admin.router";
import { resumeEngineAdminRouter } from "@/features/resume-engine/server/resume-engine-admin.router";
import { interviewPrepAdminRouter } from "@/features/resume-engine/server/interview-prep-admin.router";
import { integrationsAdminRouter } from "@/features/integrations/server/integrations-admin.router";
import { portfolioSeedExportRouter } from "@/features/portfolio/server/seed-export/portfolio-seed-export.router";

import { analyticsRouter } from "@/features/analytics/server/analytics.router";
import { analyticsAdminRouter } from "@/features/analytics/server/analytics-admin.router";
import { geoRouter } from "@/server/api/routers/geo";

export const appRouter = createTRPCRouter({
  geo: geoRouter,
  analytics: analyticsRouter,
  analyticsAdmin: analyticsAdminRouter,
  portfolio: portfolioRouter,
  appLanguagesAdmin: appLanguagesAdminRouter,
  projectsAdmin: projectsAdminRouter,
  servicesAdmin: servicesAdminRouter,
  certificationsAdmin: certificationsAdminRouter,
  skillsAdmin: skillsAdminRouter,
  timelineAdmin: timelineAdminRouter,
  softSkillsAdmin: softSkillsAdminRouter,
  usesAdmin: usesAdminRouter,
  nowAdmin: nowAdminRouter,
  processPagesAdmin: processPagesAdminRouter,
  processPages: processPagesRouter,
  cv: cvRouter,
  cvPublic: cvPublicRouter,
  profileAdmin: profileAdminRouter,
  terminal: terminalRouter,
  spotify: spotifyRouter,
  spotifyAdmin: spotifyAdminRouter,
  googleCalendarAdmin: googleCalendarAdminRouter,
  contact: contactRouter,
  jobTrackerAdmin: jobTrackerAdminRouter,
  resumeEngineAdmin: resumeEngineAdminRouter,
  interviewPrepAdmin: interviewPrepAdminRouter,
  integrationsAdmin: integrationsAdminRouter,
  portfolioSeedExport: portfolioSeedExportRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
