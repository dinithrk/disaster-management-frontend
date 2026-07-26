import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUserId, setEditingUserId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showModal = (record = null) => {
    if (record) {
      setEditingUserId(record.userId);
      form.setFieldsValue(record);
    } else {
      setEditingUserId(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        if (editingUserId) {
          await api.put(`/users/${editingUserId}`, values);
          message.success('User updated successfully');
        } else {
          await api.post('/users', values);
          message.success('User created successfully');
        }
        setIsModalVisible(false);
        fetchUsers();
      } catch (error) {
        message.error(error.response?.data || 'Operation failed');
      }
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data || 'Failed to delete user');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>
          {role}
        </Tag>
      ),
      filters: [
        { text: 'ADMIN', value: 'ADMIN' },
        { text: 'OPERATOR', value: 'OPERATOR' },
        { text: 'VIEWER', value: 'VIEWER' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => showModal(record)} />
          <Popconfirm
            title="Delete the user"
            description="Are you sure to delete this user?"
            onConfirm={() => handleDelete(record.userId)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredUsers = users.filter((user) => {
    const searchLower = searchText.toLowerCase();
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    return (
      (user.username && user.username.toLowerCase().includes(searchLower)) ||
      (fullName.includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div style={{ padding: '24px', background: 'var(--bg-surface)', borderRadius: '12px', minHeight: 'calc(100vh - 100px)' }} className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>User Management</Title>
        <Space>
          <Input.Search
            placeholder="Search username, name, email"
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Add User
          </Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredUsers} 
        rowKey="userId" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal 
        title={editingUserId ? "Edit User" : "Create New User"} 
        open={isModalVisible} 
        onOk={handleOk} 
        onCancel={handleCancel}
        okText={editingUserId ? "Save" : "Create"}
      >
        <Form form={form} layout="vertical" name="userForm">
          <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Please input username!' }]}>
            <Input />
          </Form.Item>
          
          {!editingUserId && (
            <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please input password!' }]}>
              <Input.Password />
            </Form.Item>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Please input first name!' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Please input last name!' }]}>
              <Input />
            </Form.Item>
          </div>

          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'The input is not valid E-mail!' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select a role!' }]}>
            <Select>
              <Option value="ADMIN">ADMIN</Option>
              <Option value="OPERATOR">OPERATOR</Option>
              <Option value="VIEWER">VIEWER</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
