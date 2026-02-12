import React from 'react';

const CareerPathsSection = ({ careerPaths }) => {
  if (!careerPaths) return null;

  const { icon, title, entryLevel, midLevel, skillsRoadmap } = careerPaths;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        {icon} {title}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entry Level Roles */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-5 border border-blue-100">
          <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded mr-2">ENTRY</span>
            Entry Level Roles
          </h4>
          <div className="space-y-2">
            {entryLevel?.map((role, index) => (
              <div key={index} className="flex items-start">
                <span className="text-blue-600 mr-2 mt-1">🔹</span>
                <div>
                  <span className="font-medium text-gray-800">{role.title}</span>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mid Level Roles */}
        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-5 border border-green-100">
          <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded mr-2">MID</span>
            Mid Level Roles
          </h4>
          <div className="space-y-2">
            {midLevel?.map((role, index) => (
              <div key={index} className="flex items-start">
                <span className="text-green-600 mr-2 mt-1">🔹</span>
                <div>
                  <span className="font-medium text-gray-800">{role.title}</span>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Roadmap */}
      {skillsRoadmap && (
        <div className="mt-6 bg-gray-50 rounded-lg p-5 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">🛤️ Skills Roadmap</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            {Object.entries(skillsRoadmap).map(([category, skills], index) => {
              const colors = [
                "text-blue-700",
                "text-green-700", 
                "text-purple-700",
                "text-red-700"
              ];
              return (
                <div key={category}>
                  <h5 className={`font-semibold ${colors[index % colors.length]} mb-2 capitalize`}>
                    {category.replace('_', ' ')}
                  </h5>
                  <div className="space-y-1 text-gray-600">
                    {skills?.map((skill, skillIndex) => (
                      <div key={skillIndex}>• {skill}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerPathsSection;
