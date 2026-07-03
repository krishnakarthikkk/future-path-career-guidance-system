import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from database import db

# Load secret key from environment
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-career-recommendation-key-2026")

def hash_password(password):
    # Hash plain text password using bcrypt
    salt = bcrypt.gensalt(12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def check_password(password, hashed_password):
    # Verify a password against its bcrypt hash
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def generate_token(user_id):
    # Generate JWT authentication token valid for 7 days
    try:
        payload = {
            'exp': datetime.utcnow() + timedelta(days=7),
            'iat': datetime.utcnow(),
            'sub': str(user_id)
        }
        return jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    except Exception as e:
        return str(e)

def decode_token(token):
    # Decode JWT token to retrieve the user ID (subject)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['sub']
    except jwt.ExpiredSignatureError:
        return 'Signature expired. Please log in again.'
    except jwt.InvalidTokenError:
        return 'Invalid token. Please log in again.'

def token_required(f):
    # Decorator to ensure endpoint requires valid Authorization Bearer token
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Expects "Bearer <token>"
            except IndexError:
                return jsonify({'message': 'Invalid authorization header format.'}), 401
                
        if not token:
            return jsonify({'message': 'Token is missing.'}), 401
            
        decoded_result = decode_token(token)
        
        # Check if the result was an error string
        if isinstance(decoded_result, str) and (decoded_result.startswith('Signature') or decoded_result.startswith('Invalid')):
            return jsonify({'message': decoded_result}), 401
            
        # Fetch current user from database
        current_user = db.users.find_one({'_id': decoded_result})
        if not current_user:
            return jsonify({'message': 'User not found.'}), 401
            
        # Remove sensitive password hash from user context
        if 'password' in current_user:
            del current_user['password']
            
        return f(current_user, *args, **kwargs)
        
    return decorated
