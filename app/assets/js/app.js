(function () {
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
        if (typeof window.WorkoutApp.loadPrograms === "function") {
            window.WorkoutApp.loadPrograms();
        }
    }

    window.addEventListener("DOMContentLoaded", init);
})();
