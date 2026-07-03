import os
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

class LocalCollection:
    def __init__(self, file_path):
        self.file_path = file_path
        if not os.path.exists(file_path):
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'w') as f:
                json.dump([], f)
                
    def _read(self):
        try:
            if not os.path.exists(self.file_path):
                return []
            with open(self.file_path, 'r') as f:
                return json.load(f)
        except Exception:
            return []
            
    def _write(self, data):
        with open(self.file_path, 'w') as f:
            json.dump(data, f, default=str, indent=2)
            
    def find_one(self, query):
        data = self._read()
        for item in data:
            if self._matches(item, query):
                return item
        return None
        
    def find(self, query=None):
        data = self._read()
        if not query:
            return data
        return [item for item in data if self._matches(item, query)]
        
    def insert_one(self, doc):
        data = self._read()
        if '_id' not in doc:
            doc['_id'] = str(uuid.uuid4())
            
        # Convert datetime objects to ISO strings
        for k, v in doc.items():
            if isinstance(v, datetime):
                doc[k] = v.isoformat()
            elif isinstance(v, dict):
                # Shallow convert nested datetime
                for nk, nv in v.items():
                    if isinstance(nv, datetime):
                        v[nk] = nv.isoformat()
        data.append(doc)
        self._write(data)
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc['_id'])
        
    def update_one(self, query, update_op, upsert=False):
        data = self._read()
        matched_idx = -1
        for i, item in enumerate(data):
            if self._matches(item, query):
                matched_idx = i
                break
                
        if matched_idx == -1:
            if upsert:
                new_doc = query.copy()
                if '$set' in update_op:
                    new_doc.update(update_op['$set'])
                self.insert_one(new_doc)
            return
            
        doc = data[matched_idx]
        if '$set' in update_op:
            for k, v in update_op['$set'].items():
                if '.' in k:
                    parts = k.split('.')
                    curr = doc
                    for part in parts[:-1]:
                        if part not in curr:
                            curr[part] = {}
                        curr = curr[part]
                    curr[parts[-1]] = v
                else:
                    doc[k] = v
                    
        # Convert datetime objects to string
        for k, v in doc.items():
            if isinstance(v, datetime):
                doc[k] = v.isoformat()
            elif isinstance(v, dict):
                for nk, nv in v.items():
                    if isinstance(nv, datetime):
                        v[nk] = nv.isoformat()
                        
        data[matched_idx] = doc
        self._write(data)
        
    def delete_one(self, query):
        data = self._read()
        for i, item in enumerate(data):
            if self._matches(item, query):
                data.pop(i)
                self._write(data)
                break
                
    def _matches(self, item, query):
        for k, v in query.items():
            if k not in item:
                return False
            # Basic matching (support exact or dict match)
            if item[k] != v:
                return False
        return True
        
    def count_documents(self, query):
        return len(self.find(query))

def _sync_catalog_collection(collection, records):
    for record in records:
        record_id = record.get('id')
        if not record_id:
            continue
        collection.update_one({'id': record_id}, {'$set': record}, upsert=True)

class LocalDatabase:
    def __init__(self, database_dir):
        self.database_dir = database_dir
        self.users = LocalCollection(os.path.join(database_dir, 'users.json'))
        self.student_profiles = LocalCollection(os.path.join(database_dir, 'student_profiles.json'))
        self.career_recommendations = LocalCollection(os.path.join(database_dir, 'career_recommendations.json'))
        self.career_details = LocalCollection(os.path.join(database_dir, 'career_details.json'))
        self.courses = LocalCollection(os.path.join(database_dir, 'courses.json'))
        
        # Seed local collections if empty
        self._seed_local_collections()
        
    def _seed_local_collections(self):
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        
        careers_file = os.path.join(backend_dir, 'data', 'careers.json')
        if os.path.exists(careers_file):
            with open(careers_file, 'r') as f:
                _sync_catalog_collection(self.career_details, json.load(f))

        courses_file = os.path.join(backend_dir, 'data', 'courses.json')
        if os.path.exists(courses_file):
            with open(courses_file, 'r') as f:
                _sync_catalog_collection(self.courses, json.load(f))

# Initialize database
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "career_analyzer")

# Local database folder
LOCAL_DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'database'))

db = None
is_local_db = False

if MONGO_URI:
    try:
        # 3 second timeout for quick fallback if Atlas is offline
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        client.server_info()  # Forces a call to verify connection
        db = client[MONGO_DB_NAME]
        is_local_db = False
        print(">>> Database Connection: MongoDB Atlas connected.")
        
        # Seed MongoDB Atlas collections if empty
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        careers_file = os.path.join(backend_dir, 'data', 'careers.json')
        if os.path.exists(careers_file):
            with open(careers_file, 'r') as f:
                _sync_catalog_collection(db.career_details, json.load(f))
                print(">>> Synced Career Details with catalog data.")

        courses_file = os.path.join(backend_dir, 'data', 'courses.json')
        if os.path.exists(courses_file):
            with open(courses_file, 'r') as f:
                _sync_catalog_collection(db.courses, json.load(f))
                print(">>> Synced Courses with catalog data.")
    except Exception as e:
        print(f">>> Database Connection: MongoDB Atlas connection failed ({e}).")
        print(">>> Falling back to Local JSON database.")
        db = LocalDatabase(LOCAL_DB_DIR)
        is_local_db = True
else:
    print(">>> Database Connection: MONGO_URI not configured. Using Local JSON database.")
    db = LocalDatabase(LOCAL_DB_DIR)
    is_local_db = True

def get_db_status():
    return {
        "mode": "local_json" if is_local_db else "mongodb_atlas",
        "database_name": MONGO_DB_NAME if not is_local_db else "local_json_db",
        "path": LOCAL_DB_DIR if is_local_db else "cloud"
    }
