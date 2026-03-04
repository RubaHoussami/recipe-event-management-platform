"""AI parsing: choose provider (Mock vs OpenAI) and delegate."""
from __future__ import annotations

from app.modules.ai.providers import AIProvider, MockAIProvider, OpenAIProvider
from app.modules.ai.schemas import (
    ParseEventResponse,
    ParseRecipeResponse,
    RecipeSuggestionItem,
    SuggestRecipesResponse,
)


def get_provider() -> AIProvider:
    """Return MockAIProvider. OpenAI is only used when per-request key is provided."""
    return MockAIProvider()


def assign_cuisine_with_openai(recipe_text: str, openai_api_key: str) -> str:
    """Requires OpenAI; call with non-empty api_key."""
    provider = OpenAIProvider(api_key=openai_api_key.strip())
    return provider.assign_cuisine(recipe_text)


def suggest_recipes_with_openai(cuisine: str, openai_api_key: str) -> SuggestRecipesResponse:
    """Requires OpenAI; call with non-empty api_key."""
    provider = OpenAIProvider(api_key=openai_api_key.strip())
    raw = provider.suggest_recipes_by_cuisine(cuisine)
    suggestions = [
        RecipeSuggestionItem(
            title=s.get("title") or "",
            ingredients=s.get("ingredients") or [],
            steps=s.get("steps") or [],
        )
        for s in raw
    ]
    return SuggestRecipesResponse(suggestions=suggestions)


def parse_recipe(free_text: str, use_openai: bool = False, openai_api_key: str | None = None) -> ParseRecipeResponse:
    """Use OpenAI for this request only when use_openai is True and openai_api_key is non-empty. Returns null for fields that fail to parse."""
    try:
        if use_openai and openai_api_key and openai_api_key.strip():
            provider = OpenAIProvider(api_key=openai_api_key.strip())
        else:
            provider = get_provider()
        title, ingredients, steps, description, cuisine, share_with = provider.parse_recipe(free_text)
        return ParseRecipeResponse(
            title=title if title else None,
            description=description,
            ingredients=ingredients if ingredients is not None else None,
            steps=steps if steps is not None else None,
            cuisine=cuisine,
            share_with=share_with,
        )
    except Exception:
        return ParseRecipeResponse(
            title=None, description=None, ingredients=None, steps=None, cuisine=None, share_with=None
        )


def parse_event(free_text: str, use_openai: bool = False, openai_api_key: str | None = None) -> ParseEventResponse:
    """Use OpenAI for this request only when use_openai is True and openai_api_key is non-empty."""
    if use_openai and openai_api_key and openai_api_key.strip():
        provider = OpenAIProvider(api_key=openai_api_key.strip())
    else:
        provider = get_provider()
    title, start_time, location, end_time = provider.parse_event(free_text)
    return ParseEventResponse(
        title=title,
        start_time=start_time,
        location=location,
        end_time=end_time,
    )
