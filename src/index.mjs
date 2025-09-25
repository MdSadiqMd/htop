import { h, render } from "https://unpkg.com/preact?module";
import htm from "https://unpkg.com/htm?module";

const html = htm.bind(h);

function App(props) {
    return html`
    <div>
      ${props.cpus.map((cpu) => {
        return html`<div class="bar">
          <div class="bar-inner" style="width: ${cpu}%"></div>
          <label>${cpu.toFixed(2)}%</label>
        </div>`;
    })}
    </div>
  `;
}

/* document.addEventListener("DOMContentLoaded", () => {
    setInterval(async () => {
        let response = await fetch('/htop');
        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let result = await response.json();
        const app = h("pre", null, JSON.stringify(result, null, 2));
        render(html`<${App} cpus=${result}></${App}>`, document.body);
    }, 1000);
}); */

let url = new URL("/realtime/cpus", window.location.href);
url.protocol = url.protocol.replace("http", "ws");

let ws = new WebSocket(url.href);
ws.onmessage = (ev) => {
    let json = JSON.parse(ev.data);
    render(html`<${App} cpus=${json}></${App}>`, document.body);
};