
import React from 'react';

interface CacheRecommendationsProps {
  recommendations: string[];
}

const CacheRecommendations: React.FC<CacheRecommendationsProps> = ({ recommendations }) => {
  if (recommendations.length === 0) return null;

  return (
    <div className="bg-green-50 p-3 rounded-lg">
      <h4 className="text-sm font-semibold mb-2 text-green-900">Recomendaciones</h4>
      <ul className="text-xs space-y-1">
        {recommendations.map((rec, index) => (
          <li key={index} className="text-green-800">• {rec}</li>
        ))}
      </ul>
    </div>
  );
};

export default CacheRecommendations;
