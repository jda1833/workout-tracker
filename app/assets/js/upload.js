(function () {
    function setStatus(text) {
        document.getElementById("uploadStatus").textContent = text;
    }

    function validateProgramShape(parsed) {
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
            return "JSON must be an object.";
        }
        if (!Number.isInteger(parsed.week)) {
            return "JSON must include an integer 'week'.";
        }
        if (typeof parsed.week_type !== "string" || !parsed.week_type.trim()) {
            return "JSON must include 'week_type' as text.";
        }
        if (typeof parsed.amrap_rule !== "string") {
            return "JSON must include 'amrap_rule' as text.";
        }

        const tm = parsed.training_maxes;
        if (!tm || typeof tm !== "object" || Array.isArray(tm)) {
            return "JSON must include a 'training_maxes' object.";
        }

        const tmKeys = ["squat", "bench", "deadlift", "overhead_press"];
        for (const key of tmKeys) {
            if (typeof tm[key] !== "number" || Number.isNaN(tm[key])) {
                return "training_maxes." + key + " must be a number.";
            }
        }

        if (!Array.isArray(parsed.days) || parsed.days.length === 0) {
            return "'days' must be a non-empty array.";
        }

        for (const day of parsed.days) {
            if (!day || typeof day !== "object" || Array.isArray(day)) {
                return "Each day must be an object.";
            }
            if (typeof day.day !== "string" || typeof day.focus !== "string") {
                return "Each day must include 'day' and 'focus' strings.";
            }
            if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
                return "Each day must include a non-empty 'exercises' array.";
            }
            for (const ex of day.exercises) {
                if (!ex || typeof ex !== "object" || Array.isArray(ex)) {
                    return "Each exercise must be an object.";
                }
                if (typeof ex.name !== "string") {
                    return "Each exercise must include a text 'name'.";
                }
                if (!Array.isArray(ex.sets) || ex.sets.length === 0) {
                    return "Each exercise must include a non-empty 'sets' array.";
                }
            }
        }

        const notes = parsed.weekly_notes;
        if (notes !== undefined) {
            if (!notes || typeof notes !== "object" || Array.isArray(notes)) {
                return "'weekly_notes' must be an object when provided.";
            }

            const noteKeys = [
                "bodyweight",
                "sleep_avg_hours",
                "hardest_lift",
                "pain_tightness_notes",
                "recovery_notes",
                "general_notes",
            ];

            for (const key of noteKeys) {
                if (!(key in notes)) {
                    return "weekly_notes." + key + " is required when 'weekly_notes' is provided.";
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
