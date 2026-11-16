(function () {
    function setResetStatus(message) {
        const node = document.getElementById("resetStatus");
        if (node) node.textContent = message;
    }

    async function resetAllData() {
        const typed = window.prompt(
            "This permanently deletes ALL programs (including trashed weeks), check-ins and exercise notes.\n\n" +
            "Download a backup first if you want to keep anything.\n\nType DELETE to confirm."
        );
        if (typed === null) return;
        if (typed.trim() !== "DELETE") {
            setResetStatus("Reset cancelled: confirmation text did not match.");
            return;
        }

        setResetStatus("Deleting all data...");
        try {
            const res = await fetch("/reset/?confirm=DELETE", {method: "DELETE"});
            if (!res.ok) {
                const err = await res.json().catch(() => ({detail: "Reset failed"}));
                setResetStatus("Reset failed: " + (err.detail || "Unknown error"));
                return;
            }
            window.location.reload();
        } catch {
            setResetStatus("Reset failed: network error.");
        }
    }

    function initReset() {
        const btn = document.getElementById("resetAllBtn");
        if (btn) btn.addEventListener("click", resetAllData);
    }

    window.addEventListener("DOMContentLoaded", initReset);
})();
