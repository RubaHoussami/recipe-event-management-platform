"""AIProvider abstraction; MockAIProvider (default); optional OpenAIProvider."""
from __future__ import annotations

import re
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass


class AIProvider(ABC):
    """Abstract provider for parsing recipe/event free text."""

    @abstractmethod
    def parse_recipe(
        self, free_text: str
    ) -> tuple[str | None, list[str] | None, list[str] | None, str | None, str | None, list[str] | None]:
        """Return (title, ingredients, steps, description, cuisine, share_with). Any may be None if not parsed."""
        ...

    @abstractmethod
    def parse_event(self, free_text: str) -> tuple[str, datetime, str | None, datetime | None]:
        """Return (title, start_time, location, end_time)."""
        ...


class MockAIProvider(AIProvider):
    """Deterministic heuristics; works without any API key."""

    def parse_recipe(
        self, free_text: str
    ) -> tuple[str | None, list[str] | None, list[str] | None, str | None, str | None, list[str] | None]:
        lines = [ln.strip() for ln in free_text.strip().splitlines() if ln.strip()]
        title: str | None = "Parsed Recipe"
        description: str | None = None
        ingredients: list[str] = []
        steps: list[str] = []
        current = "title"
        share_with: list[str] | None = None
        for i, line in enumerate(lines):
            lower = line.lower()
            if lower.startswith("title:"):
                title = line[6:].strip() or title
                current = "body"
                continue
            if lower.startswith("description:"):
                description = line[12:].strip() or None
                current = "body"
                continue
            if (lower.startswith("share with") or lower.startswith("send to") or lower.startswith("invite")) and ":" in line:
                rest = line.split(":", 1)[1].strip()
                if rest:
                    share_with = [e.strip() for e in re.split(r"[\s,;]+", rest) if e.strip() and "@" in e]
                current = "body"
                continue
            if lower == "ingredients" or (lower.startswith("ingredients") and ":" in line):
                current = "ingredients"
                if ":" in line:
                    rest = line.split(":", 1)[1].strip()
                    if rest:
                        ingredients.extend(_split_list_items(rest))
                continue
            if lower == "steps" or (lower.startswith("steps") and ":" in line):
                current = "steps"
                if ":" in line:
                    rest = line.split(":", 1)[1].strip()
                    if rest:
                        steps.append(rest)
                continue
            if current == "title":
                if line and not line.startswith("-") and not re.match(r"^\d+[.)]", line) and ":" not in lower:
                    title = line[:200]
                current = "body"
                continue
            if current == "body":
                if line.startswith("-") or line.startswith("*"):
                    ingredients.append(line.lstrip("-* ").strip())
                    current = "ingredients"
                elif re.match(r"^\d+[.)]\s*", line):
                    steps.append(re.sub(r"^\d+[.)]\s*", "", line).strip())
                    current = "steps"
                elif "ingredient" in lower:
                    current = "ingredients"
                    if ":" in line:
                        rest = line.split(":", 1)[1].strip()
                        if rest:
                            ingredients.extend(_split_list_items(rest))
                elif line and description is None and not ingredients:
                    description = line[:500]
                elif line:
                    ingredients.append(line)
                    current = "ingredients"
            elif current == "ingredients":
                if line.startswith("-") or line.startswith("*"):
                    ingredients.append(line.lstrip("-* ").strip())
                elif re.match(r"^\d+[.)]\s*", line):
                    steps.append(re.sub(r"^\d+[.)]\s*", "", line).strip())
                    current = "steps"
                elif "step" in lower and (":" in line or lower == "steps"):
                    current = "steps"
                    if ":" in line:
                        rest = line.split(":", 1)[1].strip()
                        if rest:
                            steps.append(rest)
                elif line and not re.match(r"^\d+[.)]\s*", line):
                    ingredients.append(line)
            elif current == "steps":
                if re.match(r"^\d+[.)]\s*", line):
                    steps.append(re.sub(r"^\d+[.)]\s*", "", line).strip())
                elif line.startswith("-") or line.startswith("*"):
                    ingredients.append(line.lstrip("-* ").strip())
                elif line:
                    steps.append(line)
        if not ingredients and len(lines) > 1:
            for ln in lines[1:]:
                if ln and not re.match(r"^\d+[.)]", ln) and ":" not in ln.lower():
                    ingredients.append(ln)
        if not steps and len(lines) > 1:
            for ln in lines[1:]:
                if re.match(r"^\d+[.)]\s*", ln):
                    steps.append(re.sub(r"^\d+[.)]\s*", "", ln).strip())
        return (
            title or "Parsed Recipe",
            ingredients[:50] if ingredients else None,
            steps[:50] if steps else None,
            description,
            None,
            share_with or None,
        )

    def parse_event(self, free_text: str) -> tuple[str, datetime, str | None, datetime | None]:
        text = free_text.strip()
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        title = "Parsed Event"
        start_time = datetime.now(timezone.utc).replace(hour=12, minute=0, second=0, microsecond=0)
        location: str | None = None
        end_time: datetime | None = None
        # Try to find date/time patterns (simple)
        date_match = re.search(
            r"(\d{4})-(\d{2})-(\d{2})[T\s]+(\d{1,2}):(\d{2})",
            text,
            re.IGNORECASE,
        )
        if date_match:
            y, m, d, h, minu = map(int, date_match.groups())
            start_time = datetime(y, m, d, h, minu, 0, tzinfo=timezone.utc)
        else:
            for part in re.split(r"[\s,]+", text):
                if re.match(r"^\d{4}-\d{2}-\d{2}", part):
                    try:
                        start_time = datetime.fromisoformat(part.replace("Z", "+00:00"))
                        if start_time.tzinfo is None:
                            start_time = start_time.replace(tzinfo=timezone.utc)
                    except ValueError:
                        pass
                    break
        # Location: "at X", "in X", "location: X"
        loc_m = re.search(r"(?:at|in|location:)\s*([^\n,]+)", text, re.IGNORECASE)
        if loc_m:
            location = loc_m.group(1).strip()
        # Title: first line or before first date
        first_line = lines[0] if lines else ""
        if first_line and not re.match(r"^\d", first_line) and "location" not in first_line.lower():
            title = first_line[:200]
        return title, start_time, location or None, end_time


