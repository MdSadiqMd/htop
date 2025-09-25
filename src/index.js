document.addEventListener("DOMContentLoaded", () => {
    setInterval(async () => {
        let response = await fetch('/');
        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let result = await response.json();
        document.body.textContent = JSON.stringify(result, null, 2);
    }, 1000);
});
