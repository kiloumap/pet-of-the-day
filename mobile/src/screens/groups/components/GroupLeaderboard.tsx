import React = require('react');
import { Pet } from '../../../../types';

interface GroupLeaderboardProps {
    pets: Pet[];
}

const GroupLeaderboard: React.FC<GroupLeaderboardProps> = ({ pets }) => {
    const topPets = [...pets].sort((a, b) => b.points - a.points).slice(0, 3);

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Top du jour</h4>
            {topPets.map((pet, index) => (
                <div key={pet.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                        </div>
                        <span className="text-lg">{pet.image}</span>
                        <span className="font-medium">{pet.name}</span>
                    </div>
                    <span className="font-bold text-blue-600">{pet.points}</span>
                </div>
            ))}
        </div>
    );
};

export default GroupLeaderboard;