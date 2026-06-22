(function () {
    async function renderVersion() {
        const versionNode = document.getElementById("appVersion");
        if (!versionNode) return;
        try {
            const res = await fetch("/version");
            if (res.ok) {
                const data = await res.json();
                versionNode.textContent = "Version " + data.version;
                return;
            }
        } catch {
            // fall through to fallback
        }
        versionNode.textContent = "Version " + (window.WorkoutApp.version || "dev");
    }

    function syncMobileStickyOffset() {
        const root = document.documentElement;
        const sidebar = document.querySelector(".sidebar");

        if (!root || !sidebar) {
            return;
        }

        if (window.innerWidth > 640) {
            root.style.setProperty("--mobile-sticky-offset", "0px");
            return;
        }

        root.style.setProperty("--mobile-sticky-offset", sidebar.offsetHeight + "px");
    }

    function init() {
        if (typeof window.WorkoutApp.initNav === "function") {
            window.WorkoutApp.initNav();
        }
        if (typeof window.WorkoutApp.initTracker === "function") {
            window.WorkoutApp.initTracker();
        }
        if (typeof window.WorkoutApp.initCheckIn === "function") {
            window.WorkoutApp.initCheckIn();
        }
        if (typeof window.WorkoutApp.initAnalytics === "function") {
            window.WorkoutApp.initAnalytics();
        }
        if (typeof window.WorkoutApp.initUpload === "function") {
            window.WorkoutApp.initUpload();
        }
        if (typeof window.WorkoutApp.initTools === "function") {
            window.WorkoutApp.initTools();
        }
        if (typeof window.WorkoutApp.initStopwatch === "function") {
            window.WorkoutApp.initStopwatch();
        }
        if (typeof window.WorkoutApp.loadPrograms === "function") {
            window.WorkoutApp.loadPrograms();
        }

        renderVersion();
        syncMobileStickyOffset();
        window.addEventListener("resize", syncMobileStickyOffset);
    }

    window.addEventListener("DOMContentLoaded", init);
})();
