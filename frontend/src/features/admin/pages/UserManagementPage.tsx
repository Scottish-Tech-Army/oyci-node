import { useState, useEffect } from 'react'
import { usersAPI } from '../../../services/api'
import { useAuth } from '../../../services/auth.context'

type User = {
  id: string
  email: string
  roleId: 'role_admin' | 'role_staff'
  isActive: boolean
  createdAt: string
}

export function UserManagementPage() {
  const { token } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState<'role_admin' | 'role_staff'>('role_staff')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch users on mount
  useEffect(() => {
    if (token) {
      fetchUsers()
    }
  }, [token])

  const fetchUsers = async () => {
    if (!token) return
    try {
      setError('')
      const response = await usersAPI.list(token)
      setUsers(response.data || [])
    } catch (err) {
      setError(`Failed to load users: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Not authenticated')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await usersAPI.create({ email, password, roleId }, token)
      setSuccess(`User ${email} created successfully!`)
      setEmail('')
      setPassword('')
      setRoleId('role_staff')
      await fetchUsers()
    } catch (err) {
      setError(`Failed to create user: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3>Create New User</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
          <div>
            <label htmlFor="email-input">Email</label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div>
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={10}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div>
            <label htmlFor="role-select">Role</label>
            <select
              id="role-select"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value as 'role_admin' | 'role_staff')}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="role_staff">Staff</option>
              <option value="role_admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '0.75rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>

        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
        {success && <p style={{ color: 'green', marginTop: '1rem' }}>{success}</p>}
      </div>

      <div>
        <h3>Users in Database</h3>
        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Email</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Role</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Active</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>{user.email}</td>
                  <td style={{ padding: '0.5rem' }}>{user.roleId === 'role_admin' ? 'Admin' : 'Staff'}</td>
                  <td style={{ padding: '0.5rem' }}>{user.isActive ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '0.5rem' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
