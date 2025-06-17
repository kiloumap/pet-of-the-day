import React = require('react');
import { Users, Settings } from 'lucide-react';
import GroupLeaderboard from './GroupLeaderboard';
import { Group, Pet } from '../../../../types';

interface GroupCardProps {
    group: Group;
    pets: Pet[];
}

const GroupCard: React.FC<GroupCardProps> = ({ group, pets }) => {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="text-sm text-gray-600">{group.members} membres</p>
                    </div>
                </div>
                <button className="text-blue-500 hover:text-blue-600">
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            <GroupLeaderboard pets={pets} />
        </div>
    );
};

export default GroupCard;