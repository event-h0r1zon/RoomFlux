from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import images, sessions
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(title="Deckd Flux API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,             # Allow cookies/authorization headers
    allow_methods=["*"],                # Allow all HTTP methods
    allow_headers=["*"],                # Allow all headers
)

# Include routers
app.include_router(images.router, prefix="/api/v1/images", tags=["images"])
app.include_router(sessions.router, prefix="/api/v1", tags=["sessions"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Deckd Flux API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
