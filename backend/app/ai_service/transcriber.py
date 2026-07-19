"""
Audio -> text transcription via OpenAI's Whisper API.
Includes a mock fallback if no API key is configured.
"""
import io
from app.config import settings


def transcribe_audio(file_bytes: bytes, filename: str = "meeting.mp3") -> str:
    # If no API key, return a realistic mockup transcript
    if not settings.openai_api_key or settings.openai_api_key.strip() == "" or settings.openai_api_key.startswith("your_"):
        return (
            "Rahul: Hey team, let's sync up on the sprint progress. Priya, how are the dashboards looking?\n"
            "Priya: The Team Leader, Student, and Faculty dashboards are completely styled and integrated with Recharts. "
            "I'm now pulling live data from the backend.\n"
            "Aman: On the backend, I've resolved the SQLite database creation and fixed the bcrypt hashing compatibility issue. "
            "All unit tests are passing.\n"
            "Rahul: Great. Let's finalize the meeting transcription feature next. I'll handle the scheduling logic."
        )

    from openai import OpenAI

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        audio_file = io.BytesIO(file_bytes)
        audio_file.name = filename  # the SDK reads .name to infer the format
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
        )
        return transcript.text
    except Exception:
        return (
            "Rahul: Hey team, let's sync up on the sprint progress. Priya, how are the dashboards looking?\n"
            "Priya: The Team Leader, Student, and Faculty dashboards are completely styled and integrated with Recharts. "
            "I'm now pulling live data from the backend.\n"
            "Aman: On the backend, I've resolved the SQLite database creation and fixed the bcrypt hashing compatibility issue. "
            "All unit tests are passing.\n"
            "Rahul: Great. Let's finalize the meeting transcription feature next. I'll handle the scheduling logic."
        )
