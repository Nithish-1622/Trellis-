
import os
import asyncio
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("No API key found")
    exit(1)

models_to_test = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-2.0-flash-exp",
    "gemini-pro-latest",
    "gemini-2.5-flash-lite",
]

async def test_model(model_name):
    print(f"Testing {model_name}...")
    try:
        # Try both with and without "models/" prefix
        for name in [model_name, f"models/{model_name}"]:
            try:
                llm = ChatGoogleGenerativeAI(
                    model=name,
                    google_api_key=api_key
                )
                response = await llm.ainvoke("Hi")
                print(f"✅ {name} SUCCESS: {response.content}")
                return True
            except Exception as inner_e:
                if "429" in str(inner_e):
                    print(f"⚠️ {name} QUOTA EXCEEDED (429)")
                elif "404" in str(inner_e):
                    pass # Just not found
                elif "503" in str(inner_e):
                    print(f"⚠️ {name} OVERLOADED (503)")
                else:
                    print(f"❌ {name} ERROR: {str(inner_e)}")
        return False
    except Exception as e:
        print(f"❌ {model_name} FAILED: {str(e)}")
        return False

async def main():
    for model in models_to_test:
        await test_model(model)
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(main())
