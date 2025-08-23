import React from 'react';

const NotAuthenticated = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <h2 className="text-3xl font-bold mb-4 text-red-600">Not Authenticated</h2>
    <p className="mb-6 text-gray-700 text-lg">You must be logged in to access this page.</p>
    <a href="/" className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-600">Go to Login</a>
  </div>
);

export default NotAuthenticated;
