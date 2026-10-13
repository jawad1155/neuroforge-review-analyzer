import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.database import get_db, User

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "neuroforge-super-secret-dev-key-change-me-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_api_key_user(api_key: str, db: Session):
    from backend.database import APIKey
    # In production, we store hashed keys. We must verify the raw key against the hash.
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    # Since we store the hash, we need to find the record and then verify.
    # However, since bcrypt hashes have different salts, we cannot query by hash.
    # In a real high-scale system, we'd use a prefix (e.g., nf_...) to find the record
    # or a fast lookup table. For this implementation, we iterate active keys for the user
    # or we can store a non-sensitive "key_id" as part of the key.

    # Optimized Approach: Iterate active keys.
    # (Note: For very large numbers of keys, this should be replaced with a key-id lookup).
    all_active_keys = db.query(APIKey).filter(APIKey.is_active == True).all()
    for key_record in all_active_keys:
        if pwd_context.verify(api_key, key_record.key_hash):
            return db.query(User).filter(User.id == key_record.user_id).first()

    return None
