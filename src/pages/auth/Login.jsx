import React, { useContext, useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    try {
      await login(values.username, values.password);
      navigate('/');
    } catch (err) {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      width: '100%',
      padding: '20px'
    }}>
      <Card
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '400px',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--glass-card-shadow)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/atlas-logo.png" alt="Logo" style={{ width: 64, height: 64, marginBottom: '1rem', borderRadius: '12px' }} />
          <Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>Welcome Back</Title>
          <Text style={{ color: 'var(--text-secondary)' }}>Sign in to continue to ATLAS</Text>
        </div>

        {error && (
          <Alert message={error} type="error" showIcon style={{ marginBottom: '1rem' }} />
        )}

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your Username!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              Log in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
