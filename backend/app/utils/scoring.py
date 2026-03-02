def calculate_financial_score(total_spent: float, total_budget: float, alerts_count: int) -> int:
    if total_budget <= 0:
        return 50
    usage = min(total_spent / total_budget, 2.0)
    score = 100 - int(usage * 40) - alerts_count * 5
    return max(0, min(100, score))
