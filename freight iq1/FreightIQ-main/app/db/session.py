"""
DB session wiring.

NOTE: The actual database (schema/migrations/Postgres or Supabase instance)
is owned by a teammate. This file just defines the *interface* the rest of
the backend depends on:

    from app.db.session import get_db

    @router.get(...)
    def endpoint(db: Session = Depends(get_db)):
        ...

so that all routers/services are already wired for dependency injection.
Swap DATABASE_URL in app/config.py (or a .env file) once the real DB is
ready — no other file needs to change.

Until then, it falls back to a local SQLite file so you can run and test
the API end-to-end without waiting on the DB.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
