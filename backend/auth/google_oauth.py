import httpx
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from pydantic import BaseModel
from config import settings

class GoogleUserSchema(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None
    sub: str  # Google User ID

class GoogleOAuthService:
    @staticmethod
    def get_authorization_url() -> str:
        """
        Builds the secure redirects URI targeting Google's identity servers.
        """
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent"
        }
        query_string = "&".join(f"{key}={value}" for key, value in params.items())
        return f"{base_url}?{query_string}"

    @staticmethod
    async def exchange_code_for_user_info(code: str) -> GoogleUserSchema:
        """
        Exchanges the authorization grant code for Google API access and ID tokens,
        then queries the userinfo endpoint to fetch email, name, and profile values.
        """
        token_url = "https://oauth2.googleapis.com/token"
        headers = {"Host": "oauth2.googleapis.com"}
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # Exchange validation code for token parameters map
                token_response = await client.post(token_url, data=data, headers=headers)
                if token_response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Google OAuth token exchange failed: {token_response.text}"
                    )
                
                credentials_map = token_response.json()
                access_token = credentials_map.get("access_token")
                
                # Request user properties using open ID access credentials
                userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
                user_headers = {"Authorization": f"Bearer {access_token}"}
                userinfo_response = await client.get(userinfo_url, headers=user_headers)
                
                if userinfo_response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to retrieve Google profile parameters metadata."
                    )
                
                decoded_user = userinfo_response.json()
                return GoogleUserSchema(
                    email=decoded_user["email"],
                    name=decoded_user["name"],
                    picture=decoded_user.get("picture"),
                    sub=decoded_user["sub"]
                )
                
            except Exception as exc:
                if isinstance(exc, HTTPException):
                    raise exc
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Integrations error during OAuth callbacks context: {str(exc)}"
                )
