(function () {
    const pageRoutes = {
        trackerPage: "/",
        uploadPage: "/",
        linksPage: "/",
    };

    function getPageFromPath(pathname) {
        return "trackerPage";
    }

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

    function navigateToPage(pageId, replaceState) {
        setActivePage(pageId);

        const nextPath = pageRoutes[pageId] || "/";
        if (window.location.pathname !== nextPath) {
            const historyMethod = replaceState ? "replaceState" : "pushState";
            window.history[historyMethod]({}, "", nextPath);
        }
    }

    function initNav() {
        document.querySelectorAll(".nav-link").forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                navigateToPage(link.dataset.page, false);
            });
        });

        window.addEventListener("popstate", () => {
            setActivePage(getPageFromPath(window.location.pathname));
        });

        navigateToPage(getPageFromPath(window.location.pathname), true);
    }

    window.WorkoutApp.setActivePage = setActivePage;
    window.WorkoutApp.navigateToPage = navigateToPage;
    window.WorkoutApp.initNav = initNav;
})();
