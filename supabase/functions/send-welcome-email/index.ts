const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailRequest {
  to: string;
  username: string;
  fullName: string;
  role: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Edge Function called - processing email request')
    
    const requestBody = await req.json()
    console.log('Request body received:', JSON.stringify(requestBody, null, 2))
    
    const { to, username, fullName, role }: EmailRequest = requestBody

    // Validate required fields
    if (!to || !username || !fullName) {
      console.error('Missing required fields:', { to: !!to, username: !!username, fullName: !!fullName })
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const MAILTRAP_TOKEN = Deno.env.get('MAILTRAP_TOKEN')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@demomailtrap.co'
    const FROM_NAME = Deno.env.get('FROM_NAME') || 'PM-Cockpit Team'

    console.log('Environment check:', {
      hasToken: !!MAILTRAP_TOKEN,
      fromEmail: FROM_EMAIL,
      fromName: FROM_NAME
    })

    if (!MAILTRAP_TOKEN) {
      console.error('MAILTRAP_TOKEN not configured')
      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId: 'demo-mode', 
          message: 'Email service not configured - running in demo mode' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create email content
    const emailHtml = generateWelcomeEmailHTML(fullName, username, role)
    const emailText = generateWelcomeEmailText(fullName, username, role)

    // Mailtrap API payload
    const emailPayload = {
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      to: [
        {
          email: to,
          name: fullName
        }
      ],
      subject: 'Welcome to PM-Cockpit - Account Created Successfully',
      text: emailText,
      html: emailHtml
    }

    console.log('Sending email via Mailtrap API to:', to)
    console.log('Email payload:', JSON.stringify(emailPayload, null, 2))

    // Send email via Mailtrap API
    const response = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILTRAP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })

    console.log('Mailtrap API response status:', response.status)
    
    const responseText = await response.text()
    console.log('Mailtrap API response body:', responseText)

    if (response.ok) {
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        console.log('Response is not JSON, treating as success')
        responseData = { message_ids: ['success'] }
      }
      
      const messageId = responseData.message_ids?.[0] || responseData.message_id || 'sent'
      console.log(`Welcome email sent successfully to ${to}, Message ID: ${messageId}`)
      
      return new Response(
        JSON.stringify({ success: true, messageId }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.error(`Mailtrap API error - Status: ${response.status}`)
      console.error('Error response:', responseText)
      
      // Try to parse error response
      let errorMessage = 'Failed to send email'
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch (e) {
        errorMessage = responseText || errorMessage
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Mailtrap API error (${response.status}): ${errorMessage}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error in send-welcome-email function:', error)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Internal server error: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateWelcomeEmailHTML(fullName: string, username: string, role: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PM-Cockpit</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            background: #3b82f6;
            color: white;
            width: 60px;
            height: 60px;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .title {
            color: #1f2937;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 8px 0 0 0;
        }
        .content {
            margin: 30px 0;
        }
        .welcome-text {
            font-size: 18px;
            color: #374151;
            margin-bottom: 20px;
        }
        .account-details {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .detail-label {
            font-weight: 600;
            color: #374151;
        }
        .detail-value {
            color: #6b7280;
        }
        .next-steps {
            background: #dbeafe;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .next-steps h3 {
            color: #1e40af;
            margin: 0 0 15px 0;
            font-size: 18px;
        }
        .next-steps ul {
            margin: 0;
            padding-left: 20px;
        }
        .next-steps li {
            margin-bottom: 8px;
            color: #374151;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .support-info {
            background: #f9fafb;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">PC</div>
            <h1 class="title">Welcome to PM-Cockpit!</h1>
            <p class="subtitle">Your account has been created successfully</p>
        </div>
        
        <div class="content">
            <p class="welcome-text">
                Hello <strong>${fullName}</strong>,
            </p>
            
            <p>
                We're excited to welcome you to PM-Cockpit, your comprehensive project management dashboard. 
                Your account has been successfully created and is ready to use.
            </p>
            
            <div class="account-details">
                <h3 style="margin-top: 0; color: #374151;">Account Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Full Name:</span>
                    <span class="detail-value">${fullName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Username:</span>
                    <span class="detail-value">${username}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Role:</span>
                    <span class="detail-value">${role}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Account Status:</span>
                    <span class="detail-value" style="color: #059669; font-weight: 600;">Active</span>
                </div>
            </div>
            
            <div class="next-steps">
                <h3>Next Steps</h3>
                <ul>
                    <li>Your system administrator will provide you with your login credentials</li>
                    <li>Once you receive your credentials, you can access the PM-Cockpit dashboard</li>
                    <li>Explore the dashboard features including project management, resource allocation, and reporting</li>
                    <li>Contact support if you need any assistance getting started</li>
                </ul>
            </div>
            
            <div class="support-info">
                <h4 style="margin: 0 0 10px 0; color: #374151;">Need Help?</h4>
                <p style="margin: 0; color: #6b7280;">
                    If you have any questions or need assistance, please contact our support team:<br>
                    <strong>Email:</strong> support@pmcockpit.com<br>
                    <strong>Phone:</strong> +1 (555) 123-4567
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p>
                This email was sent automatically by PM-Cockpit.<br>
                © 2024 PM-Cockpit Solutions. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
  `
}

function generateWelcomeEmailText(fullName: string, username: string, role: string): string {
  return `
Welcome to PM-Cockpit!

Hello ${fullName},

We're excited to welcome you to PM-Cockpit, your comprehensive project management dashboard. Your account has been successfully created and is ready to use.

Account Details:
- Full Name: ${fullName}
- Username: ${username}
- Role: ${role}
- Account Status: Active

Next Steps:
1. Your system administrator will provide you with your login credentials
2. Once you receive your credentials, you can access the PM-Cockpit dashboard
3. Explore the dashboard features including project management, resource allocation, and reporting
4. Contact support if you need any assistance getting started

Need Help?
If you have any questions or need assistance, please contact our support team:
Email: support@pmcockpit.com
Phone: +1 (555) 123-4567

This email was sent automatically by PM-Cockpit.
© 2024 PM-Cockpit Solutions. All rights reserved.
  `
}