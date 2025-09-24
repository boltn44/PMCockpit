import { supabase } from '../lib/supabase';
import { User } from '../types';
import { emailService } from './emailService';

export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      username: item.username,
      email: item.email,
      fullName: item.full_name,
      role: item.role,
      status: item.status,
      createdAt: item.created_at,
      lastLogin: item.last_login,
    }));
  },

  async create(user: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<User> {
    console.log('Creating user:', user);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        username: user.username,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        status: user.status,
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newUser = {
      id: data.id,
      username: data.username,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      status: data.status,
      createdAt: data.created_at,
      lastLogin: data.last_login,
    };

    // Send welcome email asynchronously (don't block user creation)
    this.sendWelcomeEmailAsync(newUser);
    
    return newUser;
  },

  async sendWelcomeEmailAsync(user: User): Promise<void> {
    try {
      console.log('Sending welcome email for user:', user.username);
      
      const emailResult = await emailService.sendWelcomeEmail({
        to: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      });

      if (emailResult.success) {
        console.log(`Welcome email sent successfully to ${user.email}, Message ID: ${emailResult.messageId}`);
      } else {
        console.error(`Failed to send welcome email to ${user.email}:`, emailResult.error);
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error - email failure shouldn't break user creation
    }
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    const updateData: any = {};
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      status: data.status,
      createdAt: data.created_at,
      lastLogin: data.last_login,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async updateLastLogin(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },

  async findByCredentials(username: string, password: string): Promise<User | null> {
    // Note: In a real application, you would hash passwords and store them securely
    // For demo purposes, we'll use hardcoded credentials
    const demoCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'manager', password: 'manager123' },
      { username: 'user', password: 'user123' },
    ];

    const validCredential = demoCredentials.find(
      cred => cred.username === username && cred.password === password
    );

    if (!validCredential) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('status', 'Active')
      .single();
    
    if (error || !data) return null;

    // Update last login
    await this.updateLastLogin(data.id);

    return {
      id: data.id,
      username: data.username,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      status: data.status,
      createdAt: data.created_at,
      lastLogin: new Date().toISOString(),
    };
  }
};