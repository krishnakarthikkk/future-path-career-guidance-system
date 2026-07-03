import csv
import os
import re
from database import db

# Mapping of career IDs to interests
CAREER_INTERESTS_MAP = {
    "software_engineer": ["Software Development"],
    "ai_engineer": ["Artificial Intelligence", "Data Science"],
    "data_analyst": ["Data Science", "Software Development"],
    "data_scientist": ["Data Science", "Technology"],
    "data_engineer": ["Data Science", "Software Development"],
    "web_developer": ["Software Development", "Technology"],
    "backend_developer": ["Software Development", "Technology"],
    "java_developer": ["Software Development", "Technology"],
    "cloud_engineer": ["Software Development", "Technology"],
    "cyber_security_analyst": ["Technology", "Defence"],
    "civil_engineer": ["Engineering", "Infrastructure"],
    "mechanical_engineer": ["Engineering", "Manufacturing"],
    "teacher": ["Teaching", "Education"],
    "sales_executive": ["Management", "Entrepreneurship"],
    "defence_officer": ["Defence", "Government Jobs"],
    "police_officer": ["Defence", "Government Jobs"],
    "operations_manager": ["Management"],
    "civil_services": ["Government Jobs"],
    "hr_executive": ["Management"],
    "ngo_manager": ["Management", "Teaching"],
    "pr_officer": ["Management"],
    "social_worker": ["Teaching"],
    "business_analyst": ["Management", "Data Science"],
    "product_manager": ["Management", "Entrepreneurship"],
    "entrepreneur": ["Entrepreneurship", "Management"]
}

# Mapping of career IDs to preferred soft skills and their weightage (Summing up to 20)
CAREER_SOFT_SKILLS_MAP = {
    "software_engineer": {"problem_solving": 12, "teamwork": 8},
    "ai_engineer": {"problem_solving": 12, "communication": 8},
    "data_analyst": {"problem_solving": 10, "communication": 10},
    "data_scientist": {"problem_solving": 12, "communication": 8},
    "data_engineer": {"problem_solving": 10, "teamwork": 5, "communication": 5},
    "web_developer": {"problem_solving": 10, "teamwork": 10},
    "backend_developer": {"problem_solving": 12, "teamwork": 8},
    "java_developer": {"problem_solving": 12, "teamwork": 8},
    "cloud_engineer": {"problem_solving": 8, "communication": 6, "teamwork": 6},
    "cyber_security_analyst": {"problem_solving": 10, "leadership": 5, "teamwork": 5},
    "civil_engineer": {"leadership": 6, "teamwork": 7, "problem_solving": 7},
    "mechanical_engineer": {"problem_solving": 10, "teamwork": 5, "leadership": 5},
    "teacher": {"communication": 8, "public_speaking": 6, "teamwork": 6},
    "sales_executive": {"communication": 10, "public_speaking": 5, "teamwork": 5},
    "defence_officer": {"leadership": 10, "teamwork": 5, "problem_solving": 5},
    "police_officer": {"leadership": 10, "teamwork": 5, "problem_solving": 5},
    "operations_manager": {"leadership": 8, "communication": 6, "teamwork": 6},
    "civil_services": {"leadership": 8, "communication": 6, "problem_solving": 6},
    "hr_executive": {"communication": 10, "teamwork": 6, "leadership": 4},
    "ngo_manager": {"communication": 8, "teamwork": 6, "leadership": 6},
    "pr_officer": {"communication": 10, "public_speaking": 10},
    "social_worker": {"communication": 10, "teamwork": 10},
    "business_analyst": {"problem_solving": 8, "communication": 8, "teamwork": 4},
    "product_manager": {"leadership": 8, "communication": 6, "problem_solving": 6},
    "entrepreneur": {"leadership": 10, "problem_solving": 5, "communication": 5}
}

TECHNICAL_CAREERS = {
    "software_engineer",
    "ai_engineer",
    "data_analyst",
    "data_scientist",
    "data_engineer",
    "web_developer",
    "backend_developer",
    "java_developer",
    "cloud_engineer",
    "cyber_security_analyst",
    "civil_engineer",
    "mechanical_engineer",
    "business_analyst",
    "product_manager",
}

