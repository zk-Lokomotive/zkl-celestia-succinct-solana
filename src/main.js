import './app.css'
import App from './App.svelte'
import { Buffer } from 'buffer';

// Make Buffer available globally
window.Buffer = Buffer;

const app = new App({
  target: document.getElementById('app'),
})

export default app