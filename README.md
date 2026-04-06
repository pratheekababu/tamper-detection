# 🛡️ Academic Tamper Detection System (ATDS)

A full-stack platform for detecting academic data tampering using **SHA-256 cryptographic hashing**, with role-based dashboards for Students, Faculty, and Admins.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Hashing | SHA-256 (Node.js `crypto` module) |
| PDF | PDFKit |
| Frontend | Vanilla HTML5 + CSS3 + JavaScript |
| Security | Rate limiting, CORS, bcrypt password hashing |

---

## 📁 Project Structure

```
academic-tamper-detection/
├── backend/
│   ├── models/
│   │   ├── User.js              # User schema (student/faculty/admin)
│   │   ├── Student.js           # Student schema with SHA-256 hash fields
│   │   ├── AuditLog.js          # Audit log + EditRequest schemas
│   │   └── Announcement.js      # Announcement schema
│   ├── routes/
│   │   ├── auth.js              # Login, logout, /me, change-password
│   │   ├── students.js          # Student CRUD + integrity verify
│   │   ├── faculty.js           # Faculty edit requests
│   │   ├── admin.js             # Admin: approve/reject, integrity check, user management
│   │   ├── announcements.js     # Announcements CRUD
│   │   ├── audit.js             # Audit log viewing
│   │   └── pdf.js               # PDF generation (transcript + announcement)
│   ├── middleware/
│   │   └── auth.js              # JWT authenticate, authorize, auditLog middleware
│   ├── utils/
│   │   ├── tamperDetection.js   # SHA-256 hash generation, verification, repair
│   │   └── seed.js              # Database seeder with demo data
│   ├── server.js                # Express app entry point
│   ├── .env                     # Environment variables
│   └── package.json
└── frontend/
    ├── css/
    │   └── dashboard.css        # Dark theme design system
    ├── js/
    │   └── common.js            # API helper, auth, toast, sidebar builder
    └── pages/
        ├── login.html           # Login page with role selector
        ├── student-dashboard.html
        ├── faculty-dashboard.html
        └── admin-dashboard.html
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/academic_tamper_detection
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_change_this
JWT_EXPIRE=24h
BCRYPT_ROUNDS=12
```

### 3. Seed Database

```bash
cd backend
node utils/seed.js
```

This creates:
- 1 Admin, 2 Faculty, 5 Students
- Sample semester records with SHA-256 hashes
- Announcements

### 4. Start the Server

```bash
node server.js
# or for development:
npx nodemon server.js
```

### 5. Open in Browser

```
http://localhost:5000
```

---

## � Vercel Deployment

This project has been refactored for Vercel deployment with serverless functions.

### What's Been Done
- ✅ Frontend moved to `public/` directory
- ✅ Basic API routes converted to serverless functions (`/api/auth/*`)
- ✅ Database connection utilities created
- ✅ Authentication middleware adapted for serverless
- ✅ `vercel.json` configuration added
- ✅ Root `package.json` created

### Remaining Work
The following API routes still need conversion to serverless functions:
- `/api/students/*` - Student management
- `/api/faculty/*` - Faculty operations
- `/api/admin/*` - Admin functions
- `/api/announcements/*` - Announcements
- `/api/audit/*` - Audit logs
- `/api/pdf/*` - PDF generation

### Deployment Steps
1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set Environment Variables** in Vercel Dashboard:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - JWT signing secret
   - `JWT_EXPIRE` - JWT expiration time
   - `BCRYPT_ROUNDS` - Password hashing rounds

4. **Access your app** at the provided Vercel URL

### Local Development (Vercel)
```bash
npm install
npm run dev
```

### API Endpoints (Converted)
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password
- `GET /api/health` - Health check

### Architecture Notes
- Serverless functions connect to MongoDB on each request
- Authentication uses JWT tokens stored in headers
- Static files served from `public/` directory
- CORS enabled for cross-origin requests

---

## �🔑 Demo Login Credentials

| Role | User ID | Password |
|------|---------|----------|
| Admin | `ADMIN001` | `admin123` |
| Faculty | `FAC001` | `faculty123` |
| Student | `STU2021001` | `student123` |

---

## 🛡️ Tamper Detection System

### How SHA-256 Hashing Works

```
Student Data → JSON Canonical Form → SHA-256 Hash → Stored in DB
                                                        ↓
On Access: Recompute Hash → Compare → Match = VERIFIED / Mismatch = TAMPERED
```