def _split_list_items(s: str) -> list[str]:
    return [x.strip() for x in re.split(r"[,;]|\s+and\s+", s) if x.strip()]


class OpenAIProvider(AIProvider):
    """Uses OpenAI API when OPENAI_API_KEY is set."""

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    def parse_recipe(
        self, free_text: str
    ) -> tuple[str | None, list[str] | None, list[str] | None, str | None, str | None, list[str] | None]:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self._api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Parse the user's recipe text. Respond with JSON only. Include: "
                            '"title", "ingredients" (array), "steps" (array). '
                            'Optionally include: "description", "cuisine", "share_with" (array of email addresses if the text mentions sharing the recipe with someone). '
                            "Use null for any field you cannot parse."
                        ),
                    },
                    {"role": "user", "content": free_text[:4000]},
                ],
                max_tokens=1024,
            )
            import json
            text = response.choices[0].message.content or "{}"
            text = text.strip().removeprefix("```json").removeprefix("```").strip()
            data = json.loads(text)
            title = data.get("title") or "Parsed Recipe"
            ingredients = data.get("ingredients") if isinstance(data.get("ingredients"), list) else []
            steps = data.get("steps") if isinstance(data.get("steps"), list) else []
            description = data.get("description") if isinstance(data.get("description"), str) else None
            cuisine = data.get("cuisine") if isinstance(data.get("cuisine"), str) else None
            share_with = data.get("share_with")
            if not isinstance(share_with, list):
                share_with = None
            else:
                share_with = [str(e).strip() for e in share_with if e and "@" in str(e)][:20]
            return title, ingredients or None, steps or None, description, cuisine, share_with or None
        except Exception:
            fallback = MockAIProvider()
            return fallback.parse_recipe(free_text)

    def parse_event(self, free_text: str) -> tuple[str, datetime, str | None, datetime | None]:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self._api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "Parse the user's event description. Respond with JSON only: {\"title\": \"...\", \"start_time\": \"ISO8601\", \"location\": \"...\" or null, \"end_time\": \"ISO8601\" or null}.",
                    },
                    {"role": "user", "content": free_text[:2000]},
                ],
                max_tokens=512,
            )
            import json
            text = response.choices[0].message.content or "{}"
            text = text.strip().removeprefix("```json").removeprefix("```").strip()
            data = json.loads(text)
            title = data.get("title") or "Parsed Event"
            st = data.get("start_time")
            if st:
                start_time = datetime.fromisoformat(st.replace("Z", "+00:00"))
                if start_time.tzinfo is None:
                    start_time = start_time.replace(tzinfo=timezone.utc)
            else:
                start_time = datetime.now(timezone.utc)
            location = data.get("location")
            et = data.get("end_time")
            end_time = None
            if et:
                end_time = datetime.fromisoformat(et.replace("Z", "+00:00"))
                if end_time.tzinfo is None:
                    end_time = end_time.replace(tzinfo=timezone.utc)
            return title, start_time, location, end_time
        except Exception:
            fallback = MockAIProvider()
            return fallback.parse_event(free_text)

    def assign_cuisine(self, recipe_text: str) -> str:
        """Infer cuisine from recipe title/ingredients/steps. OpenAI only."""
        import json
        from openai import OpenAI
        client = OpenAI(api_key=self._api_key)
        r = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Given a recipe (title, ingredients, steps), respond with a single cuisine label in JSON: {\"cuisine\": \"Italian\"}. Use one word or short phrase (e.g. Italian, Mexican, Japanese, French, American, Mediterranean).",
                },
                {"role": "user", "content": recipe_text[:3000]},
            ],
            max_tokens=64,
        )
        text = (r.choices[0].message.content or "{}").strip()
        if text.startswith("```"):
            text = re.sub(r"^```\w*\n?", "", text).rstrip("`")
        data = json.loads(text)
        return (data.get("cuisine") or "Unknown")[:100]

    def suggest_recipes_by_cuisine(self, cuisine: str) -> list[dict]:
        """Suggest recipe ideas for a cuisine. Returns list of {title, ingredients, steps}. OpenAI only."""
        import json
        from openai import OpenAI
        client = OpenAI(api_key=self._api_key)
        r = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Suggest 3 recipe ideas for the given cuisine. Respond with JSON only: {\"suggestions\": [{\"title\": \"...\", \"ingredients\": [\"...\"], \"steps\": [\"...\"]}, ...]}. Each suggestion has title, ingredients (array of strings), steps (array of strings).",
                },
                {"role": "user", "content": f"Cuisine: {cuisine}"},
            ],
            max_tokens=1024,
        )
        text = (r.choices[0].message.content or "{}").strip()
        if text.startswith("```"):
            text = re.sub(r"^```\w*\n?", "", text).rstrip("`")
        data = json.loads(text)
        suggestions = data.get("suggestions") or []
        return [s for s in suggestions if isinstance(s, dict)][:10]
