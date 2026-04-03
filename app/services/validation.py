def validate_program_payload(data: dict):
    errors = []

    if not isinstance(data, dict):
        errors.append("JSON root must be an object.")
        return errors

    if not isinstance(data.get("week"), int):
        errors.append("'week' must be an integer.")

    if not isinstance(data.get("week_type"), str):
        errors.append("'week_type' must be a string.")

    if not isinstance(data.get("amrap_rule"), str):
        errors.append("'amrap_rule' must be a string.")

    training_maxes = data.get("training_maxes")
    if not isinstance(training_maxes, dict):
        errors.append("'training_maxes' must be an object.")
    else:
        for key in ("squat", "bench", "deadlift", "overhead_press"):
            if not isinstance(training_maxes.get(key), (int, float)):
                errors.append(f"'training_maxes.{key}' must be a number.")

    days = data.get("days")
    if not isinstance(days, list) or len(days) == 0:
        errors.append("'days' must be a non-empty array.")
    else:
        for i, day in enumerate(days):
            if not isinstance(day, dict):
                errors.append(f"'days[{i}]' must be an object.")
                continue
            if not isinstance(day.get("day"), str):
                errors.append(f"'days[{i}].day' must be a string.")
            if not isinstance(day.get("focus"), str):
                errors.append(f"'days[{i}].focus' must be a string.")

            exercises = day.get("exercises")
            if not isinstance(exercises, list) or len(exercises) == 0:
                errors.append(f"'days[{i}].exercises' must be a non-empty array.")
                continue

            for j, exercise in enumerate(exercises):
                if not isinstance(exercise, dict):
                    errors.append(f"'days[{i}].exercises[{j}]' must be an object.")
                    continue
                if not isinstance(exercise.get("name"), str):
                    errors.append(f"'days[{i}].exercises[{j}].name' must be a string.")
                sets = exercise.get("sets")
                if not isinstance(sets, list) or len(sets) == 0:
                    errors.append(f"'days[{i}].exercises[{j}].sets' must be a non-empty array.")

    weekly_notes = data.get("weekly_notes")
    if weekly_notes is not None:
        if not isinstance(weekly_notes, dict):
            errors.append("'weekly_notes' must be an object when provided.")
        else:
            for key in (
                "bodyweight",
                "sleep_avg_hours",
                "hardest_lift",
                "pain_tightness_notes",
                "recovery_notes",
                "general_notes",
            ):
                if key not in weekly_notes:
                    errors.append(f"'weekly_notes.{key}' is required when 'weekly_notes' is provided.")

    return errors
