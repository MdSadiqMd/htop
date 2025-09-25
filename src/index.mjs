import { h, render } from "https://unpkg.com/preact?module";

document.addEventListener("DOMContentLoaded", () => {
    setInterval(async () => {
        let response = await fetch('/htop');
        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let result = await response.json();
        const app = h("pre", null, JSON.stringify(result, null, 2));
        render(app, document.body);
    }, 1000);
});
