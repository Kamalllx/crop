from typing import Optional
from pydantic import BaseModel, Field

class CropQuery(BaseModel):
    State_Name: str = Field(description="Name of the state")
    District_Name: str = Field(description="Name of the district")
    Crop_Year: int = Field(description="Year of the crop")
    Season: str = Field(description="Season for the crop, e.g. Kharif, Rabi, Summer")
    Crop: str = Field(description="Name of the crop")
    Area: float = Field(description="Cultivated area in hectares")
