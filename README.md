# BFHL Full-Stack Project

This is my submission for the BFHL full-stack test.

## Tech Stack

- Backend: Node.js + Express
- Frontend: HTML/CSS/JavaScript
- CORS: enabled in backend

## Project Structure

```text
Bajaj full stack test/
  backend/
    src/
      routes/
        bfhlRoutes.js
      services/
        graphService.js
      utils/
        validators.js
      app.js
      config.js
      server.js
    package.json
    sample-test-cases.json
  frontend/
    index.html
    app.js
    styles.css
  README.md
```

## API

- Method: `POST`
- Route: `/bfhl`
- Content-Type: `application/json`

### Request Body

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

### Response Fields

- `user_id`
- `email_id`
- `college_roll_number`
- `hierarchies`
- `invalid_entries`
- `duplicate_edges`
- `summary`

## Implemented Rules

1. Validation
- Entry must be in `X->Y` format
- `X` and `Y` must be single uppercase letters
- Whitespace is trimmed before validation
- Invalid values are added to `invalid_entries`
- Self-loop (`A->A`) is invalid

2. Duplicates
- Repeated edge is ignored after first occurrence
- Edge is added once to `duplicate_edges`

3. Graph build
- Adjacency list is created from valid edges
- If a child gets multiple parents, first parent is retained

4. Roots and tree construction
- Root is any node that never appears as child
- Nested tree object is produced per root

5. Cycle detection
- DFS is used to detect cycles
- Cyclic hierarchy returns:
  - `tree: {}`
  - `has_cycle: true`

6. Depth and summary
- Depth is longest root-to-leaf path in node count
- Summary returns:
  - `total_trees`
  - `total_cycles`
  - `largest_tree_root` (lexicographically smaller on tie)

7. Hierarchy ordering
- Hierarchies are emitted by first-seen component order from input

## Run Locally

### 1) Start backend

```bash
cd backend
npm install
npm run start
```

Backend runs at: `http://localhost:3000`

### 2) Start frontend

```bash
npx serve frontend -l 5173
```

Frontend runs at: `http://localhost:5173`

## Quick API Test

### cURL

```bash
curl -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d "{\"data\":[\"A->B\",\"A->C\",\"B->D\"]}"
```

### PowerShell

```powershell
$body = @{ data = @('A->B','A->C','B->D') } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/bfhl' -Method Post -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 10
```

## Sample Test Cases

Sample payloads are available in `backend/sample-test-cases.json`.

## Deployment (Frontend on Vercel + API on Render)

### 1) Deploy backend on Render

1. Create a new Web Service from this repository.
2. Set Root Directory to `backend`.
3. Set Build Command to `npm install`.
4. Set Start Command to `npm run start`.
5. Add environment variables:
   - `USER_ID`
   - `EMAIL_ID`
   - `COLLEGE_ROLL_NUMBER`
6. Deploy and copy your Render service URL:
  - `https://adarsh-bfhl.onrender.com`

### 2) Configure frontend API URL

In `frontend/app.js`, set:

- `RENDER_API_BASE_URL` to `https://adarsh-bfhl.onrender.com`

The frontend is already configured to use:

- `http://localhost:3000` during local development
- Render URL in production

### 3) Deploy frontend on Vercel

1. Import this repository in Vercel.
2. Set Root Directory to `frontend`.
3. Framework Preset: `Other`.
4. Deploy.

After deploy:

- Frontend URL: your Vercel domain
- API URL: your Render domain

## Performance

Implementation is based on graph traversal with near `O(V + E)` complexity and is suitable for up to 50 nodes under the required response time.
