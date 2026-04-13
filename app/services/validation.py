ROOT_KEYS = {"week", "days"}
DAY_KEYS = {"day", "focus", "exercises"}
EXERCISE_KEYS = {"name", "sets"}
SET_KEYS = {"percent", "target_reps", "prescribed_weight", "actual_weight", "reps", "RPE"}


def _append_unknown_key_errors(errors: list[str], data: dict, allowed_keys: set[str], path: str):
    for key in data:
        if key not in allowed_keys:
            errors.append(f"'{path}.{key}' is not allowed.")


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _is_number_or_string(value):
    return _is_number(value) or isinstance(value, str)


def validate_program_payload(data: dict):
    errors = []

    if not isinstance(data, dict):
        errors.append("JSON root must be an object.")
        return errors

    _append_unknown_key_errors(errors, data, ROOT_KEYS, "root")

    if not isinstance(data.get("week"), int) or isinstance(data.get("week"), bool):
        errors.append("'week' must be an integer.")

    days = data.get("days")
    if not isinstance(days, list) or len(days) == 0:
        errors.append("'days' must be a non-empty array.")
        return errors

    for i, day in enumerate(days):
        if not isinstance(day, dict):
            errors.append(f"'days[{i}]' must be an object.")
            continue

        _append_unknown_key_errors(errors, day, DAY_KEYS, f"days[{i}]")

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

            _append_unknown_key_errors(
                errors,
                exercise,
                EXERCISE_KEYS,
                f"days[{i}].exercises[{j}]",
            )

            if not isinstance(exercise.get("name"), str):
                errors.append(f"'days[{i}].exercises[{j}].name' must be a string.")

            sets = exercise.get("sets")
            if not isinstance(sets, list) or len(sets) == 0:
                errors.append(f"'days[{i}].exercises[{j}].sets' must be a non-empty array.")
                continue

            for k, set_item in enumerate(sets):
                if not isinstance(set_item, dict):
                    errors.append(f"'days[{i}].exercises[{j}].sets[{k}]' must be an object.")
                    continue

                _append_unknown_key_errors(
                    errors,
                    set_item,
                    SET_KEYS,
                    f"days[{i}].exercises[{j}].sets[{k}]",
                )

                for key in SET_KEYS:
                    if key not in set_item:
                        errors.append(
                            f"'days[{i}].exercises[{j}].sets[{k}].{key}' is required."
                        )

                if "percent" in set_item and not _is_number_or_string(set_item["percent"]):
                    errors.append(f"'days[{i}].exercises[{j}].sets[{k}].percent' must be a number or string.")
                if "target_reps" in set_item and not _is_number_or_string(set_item["target_reps"]):
                    errors.append(
                        f"'days[{i}].exercises[{j}].sets[{k}].target_reps' must be a number or string."
                    )
                if "prescribed_weight" in set_item and not _is_number_or_string(set_item["prescribed_weight"]):
                    errors.append(
                        f"'days[{i}].exercises[{j}].sets[{k}].prescribed_weight' must be a number or string."
                    )
                if "actual_weight" in set_item and not _is_number_or_string(set_item["actual_weight"]):
                    errors.append(
                        f"'days[{i}].exercises[{j}].sets[{k}].actual_weight' must be a number or string."
                    )
                if "reps" in set_item and not _is_number_or_string(set_item["reps"]):
                    errors.append(f"'days[{i}].exercises[{j}].sets[{k}].reps' must be a number or string.")
                if "RPE" in set_item and not _is_number_or_string(set_item["RPE"]):
                    errors.append(f"'days[{i}].exercises[{j}].sets[{k}].RPE' must be a number or string.")

    return errors
