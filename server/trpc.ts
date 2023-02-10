import { Context } from './context';
import { initTRPC } from '@trpc/server';

const t = initTRPC.context<Context>().create({});

// router
export const router = t.router;

// procedure
export const procedure = t.procedure;
