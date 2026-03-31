from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import questions, users, results

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bookkeeping Flashcard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
