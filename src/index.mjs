import { h, render } from "https://unpkg.com/preact?module";
import htm from "https://unpkg.com/htm?module";

const html = htm.bind(h);

function getUsageColor(usage) {
    if (usage >= 80) return '#e74c3c';
    if (usage >= 50) return '#f39c12';
    if (usage >= 25) return '#f1c40f';
    return '#ffffff';
}

function CpuGraph({ cpuData }) {
    const { core_id, usage, history } = cpuData;
    const maxPoints = 50;
    const graphWidth = 300;
    const graphHeight = 80;

    const createPath = (points) => {
        if (points.length < 2) return '';

        const stepX = graphWidth / (maxPoints - 1);
        let path = '';

        points.forEach((point, index) => {
            const x = index * stepX;
            const y = graphHeight - (point / 100) * graphHeight;

            if (index === 0) {
                path += `M ${x} ${y}`;
            } else {
                path += ` L ${x} ${y}`;
            }
        });

        return path;
    };

    const paddedHistory = [...history];
    while (paddedHistory.length < maxPoints) {
        paddedHistory.unshift(0);
    }

    const path = createPath(paddedHistory);
    const color = getUsageColor(usage);

    return html`
        <div class="cpu-container">
            <div class="cpu-header">
                <h3>CPU ${core_id}</h3>
                <span class="cpu-usage" style="color: ${color}">
                    ${usage.toFixed(1)}%
                </span>
            </div>
            <div class="cpu-graph">
                <svg width="${graphWidth}" height="${graphHeight}" viewBox="0 0 ${graphWidth} ${graphHeight}">
                    <defs>
                        <pattern id="grid-${core_id}" width="30" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 20" fill="none" stroke="#333" stroke-width="0.5" opacity="0.3"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-${core_id})" />
                    
                    <line x1="0" y1="${graphHeight - (25 / 100) * graphHeight}" 
                          x2="${graphWidth}" y2="${graphHeight - (25 / 100) * graphHeight}" 
                          stroke="#f1c40f" stroke-width="1" opacity="0.3" stroke-dasharray="2,2"/>
                    <line x1="0" y1="${graphHeight - (50 / 100) * graphHeight}" 
                          x2="${graphWidth}" y2="${graphHeight - (50 / 100) * graphHeight}" 
                          stroke="#f39c12" stroke-width="1" opacity="0.3" stroke-dasharray="2,2"/>
                    <line x1="0" y1="${graphHeight - (80 / 100) * graphHeight}" 
                          x2="${graphWidth}" y2="${graphHeight - (80 / 100) * graphHeight}" 
                          stroke="#e74c3c" stroke-width="1" opacity="0.3" stroke-dasharray="2,2"/>
                    
                    <path d="${path}" 
                          fill="none" 
                          stroke="${color}" 
                          stroke-width="2" 
                          opacity="0.9"/>
                    
                    <path d="${path} L ${graphWidth} ${graphHeight} L 0 ${graphHeight} Z" 
                          fill="${color}" 
                          opacity="0.1"/>
                    
                    ${paddedHistory.length > 0 ? html`
                        <circle cx="${(paddedHistory.length - 1) * (graphWidth / (maxPoints - 1))}" 
                                cy="${graphHeight - (usage / 100) * graphHeight}" 
                                r="3" 
                                fill="${color}" 
                                opacity="0.8"/>
                    ` : ''}
                </svg>
            </div>
            
            <div class="usage-bar">
                <div class="usage-bar-fill" 
                     style="width: ${usage}%; background-color: ${color};">
                </div>
                <div class="usage-bar-text">${usage.toFixed(1)}%</div>
            </div>
        </div>
    `;
}

function App({ cpuData }) {
    return html`
        <div class="app">
            <h1>System CPU Monitor</h1>
            <div class="cpu-grid">
                ${cpuData.map(cpu => html`<${CpuGraph} key=${cpu.core_id} cpuData=${cpu} />`)}
            </div>
        </div>
    `;
}

let url = new URL("/realtime/cpus", window.location.href);
url.protocol = url.protocol.replace("http", "ws");

let ws = new WebSocket(url.href);
ws.onmessage = (ev) => {
    let cpuData = JSON.parse(ev.data);
    render(html`<${App} cpuData=${cpuData} />`, document.body);
};

ws.onopen = () => {
    console.log("WebSocket connected");
};

ws.onerror = (error) => {
    console.error("WebSocket error:", error);
};

ws.onclose = () => {
    console.log("WebSocket disconnected");
    setTimeout(() => {
        location.reload();
    }, 3000);
};
