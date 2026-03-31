from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from database import get_db
from models import QuestionResult, User
import json, os

router = APIRouter()
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

def load_theme_map():
    theme_map = {}
    for level in ["3", "2c", "2i"]:
        path = os.path.join(DATA_DIR, f"questions_{level}.json")
        with open(path, encoding="utf-8") as f:
            for q in json.load(f):
                theme_map[(level, q["id"])] = q.get("theme", "その他")
    return theme_map

class ResultCreate(BaseModel):
    user_id: int
    question_id: int
    level: str
    is_correct: int

@router.post("/results")
def record_result(body: ResultCreate, db: Session = Depends(get_db)):
    result = QuestionResult(**body.model_dump())
    db.add(result)
    db.commit()
    db.refresh(result)
    return result

@router.get("/results/weak/{user_id}/{level}")
def get_weak_questions(user_id: int, level: str, db: Session = Depends(get_db)):
    rows = (
        db.query(
            QuestionResult.question_id,
            func.sum(QuestionResult.is_correct).label("correct"),
            func.count(QuestionResult.id).label("total"),
        )
        .filter(QuestionResult.user_id == user_id, QuestionResult.level == level)
        .group_by(QuestionResult.question_id)
        .all()
    )
    weak = []
    for row in rows:
        rate = row.correct / row.total if row.total > 0 else 0
        weak.append({"question_id": row.question_id, "correct": row.correct, "total": row.total, "rate": round(rate, 2)})
    weak.sort(key=lambda x: x["rate"])
    return weak

@router.get("/ranking")
def get_ranking(db: Session = Depends(get_db)):
    rows = (
        db.query(
            QuestionResult.user_id,
            func.sum(QuestionResult.is_correct).label("correct"),
            func.count(QuestionResult.id).label("total"),
        )
        .group_by(QuestionResult.user_id)
        .all()
    )
    ranking = []
    for row in rows:
        user = db.query(User).filter(User.id == row.user_id).first()
        username = user.username if user else "Unknown"
        rate = row.correct / row.total if row.total > 0 else 0
        ranking.append({"user_id": row.user_id, "username": username, "correct": int(row.correct), "total": row.total, "rate": round(rate * 100, 1)})
    ranking.sort(key=lambda x: (-x["correct"], -x["rate"]))
    return ranking

@router.get("/stats/{user_id}")
def get_stats(user_id: int, db: Session = Depends(get_db)):
    results = db.query(QuestionResult).filter(QuestionResult.user_id == user_id).all()
    theme_map = load_theme_map()

    # レベル別
    by_level = {}
    for r in results:
        if r.level not in by_level:
            by_level[r.level] = {"correct": 0, "total": 0}
        by_level[r.level]["total"] += 1
        by_level[r.level]["correct"] += r.is_correct
    for s in by_level.values():
        s["rate"] = round(s["correct"] / s["total"] * 100, 1) if s["total"] > 0 else 0

    # テーマ別
    theme_stats = {}
    for r in results:
        theme = theme_map.get((r.level, r.question_id), "その他")
        key = f"{r.level}|{theme}"
        if key not in theme_stats:
            theme_stats[key] = {"level": r.level, "theme": theme, "correct": 0, "total": 0}
        theme_stats[key]["total"] += 1
        theme_stats[key]["correct"] += r.is_correct
    by_theme = list(theme_stats.values())
    for s in by_theme:
        s["rate"] = round(s["correct"] / s["total"] * 100, 1) if s["total"] > 0 else 0

    # 日別（直近30日）
    daily = {}
    for r in results:
        d = r.created_at.strftime("%Y-%m-%d") if r.created_at else "unknown"
        if d not in daily:
            daily[d] = {"date": d, "correct": 0, "total": 0}
        daily[d]["total"] += 1
        daily[d]["correct"] += r.is_correct
    daily_list = sorted(daily.values(), key=lambda x: x["date"])[-30:]

    return {
        "by_level": by_level,
        "by_theme": by_theme,
        "daily": daily_list,
        "total_answered": len(results),
        "total_correct": sum(r.is_correct for r in results),
    }
