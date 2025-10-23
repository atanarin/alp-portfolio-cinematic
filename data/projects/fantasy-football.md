Fantasy Football Web App

A full-stack fantasy football platform that allows users to create leagues, draft teams, manage rosters, and track live scores in real time. Built with React + Flask + MySQL, designed for scalability, and deployable on AWS (Beanstalk, RDS, and CloudFront).

------------------------------------------------------------

Features

User & Authentication
- Secure signup/login with hashed passwords
- Role-based access (admin, player, guest)
- Session persistence across browser reloads

League Management
- Create and join leagues
- Team creation and roster editing
- Invite other users via email or league code

Live Data
- Real-time score updates using SSE/WebSockets
- Automatic data refresh from external APIs (e.g., player stats)
- Optimized caching with Redis or in-memory store

Frontend (React + Vite)
- Responsive, modern UI built with Tailwind or MUI
- State management via React Query / Redux
- Dynamic components for league dashboard, drafts, and standings

Backend (Flask)
- RESTful API endpoints
- JWT or cookie-based authentication
- Data validation with Marshmallow or Pydantic
- ORM using SQLAlchemy

Database (MySQL or PostgreSQL)
- Normalized schema for users, leagues, teams, players, and matches
- Relationships managed via SQLAlchemy models
- Seed scripts for test data

Deployment
- Flask app served via Gunicorn + Nginx
- Frontend built and hosted on AWS S3 + CloudFront or Vercel
- Backend deployed via AWS Elastic Beanstalk
- RDS for database
- Optional CI/CD using GitHub Actions

------------------------------------------------------------

Architecture Overview

frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.tsx
│   └── vite.config.ts
│
backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── migrations/
│   └── wsgi.py
│
.env
requirements.txt
package.json

------------------------------------------------------------

Installation & Setup

Clone the Repository
git clone https://github.com/<your-username>/fantasy-football.git
cd fantasy-football

Set Up Backend (Flask)
cd backend
python -m venv .venv
source .venv/bin/activate   # (or .venv\Scripts\activate on Windows)
pip install -r requirements.txt

Create a .env file in backend/
DATABASE_URL=mysql+pymysql://ffuser:ffpass@127.0.0.1:3306/ffdb
SECRET_KEY=your_secret_key
FLASK_ENV=development

Run database migrations:
flask db upgrade

Run the server:
flask run

Set Up Frontend (React + Vite)
cd ../frontend
npm install
npm run dev

------------------------------------------------------------

Environment Variables

DATABASE_URL           MySQL/PostgreSQL connection string
SECRET_KEY             Flask secret key for sessions
FLASK_ENV              Environment mode (development / production)
API_BASE_URL           Backend API endpoint
AWS_ACCESS_KEY_ID      AWS credentials for deployment
AWS_SECRET_ACCESS_KEY  AWS secret key
REDIS_URL              Redis instance URL (optional for caching/live updates)

------------------------------------------------------------

API Endpoints (Sample)

Method  Endpoint            Description
POST    /auth/register      Register a new user
POST    /auth/login         Authenticate user
GET     /leagues            List all leagues
POST    /leagues            Create a league
GET     /leagues/<id>       Get league details
POST    /teams              Create a team
GET     /players            Get player data

------------------------------------------------------------

Development Workflow

1. Backend changes:
   flask db migrate -m "add new table"
   flask db upgrade

2. Frontend changes:
   npm run dev
   flask run

3. Testing:
   pytest
   npm run test

4. Linting:
   black backend/
   eslint src/

------------------------------------------------------------

Deployment (AWS)

Backend (Elastic Beanstalk)
eb init -p python-3.11 fantasy-football
eb create fantasy-football-env
eb deploy

Frontend (CloudFront or Vercel)
npm run build
aws s3 sync dist/ s3://your-bucket-name --delete

------------------------------------------------------------

Testing & Future Work

Planned Additions
- Player draft simulation with live picks
- Advanced analytics dashboard (Fantasy Points, Projections)
- ML-based player performance predictions
- User notifications & live trade updates

------------------------------------------------------------

Authors
Alp Ata Narin — Full Stack Developer
Email: alp.ata.narin@gmail.com
LinkedIn: https://linkedin.com/in/alpatanarin

------------------------------------------------------------

License
This project is licensed under the MIT License — see the LICENSE file for details.
