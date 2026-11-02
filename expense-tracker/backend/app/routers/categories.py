from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas, services
from app.database import get_db

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[schemas.CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    return services.list_categories(db)


@router.post("", response_model=schemas.CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(payload: schemas.CategoryCreate, db: Session = Depends(get_db)):
    if services.get_category_by_name(db, payload.name.strip()):
        raise HTTPException(status.HTTP_409_CONFLICT, "A category with this name already exists.")
    return services.create_category(db, payload)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.get(models.Category, category_id)
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found.")
    if services.category_has_expenses(db, category_id):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "This category still has expenses. Move or delete them first.",
        )
    db.delete(category)
    db.commit()
