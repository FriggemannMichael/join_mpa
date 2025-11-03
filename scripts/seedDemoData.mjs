#!/usr/bin/env node
/**
 * Script zum Einrichten von Demo-Daten in Firebase
 * Erstellt Demo-Tasks und Demo-Contacts für Guest-User und Testzwecke
 * 
 * WICHTIG: Dieses Script muss mit einem authentifizierten Benutzer laufen.
 * Alternativ: Firebase Security Rules temporär auf public setzen oder 
 * Service Account verwenden.
 * 
 * Usage: npm run seed:demo
 * 
 * MANUELLE ALTERNATIVE:
 * 1. Firebase Console öffnen: https://console.firebase.google.com/
 * 2. Realtime Database öffnen
 * 3. Import JSON unter /contacts und /tasks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Demo-Contacts
 */
const demoContacts = [
  {
    name: "Anton Mayer",
    email: "anton.mayer@example.com",
    phone: "+49 123 4567890",
    color: "#FF7A00"
  },
  {
    name: "Anja Schulz",
    email: "anja.schulz@example.com",
    phone: "+49 123 4567891",
    color: "#6E52FF"
  },
  {
    name: "Benedikt Ziegler",
    email: "benedikt.ziegler@example.com",
    phone: "+49 123 4567892",
    color: "#02CF2F"
  },
  {
    name: "David Eisenberg",
    email: "david.eisenberg@example.com",
    phone: "+49 123 4567893",
    color: "#FF5EB3"
  },
  {
    name: "Eva Fischer",
    email: "eva.fischer@example.com",
    phone: "+49 123 4567894",
    color: "#FFC700"
  },
  {
    name: "Emmanuel Mauer",
    email: "emmanuel.mauer@example.com",
    phone: "+49 123 4567895",
    color: "#0038FF"
  },
  {
    name: "Marcel Bauer",
    email: "marcel.bauer@example.com",
    phone: "+49 123 4567896",
    color: "#C3FF2B"
  },
  {
    name: "Tatjana Wolf",
    email: "tatjana.wolf@example.com",
    phone: "+49 123 4567897",
    color: "#FF4646"
  }
];

/**
 * Demo-Tasks
 */
