from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, decode_token
from datetime import timedelta
from bson import ObjectId
from dotenv import load_dotenv
import hashlib
import base64
import os

# loading variables from .env
load_dotenv()
mongo_pass = os.getenv('mongo')
secret = os.getenv('secret')

# constants
DB_CLUSTER = 'cluster0'
DATABASE_NAME = 'HIVE'
MONGO_USERNAME = 'abhigyanpandeycug_db_user'

# Flask initialization
app = Flask(__name__)
CORS(app, supports_credentials=True, origins='*', allow_headers=['Content-Type', 'Authorization','Set-Cookie'], methods=['GET', 'POST', 'OPTIONS'])
bcrypt = Bcrypt(app)

# Database initialization
app.config["MONGO_URI"] = f"mongodb+srv://{MONGO_USERNAME}:{mongo_pass}@{DB_CLUSTER}.c0bqrqu.mongodb.net/{DATABASE_NAME}?retryWrites=true&w=majority&appName={DB_CLUSTER}"

try:
    mongo = PyMongo(app)
    users = mongo.db.users
    profile = mongo.db.profile
except Exception as e:
    print(f'Error {e},\nError Connecting to database')
    exit()

# Flask API config (for token generation)
app.config["JWT_SECRET_KEY"] = secret
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token"

# Helper Function to extract username from cookie
def get_username_from_jwt():
    access_token = request.cookies.get("access_token")
    if not access_token:
        return jsonify({"message": "Missing token"}), 401
    try:
        decoded_token = decode_token(access_token)
        user_id = decoded_token["sub"]
        user = users.find_one({"_id": ObjectId(user_id)}, {"username": 1, "email": 1, "_id": 0})
        if not user:
            return jsonify({"message": "User not found"}), 404
        return jsonify({"username": user["username"], "email": user["email"]}), 200
    except Exception as e:
        return jsonify({"message": "Invalid token", "error": str(e)}), 401


# Signup Route
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not email or not password or not username:
        return jsonify({"message": "Username, email, and password are required"}), 400

    if users.find_one({"email": email}):
        return jsonify({"message": "User with this email already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    user_data = {
        "username": username,
        "email": email,
        "password": hashed_password,
    }
    users.insert_one(user_data)

    return jsonify({"message": "User registered successfully"}), 201


# Login Route
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = users.find_one({"email": data["email"]})

    if not user:
        return jsonify({"message": "Invalid Email", "cust_error": 40101}), 401
    if not bcrypt.check_password_hash(user["password"], data["password"]):
        return jsonify({"message": "Invalid Password", "cust_error": 40102}), 401

    access_token = create_access_token(identity=str(user["_id"]))
    email = user["email"]
    email_hash = hashlib.sha256(email.encode()).digest()
    session_token = base64.urlsafe_b64encode(email_hash).decode()

    response = make_response(jsonify({
        "message": "Login successful",
        "session_token": session_token
    }))
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=False,
        samesite='Lax',
        path='/'
    )
    return response


# Logout Route
@app.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"message": "Logout successful"})
    response.delete_cookie("access_token", path='/')
    return response


# Check Authentication Route (simplified, no JWT decorator)
@app.route("/auth-check", methods=["GET"])
def auth_check():
    access_token = request.cookies.get("access_token")
    if not access_token:
        return jsonify({"message": "Not Authenticated"}), 401
    try:
        decoded_token = decode_token(access_token)
        user_id = decoded_token["sub"]
        return jsonify({"message": "Authenticated", "user_id": user_id}), 200
    except Exception as e:
        return jsonify({"message": "Invalid token", "error": str(e)}), 401


# Return username for a given cookie token
@app.route("/getusername", methods=["GET"])
def getusername():
    return get_username_from_jwt()


if __name__ == "__main__":
    app.run(debug=True)
