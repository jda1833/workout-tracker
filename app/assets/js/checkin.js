(function () {
    let saveTimer = null;

    const liftMatchers = {
        Squat: ["back squat", "squat (5/3/1)", "squat"],
        "Bench Press": ["bench press", "bench (5/3/1)", "bench"],
        Deadlift: ["deadlift (5/3/1)", "deadlift"],
    };

    function cloneTemplate() {
        return JSON.parse(JSON.stringify(window.WeeklyCheckInTemplate));
    }

    function setStatus(text) {
        document.getElementById("checkInStatus").textContent = text;
    }

    function updateTextarea() {
        document.getElementById("checkInTextarea").value = JSON.stringify(window.WorkoutApp.checkInData, null, 2);
    }

    function syncMissingState(input) {
        input.classList.toggle("is-missing", !String(input.value || "").trim());
    }

    function getSelectedProgram() {
        return window.WorkoutApp.programs.find((p) => p.week === window.WorkoutApp.selectedCheckInWeek) || null;
    }

    function normalizeText(value) {
        return String(value || "").trim().toLowerCase();
    }

    function flattenExercises(program) {
        if (!program || !program.json_data || !Array.isArray(program.json_data.days)) {
            return [];
        }
        return program.json_data.days.flatMap((day, dayIndex) => {
            const exercises = Array.isArray(day.exercises) ? day.exercises : [];
            return exercises.map((exercise) => ({day: day.day, dayIndex, focus: day.focus, exercise}));
        });
    }

    function findExerciseByMatchers(exerciseEntries, matchers) {
        const exactMatch = exerciseEntries.find((entry) => {
            const name = normalizeText(entry.exercise.name);
            return matchers.some((m) => name === m);
        });
        if (exactMatch) return exactMatch;

        const startsWithMatch = exerciseEntries.find((entry) => {
            const name = normalizeText(entry.exercise.name);
            return matchers.some((m) => name.startsWith(m));
        });
        if (startsWithMatch) return startsWithMatch;

        return exerciseEntries.find((entry) => {
            const name = normalizeText(entry.exercise.name);
            return matchers.some((m) => name.indexOf(m) !== -1);
        }) || null;
    }

    function getTopSet(exercise) {
        if (!exercise || !Array.isArray(exercise.sets) || !exercise.sets.length) return null;
        return exercise.sets[exercise.sets.length - 1];
    }

    function getFirstPresentValue(obj, keys) {
        if (!obj) return "";
        for (const key of keys) {
            if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
                return String(obj[key]);
            }
        }
        return "";
    }

    function buildCheckInFromProgram(program) {
        const data = cloneTemplate();
        if (!program || !program.json_data) return data;

        const weeklyNotes = program.json_data.weekly_notes || {};
        const exerciseEntries = flattenExercises(program);

        data.week_number = String(program.week || "");
        data.bodyweight = getFirstPresentValue(weeklyNotes, ["bodyweight"]);
        data.sleep_avg_hours = getFirstPresentValue(weeklyNotes, ["sleep_avg_hours"]);
        data.notes = getFirstPresentValue(weeklyNotes, ["general_notes", "recovery_notes", "pain_tightness_notes"]);

        data.main_lifts.forEach((liftEntry) => {
            const matchedExercise = findExerciseByMatchers(exerciseEntries, liftMatchers[liftEntry.lift] || []);
            if (matchedExercise) {
                liftEntry.notes = [matchedExercise.day, matchedExercise.focus, matchedExercise.exercise.name].filter(Boolean).join(" | ");
            }
        });
        syncLiftsFromProgram(data, program);

        return data;
    }

    // Saved check-ins may predate changes to the tracked lifts (e.g. Overhead Press was dropped);
    // keep only the template's lifts, in template order, preserving saved entries.
    // Returns true if the list changed.
    function normalizeMainLifts(data) {
        const saved = Array.isArray(data.main_lifts) ? data.main_lifts : [];
        const normalized = cloneTemplate().main_lifts.map((templateEntry) =>
            saved.find((entry) => entry && entry.lift === templateEntry.lift) || templateEntry
        );
        const changed = normalized.length !== saved.length || normalized.some((entry, i) => entry !== saved[i]);
        data.main_lifts = normalized;
        return changed;
    }

    // Top set values are read-only in the check-in; they always mirror the logged workout.
    // Returns true if any value changed.
    function syncLiftsFromProgram(data, program) {
        const exerciseEntries = flattenExercises(program);
        let changed = false;

        data.main_lifts.forEach((liftEntry) => {
            const matchedExercise = findExerciseByMatchers(exerciseEntries, liftMatchers[liftEntry.lift] || []);
            const topSet = matchedExercise ? getTopSet(matchedExercise.exercise) : null;
            const values = {
                top_set_weight: getFirstPresentValue(topSet, ["actual_weight", "weight"]),
                reps_completed: getFirstPresentValue(topSet, ["reps", "actual_reps"]),
                RPE: matchedExercise
                    ? getFirstPresentValue(
                        {top_set_RPE: matchedExercise.exercise.top_set_RPE, RPE: topSet ? topSet.RPE : ""},
                        ["top_set_RPE", "RPE"]
                    )
                    : "",
                mean_velocity: getFirstPresentValue(topSet, ["mean_velocity"]),
            };

            Object.keys(values).forEach((key) => {
                if (liftEntry[key] !== values[key]) {
                    liftEntry[key] = values[key];
                    changed = true;
                }
            });
        });

        return changed;
    }

    function findLiftSource(lift) {
        const matchers = liftMatchers[lift] || [];
        return findExerciseByMatchers(flattenExercises(getSelectedProgram()), matchers);
    }

    function goToWorkout(week, dayIndex) {
        window.history.pushState({}, "", "/?week=" + week + "&day=" + dayIndex);
        window.WorkoutApp.navigateToPage("trackerPage", true);
        window.WorkoutApp.applyTrackerStateFromUrl();
    }

    async function loadCheckInForWeek(week) {
        try {
            const res = await fetch("/check-ins/" + week);
            if (res.ok) {
                const saved = await res.json();
                return saved.json_data || null;
            }
        } catch {
            // fall through
        }
        return null;
    }

    function scheduleSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(persistCheckIn, 1200);
    }

    async function persistCheckIn() {
        if (!window.WorkoutApp.checkInData) return;
        try {
            const res = await fetch("/check-ins/", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(window.WorkoutApp.checkInData),
            });
            if (res.ok) {
                setStatus("Check-in saved.");
            } else {
                setStatus("Save failed.");
            }
        } catch {
            setStatus("Save failed: network error.");
        }
    }

    async function loadAndRenderCheckIn(week) {
        const saved = await loadCheckInForWeek(week);
        if (saved) {
            window.WorkoutApp.checkInData = saved;
            const liftsChanged = normalizeMainLifts(saved);
            const changed = syncLiftsFromProgram(saved, getSelectedProgram()) || liftsChanged;
            renderCheckInForm();
            setStatus("Saved check-in loaded for week " + week + ".");
            if (changed) scheduleSave();
        } else {
            window.WorkoutApp.checkInData = buildCheckInFromProgram(getSelectedProgram());
            renderCheckInForm();
            setStatus("Check-in built from program week " + week + ".");
        }
    }

    function populateWeekSelector() {
        const weekSelect = document.getElementById("checkInWeekSelect");
        if (!weekSelect) return;

        weekSelect.innerHTML = "";

        if (!window.WorkoutApp.programs.length) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No saved programs";
            weekSelect.appendChild(option);
            window.WorkoutApp.selectedCheckInWeek = null;
            window.WorkoutApp.checkInData = cloneTemplate();
            renderCheckInForm();
            setStatus("Upload a program to build a weekly check-in.");
            return;
        }

        window.WorkoutApp.programs.forEach((program) => {
            const option = document.createElement("option");
            option.value = program.week;
            option.textContent = "Week " + program.week;
            weekSelect.appendChild(option);
        });

        if (!window.WorkoutApp.selectedCheckInWeek || !getSelectedProgram()) {
            window.WorkoutApp.selectedCheckInWeek = window.WorkoutApp.programs[0].week;
        }

        weekSelect.value = window.WorkoutApp.selectedCheckInWeek;
        loadAndRenderCheckIn(window.WorkoutApp.selectedCheckInWeek);
    }

    function createField(labelText, value, onInput, isTextarea) {
        const wrapper = document.createElement("div");
        wrapper.className = "checkin-field";

        const label = document.createElement("label");
        label.textContent = labelText.replaceAll("_", " ");
        wrapper.appendChild(label);

        const input = document.createElement(isTextarea ? "textarea" : "input");
        if (!isTextarea) input.type = "text";
        input.value = value || "";
        syncMissingState(input);

        input.addEventListener("input", (event) => {
            onInput(event.target.value);
            syncMissingState(event.target);
            updateTextarea();
            setStatus("Check-in updated.");
            scheduleSave();
        });

        wrapper.appendChild(input);
        return wrapper;
    }

    function createReadOnlyField(labelText, value, isOptional) {
        const wrapper = document.createElement("div");
        wrapper.className = "checkin-field";

        const label = document.createElement("label");
        label.textContent = labelText.replaceAll("_", " ");
        wrapper.appendChild(label);

        const input = document.createElement("input");
        input.type = "text";
        input.readOnly = true;
        input.tabIndex = -1;
        input.value = value || "";
        input.placeholder = "Not logged";
        if (!isOptional) syncMissingState(input);

        wrapper.appendChild(input);
        return wrapper;
    }

    function createWorkoutLink(lift, source) {
        const message = document.createElement("p");
        message.className = "note checkin-source";

        if (!source) {
            message.textContent = "No " + lift + " exercise found in this week's program.";
            return message;
        }

        const week = window.WorkoutApp.selectedCheckInWeek;
        const link = document.createElement("a");
        link.href = "/?week=" + week + "&day=" + source.dayIndex;
        link.textContent = source.day + ": " + source.exercise.name;
        link.addEventListener("click", (event) => {
            event.preventDefault();
            goToWorkout(week, source.dayIndex);
        });

        message.appendChild(document.createTextNode("Log the last set's weight, reps and RPE in "));
        message.appendChild(link);
        return message;
    }

    function createCard(title) {
        const card = document.createElement("section");
        card.className = "checkin-card";
        const heading = document.createElement("h2");
        heading.textContent = title;
        card.appendChild(heading);
        return card;
    }

    function renderGeneralInfo(container) {
        const card = createCard("General");
        const fields = document.createElement("div");
        fields.className = "checkin-fields";

        fields.appendChild(createField("week_number", window.WorkoutApp.checkInData.week_number, (v) => { window.WorkoutApp.checkInData.week_number = v; }));
        fields.appendChild(createField("date", window.WorkoutApp.checkInData.date, (v) => { window.WorkoutApp.checkInData.date = v; }));
        fields.appendChild(createField("bodyweight", window.WorkoutApp.checkInData.bodyweight, (v) => { window.WorkoutApp.checkInData.bodyweight = v; }));
        fields.appendChild(createField("sleep_avg_hours", window.WorkoutApp.checkInData.sleep_avg_hours, (v) => { window.WorkoutApp.checkInData.sleep_avg_hours = v; }));

        card.appendChild(fields);
        container.appendChild(card);
    }

    function renderNotes(container) {
        const card = createCard("Notes");
        card.appendChild(createField("notes", window.WorkoutApp.checkInData.notes, (v) => { window.WorkoutApp.checkInData.notes = v; }, true));
        container.appendChild(card);
    }

    function renderMainLifts(container) {
        const card = createCard("Main Lifts");
        const stack = document.createElement("div");
        stack.className = "checkin-stack";

        window.WorkoutApp.checkInData.main_lifts.forEach((liftEntry) => {
            const liftCard = document.createElement("div");
            liftCard.className = "program-card";

            const heading = document.createElement("h3");
            heading.textContent = liftEntry.lift;
            liftCard.appendChild(heading);

            const fields = document.createElement("div");
            fields.className = "checkin-fields";
            fields.appendChild(createReadOnlyField("top_set_weight", liftEntry.top_set_weight));
            fields.appendChild(createReadOnlyField("reps_completed", liftEntry.reps_completed));
            fields.appendChild(createReadOnlyField("RPE", liftEntry.RPE));
            fields.appendChild(createReadOnlyField("mean_velocity (m/s)", liftEntry.mean_velocity, true));
            fields.appendChild(createField("notes", liftEntry.notes, (v) => { liftEntry.notes = v; }, true));

            liftCard.appendChild(fields);

            const isMissing = !liftEntry.top_set_weight || !liftEntry.reps_completed || !liftEntry.RPE;
            if (isMissing) {
                liftCard.appendChild(createWorkoutLink(liftEntry.lift, findLiftSource(liftEntry.lift)));
            }
            stack.appendChild(liftCard);
        });

        card.appendChild(stack);
        container.appendChild(card);
    }

    function renderCheckInForm() {
        const container = document.getElementById("checkInForm");
        container.innerHTML = "";
        renderGeneralInfo(container);
        renderNotes(container);
        renderMainLifts(container);
        updateTextarea();
    }

    async function copyCheckIn() {
        const textarea = document.getElementById("checkInTextarea");
        updateTextarea();
        try {
            await navigator.clipboard.writeText(textarea.value);
            setStatus("Check-in JSON copied.");
        } catch {
            textarea.focus();
            textarea.select();
            setStatus("Clipboard unavailable. JSON selected for manual copy.");
        }
    }

    function resetCheckIn() {
        window.WorkoutApp.checkInData = buildCheckInFromProgram(getSelectedProgram());
        renderCheckInForm();
        setStatus("Check-in reset from the selected program week.");
        scheduleSave();
    }

    function refreshCheckIn() {
        if (window.WorkoutApp.selectedCheckInWeek !== null) {
            loadAndRenderCheckIn(window.WorkoutApp.selectedCheckInWeek);
        }
    }

    function initCheckIn() {
        window.WorkoutApp.checkInData = cloneTemplate();
        document.getElementById("copyCheckInBtn").addEventListener("click", copyCheckIn);
        document.getElementById("resetCheckInBtn").addEventListener("click", resetCheckIn);
        document.getElementById("checkInWeekSelect").addEventListener("change", (event) => {
            window.WorkoutApp.selectedCheckInWeek = parseInt(event.target.value, 10);
            loadAndRenderCheckIn(window.WorkoutApp.selectedCheckInWeek);
        });
        populateWeekSelector();
    }

    window.WorkoutApp.populateCheckInWeeks = populateWeekSelector;
    window.WorkoutApp.refreshCheckIn = refreshCheckIn;
    window.WorkoutApp.initCheckIn = initCheckIn;
})();
