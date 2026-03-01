# API Endpoints

All authenticated endpoints require `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint         | Description                          |
| ------ | ---------------- | ------------------------------------ |
| `POST` | `/auth/register` | Create account with email + password |
| `POST` | `/auth/login`    | Returns JWT access token             |
| `POST` | `/auth/logout`   | Invalidate session                   |
| `GET`  | `/auth/me`       | Get current user                     |

### Profile

| Method | Endpoint       | Description                                        |
| ------ | -------------- | -------------------------------------------------- |
| `GET`  | `/api/profile` | Get profile (age, sex, height, weight, goal, etc.) |
| `PUT`  | `/api/profile` | Update any profile fields                          |

### Meal Logging

| Method   | Endpoint                   | Description                              |
| -------- | -------------------------- | ---------------------------------------- |
| `POST`   | `/api/log`                 | Log a food item with full nutrition data |
| `GET`    | `/api/log?date=YYYY-MM-DD` | Get day's items + computed macro totals  |
| `DELETE` | `/api/log/:id`             | Remove a logged item                     |

### Saved Foods

| Method   | Endpoint                    | Description                   |
| -------- | --------------------------- | ----------------------------- |
| `POST`   | `/api/saved-foods`          | Save/favorite a food (upsert) |
| `GET`    | `/api/saved-foods`          | List all saved foods          |
| `DELETE` | `/api/saved-foods/:food_id` | Unsave a food                 |

### Menu

| Method | Endpoint                      | Description                |
| ------ | ----------------------------- | -------------------------- |
| `GET`  | `/api/menu?hall=&meal=&date=` | Fetch menu from Nutrislice |

**Halls:** `gordon-avenue-market` `four-lakes-market` `rhetas-market` `lizs-market` `carsons-market` `lowell-market`

**Meals:** `breakfast` `lunch` `dinner`

**Date:** `YYYY-MM-DD` (optional, defaults to today CT)

### Dining Halls

| Method | Endpoint                | Description                         |
| ------ | ----------------------- | ----------------------------------- |
| `GET`  | `/api/dining-halls`     | All halls with hours and meal types |
| `GET`  | `/api/dining-halls/:id` | Single hall details                 |

### Recommendations

| Method | Endpoint                     | Description                        |
| ------ | ---------------------------- | ---------------------------------- |
| `GET`  | `/api/recommend?meal=&date=` | Top 5 items per hall, personalized |
