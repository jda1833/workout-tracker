(function () {
    const DISPLAY_INTERVAL_MS = 100;

    function formatElapsed(elapsedMs) {
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return [
                String(hours).padStart(2, "0"),
                String(minutes).padStart(2, "0"),
                String(seconds).padStart(2, "0"),
            ].join(":");
        }

        return [
            String(minutes).padStart(2, "0"),
            String(seconds).padStart(2, "0"),
        ].join(":");
    }

    function initStopwatch() {
        const display = document.getElementById("stopwatchDisplay");
        const startButton = document.getElementById("stopwatchStartBtn");
        const stopButton = document.getElementById("stopwatchStopBtn");
        const resetButton = document.getElementById("stopwatchResetBtn");

        if (!display || !startButton || !stopButton || !resetButton) {
            return;
        }

        let elapsedMs = 0;
        let startedAt = null;
        let intervalId = null;

        function getCurrentElapsedMs() {
            if (startedAt === null) {
                return elapsedMs;
            }

            return elapsedMs + (Date.now() - startedAt);
        }

        function render() {
            display.textContent = formatElapsed(getCurrentElapsedMs());
        }

        function start() {
            if (startedAt !== null) {
                return;
            }

            startedAt = Date.now();
            intervalId = window.setInterval(render, DISPLAY_INTERVAL_MS);
            render();
        }

        function stop() {
            if (startedAt === null) {
                return;
            }

            elapsedMs = getCurrentElapsedMs();
            startedAt = null;

            if (intervalId !== null) {
                window.clearInterval(intervalId);
                intervalId = null;
            }

            render();
        }

        function reset() {
            elapsedMs = 0;
            startedAt = null;

            if (intervalId !== null) {
                window.clearInterval(intervalId);
                intervalId = null;
            }

            render();
        }

        startButton.addEventListener("click", start);
        stopButton.addEventListener("click", stop);
        resetButton.addEventListener("click", reset);

        render();
    }

    window.WorkoutApp.initStopwatch = initStopwatch;
})();
