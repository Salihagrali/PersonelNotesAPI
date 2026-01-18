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

For share note endpoints :

```
curl -X POST http://localhost:3000/notes/4fbb739d-05ef-4f10-9911-dc6a48a3a19d/share \
     -H "Content-Type: application/json" \
     -d '{
           "ownerId": "840e52b7-ab84-4051-88ed-2405cc915b7d",
           "sharedWith": "b039e777-3ee5-4b40-bdc0-5ef071430c50"
         }'

curl -X GET http://localhost:3000/users/b039e777-3ee5-4b40-bdc0-5ef071430c50/shared

curl -X GET http://localhost:3000/notes/e5a7fa36-aa62-429d-ba98-f470c473cd27/accessList

```

For tag endpoints:
```
curl -X POST http://localhost:3000/notes/8cf8383d-425a-4437-bcc7-bf226b520524/tags \
     -H "Content-Type: application/json" \
     -d '{
           "tag": "urgent",
           "userId": "840e52b7-ab84-4051-88ed-2405cc915b7d"
         }'

curl -X GET "http://localhost:3000/notes/tags/urgent?userId=840e52b7-ab84-4051-88ed-2405cc915b7d"

```

For version endpoints:
```
curl -X PUT http://localhost:3000/notes/8cf8383d-425a-4437-bcc7-bf226b520524 \
     -H "Content-Type: application/json" \
     -d '{
           "title": "Testing the version functionality",
           "content": "Version should be updated"
         }'
            http://localhost:3000/notes/<NOTE_ID>/<VERSION_ID>
curl -X GET http://localhost:3000/notes/8cf8383d-425a-4437-bcc7-bf226b520524/1
    
```