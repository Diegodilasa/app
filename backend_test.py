#!/usr/bin/env python3
"""
Protocolo 7D Backend API Test Suite
Tests the complete flow of the 7-day addiction recovery protocol
"""

import requests
import json
from datetime import datetime
import sys
import os

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return "http://localhost:8001"
    return "http://localhost:8001"

BASE_URL = get_backend_url()
API_URL = f"{BASE_URL}/api"

print(f"Testing Protocolo 7D API at: {API_URL}")

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def assert_response(self, response, expected_status=200, test_name=""):
        try:
            if response.status_code != expected_status:
                self.failed += 1
                error_msg = f"❌ {test_name}: Expected status {expected_status}, got {response.status_code}"
                if response.text:
                    error_msg += f" - Response: {response.text}"
                self.errors.append(error_msg)
                print(error_msg)
                return False
            else:
                self.passed += 1
                print(f"✅ {test_name}: Status {response.status_code}")
                return True
        except Exception as e:
            self.failed += 1
            error_msg = f"❌ {test_name}: Exception - {str(e)}"
            self.errors.append(error_msg)
            print(error_msg)
            return False
    
    def assert_json_field(self, data, field, expected_value=None, test_name=""):
        try:
            if field not in data:
                self.failed += 1
                error_msg = f"❌ {test_name}: Field '{field}' not found in response"
                self.errors.append(error_msg)
                print(error_msg)
                return False
            
            if expected_value is not None and data[field] != expected_value:
                self.failed += 1
                error_msg = f"❌ {test_name}: Field '{field}' expected '{expected_value}', got '{data[field]}'"
                self.errors.append(error_msg)
                print(error_msg)
                return False
            
            self.passed += 1
            print(f"✅ {test_name}: Field '{field}' = {data[field]}")
            return True
        except Exception as e:
            self.failed += 1
            error_msg = f"❌ {test_name}: Exception checking field '{field}' - {str(e)}"
            self.errors.append(error_msg)
            print(error_msg)
            return False
    
    def print_summary(self):
        print(f"\n{'='*50}")
        print(f"TEST SUMMARY")
        print(f"{'='*50}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"Total: {self.passed + self.failed}")
        
        if self.errors:
            print(f"\n{'='*50}")
            print(f"FAILED TESTS:")
            print(f"{'='*50}")
            for error in self.errors:
                print(error)
        
        return self.failed == 0

def test_protocolo_7d_api():
    results = TestResults()
    test_email = "usuario@teste.com"
    
    print(f"\n{'='*50}")
    print(f"TESTING PROTOCOLO 7D BACKEND API")
    print(f"{'='*50}")
    print(f"Test Email: {test_email}")
    print(f"API Base URL: {API_URL}")
    
    # Test 1: Root endpoint
    print(f"\n--- Test 1: Root Endpoint ---")
    try:
        response = requests.get(f"{API_URL}/")
        if results.assert_response(response, 200, "Root endpoint"):
            data = response.json()
            results.assert_json_field(data, "message", test_name="Root message")
    except Exception as e:
        results.failed += 1
        results.errors.append(f"❌ Root endpoint: Connection error - {str(e)}")
        print(f"❌ Root endpoint: Connection error - {str(e)}")
    
    # Test 2: Login (Create new user)
    print(f"\n--- Test 2: Auth Flow - Login (New User) ---")
    try:
        login_data = {"email": test_email}
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        if results.assert_response(response, 200, "Login new user"):
            data = response.json()
            results.assert_json_field(data, "success", True, "Login success")
            results.assert_json_field(data, "is_new", True, "Is new user")
            results.assert_json_field(data, "email", test_email, "Login email")
    except Exception as e:
        results.failed += 1
        results.errors.append(f"❌ Login new user: Exception - {str(e)}")
        print(f"❌ Login new user: Exception - {str(e)}")
    
    # Test 3: Get User
    print(f"\n--- Test 3: Get User Data ---")
    try:
        response = requests.get(f"{API_URL}/user/{test_email}")
        if results.assert_response(response, 200, "Get user"):
            data = response.json()
            results.assert_json_field(data, "email", test_email, "User email")
            results.assert_json_field(data, "_id", test_name="User ID exists")
    except Exception as e:
        results.failed += 1
        results.errors.append(f"❌ Get user: Exception - {str(e)}")
        print(f"❌ Get user: Exception - {str(e)}")
    
    # Test 4: Onboarding
    print(f"\n--- Test 4: Complete Onboarding ---")
    try:
        onboarding_data = {
            "email": test_email,
            "vicio_alvo": "Redes Sociais"
        }
        response = requests.post(f"{API_URL}/auth/onboarding", json=onboarding_data)
        if results.assert_response(response, 200, "Complete onboarding"):
            data = response.json()
            results.assert_json_field(data, "success", True, "Onboarding success")
    except Exception as e:
        results.failed += 1
        results.errors.append(f"❌ Complete onboarding: Exception - {str(e)}")
        print(f"❌ Complete onboarding: Exception - {str(e)}")
    
    # Test 5: Get Progress (verify tempo_limpo_inicio)
    print(f"\n--- Test 5: Get Progress (After Onboarding) ---")
    try:
        response = requests.get(f"{API_URL}/progress/{test_email}")
        if results.assert_response(response, 200, "Get progress"):
            data = response.json()
            results.assert_json_field(data, "user_email", test_email, "Progress user email")
            results.assert_json_field(data, "dia_atual", 1, "Initial day")
            results.assert_json_field(data, "pontos_totais", 0, "Initial points")
            results.assert_json_field(data, "tempo_limpo_inicio", test_name="Tempo limpo inicio set")
    except Exception as e:
        results.failed += 1
        results.errors.append(f"❌ Get progress: Exception - {str(e)}")
        print(f"❌ Get progress: Exception - {str(e)}")
    
    # Test 6: Day 1 - Save Tool Data
    print(f"\n--- Test 6: Day 1 - Save Tool Data ---")
    try:
        tool_data = {
            "email": test_email,
            "dia": 1,
            "data": {
                "gatilhos": ["stress", "tedio", "ansiedade"],
                "estrategias": ["respiracao", "caminhada", "musica"],
                "reflexao": "Primeiro dia foi desafiador mas consegui identificar meus gatilhos principais"
            }
        }
        response = requests.post(f"{API_URL}/progress/save-tool-data", json=tool_data)
        if results.assert_response(response, 200, "Save day 1 tool data"):
            data = response.json()
            results.assert_json_field(data, "success", True, "Save tool data success")
    except Exception as e:
        results.failed += 1
        results.errors.append(f"❌ Save day 1 tool data: Exception - {str(e)}")
        print(f"❌ Save day 1 tool data: Exception - {str(e)}")
    
    # Test 7: Day 1 - Complete Day
    print(f"\n--- Test 7: Day 1 - Complete Day ---")
    try:
        complete_data = {
            "email": test_email,
            "dia": 1,
            "pontos": 100
        }
        response = requests.post(f"{API_URL}/progress/complete-day", json=complete_data)
        if results.assert_response(response, 200, "Complete day 1"):
            data = response.json()
            results.assert_json_field(data, "success", True, "Complete day success")
            results.assert_json_field(data, "already_completed", False, "Not already completed")
            results.assert_json_field(data, "pontos_ganhos", 100, "Points awarded")
            # Check if primeira_vitoria medal was awarded
            if "novas_medalhas" in data and "primeira_vitoria" in data["novas_medalhas"]:
                results.passed += 1
                print("✅ Day 1 complete: primeira_vitoria medal awarded")
            else:
                results.failed += 1
                results.errors.append("❌ Day 1 complete: primeira_vitoria medal not awarded")
                print("❌ Day 1 complete: primeira_vitoria medal not awarded")
    except Exception as e:
        results.failed += 1
        results.errors.append(f"❌ Complete day 1: Exception - {str(e)}")
        print(f"❌ Complete day 1: Exception - {str(e)}")
    
    # Test 8: Verify Progress After Day 1
    print(f"\n--- Test 8: Verify Progress After Day 1 ---")
    try:
        response = requests.get(f"{API_URL}/progress/{test_email}")
        if results.assert_response(response, 200, "Get progress after day 1"):
            data = response.json()
            results.assert_json_field(data, "dia_atual", 2, "Day advanced to 2")
            results.assert_json_field(data, "pontos_totais", 100, "Points accumulated")
            # Check medalhas
            if "medalhas" in data and "primeira_vitoria" in data["medalhas"]:
                results.passed += 1
                print("✅ Progress after day 1: primeira_vitoria medal in progress")
            else:
                results.failed += 1
                results.errors.append("❌ Progress after day 1: primeira_vitoria medal not in progress")
                print("❌ Progress after day 1: primeira_vitoria medal not in progress")
    except Exception as e:
        results.failed += 1
        results.errors.append(f"❌ Get progress after day 1: Exception - {str(e)}")
        print(f"❌ Get progress after day 1: Exception - {str(e)}")
    
    # Test 9: Day 2 - Save Tool Data and Complete
    print(f"\n--- Test 9: Day 2 - Save Tool Data and Complete ---")
    try:
        # Save tool data
        tool_data = {
            "email": test_email,
            "dia": 2,
            "data": {
                "gatilhos": ["solidao", "pressao_social"],
                "estrategias": ["meditacao", "leitura"],
                "reflexao": "Segundo dia mais facil, estrategias funcionando"
            }
        }
        response = requests.post(f"{API_URL}/progress/save-tool-data", json=tool_data)
        results.assert_response(response, 200, "Save day 2 tool data")
        
        # Complete day
        complete_data = {
            "email": test_email,
            "dia": 2,
            "pontos": 150
        }
        response = requests.post(f"{API_URL}/progress/complete-day", json=complete_data)
        if results.assert_response(response, 200, "Complete day 2"):
            data = response.json()
            results.assert_json_field(data, "success", True, "Complete day 2 success")
            results.assert_json_field(data, "pontos_ganhos", 150, "Day 2 points awarded")
    except Exception as e:
        results.failed += 1
        results.errors.append(f"❌ Day 2 operations: Exception - {str(e)}")
        print(f"❌ Day 2 operations: Exception - {str(e)}")
    
    # Test 10: Verify Progress After Day 2
    print(f"\n--- Test 10: Verify Progress After Day 2 ---")
    try:
        response = requests.get(f"{API_URL}/progress/{test_email}")
        if results.assert_response(response, 200, "Get progress after day 2"):
            data = response.json()
            results.assert_json_field(data, "dia_atual", 3, "Day advanced to 3")
            results.assert_json_field(data, "pontos_totais", 250, "Points accumulated (100+150)")
    except Exception as e:
        results.failed += 1
        results.errors.append(f"❌ Get progress after day 2: Exception - {str(e)}")
        print(f"❌ Get progress after day 2: Exception - {str(e)}")
    
    # Test 11: Day 3 - Save Tool Data and Complete (should award guerreiro_3_dias)
    print(f"\n--- Test 11: Day 3 - Save Tool Data and Complete ---")
    try:
        # Save tool data
        tool_data = {
            "email": test_email,
            "dia": 3,
            "data": {
                "gatilhos": ["habito_antigo"],
                "estrategias": ["exercicio", "conversa_amigo"],
                "reflexao": "Terceiro dia - me sinto mais confiante!"
            }
        }
        response = requests.post(f"{API_URL}/progress/save-tool-data", json=tool_data)
        results.assert_response(response, 200, "Save day 3 tool data")
        
        # Complete day
        complete_data = {
            "email": test_email,
            "dia": 3,
            "pontos": 200
        }
        response = requests.post(f"{API_URL}/progress/complete-day", json=complete_data)
        if results.assert_response(response, 200, "Complete day 3"):
            data = response.json()
            results.assert_json_field(data, "success", True, "Complete day 3 success")
            results.assert_json_field(data, "pontos_ganhos", 200, "Day 3 points awarded")
            # Check if guerreiro_3_dias medal was awarded
            if "novas_medalhas" in data and "guerreiro_3_dias" in data["novas_medalhas"]:
                results.passed += 1
                print("✅ Day 3 complete: guerreiro_3_dias medal awarded")
            else:
                results.failed += 1
                results.errors.append("❌ Day 3 complete: guerreiro_3_dias medal not awarded")
                print("❌ Day 3 complete: guerreiro_3_dias medal not awarded")
    except Exception as e:
        results.failed += 1
        results.errors.append(f"❌ Day 3 operations: Exception - {str(e)}")
        print(f"❌ Day 3 operations: Exception - {str(e)}")
    
    # Test 12: Verify Progress After Day 3
    print(f"\n--- Test 12: Verify Progress After Day 3 ---")
    try:
        response = requests.get(f"{API_URL}/progress/{test_email}")
        if results.assert_response(response, 200, "Get progress after day 3"):
            data = response.json()
            results.assert_json_field(data, "dia_atual", 4, "Day advanced to 4")
            results.assert_json_field(data, "pontos_totais", 450, "Points accumulated (100+150+200)")
            # Check both medals
            if "medalhas" in data:
                if "primeira_vitoria" in data["medalhas"] and "guerreiro_3_dias" in data["medalhas"]:
                    results.passed += 1
                    print("✅ Progress after day 3: Both medals present")
                else:
                    results.failed += 1
                    results.errors.append(f"❌ Progress after day 3: Missing medals. Found: {data['medalhas']}")
                    print(f"❌ Progress after day 3: Missing medals. Found: {data['medalhas']}")
            else:
                results.failed += 1
                results.errors.append("❌ Progress after day 3: No medalhas field")
                print("❌ Progress after day 3: No medalhas field")
    except Exception as e:
        results.failed += 1
        results.errors.append(f"❌ Get progress after day 3: Exception - {str(e)}")
        print(f"❌ Get progress after day 3: Exception - {str(e)}")
    
    # Test 13: Edge Case - Try to complete day 1 again
    print(f"\n--- Test 13: Edge Case - Complete Day 1 Again ---")
    try:
        complete_data = {
            "email": test_email,
            "dia": 1,
            "pontos": 50
        }
        response = requests.post(f"{API_URL}/progress/complete-day", json=complete_data)
        if results.assert_response(response, 200, "Complete day 1 again"):
            data = response.json()
            results.assert_json_field(data, "success", True, "Duplicate completion success")
            results.assert_json_field(data, "already_completed", True, "Already completed flag")
    except Exception as e:
        results.failed += 1
        results.errors.append(f"❌ Complete day 1 again: Exception - {str(e)}")
        print(f"❌ Complete day 1 again: Exception - {str(e)}")
    
    # Test 14: Edge Case - Login with existing user
    print(f"\n--- Test 14: Edge Case - Login Existing User ---")
    try:
        login_data = {"email": test_email}
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        if results.assert_response(response, 200, "Login existing user"):
            data = response.json()
            results.assert_json_field(data, "success", True, "Existing login success")
            results.assert_json_field(data, "is_new", False, "Is not new user")
            results.assert_json_field(data, "has_onboarding", True, "Has onboarding completed")
    except Exception as e:
        results.failed += 1
        results.errors.append(f"❌ Login existing user: Exception - {str(e)}")
        print(f"❌ Login existing user: Exception - {str(e)}")
    
    return results.print_summary()

if __name__ == "__main__":
    success = test_protocolo_7d_api()
    sys.exit(0 if success else 1)