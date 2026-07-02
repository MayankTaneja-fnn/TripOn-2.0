export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        
        {/* Loading Text */}
        <div className="text-lg font-medium text-gray-700 dark:text-gray-300 animate-pulse">
          Loading...
        </div>
      </div>
    </div>
  );
}
