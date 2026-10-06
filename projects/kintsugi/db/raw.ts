import { env } from 'cloudflare:workers';
export function database(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export function bucket(){if(!env.BUCKET)throw new Error('Storage unavailable');return env.BUCKET;}
