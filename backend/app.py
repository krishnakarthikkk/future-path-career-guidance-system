import os
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from datetime import datetime

from database import db, get_db_status
from auth import hash_password, check_password, generate_token, token_required
from engine import analyze_profile
from pdf_generator import generate_student_report

app = Flask(__name__)
# Enable CORS for frontend compatibility
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# ----------------- AUTH ROUTES -----------------

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No input data provided.'}), 400
        
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not name or not email or not password:
        return jsonify({'message': 'Name, email, and password are required.'}), 400
        
    # Email unique validation
    existing_user = db.users.find_one({'email': email.strip().lower()})
    if existing_user:
        return jsonify({'message': 'Email address already registered.'}), 400
        
    hashed_pwd = hash_password(password)
    user_doc = {
        'name': name.strip(),
        'email': email.strip().lower(),
        'password': hashed_pwd,
        'created_at': datetime.utcnow()
    }
    
    result = db.users.insert_one(user_doc)
    user_id = result.inserted_id
    
    token = generate_token(user_id)
    return jsonify({
        'token': token,
        'user': {
            'id': str(user_id),
            'name': user_doc['name'],
            'email': user_doc['email']
        }
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Invalid payload.'}), 400
        
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password are required.'}), 400
        
    user = db.users.find_one({'email': email.strip().lower()})
    if not user or not check_password(password, user['password']):
        return jsonify({'message': 'Incorrect email or password.'}), 401
        
    token = generate_token(user['_id'])
    return jsonify({
        'token': token,
        'user': {
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email']
        }
    }), 200

@app.route('/api/auth/user', methods=['GET'])
@token_required
def get_user(current_user):
    return jsonify({
        'id': str(current_user['_id']),
        'name': current_user['name'],
        'email': current_user['email']
    }), 200

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    # Token invalidation is handled on client-side by deleting the token.
    return jsonify({'message': 'Successfully logged out.'}), 200

# ----------------- STUDENT PROFILE ROUTES -----------------

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    user_id = str(current_user['_id'])
    profile = db.student_profiles.find_one({'_id': user_id})
    
    if not profile:
        # Return default structure to let client prefill
        return jsonify({
            'personal_info': {
                'name': current_user['name'],
                'email': current_user['email'],
                'college': '',
                'branch': '',
                'year': '1'
            },
            'academic_info': {
                'cgpa': '',
                'tenth_percentage': '',
                'twelfth_percentage': ''
            },
            'technical_skills': {
                'programming_languages': [],
                'skills': [],
                'projects': [],
                'internships': [],
                'certifications': [],
                'hackathons': []
            },
            'soft_skills': {
                'communication': 3,
                'leadership': 3,
                'teamwork': 3,
                'problem_solving': 3,
                'public_speaking': 3
            },
            'extracurriculars': {
                'ncc': False,
                'nss': False,
                'sports': [],
                'volunteering': [],
                'club_activities': [],
                'event_management': False,
                'achievements': []
            },
            'interests': []
        }), 200
        
    return jsonify(profile), 200

@app.route('/api/profile', methods=['POST', 'PUT'])
@token_required
def save_profile(current_user):
    user_id = str(current_user['_id'])
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'Profile data is missing.'}), 400
        
    profile_doc = {
        '_id': user_id,
        'personal_info': data.get('personal_info', {}),
        'academic_info': data.get('academic_info', {}),
        'technical_skills': data.get('technical_skills', {}),
        'soft_skills': data.get('soft_skills', {}),
        'extracurriculars': data.get('extracurriculars', {}),
        'interests': data.get('interests', []),
        'updated_at': datetime.utcnow()
    }
    
    db.student_profiles.update_one({'_id': user_id}, {'$set': profile_doc}, upsert=True)
    return jsonify({'message': 'Profile saved successfully.', 'profile': profile_doc}), 200

# ----------------- CAREER ENGINE ROUTES -----------------

