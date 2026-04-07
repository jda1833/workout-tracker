(function () {
    const liftConfig = [
        {key: "Squat", label: "Back Squat", color: "#1f7ae0", matchers: ["back squat", "squat (5/3/1)"]},
        {key: "Bench Press", label: "Bench Press", color: "#0f9d7a", matchers: ["bench press", "bench (5/3/1)"]},
        {key: "Deadlift", label: "Deadlift", color: "#d65c2e", matchers: ["deadlift (5/3/1)", "deadlift"]},
    ];

    const volumePalette = ["#1f7ae0", "#0f9d7a", "#d65c2e", "#8f4ad0", "#cc8b00", "#d1437b"];

    function normalizeText(value) {
        return String(value || "").trim().toLowerCase();
    }

    function parseNumber(value) {
        if (typeof value === "number") {
            return Number.isFinite(value) ? value : null;
        }

        if (typeof value === "string") {
            const cleaned = value.trim();
            if (!cleaned) {
                return null;
            }
            const parsed = Number(cleaned);
            return Number.isFinite(parsed) ? parsed : null;
        }

        return null;
    }

    function getTopSet(exercise) {
        if (!exercise || !Array.isArray(exercise.sets) || !exercise.sets.length) {
            return null;
        }
        return exercise.sets[exercise.sets.length - 1];
    }

    function getSeriesValue(obj, keys) {
        if (!obj) {
            return null;
        }

        for (const key of keys) {
            const parsed = parseNumber(obj[key]);
            if (parsed !== null) {
                return parsed;
            }
        }

        return null;
    }

    function findExerciseByMatchers(exercises, matchers) {
        const exactMatch = exercises.find((entry) => {
            const name = normalizeText(entry.name);
            return matchers.some((matcher) => name === matcher);
        });

        if (exactMatch) {
            return exactMatch;
        }

        const startsWithMatch = exercises.find((entry) => {
            const name = normalizeText(entry.name);
            return matchers.some((matcher) => name.startsWith(matcher));
        });

        if (startsWithMatch) {
            return startsWithMatch;
        }

        return exercises.find((entry) => {
            const name = normalizeText(entry.name);
            return matchers.some((matcher) => name.indexOf(matcher) !== -1);
        }) || null;
    }

    function getMainLiftProgress(program) {
        const days = program && program.json_data && Array.isArray(program.json_data.days) ? program.json_data.days : [];
        const exercises = days.flatMap((day) => Array.isArray(day.exercises) ? day.exercises : []);

        return liftConfig.map((lift) => {
            const exercise = findExerciseByMatchers(exercises, lift.matchers);
            const topSet = getTopSet(exercise);
            return {
                key: lift.key,
                label: lift.label,
                color: lift.color,
                value: getSeriesValue(topSet, ["actual_weight", "prescribed_weight", "weight"]),
            };
        });
    }

    function getDayVolumes(program) {
        const days = program && program.json_data && Array.isArray(program.json_data.days) ? program.json_data.days : [];
        return days.map((day, index) => {
            const exercises = Array.isArray(day.exercises) ? day.exercises : [];
            let total = 0;

            exercises.forEach((exercise) => {
                const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
                sets.forEach((setItem) => {
                    const weight = getSeriesValue(setItem, ["actual_weight", "prescribed_weight", "weight"]);
                    const reps = getSeriesValue(setItem, ["reps", "actual_reps", "target_reps"]);
                    if (weight !== null && reps !== null) {
                        total += weight * reps;
                    }
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

    function buildAnalyticsData(programs) {
        const sortedPrograms = [...programs].sort((a, b) => a.week - b.week);
        const allDayLabels = [];

        sortedPrograms.forEach((program) => {
            const days = program && program.json_data && Array.isArray(program.json_data.days) ? program.json_data.days : [];
            days.forEach((day) => {
                const label = day.day || "Day";
                if (!allDayLabels.includes(label)) {
                    allDayLabels.push(label);
                }
            });
        });

        const liftSeriesMap = {};
        liftConfig.forEach((lift) => {
            liftSeriesMap[lift.key] = {
                key: lift.key,
                label: lift.label,
                color: lift.color,
                points: [],
            };
        });

        const daySeriesMap = {};
        allDayLabels.forEach((label, index) => {
            daySeriesMap[label] = {
                key: label,
                label: label,
                color: volumePalette[index % volumePalette.length],
                points: [],
            };
        });

        sortedPrograms.forEach((program) => {
            const week = program.week;
            getMainLiftProgress(program).forEach((lift) => {
                liftSeriesMap[lift.key].points.push({x: week, y: lift.value});
            });

            const volumeEntries = getDayVolumes(program);
            allDayLabels.forEach((label) => {
                const dayEntry = volumeEntries.find((entry) => entry.label === label);
                daySeriesMap[label].points.push({x: week, y: dayEntry ? dayEntry.value : null});
            });
        });

        return {
            totalPrograms: sortedPrograms.length,
            weekRange: sortedPrograms.length ? "Week " + sortedPrograms[0].week + " to Week " + sortedPrograms[sortedPrograms.length - 1].week : "No data",
            liftSeries: Object.values(liftSeriesMap),
            daySeries: Object.values(daySeriesMap),
        };
    }

    function renderLegend(containerId, series) {
        const container = document.getElementById(containerId);
        if (!container) {
            return;
        }

        container.innerHTML = "";
        series.forEach((entry) => {
            const item = document.createElement("span");
            item.className = "chart-legend-item";

            const swatch = document.createElement("span");
            swatch.className = "chart-legend-swatch";
            swatch.style.backgroundColor = entry.color;
            item.appendChild(swatch);

            const label = document.createElement("span");
            label.textContent = entry.label;
            item.appendChild(label);
            container.appendChild(item);
        });
    }

    function renderSummary(totalPrograms, weekRange) {
        const container = document.getElementById("analyticsSummary");
        if (!container) {
            return;
        }

        container.innerHTML = "";
        [
            {label: "Saved Weeks", value: String(totalPrograms)},
            {label: "Tracked Range", value: weekRange},
        ].forEach((item) => {
            const pill = document.createElement("div");
            pill.className = "analytics-pill";
            pill.innerHTML = "<span class=\"note\">" + item.label + "</span><strong>" + item.value + "</strong>";
            container.appendChild(pill);
        });
    }

    function renderChart(containerId, series, yAxisLabel) {
        const container = document.getElementById(containerId);
        if (!container) {
            return;
        }

        const allPoints = series.flatMap((entry) => entry.points.filter((point) => point.y !== null));
        if (!allPoints.length) {
            container.innerHTML = "<div class=\"chart-empty\">Add more saved weeks with completed data to see this chart.</div>";
            return;
        }

        const width = 760;
        const height = 320;
        const padding = {top: 24, right: 24, bottom: 48, left: 60};
        const xValues = [...new Set(allPoints.map((point) => point.x))].sort((a, b) => a - b);
        const yMax = Math.max(...allPoints.map((point) => point.y));
        const yTop = yMax === 0 ? 1 : Math.ceil(yMax * 1.1);
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;

        function xScale(value) {
            if (xValues.length === 1) {
                return padding.left + plotWidth / 2;
            }
            const index = xValues.indexOf(value);
            return padding.left + (index / (xValues.length - 1)) * plotWidth;
        }

        function yScale(value) {
            return padding.top + plotHeight - (value / yTop) * plotHeight;
        }

        const yTicks = 4;
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("viewBox", "0 0 " + width + " " + height);
        svg.setAttribute("class", "chart-svg");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", yAxisLabel + " line chart");

        for (let tick = 0; tick <= yTicks; tick += 1) {
            const value = (yTop / yTicks) * tick;
            const y = yScale(value);

            const grid = document.createElementNS(ns, "line");
            grid.setAttribute("x1", padding.left);
            grid.setAttribute("x2", width - padding.right);
            grid.setAttribute("y1", y);
            grid.setAttribute("y2", y);
            grid.setAttribute("class", "chart-grid-line");
            svg.appendChild(grid);

            const label = document.createElementNS(ns, "text");
            label.setAttribute("x", padding.left - 10);
            label.setAttribute("y", y + 4);
            label.setAttribute("text-anchor", "end");
            label.setAttribute("class", "chart-label");
            label.textContent = Math.round(value).toString();
            svg.appendChild(label);
        }

        const xAxis = document.createElementNS(ns, "line");
        xAxis.setAttribute("x1", padding.left);
        xAxis.setAttribute("x2", width - padding.right);
        xAxis.setAttribute("y1", height - padding.bottom);
        xAxis.setAttribute("y2", height - padding.bottom);
        xAxis.setAttribute("class", "chart-axis-line");
        svg.appendChild(xAxis);

        const yAxis = document.createElementNS(ns, "line");
        yAxis.setAttribute("x1", padding.left);
        yAxis.setAttribute("x2", padding.left);
        yAxis.setAttribute("y1", padding.top);
        yAxis.setAttribute("y2", height - padding.bottom);
        yAxis.setAttribute("class", "chart-axis-line");
        svg.appendChild(yAxis);

        xValues.forEach((week) => {
            const x = xScale(week);

            const label = document.createElementNS(ns, "text");
            label.setAttribute("x", x);
            label.setAttribute("y", height - padding.bottom + 22);
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("class", "chart-label");
            label.textContent = "W" + week;
            svg.appendChild(label);
        });

        const title = document.createElementNS(ns, "text");
        title.setAttribute("x", padding.left);
        title.setAttribute("y", 16);
        title.setAttribute("class", "chart-title");
        title.textContent = yAxisLabel;
        svg.appendChild(title);

        function formatValue(value) {
            return Number.isInteger(value) ? String(value) : value.toFixed(1);
        }

        series.forEach((entry) => {
            const visiblePoints = entry.points.filter((point) => point.y !== null);
            if (!visiblePoints.length) {
                return;
            }

            const path = document.createElementNS(ns, "path");
            const pathData = visiblePoints.map((point, index) => {
                const prefix = index === 0 ? "M" : "L";
                return prefix + xScale(point.x) + " " + yScale(point.y);
            }).join(" ");
            path.setAttribute("d", pathData);
            path.setAttribute("stroke", entry.color);
            path.setAttribute("class", "chart-line");
            svg.appendChild(path);

            visiblePoints.forEach((point) => {
                const pointGroup = document.createElementNS(ns, "g");
                pointGroup.setAttribute("class", "chart-point-group");

                const tooltip = document.createElementNS(ns, "title");
                tooltip.textContent = entry.label + " | Week " + point.x + " | " + formatValue(point.y);
                pointGroup.appendChild(tooltip);

                const hitArea = document.createElementNS(ns, "circle");
                hitArea.setAttribute("cx", xScale(point.x));
                hitArea.setAttribute("cy", yScale(point.y));
                hitArea.setAttribute("r", 12);
                hitArea.setAttribute("fill", "transparent");
                hitArea.setAttribute("class", "chart-point-hit");
                pointGroup.appendChild(hitArea);

                const circle = document.createElementNS(ns, "circle");
                circle.setAttribute("cx", xScale(point.x));
                circle.setAttribute("cy", yScale(point.y));
                circle.setAttribute("r", 4);
                circle.setAttribute("fill", entry.color);
                circle.setAttribute("class", "chart-point");
                pointGroup.appendChild(circle);

                svg.appendChild(pointGroup);
            });
        });

        container.innerHTML = "";
        container.appendChild(svg);
    }

    function renderAnalytics() {
        const data = buildAnalyticsData(window.WorkoutApp.programs || []);
        renderSummary(data.totalPrograms, data.weekRange);
        renderLegend("analyticsLiftLegend", data.liftSeries);
        renderLegend("analyticsVolumeLegend", data.daySeries);
        renderChart("liftProgressChart", data.liftSeries, "Top Set Weight");
        renderChart("dayVolumeChart", data.daySeries, "Total Day Volume");
    }

    function initAnalytics() {
        renderAnalytics();
    }

    window.WorkoutApp.onProgramsLoaded = function () {
        if (typeof window.WorkoutApp.populateCheckInWeeks === "function") {
            window.WorkoutApp.populateCheckInWeeks();
        }
        renderAnalytics();
    };

    window.WorkoutApp.initAnalytics = initAnalytics;
    window.WorkoutApp.renderAnalytics = renderAnalytics;
})();
