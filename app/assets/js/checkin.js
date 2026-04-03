(function () {
    function cloneTemplate() {
        return JSON.parse(JSON.stringify(window.WeeklyCheckInTemplate));
    }

    function setStatus(text) {
        document.getElementById("checkInStatus").textContent = text;
    }

    function updateTextarea() {
        document.getElementById("checkInTextarea").value = JSON.stringify(window.WorkoutApp.checkInData, null, 2);
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
        window.WorkoutApp.checkInData = cloneTemplate();
        renderCheckInForm();
        setStatus("Check-in reset.");
    }

    function initCheckIn() {
        window.WorkoutApp.checkInData = cloneTemplate();
        renderCheckInForm();
        document.getElementById("copyCheckInBtn").addEventListener("click", copyCheckIn);
        document.getElementById("resetCheckInBtn").addEventListener("click", resetCheckIn);
    }

    window.WorkoutApp.initCheckIn = initCheckIn;
})();
