from fastapi import FastAPI, File, UploadFile, Form, Request, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from rag_utils import process_pdf, get_top_chunks
from llm_utils import summarize_with_llm, ask_question
from spellchecker import SpellChecker
from pymongo import MongoClient
from datetime import datetime, timedelta
from bson import ObjectId
import os
import requests
import pdfkit
import logging
import pickle
import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Specify wkhtmltopdf path for Windows
WKHTMLTOPDF_PATH = r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
config = pdfkit.configuration(wkhtmltopdf=WKHTMLTOPDF_PATH)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MONGO_URI = "mongodb+srv://garigemurali715:WKreAHP1TTgG7Vy8@paperglance.jmouwby.mongodb.net/?retryWrites=true&w=majority&appName=paperglance"
client = MongoClient(MONGO_URI)
db = client["paper_summarizer"]

papers_collection = db["papers"]
summaries_collection = db["summaries"]
chat_history_collection = db["chat_history"]
tokens_collection = db["tokens"]
users_collection = db["users"]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Secret Key
SECRET_KEY = "your-secret-key"

# Google Client ID
GOOGLE_CLIENT_ID = "273779716750-nlev0mrpjp544iuibke503qii5ma42n4.apps.googleusercontent.com"  # Replace with your Google Client ID

# Pydantic models
class LoginRequest(BaseModel):
    username: str
    password: str

class GoogleLoginRequest(BaseModel):
    token: str

class UserCreateRequest(BaseModel):
    username: str
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    username: str | None = None
    email: str | None = None
    bio: str | None = None

