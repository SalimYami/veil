import requests
import json
import os

API_KEY = "ctx7sk-ecaeadea-1ff3-4fc5-99b6-223523ab567b"
URL = "https://mcp.context7.com/mcp"

payload = {
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
        "name": "resolve-library-id",
        "arguments": {
            "query": "react",
            "libraryName": "react"
        }
    },
    "id": 1
}

headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    "CONTEXT7_API_KEY": API_KEY
}

try:
    response = requests.post(URL, json=payload, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {str(e)}")
