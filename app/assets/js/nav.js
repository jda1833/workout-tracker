(function () {
    function isMobileTrackerOnlyMode() {
        return window.innerWidth < 768;
    }

    const pageRoutes = {
        trackerPage: "/",
        checkInPage: "/check-in",
        analyticsPage: "/analytics",
        toolsPage: "/tools",
        uploadPage: "/",
        linksPage: "/",
    };

    function getPageFromPath(pathname) {
        if (isMobileTrackerOnlyMode()) {
            return "trackerPage";
        }
        if (pathname === "/check-in") return "checkInPage";
        if (pathname === "/analytics") return "analyticsPage";
        if (pathname === "/tools") return "toolsPage";
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
        const resolvedPageId = isMobileTrackerOnlyMode() ? "trackerPage" : pageId;
        setActivePage(resolvedPageId);

        const nextPath = pageRoutes[resolvedPageId] || "/";
        const nextSearch = resolvedPageId === "trackerPage" ? window.location.search : "";
        const nextUrl = nextPath + nextSearch;
        const currentUrl = window.location.pathname + window.location.search;
        if (currentUrl !== nextUrl) {
            const historyMethod = replaceState ? "replaceState" : "pushState";
            window.history[historyMethod]({}, "", nextUrl);
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
            if (typeof window.WorkoutApp.applyTrackerStateFromUrl === "function") {
                window.WorkoutApp.applyTrackerStateFromUrl();
            }
        });

        window.addEventListener("resize", () => {
            if (!isMobileTrackerOnlyMode()) {
                return;
            }

            setActivePage("trackerPage");
            if (window.location.pathname !== "/") {
                window.history.replaceState({}, "", "/" + window.location.search);
            }
        });

        navigateToPage(getPageFromPath(window.location.pathname), true);
    }

    window.WorkoutApp.setActivePage = setActivePage;
    window.WorkoutApp.navigateToPage = navigateToPage;
    window.WorkoutApp.initNav = initNav;
})();
