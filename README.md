# Personal Notes API

A high-performance, serverless-ready REST API built with **Hono**, **ElectroDB**, and **DynamoDB**. This project demonstrates advanced Single Table Design patterns including adjacency lists, index overloading, atomic transactions, and copy-on-write versioning.

## Features

* **User Management:** Create users and look up by ID or Email (Uniqueness enforced).
* **Notes CRUD:** Create, read, update, and delete notes.
* **Advanced Filtering:** Efficient "Due Date" range queries using DynamoDB Sort Keys.
* **Sharing:** Share notes with other users and view "Shared With Me" lists.
* **Tagging:** Add tags to notes and search notes by tag (Hybrid Index pattern).
* **Audit Trail:** Automatic version history tracking for every note update.

## Prerequisites

* **Node.js** (v20)
* **AWS Credentials** (configured via `.env` or AWS CLI)
* **DynamoDB Table** (Created in AWS or running locally)

## Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-project-folder>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory and configure your AWS/Table settings:
    ```env
    AWS_REGION=eu-north-1
    AWS_ACCESS_KEY_ID=YOUR_KEY
    AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS
    TABLE_NAME=table_name
    ```

4.  **Run the application:**
    ```bash
    npm run dev
    ```
---
## API Usage & Test Commands

Below is a collection of `curl` commands to test the API features.

> **Note:** Replace `<UUIDs>` in the URLs and JSON bodies with the actual IDs returned by your API responses.

### 1. User Management

**Create a User**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "API Tester", "email": "api@test.com"}'
```

**Get User by Email**
```bash
curl -X GET http://localhost:3000/users/by-email/api@test.com
```

**Get User by ID**
bc00db7a-cf2d-41ff-93b3-0dcb8e8bbb37 = userID
```bash
curl -X GET http://localhost:3000/users/bc00db7a-cf2d-41ff-93b3-0dcb8e8bbb37
```
**Create a Note**
840e52b7-ab84-4051-88ed-2405cc915b7d = userId
```bash
curl -X POST http://localhost:3000/users/840e52b7-ab84-4051-88ed-2405cc915b7d/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Previous final exam questions",
    "content": "Already done this i guess",
    "deadline": "2026-01-21T21:37:12.345Z"
  }'
```

**Get All Notes for a User**
bc00db7a-cf2d-41ff-93b3-0dcb8e8bbb37 = userId
```bash
curl -X GET http://localhost:3000/users/bc00db7a-cf2d-41ff-93b3-0dcb8e8bbb37/notes
```

**Get Notes Due BEFORE Date**
bc00db7a-cf2d-41ff-93b3-0dcb8e8bbb37 = userId
2026-01-20T00%3A00%3A00Z = date
```bash
curl -X GET "http://localhost:3000/users/bc00db7a-cf2d-41ff-93b3-0dcb8e8bbb37/notes/due-before/2026-01-20T00%3A00%3A00Z"
```
**Get Notes Due AFTER Date** 
bc00db7a-cf2d-41ff-93b3-0dcb8e8bbb37 = userId
2026-01-10T00%3A00%3A00Z = date
```bash
curl -X GET "http://localhost:3000/users/bc00db7a-cf2d-41ff-93b3-0dcb8e8bbb37/notes/due-after/2026-01-10T00%3A00%3A00Z"
```
  
**Update Note**
cff771f3-a94d-47d8-98ee-6120efc60c8d = noteId
```bash
curl -X PUT http://localhost:3000/notes/cff771f3-a94d-47d8-98ee-6120efc60c8d \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title testing",
    "content": "Updated content testing"
  }'
```

**Delete Note**
5a582a0e-ace5-470d-b043-27822e1bc3c8 = noteId
```bash
curl -X DELETE http://localhost:3000/notes/5a582a0e-ace5-470d-b043-27822e1bc3c8
```

**Share a Note**
4fbb739d-05ef-4f10-9911-dc6a48a3a19d = noteId
```bash
curl -X POST http://localhost:3000/notes/4fbb739d-05ef-4f10-9911-dc6a48a3a19d/share \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "840e52b7-ab84-4051-88ed-2405cc915b7d",
    "sharedWith": "b039e777-3ee5-4b40-bdc0-5ef071430c50"
  }'
```

**Get Shared With Me**
b039e777-3ee5-4b40-bdc0-5ef071430c50 = userId
```bash
curl -X GET http://localhost:3000/users/b039e777-3ee5-4b40-bdc0-5ef071430c50/shared
```

**Get Note Access List**
e5a7fa36-aa62-429d-ba98-f470c473cd27 = noteId
```bash
curl -X GET http://localhost:3000/notes/e5a7fa36-aa62-429d-ba98-f470c473cd27/accessList
```

**Add Tag to Note**
8cf8383d-425a-4437-bcc7-bf226b520524 = noteId
```bash
curl -X POST http://localhost:3000/notes/8cf8383d-425a-4437-bcc7-bf226b520524/tags \
  -H "Content-Type: application/json" \
  -d '{
    "tag": "urgent",
    "userId": "840e52b7-ab84-4051-88ed-2405cc915b7d"
  }'
```
**Get Notes by Tag**
urgent = tagName
```bash
curl -X GET "http://localhost:3000/notes/tags/urgent?userId=840e52b7-ab84-4051-88ed-2405cc915b7d"
```

**Get Note Version**
8cf8383d-425a-4437-bcc7-bf226b520524 = noteId
1 = versionId
```bash
curl -X GET http://localhost:3000/notes/8cf8383d-425a-4437-bcc7-bf226b520524/1
```