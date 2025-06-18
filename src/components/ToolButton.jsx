const ToolButton = ({ active, onClick, icon, title, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500'
  };
  
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-full ${active ? colorClasses[color] : 'hover:bg-gray-700'} transition-colors relative group`}
      title={title}
    >
      {icon}
      <span className="absolute -bottom-6 left-2 ml-2 px-2 py-1 text-xs rounded-md bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {title}
      </span>
    </button>
  );
};

export default ToolButton;