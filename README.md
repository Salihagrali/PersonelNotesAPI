```
npm install
npm run dev
```

```
open http://localhost:3000
```

For user endpoints:
```
 curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "API Tester", "email": "api@test.com"}'

  curl -X GET http://localhost:3000/users/by-email/api@test.com

  curl -X GET http://localhost:3000/users/bc00db7a-cf2d-41ff-93b3-0dcb8e8bbb37
  
```
For note endpoints:
```
curl -X POST http://localhost:3000/users/840e52b7-ab84-4051-88ed-2405cc915b7d/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Previous final exam questions",
    "content": "Already done this i guess",
    "deadline": "2026-01-21T21:37:12.345Z"
  }'

curl -X GET http://localhost:3000/users/bc00db7a-cf2d-41ff-93b3-0dcb8e8bbb37/notes

curl -X GET "http://localhost:3000/users/bc00db7a-cf2d-41ff-93b3-0dcb8e8bbb37/notes/due-before/2026-01-20T00%3A00%3A00Z"

curl -X GET "http://localhost:3000/users/bc00db7a-cf2d-41ff-93b3-0dcb8e8bbb37/notes/due-after/2026-01-10T00%3A00%3A00Z"

curl -X PUT http://localhost:3000/notes/cff771f3-a94d-47d8-98ee-6120efc60c8d \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title testing",
    "content": "Updated content testing"
  }'

curl -X DELETE http://localhost:3000/notes/5a582a0e-ace5-470d-b043-27822e1bc3c8

```

