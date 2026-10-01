import { dev } from '$app/environment';
import { injectAnalytics } from '@vercel/analytics/sveltekit';

// Vercel Web Analytics: cookieless page-view counts (see /privacy, "This website")
injectAnalytics({ mode: dev ? 'development' : 'production' });

export const prerender = true;
