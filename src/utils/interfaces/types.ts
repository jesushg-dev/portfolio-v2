import { AppRouter } from '../../server/routers/_app';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export type localeType = 'en' | 'es';
export type RouterOutputType = inferRouterOutputs<AppRouter>;

export type SkillsOutputTypes = RouterOutputType['getSkills']['data'];
export type SkillsInputTypes = inferRouterInputs<AppRouter>['getSkills'];
export type SkillType = SkillsOutputTypes[0];

export type ProjectsOutputTypes = RouterOutputType['getProjects']['data'];
export type ProjectsInputTypes = inferRouterInputs<AppRouter>['getProjects'];
export type ProjectType = ProjectsOutputTypes[0];