### Fields Included in Hash
```json
{
  "studentId": "STU2021001",
  "cgpa": 8.83,
  "totalCredits": 70,
  "semesterRecords": [...],
  "program": "B.Tech",
  "branch": "Computer Science",
  "batch": 2021
}
```

### Hash History
Every change records:
- Previous hash
- New hash
- Who made the change
- Timestamp
- Change type (`initial`, `approved_edit`, `repair`)

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT tokens, 24h expiry |
| Password Storage | bcrypt with 12 salt rounds |
| Rate Limiting | 100 req/15min global, 10 req/15min on `/auth/` |
| Role Authorization | Middleware guards all routes |
| Audit Logging | Every significant action logged |
| Tamper Detection | SHA-256 hash on all student records |
| CORS | Configurable origin |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/change-password` | Change password |

### Students (Faculty/Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List all students |
| GET | `/api/students/me` | Student's own profile |
| GET | `/api/students/:id` | Get student by ID |
| GET | `/api/students/:id/integrity` | Verify integrity |

### Faculty
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/faculty/edit-request` | Submit edit request |
| GET | `/api/faculty/edit-requests` | My edit requests |
| GET | `/api/faculty/dashboard-stats` | Stats |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard-stats` | Platform overview |
| GET | `/api/admin/edit-requests` | All requests |
| POST | `/api/admin/edit-requests/:id/approve` | Approve request |
| POST | `/api/admin/edit-requests/:id/reject` | Reject request |
| POST | `/api/admin/integrity-check` | Run full check |
| POST | `/api/admin/repair-hash/:id` | Repair tampered hash |
| POST | `/api/admin/users` | Create user |
| GET | `/api/admin/users` | List users |
| PATCH | `/api/admin/users/:id/toggle-status` | Activate/deactivate |

### PDF
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pdf/transcript` | Student transcript PDF |
| GET | `/api/pdf/announcement/:id` | Announcement PDF |

### Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit/logs` | Full audit trail |
| GET | `/api/audit/summary` | Stats summary |

---

## 🎨 Dashboard Features

### Student Dashboard
- CGPA ring animation with performance grade
- SHA-256 hash display and integrity status
- Semester-wise GPA table
- Subject-level grade breakdown
- PDF transcript download with integrity certificate
- Announcements with PDF download

### Faculty Dashboard  
- Student roster with search
- Student detail modal with hash verification
- Edit request submission form (semester GPA, credits)
- Request status tracking (pending/approved/rejected)

### Admin Dashboard
- Platform-wide statistics
- Critical alert monitoring
- Student/Faculty user management (create, activate/deactivate)
- Edit request review with approve/reject + notes
- Full integrity check across all records with repair tool
- Filterable audit log with severity indicators
- Announcement management with multi-role targeting

---

## 🧪 Testing Tamper Detection

To test the tamper detection system:

1. Login as Admin → Integrity Check → Run Full Check (should show all verified)
2. Manually edit a document in MongoDB:
   ```js
   db.students.updateOne({studentId:"STU2021001"}, {$set:{cgpa:10.0}})
   ```
3. Run integrity check again — the record will show as **TAMPERED**
4. Use "Repair Hash" to recompute and restore verified status

---

## 📄 PDF Generation

The system generates two types of PDFs via PDFKit:

1. **Student Transcript** — includes profile, CGPA, semester records, subject grades, and a SHA-256 integrity certificate
2. **Announcement PDF** — formatted announcement with institution header and priority badge

---

## 🔄 Edit Request Workflow

```
Faculty → Submit Edit Request (with reason)
              ↓
Admin → Reviews request (sees changes, original data)
              ↓
    [Approve]         [Reject]
        ↓                 ↓
  Changes Applied    Request Closed
  Hash Recomputed    Faculty Notified
  Audit Log Created  Audit Log Created
```

---

## 📊 Audit Log Events

| Event | Severity |
|-------|----------|
| LOGIN / LOGOUT | low |
| VIEW_STUDENT | low |
| PDF_GENERATED | low |
| EDIT_REQUEST_CREATED | medium |
| USER_CREATED | medium |
| PASSWORD_CHANGED | medium |
| EDIT_REQUEST_APPROVED | high |
| EDIT_REQUEST_REJECTED | medium |
| DATA_MODIFIED | high |
| USER_DEACTIVATED | high |
| TAMPER_DETECTED | critical |
| INTEGRITY_CHECK | low/high |
