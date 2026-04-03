(function () {
    const liftMatchers = {
        Squat: ["back squat", "squat (5/3/1)", "squat"],
        "Bench Press": ["bench press", "bench (5/3/1)", "bench"],
        Deadlift: ["deadlift (5/3/1)", "deadlift"],
        "Overhead Press": ["overhead press", "press"],
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

    function getSelectedProgram() {
        return window.WorkoutApp.programs.find((program) => program.week === window.WorkoutApp.selectedCheckInWeek) || null;
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
            return exercises.map((exercise) => ({
                day: day.day,
                focus: day.focus,
                exercise: exercise,
            }));
        });
    }

    function findExerciseByMatchers(exerciseEntries, matchers) {
        return exerciseEntries.find((entry) => {
            const name = normalizeText(entry.exercise.name);
            return matchers.some((matcher) => name.indexOf(matcher) !== -1);
        }) || null;
    }

    function getTopSetValue(exercise, keys) {
        if (!exercise || !Array.isArray(exercise.sets) || !exercise.sets.length) {
            return "";
        }

        const topSet = exercise.sets[exercise.sets.length - 1];
        for (const key of keys) {
            if (topSet[key] !== undefined && topSet[key] !== null && topSet[key] !== "") {
                return String(topSet[key]);
            }
        }

        return "";
    }

    function buildRecoveryNotes(notes) {
        const parts = [];

        if (notes.pain_tightness_notes) {
            parts.push("Pain/Tightness: " + notes.pain_tightness_notes);
        }
        if (notes.recovery_notes) {
            parts.push("Recovery: " + notes.recovery_notes);
        }

        return parts.join(" | ");
    }

    function buildAdditionalNotes(programData) {
        const parts = [];
        if (programData.week_type) {
            parts.push("Week Type: " + programData.week_type);
        }
        if (programData.amrap_rule) {
            parts.push("AMRAP Rule: " + programData.amrap_rule);
        }
        if (programData.weekly_notes && programData.weekly_notes.general_notes) {
            parts.push("General: " + programData.weekly_notes.general_notes);
        }
        return parts.join(" | ");
    }

    function buildCheckInFromProgram(program) {
        const data = cloneTemplate();

        if (!program || !program.json_data) {
            return data;
        }

        const programData = program.json_data;
        const weeklyNotes = programData.weekly_notes || {};
        const exerciseEntries = flattenExercises(program);

        data.week_number = String(program.week || "");
        data.bodyweight = String(weeklyNotes.bodyweight || "");
        data.recovery.sleep_hours = String(weeklyNotes.sleep_avg_hours || "");
        data.recovery.overall_recovery_notes = buildRecoveryNotes(weeklyNotes);
        data.additional_notes = buildAdditionalNotes(programData);

        data.main_lifts = data.main_lifts.map((liftEntry) => {
            const matchedExercise = findExerciseByMatchers(exerciseEntries, liftMatchers[liftEntry.lift] || []);
            if (!matchedExercise) {
                return liftEntry;
            }

            return {
                lift: liftEntry.lift,
                top_set_weight: getTopSetValue(matchedExercise.exercise, ["prescribed_weight", "weight"]),
                reps_completed: getTopSetValue(matchedExercise.exercise, ["target_reps", "reps", "actual_reps"]),
                RPE: String(matchedExercise.exercise.top_set_RPE || getTopSetValue(matchedExercise.exercise, ["RPE"])),
                notes: [matchedExercise.day, matchedExercise.focus, matchedExercise.exercise.name].filter(Boolean).join(" | "),
            };
        });

        data.accessories = data.accessories.filter((accessoryEntry) => {
            const exerciseName = normalizeText(accessoryEntry.exercise);
            return exerciseEntries.some((entry) => {
                const name = normalizeText(entry.exercise.name);
                if (exerciseName === "ab wheel / hanging leg raise") {
                    return name.indexOf("ab wheel") !== -1 || name.indexOf("hanging leg raise") !== -1;
                }
                return name.indexOf(exerciseName) !== -1;
            });
        });

        return data;
    }

    function populateWeekSelector() {
        const weekSelect = document.getElementById("checkInWeekSelect");
        if (!weekSelect) {
            return;
        }

        weekSelect.innerHTML = "";

        if (!window.WorkoutApp.programs.length) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No saved programs";
            weekSelect.appendChild(option);
            window.WorkoutApp.selectedCheckInWeek = null;
            window.WorkoutApp.checkInData = cloneTemplate();
            renderCheckInForm();
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
        window.WorkoutApp.checkInData = buildCheckInFromProgram(getSelectedProgram());
        renderCheckInForm();
    }

    function createField(labelText, value, onInput, isTextarea) {
        const wrapper = document.createElement("div");
        wrapper.className = "checkin-field";

        const label = document.createElement("label");
        label.textContent = labelText.replaceAll("_", " ");
        wrapper.appendChild(label);

        const input = document.createElement(isTextarea ? "textarea" : "input");
        input.type = isTextarea ? undefined : "text";
        input.value = value || "";
        input.addEventListener("input", (event) => {
            onInput(event.target.value);
            updateTextarea();
            setStatus("Check-in updated.");
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

        fields.appendChild(createField("week_number", window.WorkoutApp.checkInData.week_number, (value) => {
            window.WorkoutApp.checkInData.week_number = value;
        }));
        fields.appendChild(createField("date", window.WorkoutApp.checkInData.date, (value) => {
            window.WorkoutApp.checkInData.date = value;
        }));
        fields.appendChild(createField("bodyweight", window.WorkoutApp.checkInData.bodyweight, (value) => {
            window.WorkoutApp.checkInData.bodyweight = value;
        }));
        fields.appendChild(createField("additional_notes", window.WorkoutApp.checkInData.additional_notes, (value) => {
            window.WorkoutApp.checkInData.additional_notes = value;
        }, true));

        card.appendChild(fields);
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
            fields.appendChild(createField("top_set_weight", liftEntry.top_set_weight, (value) => {
                liftEntry.top_set_weight = value;
            }));
            fields.appendChild(createField("reps_completed", liftEntry.reps_completed, (value) => {
                liftEntry.reps_completed = value;
            }));
            fields.appendChild(createField("RPE", liftEntry.RPE, (value) => {
                liftEntry.RPE = value;
            }));
            fields.appendChild(createField("notes", liftEntry.notes, (value) => {
                liftEntry.notes = value;
            }, true));

            liftCard.appendChild(fields);
            stack.appendChild(liftCard);
        });

        card.appendChild(stack);
        container.appendChild(card);
    }

    function renderAccessories(container) {
        const card = createCard("Accessories");
        const stack = document.createElement("div");
        stack.className = "checkin-stack";

        window.WorkoutApp.checkInData.accessories.forEach((accessory) => {
            const accessoryCard = document.createElement("div");
            accessoryCard.className = "program-card";

            const heading = document.createElement("h3");
            heading.textContent = accessory.exercise;
            accessoryCard.appendChild(heading);

            const fields = document.createElement("div");
            fields.className = "checkin-fields";
            fields.appendChild(createField("difficulty", accessory.difficulty, (value) => {
                accessory.difficulty = value;
            }));
            fields.appendChild(createField("notes", accessory.notes, (value) => {
                accessory.notes = value;
            }, true));

            accessoryCard.appendChild(fields);
            stack.appendChild(accessoryCard);
        });

        card.appendChild(stack);
        container.appendChild(card);
    }

    function renderRecovery(container) {
        const card = createCard("Recovery");
        const fields = document.createElement("div");
        fields.className = "checkin-fields";

        Object.keys(window.WorkoutApp.checkInData.recovery).forEach((key) => {
            const isTextarea = key.indexOf("notes") !== -1;
            fields.appendChild(createField(key, window.WorkoutApp.checkInData.recovery[key], (value) => {
                window.WorkoutApp.checkInData.recovery[key] = value;
            }, isTextarea));
        });

        card.appendChild(fields);
        container.appendChild(card);
    }

    function renderCheckInForm() {
        const container = document.getElementById("checkInForm");
        container.innerHTML = "";
        renderGeneralInfo(container);
        renderMainLifts(container);
        renderAccessories(container);
        renderRecovery(container);
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
        setStatus("Check-in reset.");
    }

    function initCheckIn() {
        window.WorkoutApp.checkInData = cloneTemplate();
        document.getElementById("copyCheckInBtn").addEventListener("click", copyCheckIn);
        document.getElementById("resetCheckInBtn").addEventListener("click", resetCheckIn);
        document.getElementById("checkInWeekSelect").addEventListener("change", (event) => {
            window.WorkoutApp.selectedCheckInWeek = parseInt(event.target.value, 10);
            window.WorkoutApp.checkInData = buildCheckInFromProgram(getSelectedProgram());
            renderCheckInForm();
            setStatus("Loaded week " + window.WorkoutApp.selectedCheckInWeek + " into check-in.");
        });
        populateWeekSelector();
    }

    window.WorkoutApp.onProgramsLoaded = populateWeekSelector;
    window.WorkoutApp.initCheckIn = initCheckIn;
})();
