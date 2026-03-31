from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import User

router = APIRouter()


class UserCreate(BaseModel):
    username: str


@router.post("/users")
def create_or_get_user(body: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user:
        user = User(username=body.username)
        db.add(user)
        db.commit()
        db.refresh(user)
    return {"id": user.id, "username": user.username}


@router.get("/users/{username}")
def get_user(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "username": user.username}
