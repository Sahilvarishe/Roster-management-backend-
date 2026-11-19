# Roster Management System - Backend API

RESTful API backend for the Operations & Roster Management System built with Express.js, MongoDB (Mongoose), and JWT authentication.

## Tech Stack
- **Node.js & Express 4** (ES Modules)
- **MongoDB & Mongoose 8**
- **JSON Web Tokens (JWT) & bcryptjs** for authentication & RBAC
- **dotenv & cookie-parser**

## Setup & Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your configuration:
   ```bash
   cp .env.example .env
   ```

3. Seed initial database data:
   ```bash
   npm run seed
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Start production server:
   ```bash
   npm start
   ```

## Available Scripts
- `npm start`: Starts the server (`node src/server.js`)
- `npm run dev`: Starts server with Nodemon auto-reload
- `npm run seed`: Seeds database with realistic pods, employees, brands, processes, roster, holidays, leaves, and conflicts
