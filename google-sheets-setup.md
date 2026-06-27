# Google Sheets Form Submission Setup Guide

This guide describes how to connect the AquaCare360™ inquiry form to a Google Sheet so that all form responses are automatically logged.

## Step 1: Create a Google Spreadsheet

1. Open [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Name your spreadsheet (e.g., `AquaCare360 Form Responses`).
3. You can leave the sheet empty; the script below will automatically create the correct column headers ("Timestamp", "Name", "Mobile", "Email", "Location", "Service Type", "Message") on the very first form submission.

---

## Step 2: Create a Google Apps Script Web App

1. In your Google Spreadsheet, click on **Extensions** > **Apps Script** in the top menu.
2. Delete any code in the editor and paste the following Google Apps Script:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Create headers if the sheet is brand new/empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Name", "Mobile", "Email", "Location", "Service Type", "Message"]);
  }
  
  var name = "", mobile = "", email = "", location = "", serviceType = "", message = "";
  
  try {
    if (e.postData && e.postData.contents) {
      var data = JSON.parse(e.postData.contents);
      name = data.name || "";
      mobile = data.mobile || "";
      email = data.email || "";
      location = data.location || "";
      serviceType = data.serviceType || "";
      message = data.message || "";
    } else {
      name = e.parameter.name || "";
      mobile = e.parameter.mobile || "";
      email = e.parameter.email || "";
      location = e.parameter.location || "";
      serviceType = e.parameter.serviceType || "";
      message = e.parameter.message || "";
    }
  } catch (err) {
    name = e.parameter.name || "";
    mobile = e.parameter.mobile || "";
    email = e.parameter.email || "";
    location = e.parameter.location || "";
    serviceType = e.parameter.serviceType || "";
    message = e.parameter.message || "";
  }
  
  var timestamp = new Date();
  sheet.appendRow([timestamp, name, mobile, email, location, serviceType, message]);
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}
```

3. Click the **Save** (disk) icon in the toolbar, or press `Ctrl + S`.
4. You can rename the script project to something like `AquaCare360 Forms` by clicking on "Untitled project" at the top.

---

## Step 3: Deploy the Apps Script as a Web App

1. In the top right corner of the Apps Script page, click **Deploy** > **New deployment**.
2. Click the gear icon next to **Select type** and choose **Web app**.
3. Fill in the deployment details:
   - **Description**: `AquaCare360 form handler`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` (This is **crucial** so the public website can submit responses without requesting Google sign-in).
4. Click **Deploy**.
5. You may be prompted to authorize access. Click **Authorize access**, choose your Google account, click **Advanced** > **Go to AquaCare360 Forms (unsafe)**, and click **Allow**.
6. Once deployed, copy the **Web app URL** shown in the "New deployment" window. It should look like:
   `https://script.google.com/macros/s/AKfycb.../exec`

---

## Step 4: Configure the Website Environment

1. Create a file named `.env.local` in the root directory of this project (if it doesn't already exist).
2. Add your deployed Web App URL:
   ```env
   VITE_GOOGLE_SHEET_URL=https://script.google.com/macros/s/YOUR_DEPLOYED_WEB_APP_ID/exec
   ```
3. Restart your local development server (`npm run dev`) to load the new environment variable.
