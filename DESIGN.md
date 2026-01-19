Design Documentation

## 1. Table Design

I utilize DynamoDB Sinlge Table Desing to manage all entities such as Users, Notes, SharedNotes, Tags and Versions within a single table.

### Primary Table Structure
PK (Partition Key): Holds the entity ID. This is a must to have.
-> Examples from the table structure: USER#<user_id>, EMAIL#<email>, NOTE_HISTORY#<note_id>

SK (Sort Key): Defines hierarchy and sorting. It is optional.
-> Examples from the table structure : PROFILE, NOTE#<deadline>#<id>, TAG#<tag>NOTE#<id>, UNIQUE_EMAILS, SHARED#<note_id>, VER#<version>

### Global Secondary Indexes (GSIs)
**GSI1 (User/Email Lookup)**
GSI1PK : EMAIL#<email> 
GSI1SK : USER#<id>
Purpose: Look up users by email.

**GSI2 (Note/Deadline Lookup)**
GSI2PK : NOTE#<note_id>
GSI2SK : SHARED#<user_id> or USER#<user_id>
Purpose: Reverse lookup for notes and shared notes.

### The reasoning behind the structure
-> I decided to reuse PK, SK and GSIs to store different types of data to avoid
extra cost and space for the other entities. GSI2 is being used by Note and SharedNote for this reason.

-> By adding the 'deadline' to the Note's SK (NOTE#<deadline>#<id>), DynamoDB automatically keeps the notes sorted by deadline. While getting the due-after and due-before notes, I used fixed MIN and MAX values to only check the deadlines.

-> I used EMAIL#<email> as a PK to enforce for email uniqueness. I didn't want to query all the pk: USER#<user_id> sk:PROFILE just to check for an email. Instead, I created items with pk: EMAIL#<email> and sk: UNIQUE_EMAILS.

-> I didn't want to store old versions of notes in one item in a JSON. That would be costly and at one point in the future it'll exceed the JSON limit. That's why I store snapshots of notes in separate items using pk: NOTE_HISTORY#<note_id> and sk: VER#<version>.

-> sk: SHARED<note_id> pattern is necessary for the many-to-many relation between Users and SharedNotes. The GSI2 index helps us to see who has access to a specific note.

-> Notes have tags as attributes in them. Additionallyi I am utilizing sk: TAG#<tag>NOTE#<id> to use in getting many notes with the specified tag. Basically a batch operation.

## 2. Entity Relationships

