# Database Setup Guide

This project uses Drizzle ORM with PostgreSQL for data persistence, supporting both local Docker development and Google Cloud SQL production environments.

## Local Development Setup

### 1. Start PostgreSQL with Docker

```bash
# Start the PostgreSQL container
npm run db:dev:up

# Check logs
npm run db:dev:logs

# Stop the container
npm run db:dev:down
```

### 2. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration for local development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=photo_validator
```

### 3. Run Migrations

```bash
# Generate migration files (if schema changes)
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

### 4. Database Studio (Optional)

```bash
# Open Drizzle Studio to view/manage data
npm run db:studio
```

## Production Setup (Google Cloud SQL)

### 1. Environment Variables

Set these environment variables in your production environment:

```env
# Google Cloud SQL Configuration (External Account authentication)
CLOUD_SQL_CONNECTION_NAME=your-project:your-region:your-instance
CLOUD_SQL_USER=your-iam-user@your-project.iam
CLOUD_SQL_DATABASE=photo_validator
```

### 2. Authentication

The application uses External Account authentication with Vercel OIDC for secure connection to Google Cloud SQL. The setup includes:

1. **External Account Client**: Uses Vercel OIDC tokens for authentication
2. **Workload Identity Pool**: Configured for secure token exchange
3. **Service Account Impersonation**: For database access permissions

Make sure:
1. Your Google Cloud SQL instance allows external connections
2. IAM authentication is properly configured
3. Your Vercel deployment has the necessary Google Cloud credentials
4. Workload Identity Pool is set up for OIDC authentication

## Database Schema

### Orders Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, auto-generated |
| payment_id | VARCHAR(255) | Optional Stripe payment ID |
| status | ENUM | Order status: pending, processing, completed, failed, cancelled |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Available Scripts

- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:migrate` - Apply migrations to database
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:dev:up` - Start local PostgreSQL container
- `npm run db:dev:down` - Stop local PostgreSQL container
- `npm run db:dev:logs` - View PostgreSQL container logs

## Usage in Code

```typescript
import { createDatabaseConnection, orderService } from './api/lib/database';

// Initialize database connection
await createDatabaseConnection();

// Use the order service
const order = await orderService.createOrder({
  paymentId: 'pi_1234567890',
  status: 'pending'
});

const foundOrder = await orderService.getOrderById(order.id);
```

## Migration Workflow

1. Modify the schema in `api/lib/schema.ts`
2. Run `npm run db:generate` to create migration files
3. Review the generated SQL in the `drizzle/` folder
4. Run `npm run db:migrate` to apply changes to database
