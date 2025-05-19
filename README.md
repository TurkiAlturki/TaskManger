TaskManager
===========

TaskManager is a cross-platform (mobile and web) task management application built with React Native (Expo) and powered by Firebase. It enables users to create and manage tasks, collaborate within shared groups, and stay updated with push notifications. The app supports real-time updates, task assignment, and a simple yet powerful comment and history system.

Features
--------

- User Authentication:
  - Sign up and login with email/password
  - Google and phone number authentication

- Task Management:
  - Create, edit, and delete tasks with priority and deadlines
  - Inline editing for title, description, and status
  - Assign tasks to group members


- Comments & Reactions:
  - Leave markdown-formatted comments
  - Edit/delete comments
  - React to comments with emojis

- Push Notifications:
  - Real-time alerts for new tasks, completed tasks, and group invites

- Logs & History:
  - Track who performed actions like creating or completing a task
  - View full history with timestamps and user info

- UI/UX:
  - Mobile and web support
  - Responsive design
  - Light and clean layout

Tech Stack
----------

- Frontend: React Native (Expo)
- Backend & Database: Firebase (Authentication, Firestore, Cloud Messaging)
- Navigation: React Navigation
- Notifications: Expo Push Notifications
- Design: Figma
- Project Management: Taiga

Getting Started
---------------

Prerequisites:
- Node.js
- Expo CLI
- Firebase Project (for Authentication, Firestore, and Messaging)

Installation:
1. Clone the repository:
   git clone https://github.com/TurkiAlturki/TaskManger.git

2. Navigate to the project directory:
   cd TaskManger

3. Install dependencies:
   npm install

4. Start the Expo development server:
   npx expo start

Firebase Setup
--------------

1. Go to https://firebase.google.com and create a project.
2. Enable:
   - Authentication (Email/Password, Google, Phone)
   - Firestore Database
   - Firebase Cloud Messaging

3. Create a file called firebaseConfig.js and paste your Firebase config:

Example:

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};

Project Structure
-----------------

src/
├── components/             -> Reusable UI components
├── screens/                -> All screens (Login, Register, AddTask, TaskList, etc.)
├── context/                -> Global state management (e.g., GroupContext)
├── firebaseConfig.js       -> Firebase configuration
├── navigation/             -> Navigation setup
├── utils/                  -> Utility functions and helpers
App.js                      -> Entry point

