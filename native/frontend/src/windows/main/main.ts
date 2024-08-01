// Neutralino dev patch
// import "$lib/neu/init"

import '../../../../../src/app.css';
import './ts/window';
import App from '../../../../../src/App.svelte';
import { init } from '@neutralinojs/lib';
import * as Neutralino from '@neutralinojs/lib';

init();

const app = new App({
	target: document.getElementById('app')
});

export default app;
