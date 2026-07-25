import React, { useContext, useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const { Title, Text } = Typography;

const Profile = () => {
  const { user, fetchUser } = useContext(AuthContext);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const onUpdateProfile = async (values) => {
    setUpdatingProfile(true);
    try {
      await api.put(`/users/${user.userId}`, {
        username: values.username,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
      });
      message.success('Profile updated successfully');
      fetchUser();
    } catch (error) {
      message.error(error.response?.data || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const onChangePassword = async (values) => {
    setUpdatingPassword(true);
    try {
      await api.post(`/users/${user.userId}/change-password`, {
        currentPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error) {
      message.error(error.response?.data || 'Failed to change password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2} style={{ color: 'var(--text-primary)', marginBottom: '24px' }}>My Profile</Title>
      
      <Card className="glass-panel" style={{ marginBottom: '24px', background: 'var(--bg-surface)' }}>
        <Title level={4} style={{ color: 'var(--text-primary)' }}>Personal Information</Title>
        <Text style={{ color: 'var(--text-secondary)' }}>Update your account details here.</Text>
        <Divider />
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={onUpdateProfile}
          initialValues={{
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item name="username" label="Username" rules={[{ required: true }]}>
              <Input prefix={<UserOutlined />} />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
              <Input prefix={<MailOutlined />} />
            </Form.Item>
          </div>
          <Form.Item label="Role">
            <Input value={user.role} disabled />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={updatingProfile}>
            Save Changes
          </Button>
        </Form>
      </Card>

      <Card className="glass-panel" style={{ background: 'var(--bg-surface)' }}>
        <Title level={4} style={{ color: 'var(--text-primary)' }}>Change Password</Title>
        <Text style={{ color: 'var(--text-secondary)' }}>Ensure your account is using a long, random password to stay secure.</Text>
        <Divider />
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={onChangePassword}
        >
          <Form.Item
            name="oldPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: 'Please enter a new password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            
            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm your new password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit" loading={updatingPassword}>
            Update Password
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Profile;
