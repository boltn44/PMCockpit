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
      console.log('Email data:', emailData);
      
      // Call the Supabase Edge Function with explicit error handling
      const response = await supabase.functions.invoke('send-welcome-email', {
        body: emailData,
      });

      console.log('Raw Supabase response:', response);
      console.log('Response data:', response.data);
      console.log('Response error:', response.error);

      // Check for Supabase client errors first
      if (response.error) {
        console.error('Supabase client error:', response.error);
        
        // Try to extract more details from the error
        let errorMessage = 'Unknown Supabase error';
        
        if (response.error.message) {
          errorMessage = response.error.message;
        }
        
        // Check if there's additional context in the error
        if (response.error.context) {
          console.error('Error context:', response.error.context);
          errorMessage += ` - Context: ${JSON.stringify(response.error.context)}`;
        }
        
        // For FunctionsHttpError, try to get the actual response
        if (response.error.name === 'FunctionsHttpError') {
          console.error('FunctionsHttpError detected - this means the Edge Function returned an error status');
          
          // The actual error might be in the response data
          if (response.data) {
            console.log('Checking response data for error details:', response.data);
            if (typeof response.data === 'object' && response.data.error) {
              errorMessage = `Edge Function Error: ${response.data.error}`;
            } else if (typeof response.data === 'string') {
              errorMessage = `Edge Function Error: ${response.data}`;
            }
          }
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      // Check the function's response data
      if (!response.data) {
        console.error('No data returned from Edge Function');
        return {
          success: false,
          error: 'No response data from Edge Function'
        };
      }

      console.log('Edge Function response data:', response.data);
      
      // Handle successful response
      if (response.data.success) {
        console.log('Email sent successfully:', response.data);
        return {
          success: true,
          messageId: response.data.messageId || response.data.message
        };
      } else {
        // Function returned success: false
        console.error('Edge Function returned failure:', response.data);
        return {
          success: false,
          error: response.data.error || 'Edge Function returned failure without error message'
        };
      }
    } catch (error) {
      console.error('Email service catch block error:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error stack:', error.stack);
      } else if (typeof error === 'object' && error !== null) {
        console.error('Non-Error object caught:', error);
        errorMessage = JSON.stringify(error);
      } else {
        console.error('Non-object error caught:', error);
        errorMessage = String(error);
      }
      
      return {
        success: false,
        error: `Service Error: ${errorMessage}`
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