from datetime import datetime
import json
from urllib import request

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.models.budget import Budget
from app.models.expense import Expense
from app.schemas.budget_schema import AIPlanOut, PredictedCategoryOut


def _month_from_date(value: str) -> str:
    return value[:7]


def _next_month(month: str) -> str:
    year, mon = month.split("-")
    year_i = int(year)
    mon_i = int(mon)
    if mon_i == 12:
        return f"{year_i + 1}-01"
    return f"{year_i}-{mon_i + 1:02d}"


def _linear_projection(series: list[float]) -> tuple[float, str, str]:
    if not series:
        return 0.0, "low", "flat"
    if len(series) == 1:
        return max(0.0, round(series[0], 2)), "low", "flat"

    x = list(range(len(series)))
    y = series
    x_mean = sum(x) / len(x)
    y_mean = sum(y) / len(y)

    denominator = sum((xi - x_mean) ** 2 for xi in x)
    if denominator == 0:
        prediction = y[-1]
        slope = 0.0
    else:
        slope = sum((xi - x_mean) * (yi - y_mean) for xi, yi in zip(x, y)) / denominator
        intercept = y_mean - slope * x_mean
        prediction = intercept + slope * len(series)

    trend = "up" if slope > 0.5 else "down" if slope < -0.5 else "flat"
    confidence = "high" if len(series) >= 6 else "medium" if len(series) >= 3 else "low"
    return max(0.0, round(prediction, 2)), confidence, trend


def _extract_json_object(text: str) -> dict | None:
    raw = text.strip()
    if not raw:
        return None

    if raw.startswith("```"):
        parts = raw.split("```")
        for part in parts:
            candidate = part.strip()
            if candidate.startswith("json"):
                candidate = candidate[4:].strip()
            if candidate.startswith("{") and candidate.endswith("}"):
                try:
                    parsed = json.loads(candidate)
                    if isinstance(parsed, dict):
                        return parsed
                except json.JSONDecodeError:
                    continue

    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            parsed = json.loads(raw[start : end + 1])
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            return None
    return None


def _sanitize_plan_payload(payload: dict, fallback: AIPlanOut, source: str) -> AIPlanOut:
    try:
        categories = payload.get("predictedByCategory", [])
        valid_categories: list[PredictedCategoryOut] = []
        if isinstance(categories, list):
            for item in categories:
                if not isinstance(item, dict):
                    continue
                category = str(item.get("category", "Other"))
                predicted_total = float(item.get("predictedTotal", 0.0))
                trend = str(item.get("trend", "flat"))
                valid_categories.append(
                    PredictedCategoryOut(
                        category=category,
                        predictedTotal=round(max(predicted_total, 0.0), 2),
                        trend=trend,
                    )
                )

        recommendations_raw = payload.get("recommendations", [])
        recommendations: list[str] = []
        if isinstance(recommendations_raw, list):
            recommendations = [str(item) for item in recommendations_raw if str(item).strip()][:8]

        month = str(payload.get("month", fallback.month))
        predicted_total_spend = round(float(payload.get("predictedTotalSpend", fallback.predictedTotalSpend)), 2)
        recommended_budget_total = round(float(payload.get("recommendedBudgetTotal", fallback.recommendedBudgetTotal)), 2)
        projected_savings = round(float(payload.get("projectedSavings", fallback.projectedSavings)), 2)
        confidence = str(payload.get("confidence", fallback.confidence))

        return AIPlanOut(
            month=month,
            predictedTotalSpend=max(predicted_total_spend, 0.0),
            predictedByCategory=valid_categories,
            recommendedBudgetTotal=max(recommended_budget_total, 0.0),
            projectedSavings=max(projected_savings, 0.0),
            confidence=confidence,
            recommendations=recommendations or fallback.recommendations,
            source=source,
        )
    except Exception:
        return fallback


def _call_openai(prompt: str) -> dict | None:
    if not settings.openai_api_key:
        return None

    body = {
        "model": settings.ai_model,
        "messages": [
            {
                "role": "system",
                "content": "You are a financial planning assistant. Return only valid JSON.",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }
    req = request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.openai_api_key}",
        },
        method="POST",
    )
    with request.urlopen(req, timeout=settings.ai_request_timeout_seconds) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    content = payload.get("choices", [{}])[0].get("message", {}).get("content", "")
    return _extract_json_object(content)


def _call_gemini(prompt: str) -> dict | None:
    if not settings.gemini_api_key:
        return None

    model = settings.ai_model or "gemini-1.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.gemini_api_key}"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2},
    }
    req = request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req, timeout=settings.ai_request_timeout_seconds) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    text = (
        payload.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    )
    return _extract_json_object(text)


