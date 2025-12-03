# Nodebook Project `GEMINI.md`

This document provides a comprehensive overview of the Nodebook project, its architecture, and development conventions.

## Project Overview

Nodebook is a modular node-based notebook application. It consists of a `server` (backend) and a `web` (frontend) component.

*   **Backend (`server`):** A Node.js application built with Express.js and TypeScript. It uses Prisma as an ORM to interact with a PostgreSQL database.
*   **Frontend (`web`):** A React application built with Vite and TypeScript. It uses React Router for navigation and Tailwind CSS for styling.
*   **Database (`db`):** A PostgreSQL database.
*   **Containerization:** The entire application is containerized using Docker and orchestrated with Docker Compose.

## Building and Running

The following commands are essential for building and running the project:

*   **Install Dependencies:**
    ```bash
    pnpm install -w
    ```
*   **Start the Application (Development):**
    ```bash
    docker compose up --build -d
    ```
*   **Run Database Migrations:**
    ```bash
    docker compose exec server npx prisma generate
    docker compose exec server npx prisma db push
    ```
*   **Stop the Application:**
    ```bash
    docker compose down -v
    ```

### Accessing the Application

*   **Frontend:** [http://localhost:5173](http://localhost:5173)
*   **Server API:** [http://localhost:4000](http://localhost:4000)
*   **Adminer (Database GUI):** [http://localhost:8080](http://localhost:8080)

## Development Conventions

*   **Code Style:** The project uses Prettier for code formatting and ESLint for linting.
    *   **Format Code:** `pnpm format`
    *   **Lint Code:** `pnpm lint`
*   **API Communication:** The frontend communicates with the backend via a REST API. The API client is set up in `web/src/api.ts`.
*   **Database:** The database schema is managed by Prisma. The schema is defined in `server/prisma/schema.prisma`.
