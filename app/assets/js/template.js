window.WorkoutTemplate = {
    "week": 1,
    "week_type": "5's Week",
    "training_maxes": {
        "squat": 475,
        "bench": 325,
        "deadlift": 525,
        "overhead_press": 225
    },
    "amrap_rule": "Stop at RPE 9 max, optional AMRAP on last main lift set",
    "days": [
        {
            "day": "Monday",
            "focus": "Squat",
            "exercises": [
                {
                    "name": "Back Squat (5/3/1)",
                    "sets": [
                        {"percent": 65, "target_reps": 5, "prescribed_weight": 310, "actual_weight": "", "reps": "", "RPE": ""},
                        {"percent": 75, "target_reps": 5, "prescribed_weight": 355, "actual_weight": "", "reps": "", "RPE": ""},
                        {"percent": 85, "target_reps": "5+", "prescribed_weight": 405, "actual_weight": "", "reps": "", "RPE": ""}
                    ],
                    "AMRAP_reps": "",
                    "top_set_RPE": ""
                },
                {
                    "name": "Belt Squat",
                    "sets": [
                        {"weight": 315, "target_reps": 12, "actual_reps": "", "RPE": ""},
                        {"weight": 315, "target_reps": 12, "actual_reps": "", "RPE": ""},
                        {"weight": 315, "target_reps": 12, "actual_reps": "", "RPE": ""},
                        {"weight": 315, "target_reps": 12, "actual_reps": "", "RPE": ""}
                    ]
                },
                {
                    "name": "Romanian Deadlift",
                    "sets": [
                        {"weight": 275, "target_reps": 8, "actual_reps": "", "RPE": ""},
                        {"weight": 275, "target_reps": 8, "actual_reps": "", "RPE": ""},
                        {"weight": 275, "target_reps": 8, "actual_reps": "", "RPE": ""}
                    ]
                },
                {
                    "name": "Hanging Leg Raise",
                    "sets": [
                        {"target_reps": 12, "actual_reps": ""},
                        {"target_reps": 12, "actual_reps": ""},
                        {"target_reps": 12, "actual_reps": ""}
                    ]
                }
            ]
        },
        {
            "day": "Tuesday",
            "focus": "Bench Volume",
            "exercises": [
                {
                    "name": "Bench Press (5/3/1)",
                    "sets": [
                        {"percent": 65, "target_reps": 5, "prescribed_weight": 210, "actual_weight": "", "reps": "", "RPE": ""},
                        {"percent": 75, "target_reps": 5, "prescribed_weight": 245, "actual_weight": "", "reps": "", "RPE": ""},
                        {"percent": 85, "target_reps": "5+", "prescribed_weight": 275, "actual_weight": "", "reps": "", "RPE": ""}
                    ],
                    "AMRAP_reps": "",
                    "top_set_RPE": ""
                },
                {
                    "name": "Incline Dumbbell Press",
                    "sets": [
                        {"weight": 85, "target_reps": 10, "actual_reps": "", "RPE": ""},
                        {"weight": 85, "target_reps": 10, "actual_reps": "", "RPE": ""},
                        {"weight": 85, "target_reps": 10, "actual_reps": "", "RPE": ""},
                        {"weight": 85, "target_reps": 10, "actual_reps": "", "RPE": ""}
                    ]
                },
                {
                    "name": "Cable Row",
                    "sets": [
                        {"weight": 170, "target_reps": 12, "actual_reps": "", "RPE": ""},
                        {"weight": 170, "target_reps": 12, "actual_reps": "", "RPE": ""},
                        {"weight": 170, "target_reps": 12, "actual_reps": "", "RPE": ""},
                        {"weight": 170, "target_reps": 12, "actual_reps": "", "RPE": ""}
                    ]
                },
                {
                    "name": "EZ-Bar Skullcrusher",
                    "sets": [
                        {"weight": 85, "target_reps": 12, "actual_reps": "", "RPE": ""},
                        {"weight": 85, "target_reps": 12, "actual_reps": "", "RPE": ""},
                        {"weight": 85, "target_reps": 12, "actual_reps": "", "RPE": ""}
                    ]
                }
            ]
        },
        {
            "day": "Wednesday",
            "focus": "Deadlift",
            "exercises": [
                {
                    "name": "Deadlift (5/3/1)",
                    "sets": [
                        {"percent": 65, "target_reps": 5, "prescribed_weight": 340, "actual_weight": "", "reps": "", "RPE": ""},
                        {"percent": 75, "target_reps": 5, "prescribed_weight": 395, "actual_weight": "", "reps": "", "RPE": ""},
                        {"percent": 85, "target_reps": "5+", "prescribed_weight": 445, "actual_weight": "", "reps": "", "RPE": ""}
                    ],
                    "AMRAP_reps": "",
                    "top_set_RPE": ""
                },
                {
                    "name": "Deficit Deadlift",
                    "sets": [
                        {"weight": 325, "target_reps": 5, "actual_reps": "", "RPE": ""},
                        {"weight": 325, "target_reps": 5, "actual_reps": "", "RPE": ""},
                        {"weight": 325, "target_reps": 5, "actual_reps": "", "RPE": ""}
                    ]
                },
                {
                    "name": "Pull-Ups",
                    "sets": [
                        {"weight": "BW", "target_reps": 8, "actual_reps": "", "RPE": ""},
                        {"weight": "BW", "target_reps": 8, "actual_reps": "", "RPE": ""},
                        {"weight": "BW", "target_reps": 8, "actual_reps": "", "RPE": ""},
                        {"weight": "BW", "target_reps": 8, "actual_reps": "", "RPE": ""}
                    ]
                },
                {
                    "name": "Ab Wheel",
                    "sets": [
                        {"target_reps": 12, "actual_reps": ""},
                        {"target_reps": 12, "actual_reps": ""},
                        {"target_reps": 12, "actual_reps": ""}
                    ]
                }
            ]
        },
        {
            "day": "Thursday",
            "focus": "Bench/Shoulder Intensity",
            "exercises": [
                {
                    "name": "Close-Grip Bench",
                    "sets": [
                        {"weight": 225, "target_reps": 5, "actual_reps": "", "RPE": ""},
                        {"weight": 225, "target_reps": 5, "actual_reps": "", "RPE": ""},
                        {"weight": 225, "target_reps": 5, "actual_reps": "", "RPE": ""},
                        {"weight": 225, "target_reps": 5, "actual_reps": "", "RPE": ""},
                        {"weight": 225, "target_reps": 5, "actual_reps": "", "RPE": ""}
                    ]
                },
                {
                    "name": "Overhead Press",
                    "sets": [
                        {"weight": 165, "target_reps": 6, "actual_reps": "", "RPE": ""},
                        {"weight": 165, "target_reps": 6, "actual_reps": "", "RPE": ""},
                        {"weight": 165, "target_reps": 6, "actual_reps": "", "RPE": ""},
                        {"weight": 165, "target_reps": 6, "actual_reps": "", "RPE": ""}
                    ]
                },
                {
                    "name": "Lateral Raise",
                    "sets": [
                        {"weight": 25, "target_reps": 15, "actual_reps": "", "RPE": ""},
                        {"weight": 25, "target_reps": 15, "actual_reps": "", "RPE": ""},
                        {"weight": 25, "target_reps": 15, "actual_reps": "", "RPE": ""}
                    ]
                },
                {
                    "name": "Face Pull",
                    "sets": [
                        {"weight": 95, "target_reps": 15, "actual_reps": "", "RPE": ""},
                        {"weight": 95, "target_reps": 15, "actual_reps": "", "RPE": ""},
                        {"weight": 95, "target_reps": 15, "actual_reps": "", "RPE": ""}
                    ]
                }
            ]
        },
        {
            "day": "Friday",
            "focus": "Squat Volume",
            "exercises": [
                {
                    "name": "Paused Squat",
                    "sets": [
                        {"weight": 335, "target_reps": 5, "actual_reps": "", "RPE": ""},
                        {"weight": 335, "target_reps": 5, "actual_reps": "", "RPE": ""},
                        {"weight": 335, "target_reps": 5, "actual_reps": "", "RPE": ""},
                        {"weight": 335, "target_reps": 5, "actual_reps": "", "RPE": ""},
                        {"weight": 335, "target_reps": 5, "actual_reps": "", "RPE": ""}
                    ]
                },
                {
                    "name": "Belt Squat",
                    "sets": [
                        {"weight": 270, "target_reps": 15, "actual_reps": "", "RPE": ""},
                        {"weight": 270, "target_reps": 15, "actual_reps": "", "RPE": ""},
                        {"weight": 270, "target_reps": 15, "actual_reps": "", "RPE": ""}
                    ]
                },
                {
                    "name": "Dumbbell Row",
                    "sets": [
                        {"weight": 105, "target_reps": 12, "actual_reps": "", "RPE": ""},
                        {"weight": 105, "target_reps": 12, "actual_reps": "", "RPE": ""},
                        {"weight": 105, "target_reps": 12, "actual_reps": "", "RPE": ""},
                        {"weight": 105, "target_reps": 12, "actual_reps": "", "RPE": ""}
                    ]
                },
                {
                    "name": "Barbell Hip Thrust",
                    "sets": [
                        {"weight": 315, "target_reps": 12, "actual_reps": "", "RPE": ""},
                        {"weight": 315, "target_reps": 12, "actual_reps": "", "RPE": ""},
                        {"weight": 315, "target_reps": 12, "actual_reps": "", "RPE": ""}
                    ]
                }
            ]
        }
    ],
    "weekly_notes": {
        "bodyweight": "",
        "sleep_avg_hours": "",
        "hardest_lift": "",
        "pain_tightness_notes": "",
        "recovery_notes": "",
        "general_notes": ""
    }
};

window.WeeklyCheckInTemplate = {
    "week_number": "",
    "date": "",
    "bodyweight": "",
    "sleep_avg_hours": "",
    "main_lifts": [
        {
            "lift": "Squat",
            "top_set_weight": "",
            "reps_completed": "",
            "RPE": "",
            "notes": ""
        },
        {
            "lift": "Bench Press",
            "top_set_weight": "",
            "reps_completed": "",
            "RPE": "",
            "notes": ""
        },
        {
            "lift": "Deadlift",
            "top_set_weight": "",
            "reps_completed": "",
            "RPE": "",
            "notes": ""
        },
        {
            "lift": "Overhead Press",
            "top_set_weight": "",
            "reps_completed": "",
            "RPE": "",
            "notes": ""
        }
    ]
};
