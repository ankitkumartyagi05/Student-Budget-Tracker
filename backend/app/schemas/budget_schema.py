from pydantic import BaseModel, Field


class BudgetIn(BaseModel):
    id: str
    month: str
    category: str
    monthlyLimit: float = Field(gt=0)
class BudgetOut(BaseModel):
    id: str
    month: str
    category: str
    monthlyLimit: float
class CategoryTotalOut(BaseModel):
    category: str
    total: float
class MonthlyTotalOut(BaseModel):
    month: str
    total: float
class CategoryAlertOut(BaseModel):
    category: str
    percentageSpent: float


class PredictedCategoryOut(BaseModel):
    category: str
    predictedTotal: float
    trend: str


class AIPlanOut(BaseModel):
    month: str
    predictedTotalSpend: float
    predictedByCategory: list[PredictedCategoryOut]
    recommendedBudgetTotal: float
    projectedSavings: float
    confidence: str
    recommendations: list[str]
    source: str