@app.route('/api/recommendations', methods=['GET', 'POST'])
@token_required
def get_recommendations(current_user):
    user_id = str(current_user['_id'])
    profile = db.student_profiles.find_one({'_id': user_id})
    
    if not profile or not profile.get('personal_info', {}).get('college'):
        return jsonify({
            'message': 'Profile incomplete. Please fill out your details (under My Profile) before running recommendations.'
        }), 400
        
    # Run the rule engine
    recommendations = analyze_profile(profile)
    
    # Save the computed recommendations in DB
    rec_doc = {
        'user_id': user_id,
        'recommendations': recommendations,
        'updated_at': datetime.utcnow()
    }
    db.career_recommendations.update_one({'user_id': user_id}, {'$set': rec_doc}, upsert=True)
    
    return jsonify({'recommendations': recommendations}), 200

@app.route('/api/skill-gap', methods=['GET'])
@token_required
def get_skill_gap(current_user):
    user_id = str(current_user['_id'])
    
    # Attempt to retrieve stored recommendations, otherwise generate new
    rec_record = db.career_recommendations.find_one({'user_id': user_id})
    if rec_record:
        recommendations = rec_record['recommendations']
    else:
        profile = db.student_profiles.find_one({'_id': user_id})
        if not profile or not profile.get('personal_info', {}).get('college'):
            return jsonify({'message': 'Please complete your profile to generate a skill gap analysis.'}), 400
        recommendations = analyze_profile(profile)
        
    # Build list of missing skills and course matches for UI rendering
    gap_data = []
    for rec in recommendations:
        gap_data.append({
            'career_id': rec.get('career_id'),
            'career_title': rec.get('title'),
            'score': rec.get('score'),
            'missing_skills': rec.get('missing_skills', []),
            'suggested_courses': rec.get('suggested_courses', []),
            'required_certifications': rec.get('required_certifications', []),
            'dataset_support': rec.get('dataset_support', 0)
        })
        
    return jsonify({'gap_analysis': gap_data}), 200

@app.route('/api/careers', methods=['GET'])
def get_careers():
    # Browse-only catalog endpoints
    careers = db.career_details.find({})
    return jsonify(careers), 200

@app.route('/api/careers/<career_id>', methods=['GET'])
def get_career_by_id(career_id):
    career = db.career_details.find_one({'id': career_id})
    if not career:
        return jsonify({'message': 'Career path not found.'}), 404
    return jsonify(career), 200

# ----------------- REPORTING & UTILITIES -----------------

@app.route('/api/reports/download', methods=['GET'])
@token_required
def download_report(current_user):
    user_id = str(current_user['_id'])
    profile = db.student_profiles.find_one({'_id': user_id})
    
    if not profile or not profile.get('personal_info', {}).get('college'):
        return jsonify({'message': 'Please complete your profile before downloading reports.'}), 400
        
    rec_record = db.career_recommendations.find_one({'user_id': user_id})
    if rec_record:
        recommendations = rec_record['recommendations']
    else:
        recommendations = analyze_profile(profile)
        
    pdf_buffer = generate_student_report(profile, recommendations)
    
    safe_name = profile.get('personal_info', {}).get('name', 'Student').replace(' ', '_')
    filename = f"Career_Report_{safe_name}.pdf"
    
    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=filename,
        mimetype='application/pdf'
    )

@app.route('/api/settings/status', methods=['GET'])
def get_status():
    return jsonify(get_db_status()), 200

@app.route('/api/settings/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No input data provided.'}), 400
        
    old_pwd = data.get('currentPassword')
    new_pwd = data.get('newPassword')
    
    if not old_pwd or not new_pwd:
        return jsonify({'message': 'Current password and new password are required.'}), 400
        
    user = db.users.find_one({'_id': str(current_user['_id'])})
    if not check_password(old_pwd, user['password']):
        return jsonify({'message': 'Incorrect current password.'}), 400
        
    hashed_pwd = hash_password(new_pwd)
    db.users.update_one({'_id': str(current_user['_id'])}, {'$set': {'password': hashed_pwd}})
    return jsonify({'message': 'Password updated successfully.'}), 200

if __name__ == '__main__':
    # Run backend on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