* **User -> Note (One to Many):**
  User and their notes share the same partition key(USER#<id>).
  Notes are differentiated by SK (NOTE#<deadline>#<id>).
  This enables efficient querying of all notes for a user in a single operation.

* **User -> SharedNote (Many to Many):**
  User and their shared notes share the same partition key(USER#<id>).
  A note is inserted into the Recipient's partition pointing back to the note.

* **Note -> Tag (Many to Many):**
  Tags are stored as a 'Set' on the Note item for read access.
  A separate Entity is stored to enable searching notes by tag.

* **Note -> Version (One to Many):**
  Stored in a separate partition to prevent exceeding of the size limit.

  **Hot Queries**
  Get User
  ```
  SELECT * FROM table
  WHERE PK = USER#<user_id>
  AND SK = PROFILE
  ```
  Create Note
  ```
  INSERT INTO Notes (
    note_id,
    user_id,
    title,
    content,
    deadline,
    created_at,
    updated_at
  )
  VALUES (
      :note_id,
      :userId,
      :title,
      :content,
      :deadline,
      :now,
      :now
  );

  Get notes due-after
  ```
  ```
  SELECT * FROM table
  WHERE PK = 'USER#<userId>'
  AND SK > 'NOTE#<future-date>#MIN'
  ```

## 3. Access Pattern Mapping
 ```
POST /users/
- Operation: Transaction.write
- Index: Primary
- Key Condition: PK = 1. Put User (PK=USER#<id>)
                      2. Put Constraint (PK=EMAIL#<email>, Condition: attribute_not_exists(PK))
- Why: Creates users while checking for email uniqueness
 ```

```
GET /users/:id
- Operation: GetItem
- Index: Primary
- Key Condition: PK = USER#<id>
- Why: Get user by id
```

```
GET /users/by-email/:email
- Operation: Query
- Index: GSI1
- Key Condition: GSI1PK = EMAIL#<email>
- Why: Get user by email
```

```
POST /users/:userId/notes
- Operation: PutItem
- Index: Primary
- Key Condition: PK=USER#<id> AND SK=NOTE#<deadline>#<id>
- Why: Create note for user with deadline
```

```
GET /users/:userId/notes
- Operation: Query
- Index: Primary
- Key Condition: PK=USER#<id> AND begins_with(SK, NOTE#)
- Why: Get note for user with deadline
```

```
GET /users/:userId/notes/due-before/:date
- Operation: Query
- Index: Primary
- Key Condition: PK = USER#<id> AND SK < NOTE#<date>
- Why: Get notes for user with deadline before date
```

```
GET /users/:userId/notes/due-after/:date
- Operation: Query
- Index: Primary
- Key Condition: PK = USER#<id> AND SK > NOTE#<date>
- Why: Get notes for user with deadline after date
```

```
PUT /notes/:id
- Operation: Transaction.write
- Index: Primary
- Key Condition: 
   1.PutItem (NoteVersion): Creates snapshot of current state.
   PK=NOTE_HISTORY#<id>, SK=VER#<currentVer>
   2. UpdateItem (Note): Updates content & increments version.
   PK=USER#<id>, SK=NOTE#<deadline>#<id>
   3. Condition: attribute_exists(id) ensures we don't accidentally create a new note if the ID is wrong.
- Why: Update note with version
```

```
DELETE /notes/:id
- Operation: DeleteItem
- Index: Primary
- Key Condition: PK=USER#<userId> AND SK=NOTE#<deadline>#<id>
- Why: Delete note
```

```
POST /notes/:noteId/share
- Operation: PutItem
- Index: Primary
- Key Condition: PK=USER#<sharedWith> AND SK=SHARED#<noteId>
- Why: Share note with another user
```

```
GET /notes/:userId/shared
- Operation: Query + BatchGet
- Index: Primary
- Key Condition: PK=USER#<userId> & SK=SHARED#<noteId>
- Why: Get shared notes for user
```

```
GET /notes/:noteId/accessList
- Operation: Query
- Index: GSI2
- Key Condition: GSI2PK=NOTE#<noteId> AND GSI2SK=SHARED#<sharedWith>
- Why: Get access list for note
```

```
POST /notes/:noteId/tags
- Operation: Transaction.write
- Index: Primary 
- Key Condition: 1. Patch Note (Add to tags set) PK=USER#<userId> AND SK=NOTE#<deadline>#<id>
                 2. Create TagItem (Search Index) PK=USER#<userId> AND SK=TAG#<tag>#NOTE#<noteId>
- Why: Add tag to note
```

```
GET /notes/tags/:tagName?userId=<userId>
- Operation: Query + BatchGet
- Index: Primary
- Key Condition: 1.Query PK=USER#<id> & SK=TAG#<tag>
                 2. BatchGetItem to fetch actual Notes.
-Why: Get notes with tag
```

```
GET /notes/:noteId/:version
- Operation: Query
- Index: Primary
- Key Condition: PK=NOTE_HISTORY#<noteId> AND SK=VER#<version>
- Why: Get note version
```

## 4. Uniqueness Constraint Implementation

DynamoDB does not support unique constraints on non-primary attributes. To enforce unique emails:

1. Constraint Entity: We created a dedicated entity (emailLock) solely to reserve the email address.

  PK: EMAIL#<email>

  SK: UNIQUE_EMAILS

2. Transactional Write: When creating a user, we use TransactWriteItems.

  Operation A: Create the User Profile.

  Operation B: Create the Constraint Entity.

3. Condition Expression:

  On Operation B, we apply: attribute_not_exists(PK). ElectroDB automatically applies existence conditions for .create() operations.

4. Error Handling:

  We catch TransactionCanceledException.
  
  -> (OLD WAY DynamoDB SDK)
  We inspect CancellationReasons. If the reason at the index of the Email Lock is ConditionalCheckFailed, we throw a specific "Email already taken" error.

  -> (NEW WAY ElectroDB)
  We check the rejected field of the returned object. If the code is equal to ConditionalCheckFailed then we throw the error.

## 5. Design Decisions & Trade-offs
  1. FindByTag
    At first, I decided to retrieve all notes belonging to a user and then filter them by tags. At that moment, it seemed like a good idea. However, after considering the read requirements, I switched to using BatchGetItem.
    
    While this approach does not noticeably affect the application’s performance right now, the number of required read operations increases as more notes are persisted in the database. For example, if a user had 10,000 notes, the systemwould need to read all of them just to apply the tag filter. This would make the application visibly slow andinefficient.

  
  2. FindNoteByVersion
    By storing the notes history as new items might increase the storage cost. But other option was storing the previous notes as JSONs inside the current Note. After learning about the JSON size limit of the DynamoDB, and it wasn't recommended that much so I decided to create a new entity for note history.

    I could also store just the diffs/deltas (similar to Git). But storage is cheap compared to computing the diffs.
  
  3. Using GSI2 more than once
    I use GSI2 for different relationships mostly for reverse lookups. I've considered adding one more GSI (GSI3) but decided against it because I didn’t want to introduce another index and its associated cost. I alraedy had the GSI2, that's why I chose to reuse it.
    It is a bit difficult to read the table because I've used the same GSI more than once. However, I think pros outweighs the cons.

  **Limitations**

  The "Get Shared Notes" endpoint relies on BatchGetItem, which has a hard limit of 100 item per request. Pagination logic will be needed in the future.

  Changing the deadline is very cumbersome because I've decided to include it in the SK. Currently, users don't have the ability to change the deadline of their notes.