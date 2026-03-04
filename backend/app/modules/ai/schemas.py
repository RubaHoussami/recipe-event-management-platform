"""AI parse request/response schemas."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ParseRecipeRequest(BaseModel):
    free_text: str = Field(..., min_length=1, description="Raw recipe text to parse")
    use_openai: bool = Field(
        False,
        description="If true and user has a stored OpenAI key, use it; otherwise Mock.",
    )


class ParseRecipeResponse(BaseModel):
    title: str | None = Field(None, description="Parsed recipe title, or null if parsing failed")
    description: str | None = Field(None, description="Parsed description if present")
    ingredients: list[str] | None = Field(None, description="List of ingredients, or null if parsing failed")
    steps: list[str] | None = Field(None, description="List of steps, or null if parsing failed")
    cuisine: str | None = Field(None, description="Parsed cuisine if present")
    share_with: list[str] | None = Field(None, description="Parsed email addresses to share with, if mentioned in text")


class ParseEventRequest(BaseModel):
    free_text: str = Field(..., min_length=1, description="Natural language event description")
    use_openai: bool = Field(
        False,
        description="If true and user has a stored OpenAI key, use it; otherwise Mock.",
    )


class ParseEventResponse(BaseModel):
    title: str = Field(..., description="Parsed event title")
    start_time: datetime = Field(..., description="Parsed start time")
    location: str | None = Field(None, description="Parsed location")
    end_time: datetime | None = Field(None, description="Parsed end time if present")


class AssignCuisineRequest(BaseModel):
    recipe_id: uuid.UUID = Field(..., description="Recipe to assign cuisine to")


class SuggestRecipesRequest(BaseModel):
    cuisine: str = Field(..., min_length=1, max_length=100, description="Cuisine to get suggestions for")


class RecipeSuggestionItem(BaseModel):
    title: str = ""
    ingredients: list[str] = Field(default_factory=list)
    steps: list[str] = Field(default_factory=list)


class SuggestRecipesResponse(BaseModel):
    suggestions: list[RecipeSuggestionItem] = Field(default_factory=list)
