(function () {
    let saveTimer = null;

    const liftMatchers = {
        Squat: ["back squat", "squat (5/3/1)", "squat"],
        "Bench Press": ["bench press", "bench (5/3/1)", "bench"],
        Deadlift: ["deadlift (5/3/1)", "deadlift"],
        "Overhead Press": ["overhead press", "ohp", "overhead", "press"],
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
        return program.json_data.days.flatMap((day) => {
            const exercises = Array.isArray(day.exercises) ? day.exercises : [];
            return exercises.map((exercise) => ({day: day.day, focus: day.focus, exercise}));
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

        data.main_lifts = data.main_lifts.map((liftEntry) => {
            const matchedExercise = findExerciseByMatchers(exerciseEntries, liftMatchers[liftEntry.lift] || []);
            const topSet = matchedExercise ? getTopSet(matchedExercise.exercise) : null;
            if (!matchedExercise) return liftEntry;
            return {
                lift: liftEntry.lift,
                top_set_weight: getFirstPresentValue(topSet, ["actual_weight", "prescribed_weight", "weight"]),
                reps_completed: getFirstPresentValue(topSet, ["reps", "actual_reps"]),
                RPE: getFirstPresentValue(
                    {top_set_RPE: matchedExercise.exercise.top_set_RPE, RPE: topSet ? topSet.RPE : ""},
                    ["top_set_RPE", "RPE"]
                ),
                notes: [matchedExercise.day, matchedExercise.focus, matchedExercise.exercise.name].filter(Boolean).join(" | "),
            };
        });

        return data;
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
            renderCheckInForm();
            setStatus("Saved check-in loaded for week " + week + ".");
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
            fields.appendChild(createField("top_set_weight", liftEntry.top_set_weight, (v) => { liftEntry.top_set_weight = v; }));
            fields.appendChild(createField("reps_completed", liftEntry.reps_completed, (v) => { liftEntry.reps_completed = v; }));
            fields.appendChild(createField("RPE", liftEntry.RPE, (v) => { liftEntry.RPE = v; }));
            fields.appendChild(createField("notes", liftEntry.notes, (v) => { liftEntry.notes = v; }, true));

            liftCard.appendChild(fields);
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
    window.WorkoutApp.initCheckIn = initCheckIn;
})();
