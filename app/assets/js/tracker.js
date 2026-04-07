(function () {
    function setTrackerStatus(text) {
        document.getElementById("trackerStatus").textContent = text;
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
            window.WorkoutApp.selectedWeek = window.WorkoutApp.programs[0].week;
            weekSelect.value = window.WorkoutApp.selectedWeek;
            populateDays();
            setTrackerStatus("");
        } else {
            window.WorkoutApp.selectedWeek = null;
            window.WorkoutApp.selectedDayIndex = null;
            document.getElementById("daySelect").innerHTML = "";
            document.getElementById("dayContainer").innerHTML = "<p class='note'>No programs found yet. Use Upload Program to add one.</p>";
        }

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

        window.WorkoutApp.selectedDayIndex = 0;
        daySelect.value = 0;
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

                setKeys.forEach((key) => {
                    const cell = document.createElement("td");
                    cell.dataset.label = key;
                    const input = document.createElement("input");
                    input.value = setItem[key] || "";
                    input.setAttribute("aria-label", exercise.name + " " + key + " set " + (setIndex + 1));
                    input.onchange = async (e) => {
                        exercise.sets[setIndex][key] = e.target.value;
                        await updateProgramOnServer();
                    };
                    cell.appendChild(input);
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            card.appendChild(table);
            container.appendChild(card);
        });
    }

    async function updateProgramOnServer() {
        const weekData = window.WorkoutApp.programs.find((p) => p.week === window.WorkoutApp.selectedWeek);
        if (!weekData) {
            return;
        }

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

        const confirmed = window.confirm("Delete Week " + weekData.week + "? This cannot be undone.");
        if (!confirmed) {
            return;
        }

        setTrackerStatus("Deleting week " + weekData.week + "...");

        try {
            const res = await fetch("/programs/" + weekData.id, {
                method: "DELETE",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({detail: "Delete failed"}));
                setTrackerStatus("Delete failed: " + (err.detail || "Unknown error"));
                return;
            }

            await loadPrograms();
            if (window.WorkoutApp.selectedWeek === null) {
                setTrackerStatus("Week " + weekData.week + " deleted. No programs remain.");
            } else {
                setTrackerStatus("Week " + weekData.week + " deleted.");
            }
        } catch {
            setTrackerStatus("Delete failed: network error.");
        }
    }

    function initTracker() {
        document.getElementById("weekSelect").addEventListener("change", (e) => {
            window.WorkoutApp.selectedWeek = parseInt(e.target.value, 10);
            populateDays();
        });

        document.getElementById("daySelect").addEventListener("change", (e) => {
            window.WorkoutApp.selectedDayIndex = parseInt(e.target.value, 10);
            showDay();
        });

        document.getElementById("deleteWeekBtn").addEventListener("click", deleteSelectedWeek);
    }

    window.WorkoutApp.initTracker = initTracker;
    window.WorkoutApp.loadPrograms = loadPrograms;
})();
