(function () {
    function setActivePage(pageId) {
        document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
        document.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"));

        const nextPage = document.getElementById(pageId);
        if (nextPage) {
            nextPage.classList.add("active");
        }

        const nextNav = document.querySelector('.nav-link[data-page="' + pageId + '"]');
        if (nextNav) {
            nextNav.classList.add("active");
        }
    }

    function initNav() {
        document.querySelectorAll(".nav-link").forEach((btn) => {
            btn.addEventListener("click", () => setActivePage(btn.dataset.page));
        });
    }

    window.WorkoutApp.setActivePage = setActivePage;
    window.WorkoutApp.initNav = initNav;
})();