# Dependency to verify JWT tokens
async def verify_token(authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: user_id not found")

        token_doc = tokens_collection.find_one({"user_id": user_id, "token": token, "valid": True})
        if not token_doc:
            raise HTTPException(status_code=401, detail="Token is invalid or has been logged out")

        return user_id
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@app.post("/api/users")
async def create_user(request: UserCreateRequest):
    try:
        # Check if username or email already exists
        if users_collection.find_one({"username": request.username}):
            raise HTTPException(status_code=400, detail="Username already taken")
        if users_collection.find_one({"email": request.email}):
            raise HTTPException(status_code=400, detail="Email already in use")

        # Hash the password
        hashed_password = pwd_context.hash(request.password)
        user_data = {
            "username": request.username,
            "email": request.email,
            "password": hashed_password,
            "bio": "",
            "created_at": datetime.utcnow(),
        }
        result = users_collection.insert_one(user_data)
        return {"message": "User created successfully", "user_id": str(result.inserted_id)}
    except Exception as e:
        logger.error(f"User creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create user")
    
@app.post("/api/login")
async def login(request: LoginRequest):
    try:
        logger.debug(f"Login request received for username: {request.username}")

        # Step 1: Find the user
        user = users_collection.find_one({"username": request.username})
        if not user:
            logger.debug("User not found")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        logger.debug("User found")

        # Step 2: Verify password
        logger.debug("Verifying password")
        logger.debug(f"Stored password hash: {user['password']}")
        if not pwd_context.verify(request.password, user["password"]):
            logger.debug("Password verification failed")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        logger.debug("Password verified successfully")

        # Step 3: Invalidate existing tokens
        logger.debug("Invalidating existing tokens")
        tokens_collection.update_many(
            {"user_id": str(user["_id"]), "valid": True},
            {"$set": {"valid": False, "logged_out_at": datetime.utcnow()}}
        )
        logger.debug("Existing tokens invalidated")

        # Step 4: Generate new token
        logger.debug("Generating new token")
        token = jwt.encode(
            {"id": str(user["_id"]), "exp": datetime.utcnow() + timedelta(hours=1)},
            SECRET_KEY,
            algorithm="HS256"
        )
        logger.debug("New token generated")

        # Step 5: Store new token
        logger.debug("Storing new token")
        tokens_collection.insert_one({
            "user_id": str(user["_id"]),
            "token": token,
            "valid": True,
            "created_at": datetime.utcnow(),
        })
        logger.debug("New token stored")

        return {"token": token}
    except Exception as e:
        logger.error(f"Login failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to log in")

@app.post("/api/auth/google")
async def google_login(request: GoogleLoginRequest):
    try:
        idinfo = id_token.verify_oauth2_token(
            request.token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        email = idinfo["email"]
        username = email.split("@")[0]

        user = users_collection.find_one({"email": email})
        if not user:
            user_data = {
                "username": username,
                "email": email,
                "password": pwd_context.hash("google-auth-" + email),  # Dummy password
                "bio": "",
                "created_at": datetime.utcnow(),
            }
            user_result = users_collection.insert_one(user_data)
            user_id = str(user_result.inserted_id)
        else:
            user_id = str(user["_id"])

        tokens_collection.update_many(
            {"user_id": user_id, "valid": True},
            {"$set": {"valid": False, "logged_out_at": datetime.utcnow()}}
        )

        token = jwt.encode(
            {"id": user_id, "exp": datetime.utcnow() + timedelta(hours=1)},
            SECRET_KEY,
            algorithm="HS256"
        )

        tokens_collection.insert_one({
            "user_id": user_id,
            "token": token,
            "valid": True,
            "created_at": datetime.utcnow(),
        })

        return {"token": token}
    except ValueError as e:
        logger.error(f"Google login failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid Google token")
    except Exception as e:
        logger.error(f"Google login failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process Google login")

@app.post("/api/refresh")
async def refresh_token(user_id: str = Depends(verify_token), request: Request = None):
    try:
        token = request.headers.get("Authorization").split(" ")[1]
        tokens_collection.update_one(
            {"user_id": user_id, "token": token},
            {"$set": {"valid": False, "logged_out_at": datetime.utcnow()}}
        )

        new_token = jwt.encode(
            {"id": user_id, "exp": datetime.utcnow() + timedelta(hours=1)},
            SECRET_KEY,
            algorithm="HS256"
        )

        tokens_collection.insert_one({
            "user_id": user_id,
            "token": new_token,
            "valid": True,
            "created_at": datetime.utcnow(),
        })

        return {"token": new_token}
    except Exception as e:
        logger.error(f"Token refresh failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to refresh token")

@app.post("/api/logout")
async def logout(user_id: str = Depends(verify_token), authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[1]
        tokens_collection.update_one(
            {"user_id": user_id, "token": token},
            {"$set": {"valid": False, "logged_out_at": datetime.utcnow()}}
        )
        return {"message": "Successfully logged out"}
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to log out")

@app.get("/api/users/profile")
async def get_profile(user_id: str = Depends(verify_token)):
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "username": user["username"],
            "email": user["email"],
            "bio": user.get("bio", "")
        }
    except Exception as e:
        logger.error(f"Profile fetch failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")

@app.put("/api/users/update-profile")
async def update_profile(request: UpdateProfileRequest, user_id: str = Depends(verify_token)):
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        update_data = {}
        if request.username and request.username != user["username"]:
            existing_user = users_collection.find_one({"username": request.username})
            if existing_user:
                raise HTTPException(status_code=400, detail="Username already taken")
            update_data["username"] = request.username

        if request.email and request.email != user["email"]:
            existing_email = users_collection.find_one({"email": request.email})
            if existing_email:
                raise HTTPException(status_code=400, detail="Email already in use")
            update_data["email"] = request.email

        if request.bio is not None:
            update_data["bio"] = request.bio

        if update_data:
            users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})

        return {"message": "Profile updated successfully"}
    except Exception as e:
        logger.error(f"Profile update failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...), user_id: str = Depends(verify_token)):
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        chunks, index = process_pdf(file_path)
        if not chunks:
            raise HTTPException(status_code=400, detail="Failed to process PDF")
        summary = summarize_with_llm(chunks)
        paper_id = str(ObjectId())
        index_path = os.path.join(UPLOAD_DIR, f"{paper_id}_index.pkl")
        with open(index_path, "wb") as f:
            pickle.dump(index, f)
        paper_doc = {
            "user_id": user_id,
            "filename": file.filename,
            "filepath": file_path,
            "upload_date": datetime.utcnow(),
            "file_size": os.path.getsize(file_path),
            "status": "processed",
            "chunks": chunks,
            "index_path": index_path
        }
        paper_result = papers_collection.insert_one(paper_doc)
        summary_doc = {
            "paper_id": paper_result.inserted_id,
            "summary": summary,
            "created_at": datetime.utcnow(),
            "version": "initial"
        }
        summaries_collection.insert_one(summary_doc)
        formatted_date = datetime.utcnow().strftime("%m/%d/%Y")
        return {
            "paper_id": str(paper_result.inserted_id),
            "filename": file.filename,
            "summary": summary,
            "date": formatted_date
        }
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/api/summaries/")
async def summarize_pdf(file: UploadFile = File(...), title: str = Form(...), summary_length: str = Form("medium"), user_id: str = Depends(verify_token)):
    logger.debug(f"Received summary_length: {summary_length}")
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        chunks, index = process_pdf(file_path)
        if not chunks:
            raise HTTPException(status_code=400, detail="Failed to process PDF")
        summary = summarize_with_llm(chunks, summary_length.lower())
        paper_id = str(ObjectId())
        index_path = os.path.join(UPLOAD_DIR, f"{paper_id}_index.pkl")
        with open(index_path, "wb") as f:
            pickle.dump(index, f)
        paper_doc = {
            "user_id": user_id,
            "filename": file.filename,
            "title": title,
            "filepath": file_path,
            "upload_date": datetime.utcnow(),
            "file_size": os.path.getsize(file_path),
            "status": "processed",
            "chunks": chunks,
            "index_path": index_path
        }
        paper_result = papers_collection.insert_one(paper_doc)
        summary_doc = {
            "paper_id": paper_result.inserted_id,
            "summary": summary,
            "length": summary_length,
            "created_at": datetime.utcnow(),
            "version": "custom"
        }
        summaries_collection.insert_one(summary_doc)
        return {
            "_id": str(paper_result.inserted_id),
            "paper_id": str(paper_result.inserted_id),
            "title": title,
            "summary": summary,
            "advantages": [],
            "disadvantages": [],
            "insights": [],
            "created_at": paper_doc["upload_date"]
        }
    except Exception as e:
        logger.error(f"Summarize failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/summaries/")
async def get_summaries(user_id: str = Depends(verify_token), limit: int = 10):
    try:
        papers = papers_collection.find({"user_id": user_id}).sort("upload_date", -1).limit(limit)
        result = []
        seen_paper_ids = set()

        for paper in papers:
            paper_id = str(paper["_id"])
            if paper_id in seen_paper_ids:
                continue
            seen_paper_ids.add(paper_id)

            latest_summary = summaries_collection.find_one(
                {"paper_id": paper["_id"]},
                sort=[("created_at", -1)]
            )
            if latest_summary:
                summary_data = {
                    "_id": str(latest_summary["_id"]),
                    "paper_id": paper_id,
                    "title": paper.get("title", paper.get("filename", "Unknown")),
                    "summary": latest_summary["summary"],
                    "created_at": latest_summary["created_at"],
                    "version": latest_summary.get("version", "initial"),
                    "length": latest_summary.get("length", "medium")
                }
                summary_data["filename"] = paper.get("filename", "Unknown")
                summary_data["upload_date"] = paper.get("upload_date")

                chat_history = list(chat_history_collection.find({"paper_id": paper["_id"]}).sort("created_at", 1))
                summary_data["chat_history"] = [
                    {
                        "question": chat["question"],
                        "answer": chat["answer"],
                        "created_at": chat["created_at"]
                    } for chat in chat_history
                ]
                result.append(summary_data)

        return result
    except Exception as e:
        logger.error(f"Get summaries failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/summaries/{id}/chat")
async def chat_with_paper(id: str, question: str = Form(...), user_id: str = Depends(verify_token)):
    if not question.strip():
        raise HTTPException(status_code=422, detail="Question cannot be empty")
    if not id:
        raise HTTPException(status_code=400, detail="paper_id is required")
    
    logger.debug(f"Received question: {question}, paper_id: {id}")
    
    try:
        ObjectId(id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid paper_id format")
    
    try:
        paper = papers_collection.find_one({"_id": ObjectId(id), "user_id": user_id})
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")
        
        chunks = paper.get("chunks")
        index_path = paper.get("index_path")
        index = None
        if index_path and os.path.exists(index_path):
            with open(index_path, "rb") as f:
                index = pickle.load(f)
        
        if not chunks or not index:
            file_path = paper.get("filepath")
            if not os.path.exists(file_path):
                raise HTTPException(status_code=400, detail="PDF file not found")
            chunks, index = process_pdf(file_path)
            index_path = os.path.join(UPLOAD_DIR, f"{id}_index.pkl")
            with open(index_path, "wb") as f:
                pickle.dump(index, f)
            papers_collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": {"chunks": chunks, "index_path": index_path}}
            )
        
        top_chunks = get_top_chunks(question, chunks, index, top_k=3)
        answer = ask_question(question, top_chunks)
        
        chat_doc = {
            "paper_id": ObjectId(id),
            "question": question,
            "answer": answer,
            "created_at": datetime.utcnow()
        }
        logger.debug(f"Storing chat entry with paper_id: {id}, question: {question}")
        chat_history_collection.insert_one(chat_doc)
        
        return {"answer": answer}
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process question: {str(e)}")

@app.get("/api/history/{paper_id}")
async def get_paper_history(paper_id: str, user_id: str = Depends(verify_token)):
    try:
        ObjectId(paper_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid paper_id format")
    
    try:
        paper = papers_collection.find_one({"_id": ObjectId(paper_id), "user_id": user_id})
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")
        
        summary = summaries_collection.find_one({"paper_id": ObjectId(paper_id)})
        chat_history = list(chat_history_collection.find({"paper_id": ObjectId(paper_id)}).sort("created_at", 1))
        
        result = {
            "paper_id": paper_id,
            "filename": paper.get("filename", "Unknown"),
            "upload_date": paper.get("upload_date"),
            "summary": summary.get("summary", "") if summary else "",
            "summary_created_at": summary.get("created_at") if summary else "",
            "chat_history": [
                {
                    "question": chat["question"],
                    "answer": chat["answer"],
                    "created_at": chat["created_at"]
                } for chat in chat_history
            ]
        }
        return result
    except Exception as e:
        logger.error(f"Get paper history failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/summaries/download-summary/")
async def download_summary(request: Request, user_id: str = Depends(verify_token)):
    try:
        logger.debug("Received request to download summary")
        data = await request.json()
        summary_text = data.get("summary_text", "")
        logger.debug(f"Request data: {data}")
        if not summary_text:
            raise HTTPException(status_code=400, detail="No summary text provided")

        html_content = f"""
        <html>
            <head>
                <title>Research Summary</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                    h1 {{ color: #2c3e50; }}
                    .section {{ margin-bottom: 20px; }}
                    .section-title {{ font-weight: bold; color: #3498db; }}
                </style>
            </head>
            <body>
                <h1>Research Summary</h1>
                <div class="section">
                    {summary_text}
                </div>
            </body>
        </html>
        """

        options = {
            'encoding': 'UTF-8',
            'quiet': '',
            'page-size': 'A4',
            'margin-top': '0.75in',
            'margin-right': '0.75in',
            'margin-bottom': '0.75in',
            'margin-left': '0.75in',
        }

        pdf_path = os.path.join(UPLOAD_DIR, "summary.pdf")
        logger.debug(f"Generating PDF at: {pdf_path}")
        pdfkit.from_string(html_content, pdf_path, options=options, configuration=config)
        logger.debug("PDF generated successfully")

        return FileResponse(pdf_path, media_type='application/pdf', filename="research_summary.pdf")
    except Exception as e:
        logger.error(f"Error in download-summary: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@app.delete("/api/summaries/{summary_id}")
async def delete_summary(summary_id: str, user_id: str = Depends(verify_token)):
    try:
        summary = summaries_collection.find_one({"_id": ObjectId(summary_id)})
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        paper = papers_collection.find_one({"_id": ObjectId(summary["paper_id"]), "user_id": user_id})
        if not paper:
            raise HTTPException(status_code=403, detail="Not authorized to delete this summary")

        chat_history_collection.delete_many({"paper_id": summary["paper_id"]})
        papers_collection.delete_one({"_id": ObjectId(summary["paper_id"])})
        
        result = summaries_collection.delete_one({"_id": ObjectId(summary_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Summary not found")
        return {"message": "Summary and chat history deleted successfully"}
    except Exception as e:
        logger.error(f"Delete summary failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class WordRequest(BaseModel):
    word: str

@app.post("/api/define")
async def define_word(request: WordRequest):
    spell = SpellChecker()
    corrected_word = spell.correction(request.word.lower())

    try:
        response = requests.get(f"https://api.dictionaryapi.dev/api/v2/entries/en/{corrected_word}")
        if response.status_code == 200:
            definitions = []
            data = response.json()
            for meaning in data[0].get("meanings", []):
                part_of_speech = meaning.get("partOfSpeech", "")
                for definition in meaning.get("definitions", []):
                    definitions.append({
                        "partOfSpeech": part_of_speech,
                        "definition": definition.get("definition", ""),
                        "example": definition.get("example", "")
                    })
            return {
                "word": request.word,
                "suggested": corrected_word if corrected_word != request.word else "",
                "results": definitions
            }
        else:
            return JSONResponse(status_code=404, content={
                "error": f"No definition found for '{request.word}'"
            })
    except Exception as e:
        logger.error(f"Define word failed: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})