import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Single prerendered page; deploy the `build/` folder to any static host.
			// 404.html is served by static hosts (Vercel, Netlify, GitHub Pages) for unknown URLs,
			// and renders src/routes/+error.svelte
			adapter: adapter({ fallback: '404.html' }),

			// The CSS is small (~10 KB), so inline it into the HTML instead of blocking first paint
			inlineStyleThreshold: Infinity
		})
	]
});