def _local_plan(db: Session, user_id: str = "local-user", history_months: int = 6) -> AIPlanOut:
    rows = (
        db.query(Expense.date, Expense.category, Expense.amount)
        .filter(Expense.user_id == user_id)
        .order_by(Expense.date)
        .all()
    )

    monthly_map: dict[str, float] = {}
    category_monthly_map: dict[str, dict[str, float]] = {}

    for date, category, amount in rows:
        month = _month_from_date(date)
        monthly_map[month] = monthly_map.get(month, 0.0) + float(amount)
        if category not in category_monthly_map:
            category_monthly_map[category] = {}
        category_monthly_map[category][month] = category_monthly_map[category].get(month, 0.0) + float(amount)

    months_sorted = sorted(monthly_map.keys())
    if history_months > 0:
        months_sorted = months_sorted[-history_months:]

    monthly_series = [round(monthly_map[m], 2) for m in months_sorted]
    predicted_total, confidence, total_trend = _linear_projection(monthly_series)

    predicted_categories: list[PredictedCategoryOut] = []
    for category, month_map in category_monthly_map.items():
        series = [round(month_map.get(m, 0.0), 2) for m in months_sorted] if months_sorted else []
        predicted_value, _, trend = _linear_projection(series)
        if predicted_value > 0:
            predicted_categories.append(
                PredictedCategoryOut(
                    category=category,
                    predictedTotal=round(predicted_value, 2),
                    trend=trend,
                )
            )

    predicted_categories.sort(key=lambda item: item.predictedTotal, reverse=True)

    current_month_budget = db.query(func.sum(Budget.monthly_limit)).filter(Budget.user_id == user_id).scalar()
    budget_total = float(current_month_budget or 0.0)

    if budget_total > 0:
        recommended_budget_total = max(round(budget_total * 0.95, 2), round(predicted_total * 1.03, 2))
    else:
        recommended_budget_total = round(predicted_total * 1.10, 2)

    projected_savings = round(max(recommended_budget_total - predicted_total, 0.0), 2)

    recommendations: list[str] = []
    if predicted_total == 0:
        recommendations.append("Add at least 2-3 months of expense data for stronger AI predictions.")
    if total_trend == "up":
        recommendations.append("Spending trend is rising; cap non-essential categories by 10% next month.")
    elif total_trend == "down":
        recommendations.append("Spending trend is improving; keep current controls and move surplus to savings.")
    else:
        recommendations.append("Spending trend is stable; focus on category-level optimization for better savings.")

    for item in predicted_categories[:2]:
        if item.trend == "up":
            recommendations.append(
                f"Category '{item.category}' is trending up; set a tighter limit around {round(item.predictedTotal * 0.9, 2)}."
            )

    recommendations.append(
        f"Target a monthly savings buffer of {projected_savings} based on current forecast and recommended budget."
    )

    base_month = months_sorted[-1] if months_sorted else datetime.utcnow().strftime("%Y-%m")
    plan_month = _next_month(base_month)

    return AIPlanOut(
        month=plan_month,
        predictedTotalSpend=round(predicted_total, 2),
        predictedByCategory=predicted_categories,
        recommendedBudgetTotal=recommended_budget_total,
        projectedSavings=projected_savings,
        confidence=confidence,
        recommendations=recommendations,
        source="local",
    )


def generate_ai_plan(
    db: Session,
    user_id: str = "local-user",
    history_months: int = 6,
    provider_override: str | None = None,
) -> AIPlanOut:
    local_plan = _local_plan(db, user_id=user_id, history_months=history_months)

    provider = (provider_override or settings.ai_provider or "local").strip().lower()
    if provider not in {"openai", "gemini"}:
        return local_plan

    prompt = (
        "Use this baseline financial plan and improve recommendations. Return ONLY JSON with keys: "
        "month, predictedTotalSpend, predictedByCategory (array of {category,predictedTotal,trend}), "
        "recommendedBudgetTotal, projectedSavings, confidence, recommendations (array of strings). "
        f"Baseline plan: {local_plan.model_dump_json()}"
    )

    try:
        llm_payload = _call_openai(prompt) if provider == "openai" else _call_gemini(prompt)
        if isinstance(llm_payload, dict):
            return _sanitize_plan_payload(llm_payload, local_plan, source=provider)
    except Exception:
        fallback_payload = local_plan.model_dump()
        fallback_payload["source"] = f"fallback-{provider}"
        return AIPlanOut(**fallback_payload)

    fallback_payload = local_plan.model_dump()
    fallback_payload["source"] = f"fallback-{provider}"
    return AIPlanOut(**fallback_payload)
