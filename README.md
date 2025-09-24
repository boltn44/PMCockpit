PMCockpit

## Email Notification System

The application includes an automated email notification system that sends welcome emails to newly created users.

### Setup Email Service

1. **Configure Mailtrap** for email testing:
   ```bash
   # Add to your Supabase project's Edge Function environment variables
   MAILTRAP_TOKEN=your_mailtrap_api_token_here
   FROM_EMAIL=noreply@yourdomain.com
   FROM_NAME=Your Company Name
   ```

   **To get your Mailtrap credentials:**
   - Sign up at [Mailtrap.io](https://mailtrap.io)
   - Go to Email API → Sending Domains
   - Create or select a domain
   - Copy your API Token from the integration settings

2. **Deploy Edge Function**:
   ```bash
   supabase functions deploy send-welcome-email
   ```

### Email Features

- ✅ **Automatic Welcome Emails**: Sent immediately after user creation
- ✅ **Professional HTML Templates**: Responsive design with company branding
- ✅ **Error Handling**: Failed emails don't block user creation
- ✅ **Email Logging**: All email attempts are logged in the database
- ✅ **Async Processing**: Email sending doesn't slow down user creation

### Email Content Includes

- Welcome message with user's name
- Account confirmation details
- Username and role information
- Next steps for getting started
- Support contact information
- Professional branding and styling

### Testing Email Functionality

1. Create a new user in User Management
2. Check browser console for email sending logs
3. Verify email delivery to the user's email address
4. Check `email_logs` table in Supabase for delivery status

### Troubleshooting

- **No emails sent**: Check MAILTRAP_TOKEN configuration
- **Emails in spam**: Configure SPF/DKIM records for your domain
- **Function errors**: Check Supabase Edge Function logs
