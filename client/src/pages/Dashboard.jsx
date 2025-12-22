import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getStructure } from '../services/api';
import { Building2, Home, CheckCircle, AlertCircle } from 'lucide-react';

const Dashboard = () => {
    const [towers, setTowers] = useState([]);
    const [stats, setStats] = useState({ totalUnits: 0, available: 0, booked: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await getStructure();
            const data = res.data;
            setTowers(data);
            
            // Calc stats
            let total = 0, avail = 0, booked = 0;
            data.forEach(t => {
                t.Floors.forEach(f => {
                    f.Units.forEach(u => {
                        total++;
                        if (u.status === 'AVAILABLE') avail++;
                        if (u.status === 'BOOKED') booked++;
                    });
                });
            });
            setStats({ totalUnits: total, available: avail, booked: booked });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h2>
                <p className="text-slate-400 mt-2">Welcome back, Admin. Here is the project summary.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-6 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Home className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Total Units</p>
                        <p className="text-3xl font-bold text-slate-100">{stats.totalUnits}</p>
                    </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-6 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Available</p>
                        <p className="text-3xl font-bold text-slate-100">{stats.available}</p>
                    </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-6 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Booked</p>
                        <p className="text-3xl font-bold text-slate-100">{stats.booked}</p>
                    </div>
                </div>
            </div>

            {/* Towers List Preview */}
            <h3 className="text-xl font-semibold text-white mb-4">Tower Status</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {towers.map(tower => (
                    <div key={tower.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-600 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="text-lg font-bold text-slate-200">{tower.name || "Unnamed Tower"}</h4>
                                <p className="text-slate-500 text-sm">{tower.total_floors} Floors Layout</p>
                            </div>
                            <Building2 className="text-slate-600" />
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: '45%' }}></div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                            <span>Occupancy</span>
                            <span>45%</span>
                        </div>
                    </div>
                ))}
            </div>
        </Layout>
    );
};

export default Dashboard;
