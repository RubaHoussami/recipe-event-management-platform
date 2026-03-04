"""Recipe share Pydantic schemas."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.modules.recipes.schemas import RecipeResponse


class ShareCreate(BaseModel):
    shared_with_email: str | None = Field(None, description="Email of user to share with")
    shared_with_user_id: uuid.UUID | None = Field(None, description="User ID to share with")
    permission: str = Field(..., pattern="^(viewer|editor)$")

    @model_validator(mode="after")
    def one_of_email_or_user_id(self):
        if not self.shared_with_email and not self.shared_with_user_id:
            raise ValueError("Provide either shared_with_email or shared_with_user_id")
        if self.shared_with_email and self.shared_with_user_id:
            raise ValueError("Provide only one of shared_with_email or shared_with_user_id")
        return self


class ShareResponse(BaseModel):
    id: uuid.UUID
    recipe_id: uuid.UUID
    shared_with_user_id: uuid.UUID
    permission: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ShareResponseWithEmail(ShareResponse):
    shared_with_email: str | None = None


class SharedRecipeItem(BaseModel):
    """Recipe plus permission when listing shared-with-me."""

    recipe: RecipeResponse
    permission: str = Field(..., pattern="^(viewer|editor)$")
