import json
import os
from fastapi import APIRouter

router = APIRouter()

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def load_questions(level: str):
    path = os.path.join(DATA_DIR, f"questions_{level}.json")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@router.get("/questions/{level}")
def get_questions(level: str, theme: str = None):
    if level not in ("2c", "2i", "3"):
        return {"error": "level must be 2c, 2i, or 3"}
    questions = load_questions(level)
    if theme:
        questions = [q for q in questions if q.get("theme") == theme]
    return questions


@router.get("/questions/{level}/themes/list")
def get_themes(level: str):
    if level not in ("2c", "2i", "3"):
        return {"error": "level must be 2c, 2i, or 3"}
    questions = load_questions(level)
    seen = []
    for q in questions:
        t = q.get("theme")
        if t and t not in seen:
            seen.append(t)
    return seen


@router.get("/questions/{level}/{question_id}")
def get_question(level: str, question_id: int):
    questions = load_questions(level)
    for q in questions:
        if q["id"] == question_id:
            return q
    return {"error": "not found"}
