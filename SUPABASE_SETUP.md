# Supabase Setup Guide

This project has been configured to use Supabase as the database provider. Supabase provides a PostgreSQL database with additional features like real-time subscriptions, authentication, and storage.

## Quick Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `photo-validator` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
6. Click "Create new project"

### 2. Get Your Database URL

1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Copy the **URI** connection string
4. It should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

### 3. Configure Environment Variables

Create a `.env` file in your project root and add:

```bash
# Supabase Database URL
SUPABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

Replace `[YOUR-PASSWORD]` and `[YOUR-PROJECT-REF]` with your actual values.

### 4. Run Database Migrations

```bash
npm run db:migrate
```

This will create the necessary tables in your Supabase database.

### 5. Verify Setup

You can verify your setup by:

1. **Using Drizzle Studio** (optional):
   ```bash
   npm run db:studio
   ```

2. **Testing the API**:
   ```bash
   # Start your development server
   npx vercel dev
   
   # Test the health endpoint
   curl http://localhost:3000/api/health
   ```

## Benefits of Supabase

- **Managed PostgreSQL**: No need to manage your own database server
- **Real-time features**: Built-in real-time subscriptions
- **Authentication**: User management and authentication
- **Storage**: File storage capabilities
- **Dashboard**: Easy database management through the web interface
- **Backups**: Automatic backups and point-in-time recovery
- **Scaling**: Automatic scaling based on usage

## Development vs Production

The same Supabase database can be used for both development and production, or you can create separate projects for each environment.

For production, make sure to:
- Use environment variables for your connection string
- Enable Row Level Security (RLS) if needed
- Set up proper database policies
- Configure backup schedules

## Troubleshooting

### Connection Issues
- Verify your `SUPABASE_URL` is correct
- Check that your IP is not blocked (Supabase allows all IPs by default)
- Ensure your database password is correct

### Migration Issues
- Make sure you're connected to the right Supabase project
- Check that your database is not in maintenance mode
- Verify your connection string format

### SSL Issues
The configuration automatically handles SSL for Supabase connections. If you encounter SSL issues, the connection string should include SSL parameters.