DATASET_FILE = os.path.join(os.path.dirname(__file__), "datasets", "career_recommender.csv")
_DATASET_ROWS = None
_CAREER_SIGNATURES = None
_DATASET_GROUPS = None

CAREER_ALIAS_HINTS = {
    "software_engineer": [
        "software", "developer", "programmer", "coding", "application", "web", "backend",
        "front end", "frontend", "full stack", "cloud", "devops", "system engineer",
        "computer software", "java developer", "python developer"
    ],
    "ai_engineer": [
        "ai", "machine learning", "deep learning", "data science", "data scientist",
        "data engineer", "artificial intelligence", "ml", "analytics"
    ],
    "data_analyst": [
        "data analyst", "analyst", "business intelligence", "sql", "reporting",
        "research", "statistics", "data analysis"
    ],
    "data_scientist": [
        "data scientist", "machine learning", "ml", "analytics", "python", "statistics"
    ],
    "data_engineer": [
        "data engineer", "etl", "pipeline", "warehouse", "sql", "cloud"
    ],
    "web_developer": [
        "web developer", "frontend", "front end", "html", "css", "javascript"
    ],
    "backend_developer": [
        "back end developer", "backend developer", "api", "server", "database", "node"
    ],
    "java_developer": [
        "java developer", "software developer", "application developer", "jsp", "spring"
    ],
    "cloud_engineer": [
        "cloud engineer", "aws", "azure", "devops", "infrastructure", "docker"
    ],
    "cyber_security_analyst": [
        "cyber security analyst", "security analyst", "network security", "ethical hacking"
    ],
    "civil_engineer": [
        "civil engineer", "civil design", "structural engineer", "construction"
    ],
    "mechanical_engineer": [
        "mechanical engineer", "mechanical design", "manufacturing", "design engineer"
    ],
    "teacher": [
        "teacher", "teaching", "assistant professor", "lecturer", "education"
    ],
    "sales_executive": [
        "sales executive", "sales", "business development", "marketing"
    ],
    "business_analyst": [
        "business analyst", "business analysis", "consultant", "requirements",
        "process analyst", "product analyst"
    ],
    "operations_manager": [
        "operations", "manager", "admin", "supply chain", "project manager",
        "assistant manager", "operations processor"
    ],
    "civil_services": [
        "civil service", "government", "public service", "ias", "ips", "administration",
        "officer"
    ],
    "hr_executive": [
        "hr", "human resource", "recruiter", "talent acquisition", "people manager"
    ],
    "ngo_manager": [
        "ngo", "social worker", "volunteer", "community", "welfare", "service"
    ],
    "pr_officer": [
        "pr", "communication", "content", "media", "journalist", "copywriter",
        "marketing", "public relations"
    ],
    "social_worker": [
        "teacher", "teaching", "professor", "lecturer", "assistant professor", "education"
    ],
    "entrepreneur": [
        "entrepreneur", "startup", "founder", "business development", "sales",
        "self employed", "business owner"
    ],
    "product_manager": [
        "product manager", "program manager", "project manager", "roadmap", "delivery"
    ],
    "defence_officer": [
        "defence", "army", "military", "ncc", "armed forces", "police", "security"
    ],
    "police_officer": [
        "police", "law enforcement", "security", "investigation", "defence"
    ]
}

def _normalize_text(value):
    if value is None:
        return ""
    return re.sub(r"[^a-z0-9]+", " ", str(value).lower()).strip()

def _split_multi_value(value):
    if not value:
        return []
    parts = re.split(r"[;,/|]", str(value))
    return [part.strip() for part in parts if part and part.strip()]

def _row_value(row, needle):
    for key, value in row.items():
        if needle.lower() in key.lower():
            return value
    return ""

def _tokenize(*values):
    tokens = set()
    for value in values:
        if value is None:
            continue
        text = _normalize_text(value)
        if not text:
            continue
        for token in text.split():
            if len(token) > 1:
                tokens.add(token)
    return tokens

