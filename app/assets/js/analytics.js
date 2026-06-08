(function () {
    const liftConfig = [
        {key: "Squat",      label: "Back Squat",  color: "#1f7ae0", matchers: ["back squat", "squat (5/3/1)", "squat"]},
        {key: "Bench Press",label: "Bench Press", color: "#0f9d7a", matchers: ["bench press", "bench (5/3/1)", "bench"]},
        {key: "Deadlift",   label: "Deadlift",    color: "#d65c2e", matchers: ["deadlift (5/3/1)", "deadlift"]},
    ];

    const volumePalette = ["#1f7ae0", "#0f9d7a", "#d65c2e", "#8f4ad0", "#cc8b00", "#d1437b"];

    // ─── Helpers ───
    function normalizeText(v) { return String(v || "").trim().toLowerCase(); }

    function parseNumber(value) {
        if (typeof value === "number") return Number.isFinite(value) ? value : null;
        if (typeof value === "string") {
            const n = Number(value.trim());
            return Number.isFinite(n) ? n : null;
        }
        return null;
    }

    function getTopSet(exercise) {
        if (!exercise || !Array.isArray(exercise.sets) || !exercise.sets.length) return null;
        return exercise.sets[exercise.sets.length - 1];
    }

    function getSeriesValue(obj, keys) {
        if (!obj) return null;
        for (const key of keys) {
            const v = parseNumber(obj[key]);
            if (v !== null) return v;
        }
        return null;
    }

    function findExerciseByMatchers(exercises, matchers) {
        const exact = exercises.find((e) => matchers.some((m) => normalizeText(e.name) === m));
        if (exact) return exact;
        const starts = exercises.find((e) => matchers.some((m) => normalizeText(e.name).startsWith(m)));
        if (starts) return starts;
        return exercises.find((e) => matchers.some((m) => normalizeText(e.name).indexOf(m) !== -1)) || null;
    }

    function getExercisesFromProgram(program) {
        const days = program && program.json_data && Array.isArray(program.json_data.days) ? program.json_data.days : [];
        return days.flatMap((d) => Array.isArray(d.exercises) ? d.exercises : []);
    }

    function getUnit() {
        return (window.WorkoutApp.getPlUnit && window.WorkoutApp.getPlUnit()) ||
               localStorage.getItem("plUnit") || "lbs";
    }

    function getGender() {
        return localStorage.getItem("plGender") || "male";
    }

    // ─── Wilks formula ───
    function calcWilks(totalKg, bwKg, gender) {
        const W = bwKg;
        let a, b, c, d, e, f;
        if (gender === "female") {
            a = 594.31747775582; b = -27.23842536447; c = 0.82112226871;
            d = -0.00930733913;  e = 0.00004731582;   f = -0.000000009054;
        } else {
            a = -216.0475144; b = 16.2606339; c = -0.002388645;
            d = -0.00113732;  e = 7.01863e-6; f = -1.291e-8;
        }
        const denom = a + b*W + c*W*W + d*W*W*W + e*W*W*W*W + f*W*W*W*W*W;
        if (denom <= 0) return null;
        return totalKg * (500 / denom);
    }

    // ─── Series builders ───
    function getMainLiftProgress(program) {
        const exercises = getExercisesFromProgram(program);
        return liftConfig.map((lift) => {
            const exercise = findExerciseByMatchers(exercises, lift.matchers);
            const topSet = getTopSet(exercise);
            return {
                key: lift.key, label: lift.label, color: lift.color,
                value: getSeriesValue(topSet, ["actual_weight", "prescribed_weight", "weight"]),
            };
        });
    }

    function getDayVolumes(program) {
        const days = program && program.json_data && Array.isArray(program.json_data.days) ? program.json_data.days : [];
        return days.map((day, index) => {
            let total = 0;
            (Array.isArray(day.exercises) ? day.exercises : []).forEach((exercise) => {
                (Array.isArray(exercise.sets) ? exercise.sets : []).forEach((setItem) => {
                    const weight = getSeriesValue(setItem, ["actual_weight", "prescribed_weight", "weight"]);
                    const reps   = getSeriesValue(setItem, ["reps", "actual_reps", "target_reps"]);
                    if (weight !== null && reps !== null) total += weight * reps;
                });
            });
            return {
                key: String(index),
                label: day.day || "Day " + (index + 1),
                color: volumePalette[index % volumePalette.length],
                value: total || null,
            };
        });
    }

    function getAvgRpeSeries(programs) {
        const points = programs.map((program) => {
            const rpeValues = [];
            getExercisesFromProgram(program).forEach((ex) => {
                (ex.sets || []).forEach((set) => {
                    const rpe = parseNumber(set.RPE);
                    if (rpe !== null) rpeValues.push(rpe);
                });
            });
            const avg = rpeValues.length ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : null;
            return {x: program.week, y: avg !== null ? Math.round(avg * 10) / 10 : null};
        }).filter((p) => p.y !== null);
        return [{key: "avg_rpe", label: "Avg RPE", color: "#cc8b00", points}];
    }

    function getBodyweightSeries(checkIns) {
        const points = (checkIns || []).map((ci) => {
            const data = ci.json_data || {};
            const weekNum = parseNumber(data.week_number) || parseNumber(ci.week);
            const bw = parseNumber(data.bodyweight);
            return weekNum !== null && bw !== null ? {x: weekNum, y: bw} : null;
        }).filter(Boolean);
        return [{key: "bodyweight", label: "Bodyweight", color: "#8f4ad0", points}];
    }

    function getSbdTotalSeries(programs) {
        const unit = getUnit();
        const points = programs.map((program) => {
            const exercises = getExercisesFromProgram(program);
            const s = getSeriesValue(getTopSet(findExerciseByMatchers(exercises, liftConfig[0].matchers)), ["actual_weight", "prescribed_weight"]);
            const b = getSeriesValue(getTopSet(findExerciseByMatchers(exercises, liftConfig[1].matchers)), ["actual_weight", "prescribed_weight"]);
            const d = getSeriesValue(getTopSet(findExerciseByMatchers(exercises, liftConfig[2].matchers)), ["actual_weight", "prescribed_weight"]);
            if (s === null || b === null || d === null) return null;
            return {x: program.week, y: s + b + d};
        }).filter(Boolean);
        return [{key: "sbd_total", label: "SBD Total (" + unit + ")", color: "#d1437b", points}];
    }

    function getWilksSeries(programs, checkIns) {
        const unit = getUnit();
        const gender = getGender();
        const checkInMap = {};
        (checkIns || []).forEach((ci) => {
            const week = parseNumber((ci.json_data || {}).week_number) || parseNumber(ci.week);
            if (week !== null) checkInMap[week] = ci.json_data || {};
        });

        const points = programs.map((program) => {
            const ci = checkInMap[program.week];
            if (!ci) return null;
            const bwRaw = parseNumber(ci.bodyweight);
            if (bwRaw === null) return null;
            const bwKg = unit === "lbs" ? bwRaw / 2.2046 : bwRaw;

            const exercises = getExercisesFromProgram(program);
            const s = getSeriesValue(getTopSet(findExerciseByMatchers(exercises, liftConfig[0].matchers)), ["actual_weight", "prescribed_weight"]);
            const b = getSeriesValue(getTopSet(findExerciseByMatchers(exercises, liftConfig[1].matchers)), ["actual_weight", "prescribed_weight"]);
            const d = getSeriesValue(getTopSet(findExerciseByMatchers(exercises, liftConfig[2].matchers)), ["actual_weight", "prescribed_weight"]);
            if (s === null || b === null || d === null) return null;

            const totalKg = unit === "lbs" ? (s + b + d) / 2.2046 : (s + b + d);
            const wilks = calcWilks(totalKg, bwKg, gender);
            return wilks !== null ? {x: program.week, y: Math.round(wilks * 10) / 10} : null;
        }).filter(Boolean);

        return [{key: "wilks", label: "Wilks Score", color: "#d65c2e", points}];
    }

    // ─── Analytics data ───
    function buildAnalyticsData(programs, checkIns) {
        const sorted = [...programs].sort((a, b) => a.week - b.week);
        const allDayLabels = [];
        sorted.forEach((p) => {
            (p.json_data && Array.isArray(p.json_data.days) ? p.json_data.days : []).forEach((day) => {
                const label = day.day || "Day";
                if (!allDayLabels.includes(label)) allDayLabels.push(label);
            });
        });

        const liftSeriesMap = {};
        liftConfig.forEach((lift) => { liftSeriesMap[lift.key] = {key: lift.key, label: lift.label, color: lift.color, points: []}; });

        const daySeriesMap = {};
        allDayLabels.forEach((label, index) => {
            daySeriesMap[label] = {key: label, label, color: volumePalette[index % volumePalette.length], points: []};
        });

        sorted.forEach((program) => {
            const week = program.week;
            getMainLiftProgress(program).forEach((lift) => { liftSeriesMap[lift.key].points.push({x: week, y: lift.value}); });
            const volumeEntries = getDayVolumes(program);
            allDayLabels.forEach((label) => {
                const entry = volumeEntries.find((e) => e.label === label);
                daySeriesMap[label].points.push({x: week, y: entry ? entry.value : null});
            });
        });

        const weekRange = sorted.length
            ? "Week " + sorted[0].week + " — Week " + sorted[sorted.length - 1].week
            : "No data";

        return {
            totalPrograms: sorted.length,
            weekRange,
            checkInCount: (checkIns || []).length,
            liftSeries: Object.values(liftSeriesMap),
            daySeries: Object.values(daySeriesMap),
            rpeSeries: getAvgRpeSeries(sorted),
            bodyweightSeries: getBodyweightSeries(checkIns),
            sbdSeries: getSbdTotalSeries(sorted),
            wilksSeries: getWilksSeries(sorted, checkIns),
        };
    }

    // ─── Render helpers ───
    function renderLegend(containerId, series) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";
        series.forEach((entry) => {
            const item = document.createElement("span");
            item.className = "chart-legend-item";
            const swatch = document.createElement("span");
            swatch.className = "chart-legend-swatch";
            swatch.style.backgroundColor = entry.color;
            item.appendChild(swatch);
            const lbl = document.createElement("span");
            lbl.textContent = entry.label;
            item.appendChild(lbl);
            container.appendChild(item);
        });
    }

    function renderSummary(totalPrograms, weekRange, checkInCount) {
        const container = document.getElementById("analyticsSummary");
        if (!container) return;
        container.innerHTML = "";
        [{label: "Saved Weeks", value: String(totalPrograms)}, {label: "Tracked Range", value: weekRange}, {label: "Check-Ins", value: String(checkInCount)}].forEach((item) => {
            const pill = document.createElement("div");
            pill.className = "analytics-pill";
            pill.innerHTML = "<span class=\"note\">" + item.label + "</span><strong>" + item.value + "</strong>";
            container.appendChild(pill);
        });
    }

    function renderChart(containerId, series, yAxisLabel) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const allPoints = series.flatMap((entry) => entry.points.filter((p) => p.y !== null));
        if (!allPoints.length) {
            container.innerHTML = "<div class=\"chart-empty\">Add more data to see this chart.</div>";
            return;
        }

        const width = 760, height = 320;
        const pad = {top: 24, right: 24, bottom: 48, left: 60};
        const xValues = [...new Set(allPoints.map((p) => p.x))].sort((a, b) => a - b);
        const yMax = Math.max(...allPoints.map((p) => p.y));
        const yTop = yMax === 0 ? 1 : Math.ceil(yMax * 1.1);
        const plotW = width - pad.left - pad.right;
        const plotH = height - pad.top - pad.bottom;

        function xScale(v) {
            if (xValues.length === 1) return pad.left + plotW / 2;
            return pad.left + (xValues.indexOf(v) / (xValues.length - 1)) * plotW;
        }
        function yScale(v) { return pad.top + plotH - (v / yTop) * plotH; }

        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("viewBox", "0 0 " + width + " " + height);
        svg.setAttribute("class", "chart-svg");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", yAxisLabel + " line chart");

        for (let tick = 0; tick <= 4; tick++) {
            const value = (yTop / 4) * tick;
            const y = yScale(value);
            const grid = document.createElementNS(ns, "line");
            grid.setAttribute("x1", pad.left); grid.setAttribute("x2", width - pad.right);
            grid.setAttribute("y1", y); grid.setAttribute("y2", y);
            grid.setAttribute("class", "chart-grid-line");
            svg.appendChild(grid);
            const lbl = document.createElementNS(ns, "text");
            lbl.setAttribute("x", pad.left - 10); lbl.setAttribute("y", y + 4);
            lbl.setAttribute("text-anchor", "end"); lbl.setAttribute("class", "chart-label");
            lbl.textContent = Math.round(value).toString();
            svg.appendChild(lbl);
        }

        const xAxis = document.createElementNS(ns, "line");
        xAxis.setAttribute("x1", pad.left); xAxis.setAttribute("x2", width - pad.right);
        xAxis.setAttribute("y1", height - pad.bottom); xAxis.setAttribute("y2", height - pad.bottom);
        xAxis.setAttribute("class", "chart-axis-line");
        svg.appendChild(xAxis);

        const yAxis = document.createElementNS(ns, "line");
        yAxis.setAttribute("x1", pad.left); yAxis.setAttribute("x2", pad.left);
        yAxis.setAttribute("y1", pad.top); yAxis.setAttribute("y2", height - pad.bottom);
        yAxis.setAttribute("class", "chart-axis-line");
        svg.appendChild(yAxis);

        xValues.forEach((week) => {
            const lbl = document.createElementNS(ns, "text");
            lbl.setAttribute("x", xScale(week)); lbl.setAttribute("y", height - pad.bottom + 22);
            lbl.setAttribute("text-anchor", "middle"); lbl.setAttribute("class", "chart-label");
            lbl.textContent = "W" + week;
            svg.appendChild(lbl);
        });

        const title = document.createElementNS(ns, "text");
        title.setAttribute("x", pad.left); title.setAttribute("y", 16);
        title.setAttribute("class", "chart-title");
        title.textContent = yAxisLabel;
        svg.appendChild(title);

        series.forEach((entry) => {
            const visible = entry.points.filter((p) => p.y !== null);
            if (!visible.length) return;
            const path = document.createElementNS(ns, "path");
            path.setAttribute("d", visible.map((p, i) => (i === 0 ? "M" : "L") + xScale(p.x) + " " + yScale(p.y)).join(" "));
            path.setAttribute("stroke", entry.color);
            path.setAttribute("class", "chart-line");
            svg.appendChild(path);

            visible.forEach((point) => {
                const g = document.createElementNS(ns, "g");
                g.setAttribute("class", "chart-point-group");
                const tip = document.createElementNS(ns, "title");
                tip.textContent = entry.label + " | Week " + point.x + " | " + (Number.isInteger(point.y) ? point.y : point.y.toFixed(1));
                g.appendChild(tip);
                const hit = document.createElementNS(ns, "circle");
                hit.setAttribute("cx", xScale(point.x)); hit.setAttribute("cy", yScale(point.y));
                hit.setAttribute("r", 12); hit.setAttribute("fill", "transparent"); hit.setAttribute("class", "chart-point-hit");
                g.appendChild(hit);
                const dot = document.createElementNS(ns, "circle");
                dot.setAttribute("cx", xScale(point.x)); dot.setAttribute("cy", yScale(point.y));
                dot.setAttribute("r", 4); dot.setAttribute("fill", entry.color); dot.setAttribute("class", "chart-point");
                g.appendChild(dot);
                svg.appendChild(g);
            });
        });

        container.innerHTML = "";
        container.appendChild(svg);
    }

    // ─── Settings toggles ───
    function initAnalyticsSettings() {
        const unit = getUnit();
        const gender = getGender();

        const unitBtns = document.querySelectorAll("[data-analytics-unit]");
        unitBtns.forEach((btn) => {
            btn.className = "unit-btn" + (btn.dataset.analyticsUnit === unit ? " unit-btn-active" : "");
            btn.addEventListener("click", () => {
                localStorage.setItem("plUnit", btn.dataset.analyticsUnit);
                initAnalyticsSettings();
                renderAnalytics();
                if (window.WorkoutApp.initTools) window.WorkoutApp.initTools();
            });
        });

        const genderBtns = document.querySelectorAll("[data-analytics-gender]");
        genderBtns.forEach((btn) => {
            btn.className = "unit-btn" + (btn.dataset.analyticsGender === gender ? " unit-btn-active" : "");
            btn.addEventListener("click", () => {
                localStorage.setItem("plGender", btn.dataset.analyticsGender);
                initAnalyticsSettings();
                renderAnalytics();
            });
        });
    }

    function renderAnalytics() {
        const programs = window.WorkoutApp.programs || [];
        const checkIns = window.WorkoutApp.checkIns || [];
        const unit = getUnit();

        const data = buildAnalyticsData(programs, checkIns);
        renderSummary(data.totalPrograms, data.weekRange, data.checkInCount);

        renderLegend("analyticsLiftLegend", data.liftSeries);
        renderChart("liftProgressChart", data.liftSeries, "Top Set Weight (" + unit + ")");

        renderLegend("analyticsSbdLegend", data.sbdSeries);
        renderChart("sbdTotalChart", data.sbdSeries, "SBD Total (" + unit + ")");

        renderLegend("analyticsWilksLegend", data.wilksSeries);
        renderChart("wilksChart", data.wilksSeries, "Wilks Score");

        renderLegend("analyticsVolumeLegend", data.daySeries);
        renderChart("dayVolumeChart", data.daySeries, "Daily Volume (" + unit + " × reps)");

        renderLegend("analyticsRpeLegend", data.rpeSeries);
        renderChart("rpeChart", data.rpeSeries, "Average RPE");

        renderLegend("analyticsBodyweightLegend", data.bodyweightSeries);
        renderChart("bodyweightChart", data.bodyweightSeries, "Bodyweight (" + unit + ")");
    }

    function initAnalytics() {
        initAnalyticsSettings();
        renderAnalytics();
    }

    window.WorkoutApp.onProgramsLoaded = async function () {
        try {
            const res = await fetch("/check-ins/");
            window.WorkoutApp.checkIns = res.ok ? await res.json() : [];
        } catch {
            window.WorkoutApp.checkIns = [];
        }
        if (typeof window.WorkoutApp.populateCheckInWeeks === "function") {
            window.WorkoutApp.populateCheckInWeeks();
        }
        renderAnalytics();
    };

    window.WorkoutApp.initAnalytics = initAnalytics;
    window.WorkoutApp.renderAnalytics = renderAnalytics;
})();
