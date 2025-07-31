📘 Clinic Management System
A simple and efficient web-based clinic management system built using Next.js, TypeScript, and Firebase.
The system supports role-based logins for doctors and receptionists, enabling streamlined patient visit tracking, prescription management, and billing.

🛠️ Technologies Used
Frontend: React (Next.js with App Router), TypeScript, Tailwind CSS

Backend/Database: Firebase Firestore

Authentication: Firebase Authentication

Hosting: Firebase Hosting (optional)

Logging: Firestore + Custom Logger Utility

🚀 Features
👨‍⚕️ Doctor Dashboard
View all patients

See visit history per patient

View and edit prescriptions per visit

View visit tokens and timestamps

🧑‍💼 Receptionist Dashboard
Add new patients

Generate unique token for each visit

Add new visit automatically on duplicate patient

View patient list and search by name

Generate bill per visit

📄 Patient Visit History
Shows all visits with:

Token

Date & time

Editable prescription field

🧾 Billing
Add billing information (amount)

Bill is linked to each visit

Stored with timestamp

🔐 Role-Based Access
Authenticated login for doctors and receptionists

Protected routes via useAuthGuard() hook

📁 Firestore Database Structure

patients (collection)
│
├── {patientId} (document)
│   ├── name, age, gender
│   └── visits (subcollection)
│       ├── {visitId}
│           ├── token
│           ├── createdAt
│           ├── prescription
│           └── billing
🧪 Testing
Basic manual test scenarios:

 Login as receptionist, add new patient, verify patient appears

 Add patient with existing name → adds new visit

 Login as doctor → edit prescription for any visit

 Check bill generation and logging

 Visit history shows all previous tokens and timestamps

⚙️ Getting Started
1. Clone the repo

git clone https://github.com/Avishek-7/Clinic_management_system
cd Clinic_management_system
2. Install dependencies

npm install
3. Add Firebase config
In /lib/firebase.ts, add your Firebase project config:


const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  ...
}
4. Run the development server

npm run dev
Visit http://localhost:3000

<!-- 📸 Screenshots
(Add relevant screenshots here, such as doctor dashboard, patient list, visit history, etc.) -->

📦 Folder Structure

src/
├── app/
│   ├── doctor/           → Doctor dashboard
│   ├── receptionist/     → Receptionist dashboard
│   ├── billing/[id]/     → Billing per patient
│   └── login/            → Login UI
├── components/           → Shared UI components
├── lib/firebase.ts       → Firebase config
├── utils/                → authGuard, logger, token generator
📄 License
This project is licensed under the MIT License.

👤 Author
Avishek Kumar
🔗 github.com/Avishek-7