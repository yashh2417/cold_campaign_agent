import requests
from app.core.config import settings
from fastapi import HTTPException
import httpx
from fastapi.responses import StreamingResponse
from io import BytesIO


import wave
from io import BytesIO

def convert_pcm_to_wav(pcm_data: bytes, sample_rate=44100, sample_width=2, channels=1):
    wav_io = BytesIO()
    with wave.open(wav_io, 'wb') as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(sample_width)  # 16-bit PCM = 2 bytes
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_data)
    wav_io.seek(0)
    return wav_io


async def ai_TTS(req):
    bland_api_key = settings.BLAND_API_KEY

    if not bland_api_key:
        raise HTTPException(status_code=500, detail="BLAND_API_KEY not configured")

    headers = {
            "Authorization": f"Bearer {bland_api_key}",
            "Content-Type": "application/json"
        }
    payload = {
        "voice":"Maeve",
        "text": req.text,
        'output_format': 'pcm_44100'
    }
    async with httpx.AsyncClient() as client:
        response = await client.post("https://api.bland.ai/v1/speak",headers=headers,json=payload)
        audio_stream = BytesIO(response.content)
        audio_data = response.content
        print(response,sep='\n\n')
        return StreamingResponse(audio_stream, media_type="audio/mpeg")
        return {"status":"success"}
    
    