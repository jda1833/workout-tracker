(function () {
    // Tuchscherer RPE chart — [reps][RPE index]
    // RPE columns: 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10
    const RPE_INDICES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
    const RPE_TABLE = {
        1:  [86.3, 87.8, 89.2, 90.7, 92.2, 93.9, 95.5, 97.8, 100],
        2:  [85.0, 86.3, 87.8, 89.2, 90.7, 92.2, 93.9, 95.5, 97.8],
        3:  [83.7, 85.0, 86.3, 87.8, 89.2, 90.7, 92.2, 93.9, 95.5],
        4:  [82.4, 83.7, 85.0, 86.3, 87.8, 89.2, 90.7, 92.2, 93.9],
        5:  [81.1, 82.4, 83.7, 85.0, 86.3, 87.8, 89.2, 90.7, 92.2],
        6:  [79.9, 81.1, 82.4, 83.7, 85.0, 86.3, 87.8, 89.2, 90.7],
        7:  [78.6, 79.9, 81.1, 82.4, 83.7, 85.0, 86.3, 87.8, 89.2],
        8:  [77.4, 78.6, 79.9, 81.1, 82.4, 83.7, 85.0, 86.3, 87.8],
        9:  [76.2, 77.4, 78.6, 79.9, 81.1, 82.4, 83.7, 85.0, 86.3],
        10: [75.1, 76.2, 77.4, 78.6, 79.9, 81.1, 82.4, 83.7, 85.0],
    };

    function getRpePct(reps, rpe) {
        const clamped = Math.min(Math.max(Math.round(reps), 1), 10);
        const row = RPE_TABLE[clamped];
        if (!row) return null;
        const exactIdx = RPE_INDICES.indexOf(rpe);
        if (exactIdx !== -1) return row[exactIdx];
        for (let i = 0; i < RPE_INDICES.length - 1; i++) {
            if (rpe > RPE_INDICES[i] && rpe < RPE_INDICES[i + 1]) {
                const t = (rpe - RPE_INDICES[i]) / (RPE_INDICES[i + 1] - RPE_INDICES[i]);
                return row[i] + t * (row[i + 1] - row[i]);
            }
        }
        return null;
    }

    function calcE1RM(weight, reps, rpe) {
        const w = parseFloat(weight);
        const r = parseInt(reps, 10);
        if (!isFinite(w) || w <= 0 || !isFinite(r) || r < 1) return null;

        if (rpe !== undefined && rpe !== null && String(rpe).trim() !== "") {
            const rpeVal = parseFloat(rpe);
            if (isFinite(rpeVal) && rpeVal >= 6 && rpeVal <= 10) {
                const pct = getRpePct(r, rpeVal);
                if (pct) return w / (pct / 100);
            }
        }

        if (r === 1) return w;
        return w * (1 + r / 30); // Epley
    }

    // ─── Unit preference ───
    function getUnit() {
        return localStorage.getItem("plUnit") || "lbs";
    }

    function setUnit(unit) {
        localStorage.setItem("plUnit", unit);
        window.WorkoutApp.renderAnalytics && window.WorkoutApp.renderAnalytics();
        initTools();
    }

    function roundTo(value, step) {
        return Math.round(value / step) * step;
    }

    function unitStep() {
        return getUnit() === "kg" ? 2.5 : 5;
    }

    function barWeight() {
        return getUnit() === "kg" ? 20 : 45;
    }

    // ─── Warm-up generator ───
    function buildWarmupSets(workingWeight) {
        const step = unitStep();
        const bar = barWeight();
        const pcts = [0.4, 0.6, 0.75, 0.85];
        const repCounts = [5, 3, 2, 1];
        const sets = [{weight: bar, reps: 10, label: "Bar"}];
        pcts.forEach((pct, i) => {
            const rounded = Math.max(bar, roundTo(workingWeight * pct, step));
            if (rounded < workingWeight) {
                sets.push({weight: rounded, reps: repCounts[i], label: Math.round(pct * 100) + "%"});
            }
        });
        return sets;
    }

    // ─── Helpers ───
    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }

    function makeField(labelText, inputId, attrs) {
        const wrapper = el("div", "checkin-field");
        const lbl = el("label", null, labelText);
        lbl.htmlFor = inputId;
        const input = document.createElement("input");
        input.type = "number";
        input.id = inputId;
        Object.entries(attrs || {}).forEach(([k, v]) => (input[k] = v));
        wrapper.appendChild(lbl);
        wrapper.appendChild(input);
        return {wrapper, input};
    }

    // ─── Unit toggle (shared) ───
    function renderUnitToggle(container) {
        const row = el("div", "tool-unit-row");
        const lbl = el("span", "note", "Units: ");
        row.appendChild(lbl);
        const unit = getUnit();
        ["lbs", "kg"].forEach((u) => {
            const btn = el("button", "unit-btn" + (unit === u ? " unit-btn-active" : ""), u);
            btn.type = "button";
            btn.addEventListener("click", () => setUnit(u));
            row.appendChild(btn);
        });
        container.appendChild(row);
    }

    // ─── 1RM / RPE Calculator ───
    function renderOneRmCalc(container) {
        const card = el("section", "program-card tool-card");
        card.appendChild(el("h2", null, "1RM / RPE Calculator"));
        const desc = el("p", "note", "Enter weight and reps. Add RPE to use the Tuchscherer chart instead of Epley.");
        card.appendChild(desc);

        const unit = getUnit();
        const fields = el("div", "checkin-fields tool-inputs");
        const {wrapper: wW, input: iWeight} = makeField("Weight (" + unit + ")", "toolWeight", {min: 0, step: 2.5, placeholder: "315"});
        const {wrapper: wR, input: iReps}   = makeField("Reps (1–10)", "toolReps", {min: 1, max: 10, step: 1, placeholder: "3"});
        const {wrapper: wRpe, input: iRpe}  = makeField("RPE (optional)", "toolRpe", {min: 6, max: 10, step: 0.5, placeholder: "8.5"});
        fields.appendChild(wW);
        fields.appendChild(wR);
        fields.appendChild(wRpe);
        card.appendChild(fields);

        const result = el("div", "tool-result");
        result.id = "oneRmResult";
        result.style.display = "none";
        card.appendChild(result);

        function calculate() {
            const w = parseFloat(iWeight.value);
            const r = parseInt(iReps.value, 10);
            result.style.display = "none";
            if (!isFinite(w) || w <= 0 || !isFinite(r) || r < 1 || r > 10) return;

            const u = getUnit();
            const epley = r === 1 ? w : w * (1 + r / 30);
            const brzycki = r === 1 ? w : w * 36 / (37 - r);
            let rpeLabel = "—";
            const rpeVal = parseFloat(iRpe.value);
            if (isFinite(rpeVal) && rpeVal >= 6 && rpeVal <= 10) {
                const pct = getRpePct(r, rpeVal);
                if (pct) rpeLabel = Math.round(w / (pct / 100)) + " " + u;
            }

            result.innerHTML =
                "<div class='tool-result-grid'>" +
                "<div class='tool-result-item'><span class='note'>Epley</span><strong>" + Math.round(epley) + " " + u + "</strong></div>" +
                "<div class='tool-result-item'><span class='note'>Brzycki</span><strong>" + Math.round(brzycki) + " " + u + "</strong></div>" +
                "<div class='tool-result-item'><span class='note'>RPE-based</span><strong>" + rpeLabel + "</strong></div>" +
                "</div>";
            result.style.display = "block";
        }

        card.addEventListener("input", calculate);
        container.appendChild(card);
    }

    // ─── Meet Attempt Planner ───
    function renderAttemptPlanner(container) {
        const card = el("section", "program-card tool-card");
        card.appendChild(el("h2", null, "Meet Attempt Planner"));
        card.appendChild(el("p", "note", "Enter planned openers to see suggested 2nd and 3rd attempts."));

        const unit = getUnit();
        const step = unitStep();
        const lifts = [
            {name: "Squat",      id: "attemptSquat",  placeholder: "500"},
            {name: "Bench Press",id: "attemptBench",  placeholder: "300"},
            {name: "Deadlift",   id: "attemptDead",   placeholder: "550"},
        ];

        const fields = el("div", "checkin-fields attempt-inputs");
        const inputs = {};
        lifts.forEach((lift) => {
            const {wrapper, input} = makeField(lift.name + " opener (" + unit + ")", lift.id, {min: 0, step: 2.5, placeholder: lift.placeholder});
            inputs[lift.id] = input;
            fields.appendChild(wrapper);
        });
        card.appendChild(fields);

        const resultEl = el("div", "attempt-result");
        resultEl.style.display = "none";
        card.appendChild(resultEl);

        card.addEventListener("input", () => {
            const rows = lifts.map((lift) => {
                const v = parseFloat(inputs[lift.id].value);
                if (!isFinite(v) || v <= 0) return null;
                const opener = roundTo(v, step);
                return {
                    name: lift.name,
                    opener,
                    s2: roundTo(opener * 1.025, step),
                    s2a: roundTo(opener * 1.05, step),
                    s3: roundTo(opener * 1.075, step),
                    s3a: roundTo(opener * 1.10, step),
                };
            });

            const valid = rows.filter(Boolean);
            if (!valid.length) { resultEl.style.display = "none"; return; }

            const totOpener = valid.reduce((s, r) => s + r.opener, 0);
            const totGood   = valid.reduce((s, r) => s + r.s2, 0);
            const totPr     = valid.reduce((s, r) => s + r.s3, 0);

            let html = "<div class='attempt-table-wrap'>" +
                "<table class='exercise-table'><thead><tr>" +
                "<th>Lift</th><th>Opener</th>" +
                "<th>2nd<br><span class='note'>+2.5%</span></th>" +
                "<th>2nd<br><span class='note'>+5%</span></th>" +
                "<th>3rd<br><span class='note'>+7.5%</span></th>" +
                "<th>3rd<br><span class='note'>+10%</span></th>" +
                "</tr></thead><tbody>";
            valid.forEach((r) => {
                html += "<tr><td>" + r.name + "</td><td><strong>" + r.opener + "</strong></td>" +
                    "<td>" + r.s2 + "</td><td>" + r.s2a + "</td>" +
                    "<td>" + r.s3 + "</td><td>" + r.s3a + "</td></tr>";
            });
            html += "</tbody></table></div>" +
                "<div class='attempt-totals'>" +
                "<div class='analytics-pill'><span class='note'>Total at openers</span><strong>" + totOpener + " " + unit + "</strong></div>" +
                "<div class='analytics-pill'><span class='note'>Total (+2.5% 2nds)</span><strong>" + totGood + " " + unit + "</strong></div>" +
                "<div class='analytics-pill'><span class='note'>Total (+7.5% 3rds)</span><strong>" + totPr + " " + unit + "</strong></div>" +
                "</div>";

            resultEl.innerHTML = html;
            resultEl.style.display = "block";
        });

        container.appendChild(card);
    }

    // ─── Warm-up Generator ───
    function renderWarmupGen(container) {
        const card = el("section", "program-card tool-card");
        card.appendChild(el("h2", null, "Warm-up Set Generator"));
        card.appendChild(el("p", "note", "Enter your working weight to get a standard warm-up ladder (bar, 40%, 60%, 75%, 85%)."));

        const unit = getUnit();
        const {wrapper, input} = makeField("Working weight (" + unit + ")", "warmupWeight", {min: 0, step: 5, placeholder: "405"});
        card.appendChild(wrapper);

        const resultEl = el("div", "warmup-result");
        resultEl.style.display = "none";
        card.appendChild(resultEl);

        card.addEventListener("input", () => {
            const v = parseFloat(input.value);
            if (!isFinite(v) || v <= 0) { resultEl.style.display = "none"; return; }

            const u = getUnit();
            const sets = buildWarmupSets(v);
            const working = roundTo(v, unitStep());

            let html = "<div class='warmup-sets'>";
            sets.forEach((s) => {
                html += "<div class='warmup-set'>" +
                    "<span class='warmup-label note'>" + s.label + "</span>" +
                    "<strong class='warmup-weight'>" + s.weight + " " + u + "</strong>" +
                    "<span class='warmup-reps note'>× " + s.reps + "</span></div>";
            });
            html += "<div class='warmup-set warmup-working'>" +
                "<span class='warmup-label note'>Working</span>" +
                "<strong class='warmup-weight'>" + working + " " + u + "</strong>" +
                "<span class='warmup-reps note'>× target</span></div>";
            html += "</div>";

            resultEl.innerHTML = html;
            resultEl.style.display = "block";
        });

        container.appendChild(card);
    }

    // ─── Init ───
    function initTools() {
        const container = document.getElementById("toolsContent");
        if (!container) return;
        container.innerHTML = "";
        renderUnitToggle(container);
        renderOneRmCalc(container);
        renderAttemptPlanner(container);
        renderWarmupGen(container);
    }

    window.WorkoutApp.initTools = initTools;
    window.WorkoutApp.calcE1RM = calcE1RM;
    window.WorkoutApp.getPlUnit = getUnit;
})();