def _parse_cgpa(value):
    try:
        parsed = float(str(value).strip())
    except (TypeError, ValueError):
        return 0.0
    if parsed > 10:
        return round(parsed / 10.0, 2)
    return parsed

def _feature_score(source_tokens, target_tokens):
    if not target_tokens:
        return 0.0
    overlap = source_tokens.intersection(target_tokens)
    return len(overlap) / len(target_tokens)

def _career_signature(career):
    career_id = career.get("id", "")
    title = career.get("title", "")
    description = career.get("description", "")
    required_skills = career.get("required_skills", [])
    certifications = career.get("required_certifications", [])
    interests = CAREER_INTERESTS_MAP.get(career_id, [])
    soft_skills = list(CAREER_SOFT_SKILLS_MAP.get(career_id, {}).keys())
    aliases = CAREER_ALIAS_HINTS.get(career_id, [])

    return {
        "career_id": career_id,
        "title": _tokenize(title, career_id, *aliases),
        "skills": _tokenize(*required_skills),
        "interests": _tokenize(*interests, title),
        "education": _tokenize(description, title, *aliases),
        "certifications": _tokenize(*certifications, *aliases),
        "soft_skills": _tokenize(*soft_skills),
    }

def _load_dataset_rows():
    if not os.path.exists(DATASET_FILE):
        return []

    with open(DATASET_FILE, "r", newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        rows = []
        for row in reader:
            job_title = _row_value(row, "first Job title")
            job_title = job_title.strip()
            if not job_title or job_title.upper() == "NA":
                continue

            interests = _row_value(row, "What are your interests?")
            skills = _row_value(row, "What are your skills ?")
            course = _row_value(row, "What was your course in UG?")
            specialization = _row_value(row, "What is your UG specialization?")
            certifications = _row_value(row, "please specify your certificate course title")
            masters = _row_value(row, "Have you done masters after undergraduation?")

            rows.append({
                "raw_row": row,
                "job_title": job_title,
                "features": {
                    "title": _tokenize(job_title),
                    "skills": _tokenize(*_split_multi_value(skills)),
                    "interests": _tokenize(*_split_multi_value(interests)),
                    "education": _tokenize(course, specialization, masters),
                    "certifications": _tokenize(*_split_multi_value(certifications)),
                    "all": _tokenize(job_title, skills, interests, course, specialization, certifications, masters),
                }
            })
        return rows

def _get_career_signatures():
    global _CAREER_SIGNATURES
    if _CAREER_SIGNATURES is None:
        _CAREER_SIGNATURES = [_career_signature(career) for career in db.career_details.find({})]
    return _CAREER_SIGNATURES

def _get_dataset_rows():
    global _DATASET_ROWS
    if _DATASET_ROWS is None:
        _DATASET_ROWS = _load_dataset_rows()
    return _DATASET_ROWS

def _assign_dataset_rows_to_careers():
    careers = _get_career_signatures()
    dataset_rows = _get_dataset_rows()
    grouped_rows = {career["career_id"]: [] for career in careers}

    for row in dataset_rows:
        best_career_id = None
        best_score = 0.0
        row_features = row["features"]

        for career in careers:
            signature = career
            score = 0.0
            score += 4.0 * _feature_score(row_features["title"], signature["title"])
            score += 5.0 * _feature_score(row_features["skills"], signature["skills"])
            score += 3.0 * _feature_score(row_features["interests"], signature["interests"])
            score += 2.0 * _feature_score(row_features["education"], signature["education"])
            score += 1.0 * _feature_score(row_features["certifications"], signature["certifications"])
            score += 1.0 * _feature_score(row_features["all"], signature["soft_skills"])

            if score > best_score:
                best_score = score
                best_career_id = signature["career_id"]

        if best_career_id and best_score >= 0.5:
            grouped_rows[best_career_id].append({**row, "match_score": best_score})

    return grouped_rows

def _get_dataset_groups():
    global _DATASET_GROUPS
    if _DATASET_GROUPS is None:
        _DATASET_GROUPS = _assign_dataset_rows_to_careers()
    return _DATASET_GROUPS

def _profile_tokens(profile):
    personal = profile.get("personal_info", {})
    academic = profile.get("academic_info", {})
    technical = profile.get("technical_skills", {})
    soft_skills = profile.get("soft_skills", {})
    extracurriculars = profile.get("extracurriculars", {})
    interests = profile.get("interests", [])

    project_text = [
        f"{project.get('title', '')} {project.get('description', '')}"
        for project in technical.get("projects", [])
        if isinstance(project, dict)
    ]
    internship_text = [
        f"{intern.get('role', '')} {intern.get('company', '')} {intern.get('description', '')}"
        for intern in technical.get("internships", [])
        if isinstance(intern, dict)
    ]

    active_soft_skills = [skill for skill, value in soft_skills.items() if int(value or 0) >= 4]
    extracurricular_tags = []
    for key, value in extracurriculars.items():
        if isinstance(value, bool) and value:
            extracurricular_tags.append(key)
        elif isinstance(value, list):
            extracurricular_tags.extend(value)

    return {
        "title": _tokenize(personal.get("branch"), personal.get("college"), personal.get("year")),
        "skills": _tokenize(*technical.get("skills", []), *technical.get("programming_languages", [])),
        "interests": _tokenize(*interests),
        "education": _tokenize(
            academic.get("cgpa"),
            academic.get("tenth_percentage"),
            academic.get("twelfth_percentage")
        ),
        "certifications": _tokenize(*technical.get("certifications", [])),
        "all": _tokenize(
            personal.get("branch"),
            personal.get("college"),
            *technical.get("skills", []),
            *technical.get("programming_languages", []),
            *technical.get("certifications", []),
            *interests,
            *project_text,
            *internship_text,
            *active_soft_skills,
            *extracurricular_tags
        ),
        "cgpa": _parse_cgpa(academic.get("cgpa")),
    }

def _dataset_career_signal(profile, career_id, career_title):
    grouped_rows = _get_dataset_groups()
    career_rows = grouped_rows.get(career_id, [])
    if not career_rows:
        return 0, None, 0

    profile_features = _profile_tokens(profile)
    scored_rows = []
    for row in career_rows:
        row_features = row["features"]
        similarity = 0.0
        similarity += 4.0 * _feature_score(profile_features["title"], row_features["title"])
        similarity += 5.0 * _feature_score(profile_features["skills"], row_features["skills"])
        similarity += 3.0 * _feature_score(profile_features["interests"], row_features["interests"])
        similarity += 2.0 * _feature_score(profile_features["education"], row_features["education"])
        similarity += 1.0 * _feature_score(profile_features["certifications"], row_features["certifications"])

        if profile_features["cgpa"] and row.get("raw_row"):
            row_cgpa = _parse_cgpa(_row_value(row["raw_row"], "What was the average CGPA or Percentage obtained in under graduation?"))
            if row_cgpa:
                similarity += max(0.0, 1.0 - min(abs(profile_features["cgpa"] - row_cgpa), 1.0))

        if similarity > 0:
            scored_rows.append((similarity, row))

    if not scored_rows:
        return 0, None, len(career_rows)

    scored_rows.sort(key=lambda item: item[0], reverse=True)
    top_rows = scored_rows[:5]
    avg_similarity = sum(score for score, _ in top_rows) / len(top_rows)
    dataset_score = min(round((avg_similarity / 16.0) * 100), 100)
    best_row = top_rows[0][1]

    best_row_title = best_row["job_title"].strip()
    reason = (
        f"Matched against {len(career_rows)} similar alumni profiles in the dataset, "
        f"including a profile that led to {best_row_title}."
    )

    return dataset_score, reason, len(career_rows)

def analyze_profile(profile):
    """
    Evaluates student profile and recommends top careers with compatibility scores.
    """
    # Fetch all career details and courses from database
    careers = db.career_details.find({})
    courses_cursor = db.courses.find({})
    
    # Organize courses by career
    courses_by_career = {}
    for course in courses_cursor:
        cid = course.get('career_id')
        if cid not in courses_by_career:
            courses_by_career[cid] = []
        courses_by_career[cid].append(course)
        
    recommendations = []
    
    # Extract profile details
    academic = profile.get('academic_info', {})
    technical = profile.get('technical_skills', {})
    soft_skills = profile.get('soft_skills', {})
    extracurriculars = profile.get('extracurriculars', {})
    interests = profile.get('interests', [])
    
    # Prepare normalized student skills list
    student_skills = [s.strip().lower() for s in technical.get('skills', []) if s]
    student_langs = [l.strip().lower() for l in technical.get('programming_languages', []) if l]
    all_student_skills_set = set(student_skills + student_langs)
    
    student_cgpa = float(academic.get('cgpa', 0.0) or 0.0)
    
    for career in careers:
        career_id = career.get('id')
        career_title = career.get('title')
        required_skills = career.get('required_skills', [])
        
        score = 0
        reasons = []
        
        # 1. Academic Match (Max 15%)
        # Technical/Analytical careers value CGPA more strictly
        is_technical_career = career_id in TECHNICAL_CAREERS
        if is_technical_career:
            if student_cgpa >= 8.5:
                score += 15
                reasons.append("Exceptional CGPA (≥ 8.5) meets the high academic standard for engineering/analytics.")
            elif student_cgpa >= 7.5:
                score += 12
                reasons.append("Strong academic performance with a CGPA ≥ 7.5.")
            elif student_cgpa >= 6.5:
                score += 8
                reasons.append("Moderate CGPA (≥ 6.5) meets the baseline requirement for technical roles.")
            else:
                score += 3
                reasons.append("Low CGPA (< 6.5); technical roles generally seek higher academic standing.")
        else:
            # General administrative careers
            if student_cgpa >= 7.5:
                score += 15
                reasons.append("Outstanding academic background with CGPA ≥ 7.5.")
            elif student_cgpa >= 6.0:
                score += 12
                reasons.append("Good academic baseline with CGPA ≥ 6.0.")
            else:
                score += 6
                reasons.append("Passing academic profile suitable for entrance exams but may limit some profiles.")

        # 2. Technical Skills Match (Max 35%)
        career_skills_lower = [s.lower() for s in required_skills]
        matching_skills = all_student_skills_set.intersection(career_skills_lower)
        
        skill_ratio = len(matching_skills) / len(required_skills) if required_skills else 0
        skill_score = round(skill_ratio * 25)
        score += skill_score
        
        if len(matching_skills) > 0:
            reasons.append(f"Possess {len(matching_skills)} of {len(required_skills)} core skills: {', '.join([s for s in required_skills if s.lower() in matching_skills])}.")
        else:
            reasons.append("Lacking direct core technical skills in your profile for this career.")
            
        # Projects and Internships bonus (Max 10%)
        # Analyze project descriptions/titles or internship records
        projects = technical.get('projects', [])
        internships = technical.get('internships', [])
        hackathons = technical.get('hackathons', [])
        certifications = technical.get('certifications', [])
        
        matching_projects_count = 0
        # Simple keyword checks in projects and internships
        career_keywords = [career_title.lower()] + [s.lower() for s in required_skills[:3]]
        
        for proj in projects:
            title_desc = f"{proj.get('title', '')} {proj.get('description', '')}".lower()
            if any(kw in title_desc for kw in career_keywords):
                matching_projects_count += 1
                
        matching_intern_count = 0
        for intern in internships:
            title_role = f"{intern.get('role', '')} {intern.get('company', '')} {intern.get('description', '')}".lower()
            if any(kw in title_role for kw in career_keywords):
                matching_intern_count += 1
                
        if matching_intern_count > 0:
            score += 5
            reasons.append(f"Earned internship experience related to this sector ({matching_intern_count} instance).")
        elif matching_projects_count > 0:
            score += 4
            reasons.append(f"Completed {matching_projects_count} project(s) aligning with the technical scope.")
            
        if len(hackathons) > 0 and is_technical_career:
            score += 3
            reasons.append("Hackathon participation demonstrates strong application skills and coding agility.")
        elif len(certifications) > 0:
            score += 2
            reasons.append("Certified learning records support professional credentials.")

        # 3. Soft Skills Match (Max 20%)
        pref_soft_skills = CAREER_SOFT_SKILLS_MAP.get(career_id, {})
        soft_score = 0
        for skill, weight in pref_soft_skills.items():
            # Get skill value (range 1-5, defaults to 3 if not filled)
            val = int(soft_skills.get(skill, 3) or 3)
            # Scale value to match weightage
            soft_score += (val / 5.0) * weight
            
        score += round(soft_score)
        
        # Soft skills reason
        strong_softs = [sk.replace('_', ' ').capitalize() for sk, w in pref_soft_skills.items() if int(soft_skills.get(sk, 3) or 3) >= 4]
        if strong_softs:
            reasons.append(f"Highly compatible soft skills: {' and '.join(strong_softs)}.")

        # 4. Extracurriculars and Core alignment (Max 15%)
        extra_score = 0
        has_ncc = extracurriculars.get('ncc', False)
        has_nss = extracurriculars.get('nss', False)
        sports = extracurriculars.get('sports', [])
        volunteering = extracurriculars.get('volunteering', [])
        club_activities = extracurriculars.get('club_activities', [])
        event_mgmt = extracurriculars.get('event_management', False)
        
        if career_id in ["defence_officer", "police_officer"]:
            if has_ncc:
                extra_score += 8
                reasons.append("NCC participation develops discipline and physical readiness crucial for defence/police services.")
            if len(sports) > 0:
                extra_score += 7
                reasons.append(f"Active in sports ({', '.join(sports[:2])}) aligning with standard fitness metrics.")
        elif career_id in ["social_worker", "ngo_manager", "hr_executive", "pr_officer", "civil_services"]:
            if has_nss:
                extra_score += 8
                reasons.append("NSS participation shows dedication to community development and public services.")
            if len(volunteering) > 0:
                extra_score += 7
                reasons.append("Volunteering work highlights strong community empathy and civic engagement.")
        elif career_id in ["operations_manager", "product_manager", "entrepreneur", "hr_executive"]:
            if event_mgmt:
                extra_score += 8
                reasons.append("Event Management experience indicates practical project coordination and crowd management capabilities.")
            if len(club_activities) > 0:
                extra_score += 7
                reasons.append(f"Active member of student clubs ({', '.join(club_activities[:2])}) showing peer collaboration.")
        else:
            # Default extracurricular check
            if len(club_activities) > 0 or len(sports) > 0:
                extra_score += 10
                reasons.append("Active involvement in student clubs and sports indicates a well-rounded student profile.")
            else:
                extra_score += 5
                
        score += min(extra_score, 15)

        # 5. Career Interests Match (Max 15%)
        career_interests = CAREER_INTERESTS_MAP.get(career_id, [])
        interest_overlap = [i for i in interests if i in career_interests]
        if interest_overlap:
            score += 15
            reasons.append(f"Direct alignment with self-reported interests: '{interest_overlap[0]}'.")
        else:
            # Indirect interest check
            score += 2
            
        # 6. Dataset similarity boost (uses the uploaded CSV as a real signal)
        dataset_score, dataset_reason, dataset_support = _dataset_career_signal(profile, career_id, career_title)
        if dataset_reason:
            reasons.append(dataset_reason)

        final_score = min(max(round((score * 0.7) + (dataset_score * 0.3)), 5), 100)
        
        # Identify missing skills
        missing_skills = [s for s in required_skills if s.lower() not in all_student_skills_set]
        
        # Get suggested courses
        suggested_courses = courses_by_career.get(career_id, [])
        
        recommendations.append({
            "career_id": career_id,
            "title": career_title,
            "score": final_score,
            "reasons": reasons,
            "missing_skills": missing_skills,
            "suggested_courses": suggested_courses,
            "average_salary": career.get('average_salary'),
            "hiring_companies": career.get('hiring_companies'),
            "required_certifications": career.get('required_certifications'),
            "dataset_support": dataset_support
        })
        
    # Sort recommendations by compatibility score descending
    recommendations.sort(key=lambda x: x['score'], reverse=True)
    return recommendations[:10]  # Return top 10
