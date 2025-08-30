import Layout from '../components/Layout';
import AdminDashboard from '../components/AdminDashboard';

const Admin = () => {
  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage users, monitor system activity, and control access
          </p>
        </div>
        
        <AdminDashboard />
      </div>
    </Layout>
  );
};

export default Admin;
