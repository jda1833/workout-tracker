(function () {
    function init() {
        window.WorkoutApp.initNav();
        window.WorkoutApp.initTracker();
        window.WorkoutApp.initCheckIn();
        window.WorkoutApp.initUpload();
        window.WorkoutApp.loadPrograms();
    }

    window.addEventListener("DOMContentLoaded", init);
})();
