"""AI parsing: choose provider (Mock vs OpenAI vs Hugging Face hosted) and delegate."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.modules.ai.providers import (
    AIProvider,
    HuggingFaceProvider,
    MockAIProvider,
    OpenAIProvider,
)
from app.modules.ai.schemas import (
    ParseEventResponse,
    ParseRecipeResponse,
    RecipeSuggestionItem,
    SuggestRecipesResponse,
)
from app.modules.users.repositories import get_openai_key_plain, get_user_by_id


def get_provider() -> AIProvider:
    """Return MockAIProvider when no key/provider is used."""
    return MockAIProvider()


def _hosted_provider() -> HuggingFaceProvider | None:
    s = get_settings()
    if not (s.hf_api_key and s.hf_model):
        return None
    return HuggingFaceProvider(
        api_key=s.hf_api_key,
        base_url=s.hf_base_url or "https://router.huggingface.co/v1",
        model=s.hf_model,
    )


def get_effective_ai(db: Session, user_id: str) -> tuple[AIProvider, AIProvider | None, bool]:
    """Return (parse_provider, chat_provider, rate_limited). chat_provider is used for assign_cuisine/suggest (None = not available)."""
    user = get_user_by_id(db, user_id)
    preference = getattr(user, "ai_preference", None) if user else None
    preference = preference or "my_key"
    settings = get_settings()
    hosted = _hosted_provider() if preference == "hosted" else None
    user_key = get_openai_key_plain(db, user_id) if preference == "my_key" else None

    if preference == "off":
        return MockAIProvider(), None, False
    if preference == "my_key" and user_key and user_key.strip():
        p = OpenAIProvider(api_key=user_key.strip())
        return p, p, True
    # Hosted (Hugging Face) only for verified users
    if preference == "hosted" and hosted and user and getattr(user, "email_verified_at", None):
        return hosted, hosted, True
    # Fallback: no AI
    return MockAIProvider(), None, False


def assign_cuisine_with_provider(provider: AIProvider, recipe_text: str) -> str:
    """Requires a provider that implements assign_cuisine (OpenAI or Hugging Face)."""
    return provider.assign_cuisine(recipe_text)


def suggest_recipes_with_provider(provider: AIProvider, cuisine: str) -> SuggestRecipesResponse:
    raw = provider.suggest_recipes_by_cuisine(cuisine)
    return SuggestRecipesResponse(
        suggestions=[
            RecipeSuggestionItem(
                title=s.get("title") or "",
                ingredients=s.get("ingredients") or [],
                steps=s.get("steps") or [],
            )
            for s in raw
        ]
    )


def parse_recipe_with_provider(provider: AIProvider, free_text: str) -> ParseRecipeResponse:
    try:
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


def parse_event_with_provider(provider: AIProvider, free_text: str) -> ParseEventResponse:
    title, start_time, location, end_time = provider.parse_event(free_text)
    return ParseEventResponse(
        title=title,
        start_time=start_time,
        location=location,
        end_time=end_time,
    )


def parse_recipe(free_text: str, use_openai: bool = False, openai_api_key: str | None = None) -> ParseRecipeResponse:
    """Legacy: use when no db/user context. Prefer controller that uses get_effective_ai."""
    try:
        if use_openai and openai_api_key and openai_api_key.strip():
            provider = OpenAIProvider(api_key=openai_api_key.strip())
        else:
            provider = get_provider()
        return parse_recipe_with_provider(provider, free_text)
    except Exception:
        return ParseRecipeResponse(
            title=None, description=None, ingredients=None, steps=None, cuisine=None, share_with=None
        )


def parse_event(free_text: str, use_openai: bool = False, openai_api_key: str | None = None) -> ParseEventResponse:
    """Legacy: use when no db/user context."""
    if use_openai and openai_api_key and openai_api_key.strip():
        provider = OpenAIProvider(api_key=openai_api_key.strip())
    else:
        provider = get_provider()
    return parse_event_with_provider(provider, free_text)
