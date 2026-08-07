# Chatbot Homework Notification

Firebase Cloud Functions backend for a Dialogflow + LINE chatbot that reminds students about homework deadlines and class schedules.

## What it does

- **Dialogflow webhook** (`webhookfunction`) handles intents from a LINE chatbot:
  - `nontiHW` — lists upcoming homework (subject, topic, due date, link) pulled from Google Sheets, sorted by due date, rendered as a LINE Flex carousel.
  - `timetable` — shows day-of-week buttons for the class schedule.
  - `timetable_custom` — shows the schedule for a selected day.
  - `ChatBot` — asks the user whether to turn automatic notifications on/off.
  - `ChatBot_yes` / `ChatBot_no` — saves the user's notification preference to Firestore (`users/{userId}.notificationEnabled`).
- **Scheduled notifications** (Cloud Scheduler via `onSchedule`):
  - `dailyNotification` — every day at 18:00 (Asia/Bangkok), pushes homework reminders to all opted-in users via the LINE Messaging API.
  - `dailyNotification_schedule` — weekdays at 08:00 (Asia/Bangkok), pushes today's class schedule to all opted-in users.
- Data source: a Google Sheet (`2ndFeature` tab for homework, `sheet2` tab for timetable), read via a Google service account.
- User opt-in state and delivery: Firestore + LINE Messaging API push/reply messages.

## Tech stack

- Firebase Cloud Functions (Node 22)
- Firebase Admin SDK / Firestore
- Google Sheets API (`googleapis`)
- LINE Messaging API (`axios`)
- `moment` for date parsing
- Dialogflow as the NLU/webhook front end

## Project structure

```
functions/
  index.js          # all Cloud Functions (webhook + scheduled jobs)
  package.json
firebase.json        # Firebase project config (functions + storage rules)
storage.rules
```

## Setup

1. Install dependencies:
   ```
   cd functions
   npm install
   ```
2. Set required config/secrets (do not hardcode credentials):
   - `GOOGLE_SHEETS_KEY` — private key for the Google service account (`sheetapi@test01-205c7.iam.gserviceaccount.com`) with read access to the target spreadsheet.
   - LINE channel access token — currently hardcoded in `index.js`; move this to an environment variable / Firebase secret before deploying anywhere public.
3. Update the spreadsheet ID / sheet ranges in `functions/index.js` if you're pointing at your own sheet.
4. Connect a Dialogflow agent and set its webhook URL to the deployed `webhookfunction` endpoint, with intents named `nontiHW`, `timetable`, `timetable_custom`, `ChatBot`, `ChatBot_yes`, `ChatBot_no`.
5. Connect the Dialogflow agent to a LINE Official Account (via LINE's Dialogflow integration or a custom bridge).

## Local development

```
cd functions
npm run serve      # firebase emulators:start --only functions
npm run shell       # firebase functions:shell
npm run logs        # firebase functions:log
```

## Deploy

```
firebase deploy --only functions
```

## Security note

`index.js` currently has a LINE channel access token hardcoded as a string literal. Rotate that token and move it to an environment variable / Firebase Functions secret before making this repo public or sharing it.
