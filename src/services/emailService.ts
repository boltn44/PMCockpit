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
        return {
          success: false,
          error: error.message || 'Failed to send email'
        };
      }

      console.log('Email function response:', data);
      
      if (data?.success) {
        return {
          success: true,
          messageId: data.messageId
        };
      } else {
        return {
          success: false,
          error: data?.error || 'Unknown error occurred'
        };
      }
    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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