const demoTasks = [
  {
    title: "Kochwelt Page & Recipe Recommender",
    description: "Build start page with recipe recommendation.",
    dueDate: "2025-05-10",
    category: "user-story",
    categoryLabel: "User Story",
    priority: "medium",
    status: "toDo",
    assignees: [
      { uid: "demo-1", name: "Emmanuel Mauer", email: "emmanuel.mauer@example.com" },
      { uid: "demo-2", name: "Marcel Bauer", email: "marcel.bauer@example.com" }
    ],
    subtasks: [
      { text: "Implement Recipe Recommendation", done: false },
      { text: "Start Page Layout", done: false }
    ],
    createdBy: "demo-user",
    createdByEmail: "demo@example.com",
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10
  },
  {
    title: "CSS Architecture Planning",
    description: "Define CSS naming conventions and structure.",
    dueDate: "2025-06-05",
    category: "technical-task",
    categoryLabel: "Technical Task",
    priority: "urgent",
    status: "toDo",
    assignees: [
      { uid: "demo-3", name: "Eva Fischer", email: "eva.fischer@example.com" }
    ],
    subtasks: [],
    createdBy: "demo-user",
    createdByEmail: "demo@example.com",
    createdAt: Date.now() - 86400000 * 9,
    updatedAt: Date.now() - 86400000 * 9
  },
  {
    title: "HTML Base Template Creation",
    description: "Create reusable HTML base templates with semantic structure.",
    dueDate: "2025-06-10",
    category: "technical-task",
    categoryLabel: "Technical Task",
    priority: "low",
    status: "inProgress",
    assignees: [
      { uid: "demo-4", name: "Anton Mayer", email: "anton.mayer@example.com" },
      { uid: "demo-5", name: "Anja Schulz", email: "anja.schulz@example.com" }
    ],
    subtasks: [
      { text: "Create HTML shell", done: true },
      { text: "Add semantic tags", done: false },
      { text: "Validate structure", done: false }
    ],
    createdBy: "demo-user",
    createdByEmail: "demo@example.com",
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 2
  },
  {
    title: "Contact Form Implementation",
    description: "Implement a contact form with validation and email integration.",
    dueDate: "2025-07-01",
    category: "user-story",
    categoryLabel: "User Story",
    priority: "medium",
    status: "inProgress",
    assignees: [
      { uid: "demo-6", name: "David Eisenberg", email: "david.eisenberg@example.com" }
    ],
    subtasks: [
      { text: "Design form layout", done: true },
      { text: "Add input validation", done: true },
      { text: "Connect email service", done: false }
    ],
    createdBy: "demo-user",
    createdByEmail: "demo@example.com",
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 1
  },
  {
    title: "Daily Kochwelt Recipe",
    description: "Implement daily recipe selection and display.",
    dueDate: "2025-05-09",
    category: "user-story",
    categoryLabel: "User Story",
    priority: "low",
    status: "awaitFeedback",
    assignees: [
      { uid: "demo-7", name: "Tatjana Wolf", email: "tatjana.wolf@example.com" },
      { uid: "demo-1", name: "Emmanuel Mauer", email: "emmanuel.mauer@example.com" }
    ],
    subtasks: [
      { text: "Create recipe database", done: true },
      { text: "Implement random selection", done: true },
      { text: "Design recipe card", done: true }
    ],
    createdBy: "demo-user",
    createdByEmail: "demo@example.com",
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 1
  },
  {
    title: "Responsive Design Implementation",
    description: "Make all pages responsive for mobile, tablet, and desktop.",
    dueDate: "2025-08-15",
    category: "technical-task",
    categoryLabel: "Technical Task",
    priority: "urgent",
    status: "done",
    assignees: [
      { uid: "demo-8", name: "Benedikt Ziegler", email: "benedikt.ziegler@example.com" }
    ],
    subtasks: [
      { text: "Mobile breakpoints", done: true },
      { text: "Tablet breakpoints", done: true },
      { text: "Desktop optimization", done: true }
    ],
    createdBy: "demo-user",
    createdByEmail: "demo@example.com",
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 5
  },
  {
    title: "User Authentication System",
    description: "Setup secure user login and registration flow.",
    dueDate: "2025-09-01",
    category: "technical-task",
    categoryLabel: "Technical Task",
    priority: "urgent",
    status: "done",
    assignees: [
      { uid: "demo-2", name: "Marcel Bauer", email: "marcel.bauer@example.com" },
      { uid: "demo-4", name: "Anton Mayer", email: "anton.mayer@example.com" }
    ],
    subtasks: [
      { text: "Setup Firebase Auth", done: true },
      { text: "Create login form", done: true },
      { text: "Add password reset", done: true },
      { text: "Test authentication flow", done: true }
    ],
    createdBy: "demo-user",
    createdByEmail: "demo@example.com",
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now() - 86400000 * 10
  }
];

/**
 * Generiert JSON-Export-Dateien für Firebase Import
 */
function generateJSONFiles() {
  console.log("� Generating JSON export files...\n");
  
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Contacts JSON
  const contactsObj = {};
  demoContacts.forEach((contact, index) => {
    const key = `demo-contact-${index + 1}`;
    contactsObj[key] = contact;
  });
  
  const contactsPath = path.join(outputDir, 'contacts.json');
  fs.writeFileSync(contactsPath, JSON.stringify(contactsObj, null, 2));
  console.log(`✓ Created: ${contactsPath}`);
  
  // Tasks JSON
  const tasksObj = {};
  demoTasks.forEach((task, index) => {
    const key = `demo-task-${index + 1}`;
    tasksObj[key] = task;
  });
  
  const tasksPath = path.join(outputDir, 'tasks.json');
  fs.writeFileSync(tasksPath, JSON.stringify(tasksObj, null, 2));
  console.log(`✓ Created: ${tasksPath}`);
  
  console.log("\n✅ JSON files generated successfully!");
  console.log("\n📋 MANUAL IMPORT INSTRUCTIONS:");
  console.log("1. Open Firebase Console: https://console.firebase.google.com/");
  console.log("2. Select your project: join-project-7569c");
  console.log("3. Go to: Realtime Database");
  console.log("4. Click on the three dots ⋮ menu");
  console.log("5. Select 'Import JSON'");
  console.log("6. Import contacts.json to path: /contacts");
  console.log("7. Import tasks.json to path: /tasks");
  console.log("\n📁 JSON files location:");
  console.log(`   ${outputDir}`);
}

// Script ausführen
generateJSONFiles();
