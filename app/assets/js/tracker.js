(function () {
    function setTrackerStatus(text) {
        document.getElementById("trackerStatus").textContent = text;
    }

    function parseIntegerParam(value) {
        if (value === null || value === "") return null;
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? null : parsed;
    }

    function getTrackerParamsFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return {
            week: parseIntegerParam(params.get("week")),
            day: parseIntegerParam(params.get("day")),
        };
    }

    function syncTrackerUrl(replaceState) {
        if (window.location.pathname !== "/") return;

        const params = new URLSearchParams(window.location.search);
        if (window.WorkoutApp.selectedWeek === null) {
            params.delete("week");
            params.delete("day");
        } else {
            params.set("week", String(window.WorkoutApp.selectedWeek));
            if (window.WorkoutApp.selectedDayIndex === null) {
                params.delete("day");
            } else {
                params.set("day", String(window.WorkoutApp.selectedDayIndex));
            }
        }

        const nextSearch = params.toString();
        const nextUrl = nextSearch ? "/?" + nextSearch : "/";
        const currentUrl = window.location.pathname + window.location.search;
        if (currentUrl !== nextUrl) {
            window.history[replaceState ? "replaceState" : "pushState"]({}, "", nextUrl);
        }
    }

    function hasCompletedReps(setItem) {
        const repsValue = setItem.reps !== undefined ? setItem.reps : setItem.actual_reps;
        return String(repsValue || "").trim() !== "";
    }

    function isManuallyCompleted(setItem) {
        return setItem.complete === true;
    }

    function updateCompletedRowState(row, setItem) {
        row.classList.toggle("is-complete", hasCompletedReps(setItem) || isManuallyCompleted(setItem));
    }

    function filterWeekSelect() {
        const filter = document.getElementById("weekFilter");
        const weekSelect = document.getElementById("weekSelect");
        if (!filter || !weekSelect) return;

        const query = filter.value.trim().toLowerCase();
        Array.from(weekSelect.options).forEach((option) => {
            option.hidden = query !== "" && !option.textContent.toLowerCase().includes(query);
        });
    }

    async function loadPrograms() {
        const res = await fetch("/programs/");
        window.WorkoutApp.programs = await res.json();

        const weekSelect = document.getElementById("weekSelect");
        weekSelect.innerHTML = "";

        window.WorkoutApp.programs.forEach((program) => {
            const option = document.createElement("option");
            option.value = program.week;
            option.textContent = "Week " + program.week;
            weekSelect.appendChild(option);
        });

        if (window.WorkoutApp.programs.length) {
            const requestedWeek = getTrackerParamsFromUrl().week;
            const matchingWeek = window.WorkoutApp.programs.find((p) => p.week === requestedWeek);
            window.WorkoutApp.selectedWeek = matchingWeek ? matchingWeek.week : window.WorkoutApp.programs[0].week;
            weekSelect.value = window.WorkoutApp.selectedWeek;
            populateDays();
            setTrackerStatus("");
        } else {
            window.WorkoutApp.selectedWeek = null;
            window.WorkoutApp.selectedDayIndex = null;
            document.getElementById("daySelect").innerHTML = "";
            document.getElementById("dayContainer").innerHTML = "<p class='note'>No programs found yet. Use Upload Program to add one.</p>";
            syncTrackerUrl(true);
        }

        filterWeekSelect();

        if (typeof window.WorkoutApp.onProgramsLoaded === "function") {
            window.WorkoutApp.onProgramsLoaded();
        }
    }

    function populateDays() {
        const daySelect = document.getElementById("daySelect");
        daySelect.innerHTML = "";

        const weekData = window.WorkoutApp.programs.find((p) => p.week === window.WorkoutApp.selectedWeek);
        if (!weekData || !weekData.json_data || !Array.isArray(weekData.json_data.days)) {
            document.getElementById("dayContainer").innerHTML = "<p class='note'>This program has no valid day data.</p>";
            return;
        }

        weekData.json_data.days.forEach((day, idx) => {
            const option = document.createElement("option");
            option.value = idx;
            option.textContent = day.day + " (" + day.focus + ")";
            daySelect.appendChild(option);
        });

        const requestedDay = getTrackerParamsFromUrl().day;
        const hasRequestedDay = requestedDay !== null && requestedDay >= 0 && requestedDay < weekData.json_data.days.length;
        const hasCurrentDay = window.WorkoutApp.selectedDayIndex !== null && window.WorkoutApp.selectedDayIndex >= 0 && window.WorkoutApp.selectedDayIndex < weekData.json_data.days.length;
        window.WorkoutApp.selectedDayIndex = hasRequestedDay ? requestedDay : (hasCurrentDay ? window.WorkoutApp.selectedDayIndex : 0);
        daySelect.value = window.WorkoutApp.selectedDayIndex;
        showDay();
    }

    function showDay() {
        const container = document.getElementById("dayContainer");
        container.innerHTML = "";

        const weekData = window.WorkoutApp.programs.find((p) => p.week === window.WorkoutApp.selectedWeek);
        if (!weekData || !weekData.json_data || !Array.isArray(weekData.json_data.days)) {
            container.innerHTML = "<p class='note'>No day data available.</p>";
            return;
        }

        const dayData = weekData.json_data.days[window.WorkoutApp.selectedDayIndex];
        if (!dayData || !Array.isArray(dayData.exercises)) {
            container.innerHTML = "<p class='note'>No exercises available for this day.</p>";
            return;
        }

        syncTrackerUrl(true);

        dayData.exercises.forEach((exercise) => {
            const card = document.createElement("div");
            card.className = "program-card";

            const header = document.createElement("h3");
            header.className = "exercise-title";
            header.textContent = exercise.name;
            card.appendChild(header);

            if (!exercise.sets || !exercise.sets.length) {
                const empty = document.createElement("p");
                empty.className = "note";
                empty.textContent = "No set data available.";
                card.appendChild(empty);
                container.appendChild(card);
                return;
            }

            const table = document.createElement("table");
            table.className = "exercise-table";
            const thead = document.createElement("thead");
            const headRow = document.createElement("tr");
            const setKeys = Object.keys(exercise.sets[0]);

            const setNumberHeader = document.createElement("th");
            setNumberHeader.textContent = "Set";
            headRow.appendChild(setNumberHeader);

            const completeHeader = document.createElement("th");
            completeHeader.textContent = "Done";
            headRow.appendChild(completeHeader);

            setKeys.forEach((key) => {
                const th = document.createElement("th");
                th.textContent = key;
                headRow.appendChild(th);
            });

            thead.appendChild(headRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            exercise.sets.forEach((setItem, setIndex) => {
                const row = document.createElement("tr");

                const setNumberCell = document.createElement("td");
                setNumberCell.dataset.label = "Set";
                setNumberCell.textContent = String(setIndex + 1);
                row.appendChild(setNumberCell);

                const completeCell = document.createElement("td");
                completeCell.dataset.label = "Done";
                const completeInput = document.createElement("input");
                completeInput.type = "checkbox";
                completeInput.checked = isManuallyCompleted(setItem);
                completeInput.className = "set-complete-checkbox";
                completeInput.setAttribute("aria-label", exercise.name + " complete set " + (setIndex + 1));
                completeInput.onchange = async (e) => {
                    exercise.sets[setIndex].complete = e.target.checked;
                    updateCompletedRowState(row, exercise.sets[setIndex]);
                    await updateProgramOnServer();
                };
                completeCell.appendChild(completeInput);
                row.appendChild(completeCell);

                setKeys.forEach((key) => {
                    const cell = document.createElement("td");
                    cell.dataset.label = key;
                    const input = document.createElement("input");
                    input.value = setItem[key] || "";
                    input.setAttribute("aria-label", exercise.name + " " + key + " set " + (setIndex + 1));
                    input.onchange = async (e) => {
                        exercise.sets[setIndex][key] = e.target.value;
                        updateCompletedRowState(row, exercise.sets[setIndex]);
                        await updateProgramOnServer();
                    };
                    cell.appendChild(input);
                    row.appendChild(cell);
                });

                updateCompletedRowState(row, setItem);
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            card.appendChild(table);
            container.appendChild(card);
        });
    }

    async function updateProgramOnServer() {
        const weekData = window.WorkoutApp.programs.find((p) => p.week === window.WorkoutApp.selectedWeek);
        if (!weekData) return;
        await fetch("/update-program/" + weekData.id, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(weekData.json_data),
        });
    }

    async function deleteSelectedWeek() {
        const weekData = window.WorkoutApp.programs.find((p) => p.week === window.WorkoutApp.selectedWeek);
        if (!weekData) {
            setTrackerStatus("No week selected.");
            return;
        }

        const confirmed = window.confirm("Move Week " + weekData.week + " to trash? You can restore it from the Deleted Weeks section.");
        if (!confirmed) return;

        setTrackerStatus("Deleting week " + weekData.week + "...");
        try {
            const res = await fetch("/programs/" + weekData.id, {method: "DELETE"});
            if (!res.ok) {
                const err = await res.json().catch(() => ({detail: "Delete failed"}));
                setTrackerStatus("Delete failed: " + (err.detail || "Unknown error"));
                return;
            }
            await loadPrograms();
            setTrackerStatus(
                window.WorkoutApp.selectedWeek === null
                    ? "Week " + weekData.week + " deleted. No programs remain."
                    : "Week " + weekData.week + " deleted."
            );
            renderDeletedWeeks();
        } catch {
            setTrackerStatus("Delete failed: network error.");
        }
    }

    async function renderDeletedWeeks() {
        const container = document.getElementById("deletedWeeksContainer");
        if (!container) return;

        try {
            const res = await fetch("/programs/?include_deleted=true");
            const all = await res.json();
            const deleted = all.filter((p) => p.deleted);

            if (!deleted.length) {
                container.innerHTML = "<p class='note'>No deleted weeks.</p>";
                return;
            }

            container.innerHTML = "";
            deleted.forEach((program) => {
                const row = document.createElement("div");
                row.className = "deleted-week-row";

                const label = document.createElement("span");
                label.textContent = "Week " + program.week;
                row.appendChild(label);

                const restoreBtn = document.createElement("button");
                restoreBtn.type = "button";
                restoreBtn.className = "btn-restore";
                restoreBtn.textContent = "Restore";
                restoreBtn.onclick = async () => {
                    await fetch("/programs/" + program.id + "/restore", {method: "POST"});
                    await loadPrograms();
                    renderDeletedWeeks();
                    setTrackerStatus("Week " + program.week + " restored.");
                };
                row.appendChild(restoreBtn);
                container.appendChild(row);
            });
        } catch {
            container.innerHTML = "<p class='note'>Could not load deleted weeks.</p>";
        }
    }

    function initDeletedWeeksToggle() {
        const toggleBtn = document.getElementById("showDeletedBtn");
        const panel = document.getElementById("deletedWeeksPanel");
        if (!toggleBtn || !panel) return;

        toggleBtn.addEventListener("click", () => {
            const isOpen = panel.style.display !== "none";
            panel.style.display = isOpen ? "none" : "block";
            toggleBtn.textContent = isOpen ? "Show Deleted Weeks" : "Hide Deleted Weeks";
            if (!isOpen) renderDeletedWeeks();
        });
    }

    function initTracker() {
        document.getElementById("weekSelect").addEventListener("change", (e) => {
            window.WorkoutApp.selectedWeek = parseInt(e.target.value, 10);
            window.WorkoutApp.selectedDayIndex = null;
            populateDays();
            syncTrackerUrl(false);
        });

        document.getElementById("daySelect").addEventListener("change", (e) => {
            window.WorkoutApp.selectedDayIndex = parseInt(e.target.value, 10);
            showDay();
            syncTrackerUrl(false);
        });

        const weekFilter = document.getElementById("weekFilter");
        if (weekFilter) {
            weekFilter.addEventListener("input", filterWeekSelect);
        }

        document.getElementById("deleteWeekBtn").addEventListener("click", deleteSelectedWeek);
        initDeletedWeeksToggle();
    }

    function applyTrackerStateFromUrl() {
        if (window.location.pathname !== "/") return;

        const trackerPage = document.getElementById("trackerPage");
        if (!trackerPage || !trackerPage.classList.contains("active")) return;
        if (!window.WorkoutApp.programs.length) return;

        const params = getTrackerParamsFromUrl();
        const matchingWeek = window.WorkoutApp.programs.find((p) => p.week === params.week);
        if (!matchingWeek) return;

        window.WorkoutApp.selectedWeek = matchingWeek.week;
        document.getElementById("weekSelect").value = String(matchingWeek.week);
        window.WorkoutApp.selectedDayIndex = params.day;
        populateDays();
    }

    window.WorkoutApp.applyTrackerStateFromUrl = applyTrackerStateFromUrl;
    window.WorkoutApp.initTracker = initTracker;
    window.WorkoutApp.loadPrograms = loadPrograms;
})();
