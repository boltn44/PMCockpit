import { supabase } from '../lib/supabase';

interface WelcomeEmailData {
  to: string;
  username: string;
  fullName: string;
  role: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const emailService = {
  async sendWelcomeEmail(emailData: WelcomeEmailData): Promise<EmailResponse> {
    try {
      console.log('Sending welcome email to:', emailData.to);
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: emailData,
      });

      if (error) {
        console.error('Error calling email function:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return {
          success: false,
          error: `Edge Function Error: ${error.message || 'Unknown error'} - ${JSON.stringify(error)}`
        };
      }

      console.log('Email function response:', data);
      
      if (data?.success) {
        return {
          success: true,
          messageId: data.messageId || data.message
        };
      } else {
        console.error('Email function returned failure:', data);
        return {
          success: false,
          error: `Function Response Error: ${data?.error || 'Unknown error occurred'} - Response: ${JSON.stringify(data)}`
        };
      }
    } catch (error) {
      console.error('Email service error:', error);
      console.error('Email service error details:', JSON.stringify(error, null, 2));
      return {
        success: false,
        error: `Service Error: ${error instanceof Error ? error.message : 'Unknown error'} - ${JSON.stringify(error)}`
      };
    }
  },

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<EmailResponse> {
    // Future implementation for password reset emails
    console.log('Password reset email functionality not yet implemented');
    return {
      success: false,
      error: 'Password reset emails not yet implemented'
    };
  },

  async sendNotificationEmail(email: string, subject: string, message: string): Promise<EmailResponse> {
    // Future implementation for general notification emails
    console.log('General notification email functionality not yet implemented');
    return {
      success: false,
      error: 'General notification emails not yet implemented'
    };
  }
};