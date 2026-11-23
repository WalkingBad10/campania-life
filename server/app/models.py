import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, JSON, text, Uuid
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(60), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    last_login = Column(DateTime(timezone=True), nullable=True)

    character = relationship("Character", back_populates="user", uselist=False)
    save = relationship("GameSave", back_populates="user", uselist=False)


class Character(Base):
    __tablename__ = "characters"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(40), nullable=False)
    surname = Column(String(40), nullable=False)
    look = Column(JSON, nullable=False, default=dict)
    perk = Column(String(30), nullable=False, default="nativo")
    level = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

    user = relationship("User", back_populates="character")


class GameSave(Base):
    __tablename__ = "game_saves"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    payload = Column(JSON, nullable=False)
    version = Column(Integer, nullable=False, default=1)
    saved_at = Column(DateTime(timezone=True), server_default=text("now()"))

    user = relationship("User", back_populates="save")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    kind = Column(String(40), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False, default=0)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))


class Achievement(Base):
    __tablename__ = "achievements"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    code = Column(String(60), primary_key=True)
    unlocked_at = Column(DateTime(timezone=True), server_default=text("now()"))
