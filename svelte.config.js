import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Using Svelte 4 (legacy) syntax — simpler for learning. Can switch to runes later.
		runes: false
	},
	kit: {
		adapter: adapter({
			out: 'build',
		})
	}
};

export default config;
