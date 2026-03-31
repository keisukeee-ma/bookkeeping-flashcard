import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import questions, users, results

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bookkeeping Flashcard API")

# 許可するオリジン（環境変数 FRONTEND_URL があれば追加）
origins = [
    "http://localhost:5173",
    "http://localhost:4173",
]
frontend_url = os.environ.get("FRONTEND_URL", "")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(results.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Bookkeeping Flashcard API"}
