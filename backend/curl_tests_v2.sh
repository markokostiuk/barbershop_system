#!/bin/bash

# Base URL of the API
BASE_URL="http://localhost:5000/admin"

# Helper function to print a separator
print_separator() {
  echo "----------------------------------------"
}

# 1. Admin login (POST /login) - get token automatically
echo "1. Admin login and token retrieval"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" -H "Content-Type: application/json" -d '{
  "email": "initial_owner@example.com",
  "password": "ownpassword"
}')
echo "Login response: $LOGIN_RESPONSE"
TOKEN=$(echo $LOGIN_RESPONSE | python -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$TOKEN" ]; then
  echo "Failed to retrieve access token. Exiting."
  read
  exit 1
fi

echo "Access token retrieved: $TOKEN"
print_separator

# 2. Admin registration (POST /register)
echo "2. Admin registration"
curl -X POST "$BASE_URL/register" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "email": "newadmin@example.com",
  "password": "newpassword123",
  "role": "manager"
}'
echo
print_separator

# 3. Business CRUD
# Create business (POST /businesses)
echo "3. Create business"
curl -X POST "$BASE_URL/businesses" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "name": "New Business"
}'
echo
print_separator

# 3. Business CRUD
# Create business (POST /businesses)
echo "3. Create business"
curl -X POST "$BASE_URL/businesses" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "name": "New Business"
}'
echo
print_separator

# Get businesses (GET /businesses)
echo "4. Get businesses"
curl -X GET "$BASE_URL/businesses" -H "Authorization: Bearer $TOKEN"
echo
print_separator

# Update business (PUT /businesses/{id})
echo "5. Update business"
curl -X PUT "$BASE_URL/businesses/2" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "name": "Updated Business Name"
}'
echo
print_separator

# Delete business (DELETE /businesses/{id})
echo "6. Delete business"
curl -X DELETE "$BASE_URL/businesses/2" -H "Authorization: Bearer $TOKEN"
echo
print_separator

# 4. Branch CRUD
# Create branch (POST /businesses/{id}/branches)
echo "7. Create branch"
curl -X POST "$BASE_URL/businesses/1/branches" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "name": "Main Branch",
  "location": "123 Main St",
  "phone_number": "123-456-7890",
  "start_work_hour": "09:00",
  "end_work_hour": "18:00",
  "manager_ids": [2,3]
}'
echo
print_separator

echo "7. Create branch"
curl -X POST "$BASE_URL/businesses/1/branches" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "name": "Main Branch",
  "location": "123 Main St",
  "phone_number": "123-456-7890",
  "start_work_hour": "09:00",
  "end_work_hour": "18:00",
  "manager_ids": [2,3]
}'
echo
print_separator

# Get branches (GET /businesses/{id}/branches)
echo "8. Get branches"
curl -X GET "$BASE_URL/businesses/1/branches" -H "Authorization: Bearer $TOKEN"
echo
print_separator

# Update branch (PUT /branches/{id})
echo "9. Update branch"
curl -X PUT "$BASE_URL/branches/2" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "name": "Updated Branch Name",
  "location": "456 New St",
  "phone_number": "987-654-3210",
  "start_work_hour": "08:00",
  "end_work_hour": "17:00"
}'
echo
print_separator

# Delete branch (DELETE /branches/{id})
echo "10. Delete branch"
curl -X DELETE "$BASE_URL/branches/2" -H "Authorization: Bearer $TOKEN"
echo
print_separator

# 5. Position CRUD
# Create position (POST /branches/{id}/positions)
echo "11. Create position"
curl -X POST "$BASE_URL/branches/1/positions" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "name": "Barber"
}'
echo
print_separator

# 5. Position CRUD
# Create position (POST /branches/{id}/positions)
echo "11. Create position"
curl -X POST "$BASE_URL/branches/1/positions" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "name": "Barber"
}'
echo
print_separator

# Get positions (GET /branches/{id}/positions)
echo "12. Get positions"
curl -X GET "$BASE_URL/branches/1/positions" -H "Authorization: Bearer $TOKEN"
echo
print_separator

# Update position (PUT /positions/{id})
echo "13. Update position"
curl -X PUT "$BASE_URL/positions/2" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "name": "Senior Barber"
}'
echo
print_separator

# Delete position (DELETE /positions/{id})
echo "14. Delete position"
curl -X DELETE "$BASE_URL/positions/2" -H "Authorization: Bearer $TOKEN"
echo
print_separator

# 6. Service CRUD
# Create service (POST /branches/{id}/services)
echo "15. Create service"
curl -X POST "$BASE_URL/branches/1/services" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "name": "Haircut",
  "duration": 30
}'
echo
print_separator

# 6. Service CRUD
# Create service (POST /branches/{id}/services)
echo "15. Create service"
curl -X POST "$BASE_URL/branches/1/services" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "name": "Haircut",
  "duration": 30
}'
echo
print_separator

# Get services (GET /branches/{id}/services)
echo "16. Get services"
curl -X GET "$BASE_URL/branches/1/services" -H "Authorization: Bearer $TOKEN"
echo
print_separator

# Update service (PUT /services/{id})
echo "17. Update service"
curl -X PUT "$BASE_URL/services/2" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "name": "Deluxe Haircut",
  "duration": 45
}'
echo
print_separator

# 7. Service cost creation (POST /services/{id}/costs)
echo "18. Set service cost"
curl -X POST "$BASE_URL/services/1/costs" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "position_id": 1,
  "price": 25.00
}'
echo
print_separator

# 8. Worker CRUD
# Create worker (POST /branches/{id}/workers)
echo "19. Create worker"
curl -X POST "$BASE_URL/branches/1/workers" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "name": "John Doe",
  "position_id": 1
}'
echo
print_separator

# 9. Work hours management
# Add work hours (POST /workers/{id}/work-hours)
echo "20. Add work hours"
curl -X POST "$BASE_URL/workers/1/work-hours" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "date": "2024-06-01",
  "start_work_hour": "09:00",
  "end_work_hour": "17:00"
}'
echo
print_separator

# Get work hours (GET /workers/{id}/work-hours)
echo "21. Get work hours"
curl -X GET "$BASE_URL/workers/1/work-hours" -H "Authorization: Bearer $TOKEN"
echo
print_separator

# Update work hour (PUT /work-hours/{id})
echo "22. Update work hour"
curl -X PUT "$BASE_URL/work-hours/1" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "start_work_hour": "10:00",
  "end_work_hour": "18:00"
}'
echo
print_separator

# Delete work hour (DELETE /work-hours/{id})
echo "23. Delete work hour"
curl -X DELETE "$BASE_URL/work-hours/1" -H "Authorization: Bearer $TOKEN"
echo
print_separator

# Batch add work hours (POST /workers/{id}/batch-work-hours)
echo "24. Batch add work hours"
curl -X POST "$BASE_URL/workers/1/batch-work-hours" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
  "start_date": "2024-06-01",
  "end_date": "2024-06-07",
  "days_of_week": [0,1,2,3,4],
  "start_time": "09:00",
  "end_time": "17:00"
}'
echo
print_separator

echo "All curl tests completed."
read