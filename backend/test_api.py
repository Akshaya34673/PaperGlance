import requests

# Replace with your actual API key
API_KEY = "AIzaSyBN3S4shI3dRq-P6bpmhGCA-3kxfDrVm4I"
MODEL = "gemini-1.5-flash"

def test_api(api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": "Hello, can you respond?"}
                ]
            }
        ]
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        if response.status_code == 200:
            print("✅ API key is working!")
            print("Response:", response.json()["candidates"][0]["content"]["parts"][0]["text"])
        else:
            print(f"❌ API key failed. Status: {response.status_code}")
            print("Response:", response.text)
    except Exception as e:
        print("❌ Error during API call:", str(e))

if __name__ == "__main__":
    test_api(API_KEY)