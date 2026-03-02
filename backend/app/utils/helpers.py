def normalize_shares(total_amount: float, shares: list[float]) -> list[float]:
    if not shares:
        return []
    total_share = sum(shares)
    if total_share <= 0:
        equal = total_amount / len(shares)
        return [round(equal, 2) for _ in shares]
    return [round((s / total_share) * total_amount, 2) for s in shares]

def generate_budget_alerts(category_totals: dict[str, float], budget_limits: dict[str, float]) -> list[dict[str, float | str]]:
    alerts = []
    for category, limit in budget_limits.items():
        if limit <= 0:
            continue
        spent = category_totals.get(category, 0.0)
        percentage = (spent / limit) * 100
        if percentage >= 80:
            alerts.append({'category': category, 'percentageSpent': round(percentage, 2)})
    return sorted(alerts, key=lambda a: float(a['percentageSpent']), reverse=True)
