import json
import httpx
from typing import List, Dict, Any, Optional
from config import settings

class GeminiAIService:
    """
    Cognitive service client to invoke Gemini endpoints for text generation and embeddings.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self._embedding_model = "text-embedding-004"
        # gemini-2.5-flash is no longer available to new API users; the
        # "-latest" alias always resolves to the current Flash model.
        self._generation_model = "gemini-flash-latest"
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    async def generate_text_embedding(self, text: str) -> List[float]:
        """
        Requests 1536-dimensional float vector embeddings for semantic database storing.
        """
        if not self.api_key:
            # Fallback mock/simulated vector if key is not configured yet
            return [0.0] * 1536

        url = f"{self.base_url}/models/{self._embedding_model}:embedContent?key={self.api_key}"
        payload = {
            "model": f"models/{self._embedding_model}",
            "content": {
                "parts": [
                    {"text": text}
                ]
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    return data["embedding"]["values"]
                else:
                    # Log error gracefully and return standard 1536 vector
                    return [0.0] * 1536
            except Exception:
                return [0.0] * 1536

    async def generate_response(
        self,
        customer_message: str,
        context_blocks: List[str],
        history: List[Dict[str, str]],
        agent_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Executes a targeted response synthesis using the gemini-2.5-flash model,
        injecting business context parameters, prompt rules, and analyzing confidence levels.
        """
        if not self.api_key:
            return {
                "response": agent_config.get("config_welcome_message") or "Welcome to Autofy! How can we assist you?",
                "confidence": 1.0,
                "escalate": False
            }

        url = f"{self.base_url}/models/{self._generation_model}:generateContent?key={self.api_key}"
        
        # Prepare business configuration settings parameters
        agent_name = agent_config.get("config_agent_name", "AutoBot")
        business_name = agent_config.get("name", "Autofy Partner")
        classification = agent_config.get("classification", "Direct Business")
        hours = agent_config.get("business_hours", "09:00 AM - 06:00 PM")
        timezone = agent_config.get("timezone", "IST")
        fallback_msg = agent_config.get("config_fallback_message", "I apologize, a manager will assist you shortly.")
        threshold = agent_config.get("config_confidence_threshold", 0.75)

        # Assemble retrieved RAG records list
        context_data = "\n\n".join(f"- {block}" for block in context_blocks) if context_blocks else "No specific catalog records found."
        
        # Bundle recent message history logs
        history_logs = ""
        for msg in history[-10:]:  # Last 10 lines max context limit
            sender = "Customer" if msg["sender"] == "customer" else "Assistant"
            history_logs += f"{sender}: {msg['body']}\n"

        # Craft high-intensity prompt engineering guidelines
        system_instruction = (
            f"You are {agent_name}, the AI employee of {business_name} ({classification}).\n"
            f"Your job is to assist clients politely, accurately based ONLY on this Context data:\n"
            f"---\n"
            f"Operating hours: {hours} ({timezone})\n"
            f"CONTEXT CATALOGS:\n{context_data}\n"
            f"---\n"
            f"RULES:\n"
            f"1. Restrict your details only to properties listed in the Context. Do not invent pricing/inventory.\n"
            f"2. If the user query is outside this context, output exactly: '{fallback_msg}'\n"
            f"3. Speak in a friendly, professional way.\n"
            f"4. Please output your response inside a structured JSON form with three keys: 'reply', 'confidence' (float from 0.0 to 1.0), and 'escalate_support' (boolean)."
        )

        prompt_payload = {
            "contents": {
                "parts": [
                    {"text": f"{system_instruction}\n\nClient History:\n{history_logs}\nClient Message: {customer_message}\nJSON output:"}
                ]
            },
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=prompt_payload, timeout=12.0)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    raw_text = ""
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            raw_text = parts[0].get("text", "")

                    if not raw_text:
                        return {"response": fallback_msg, "confidence": 0.0, "escalate": True}

                    # Clean markdown code fences
                    cleaned = raw_text.strip()
                    if cleaned.startswith("```"):
                        first_nl = cleaned.find("\n")
                        if first_nl != -1:
                            cleaned = cleaned[first_nl + 1:]
                        if cleaned.endswith("```"):
                            cleaned = cleaned[:-3]
                        cleaned = cleaned.strip()

                    try:
                        json_data = json.loads(cleaned)
                        reply_val = json_data.get("reply", fallback_msg) if isinstance(json_data, dict) else fallback_msg
                        conf_val = float(json_data.get("confidence", 0.9)) if isinstance(json_data, dict) else 0.5
                        esc_val = bool(json_data.get("escalate_support", False)) if isinstance(json_data, dict) else False
                        return {
                            "response": reply_val,
                            "confidence": conf_val,
                            "escalate": esc_val or conf_val < threshold
                        }
                    except Exception:
                        # Regex extraction fallback for unclosed strings
                        import re
                        match = re.search(r'"(?:reply|response|content|text)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)', cleaned)
                        if match and len(match.group(1).strip()) >= 3 and not match.group(1).startswith("{"):
                            extracted = match.group(1).replace('\\n', '\n').replace('\\"', '"').strip()
                            return {
                                "response": extracted,
                                "confidence": 0.7,
                                "escalate": False
                            }
                        return {
                            "response": fallback_msg,
                            "confidence": 0.0,
                            "escalate": True
                        }
                else:
                    return {"response": fallback_msg, "confidence": 0.0, "escalate": True}
            except Exception:
                return {"response": fallback_msg, "confidence": 0.0, "escalate": True}

# Singleton instance exporter
ai_service = GeminiAIService()
