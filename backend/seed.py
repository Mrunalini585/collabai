import sys
import os
from datetime import date, datetime, timedelta

# Add backend root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.project import Project, TeamMember
from app.models.task import Task
from app.models.meeting import Meeting
from app.core.security import hash_password

def seed_db():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Clear existing data
        print("Clearing old data...")
        db.query(TeamMember).delete()
        db.query(Task).delete()
        db.query(Meeting).delete()
        db.query(Project).delete()
        db.query(User).delete()
        db.commit()

        print("Seeding demo users...")
        # Create users
        pwd = hash_password("collabai123")
        
        admin = User(name="Administrator", email="admin@collabai.com", hashed_password=pwd, role="admin")
        leader = User(name="Rahul (Leader)", email="leader@collabai.com", hashed_password=pwd, role="team_leader")
        student1 = User(name="Priya (Frontend Developer)", email="student@collabai.com", hashed_password=pwd, role="student")
        student2 = User(name="Aman (Backend Developer)", email="student2@collabai.com", hashed_password=pwd, role="student")
        faculty = User(name="Prof. Sharma (Project Guide)", email="faculty@collabai.com", hashed_password=pwd, role="faculty")

        db.add_all([admin, leader, student1, student2, faculty])
        db.commit()
        db.refresh(leader)
        db.refresh(student1)
        db.refresh(student2)
        db.refresh(faculty)

        print("Seeding demo project...")
        # Create Project
        proj_deadline = date.today() + timedelta(days=30)
        project = Project(
            name="AI-Powered Project Lifecycle & Team Collaboration Platform",
            description="A centralized web application integrating Kanban task boards, AI-powered meeting summaries, automated SRS requirement analysis, real-time team chat, and GitHub code logs.",
            owner_id=leader.id,
            github_repo="collabai/collabai-project-final",
            deadline=proj_deadline,
            risk_level="Medium"
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        print("Seeding team memberships...")
        # Register memberships
        db.add_all([
            TeamMember(project_id=project.id, user_id=leader.id, role_in_team="leader"),
            TeamMember(project_id=project.id, user_id=student1.id, role_in_team="member"),
            TeamMember(project_id=project.id, user_id=student2.id, role_in_team="member"),
            TeamMember(project_id=project.id, user_id=faculty.id, role_in_team="member")
        ])
        db.commit()

        print("Seeding tasks...")
        # Seed Kanban board tasks
        tasks = [
            # To Do
            Task(
                project_id=project.id,
                title="Create system architecture diagram",
                description="Draft the full multi-tier component architecture including FastAPI, PostgreSQL, MongoDB, Whisper, and Recharts interaction.",
                assignee_id=student2.id,
                priority="High",
                status="To Do",
                due_date=date.today() + timedelta(days=5)
            ),
            Task(
                project_id=project.id,
                title="Integrate email notifications",
                description="Set up SendGrid/SES API credentials to trigger automated notification alerts when a member is invited.",
                assignee_id=leader.id,
                priority="Low",
                status="To Do",
                due_date=date.today() + timedelta(days=15)
            ),
            # In Progress
            Task(
                project_id=project.id,
                title="Integrate Gemini API into Requirement Analyzer",
                description="Connect app.ai_service.client to complete_json using the Gemini client library API calls.",
                assignee_id=student2.id,
                priority="Medium",
                status="In Progress",
                due_date=date.today() + timedelta(days=3)
            ),
            # Testing
            Task(
                project_id=project.id,
                title="Implement JWT authorization middleware",
                description="Secure API routes with custom require_role checks and token expiry validation.",
                assignee_id=student2.id,
                priority="High",
                status="Testing",
                due_date=date.today() + timedelta(days=1)
            ),
            # Done
            Task(
                project_id=project.id,
                title="Design Figma mockup of project workspace",
                description="Create styled high-fidelity designs for authentication screens, sidebar routes, and Kanban boards.",
                assignee_id=student1.id,
                priority="Low",
                status="Done",
                due_date=date.today() - timedelta(days=2)
            )
        ]
        db.add_all(tasks)
        db.commit()

        print("Seeding scheduled meetings...")
        # Seed meeting
        meeting = Meeting(
            project_id=project.id,
            title="Sprint 1 Planning & AI Features Review",
            scheduled_at=datetime.now() + timedelta(days=2),
            summary=""
        )
        db.add(meeting)
        db.commit()

        print("Database seeded successfully with premium demo data!")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
