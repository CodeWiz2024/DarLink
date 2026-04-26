import json
import urllib.request
import urllib.error

url = 'https://darlink-production.up.railway.app/api/users/login'

def test_login(payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        response = urllib.request.urlopen(req)
        print(f"Payload: {payload}")
        print(f"Success: {response.read().decode('utf-8')}\n")
    except urllib.error.HTTPError as e:
        print(f"Payload: {payload}")
        print(f"Error {e.code}: {e.read().decode('utf-8')}\n")

# Test 1: Uppercase Email, Password
test_login({"Email": "test@gmail.com", "Password": "password123"})
# Test 2: Lowercase email, password
test_login({"email": "test@gmail.com", "password": "password123"})
# Test 3: With UserType uppercase
test_login({"Email": "test@gmail.com", "Password": "password123", "UserType": "Renter"})
# Test 4: With UserType lowercase
test_login({"email": "test@gmail.com", "password": "password123", "UserType": "Renter"})
