(function () {
    const ROOT_KEYS = new Set(["week", "days"]);
    const DAY_KEYS = new Set(["day", "focus", "exercises"]);
    const EXERCISE_KEYS = new Set(["name", "sets"]);
    const SET_KEYS = new Set(["percent", "target_reps", "prescribed_weight", "actual_weight", "reps", "RPE"]);

    function setStatus(text) {
        document.getElementById("uploadStatus").textContent = text;
    }

    function findUnexpectedKey(obj, allowedKeys) {
        return Object.keys(obj).find((key) => !allowedKeys.has(key)) || null;
    }

    function isNumberOrString(value) {
        return typeof value === "string" || (typeof value === "number" && !Number.isNaN(value));
    }

    function validateProgramShape(parsed) {
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
            return "JSON must be an object.";
        }

        const unexpectedRootKey = findUnexpectedKey(parsed, ROOT_KEYS);
        if (unexpectedRootKey) {
            return "root." + unexpectedRootKey + " is not allowed.";
        }

        if (!Number.isInteger(parsed.week)) {
            return "JSON must include an integer 'week'.";
        }

        if (!Array.isArray(parsed.days) || parsed.days.length === 0) {
            return "'days' must be a non-empty array.";
        }

        for (let dayIndex = 0; dayIndex < parsed.days.length; dayIndex += 1) {
            const day = parsed.days[dayIndex];
            if (!day || typeof day !== "object" || Array.isArray(day)) {
                return "Each day must be an object.";
            }

            const unexpectedDayKey = findUnexpectedKey(day, DAY_KEYS);
            if (unexpectedDayKey) {
                return "days[" + dayIndex + "]." + unexpectedDayKey + " is not allowed.";
            }

            if (typeof day.day !== "string" || typeof day.focus !== "string") {
                return "Each day must include 'day' and 'focus' strings.";
            }
            if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
                return "Each day must include a non-empty 'exercises' array.";
            }

            for (let exerciseIndex = 0; exerciseIndex < day.exercises.length; exerciseIndex += 1) {
                const ex = day.exercises[exerciseIndex];
                if (!ex || typeof ex !== "object" || Array.isArray(ex)) {
                    return "Each exercise must be an object.";
                }

                const unexpectedExerciseKey = findUnexpectedKey(ex, EXERCISE_KEYS);
                if (unexpectedExerciseKey) {
                    return "days[" + dayIndex + "].exercises[" + exerciseIndex + "]." + unexpectedExerciseKey + " is not allowed.";
                }

                if (typeof ex.name !== "string") {
                    return "Each exercise must include a text 'name'.";
                }
                if (!Array.isArray(ex.sets) || ex.sets.length === 0) {
                    return "Each exercise must include a non-empty 'sets' array.";
                }

                for (let setIndex = 0; setIndex < ex.sets.length; setIndex += 1) {
                    const setItem = ex.sets[setIndex];
                    if (!setItem || typeof setItem !== "object" || Array.isArray(setItem)) {
                        return "Each set must be an object.";
                    }

                    const unexpectedSetKey = findUnexpectedKey(setItem, SET_KEYS);
                    if (unexpectedSetKey) {
                        return "days[" + dayIndex + "].exercises[" + exerciseIndex + "].sets[" + setIndex + "]." + unexpectedSetKey + " is not allowed.";
                    }

                    for (const requiredKey of SET_KEYS) {
                        if (!(requiredKey in setItem)) {
                            return "days[" + dayIndex + "].exercises[" + exerciseIndex + "].sets[" + setIndex + "]." + requiredKey + " is required.";
                        }
                    }

                    if (!isNumberOrString(setItem.percent)) {
                        return "Set 'percent' must be a number or string.";
                    }
                    if (!isNumberOrString(setItem.target_reps)) {
                        return "Set 'target_reps' must be a number or string.";
                    }
                    if (!isNumberOrString(setItem.prescribed_weight)) {
                        return "Set 'prescribed_weight' must be a number or string.";
                    }
                    if (!isNumberOrString(setItem.actual_weight)) {
                        return "Set 'actual_weight' must be a number or string.";
                    }
                    if (!isNumberOrString(setItem.reps)) {
                        return "Set 'reps' must be a number or string.";
                    }
                    if (!isNumberOrString(setItem.RPE)) {
                        return "Set 'RPE' must be a number or string.";
                    }
                }
            }
        }

        return null;
    }

    function parseAndValidatePastedJson() {
        const raw = document.getElementById("jsonTextarea").value.trim();
        if (!raw) {
            setStatus("Paste JSON into the text box first.");
            return null;
        }

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch {
            setStatus("Invalid JSON syntax.");
            return null;
        }

        const validationError = validateProgramShape(parsed);
        if (validationError) {
            setStatus(validationError);
            return null;
        }

        setStatus("JSON is valid.");
        return parsed;
    }

    async function uploadProgramFile() {
        const fileInput = document.getElementById("uploadFile");
        if (!fileInput.files.length) {
            setStatus("Please choose a JSON file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", fileInput.files[0]);

        setStatus("Uploading...");
        try {
            const res = await fetch("/upload-json/", {method: "POST", body: formData});
            if (!res.ok) {
                const err = await res.json().catch(() => ({detail: "Upload failed"}));
                const detail = Array.isArray(err.detail) ? err.detail.join(" ") : (err.detail || "Unknown error");
                setStatus("Upload failed: " + detail);
                return;
            }

            setStatus("Upload successful.");
            await window.WorkoutApp.loadPrograms();
            window.WorkoutApp.setActivePage("trackerPage");
        } catch {
            setStatus("Upload failed: network error.");
        }
    }

    async function uploadPastedJson() {
        const parsed = parseAndValidatePastedJson();
        if (!parsed) {
            return;
        }

        setStatus("Uploading pasted JSON...");
        try {
            const res = await fetch("/upload-json-body/", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(parsed),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({detail: "Upload failed"}));
                const detail = Array.isArray(err.detail) ? err.detail.join(" ") : (err.detail || "Unknown error");
                setStatus("Upload failed: " + detail);
                return;
            }

            setStatus("Upload successful.");
            await window.WorkoutApp.loadPrograms();
            window.WorkoutApp.setActivePage("trackerPage");
        } catch {
            setStatus("Upload failed: network error.");
        }
    }

    function loadTemplate() {
        document.getElementById("jsonTextarea").value = JSON.stringify(window.WorkoutTemplate, null, 2);
        setStatus("Template loaded.");
    }

    function initUpload() {
        document.getElementById("uploadBtn").addEventListener("click", uploadProgramFile);
        document.getElementById("validateJsonBtn").addEventListener("click", parseAndValidatePastedJson);
        document.getElementById("uploadPastedBtn").addEventListener("click", uploadPastedJson);
        document.getElementById("loadTemplateBtn").addEventListener("click", loadTemplate);
        loadTemplate();
    }

    window.WorkoutApp.initUpload = initUpload;
})();
