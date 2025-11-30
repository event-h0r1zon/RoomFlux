from fastapi import FastAPI
from app.routers import images
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(title="Deckd Flux API")

# Include routers
app.include_router(images.router, prefix="/api/v1/images", tags=["images"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Deckd Flux API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
