import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getProjectSettings, updateProjectSettings } from '../services/api';
import { Save } from 'lucide-react';

const Settings = () => {
    const [settings, setSettings] = useState({ regular_price_sqft: 0, group_price_sqft: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await getProjectSettings();
            setSettings(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProjectSettings(settings);
            alert('Settings updated successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-2xl">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Project Settings</h2>
                    <p className="text-slate-400 mt-2">Manage global pricing and configuration parameters.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Base Price (Per Sq Ft)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-2 text-slate-500">₹</span>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={settings.regular_price_sqft}
                                        onChange={e => setSettings({...settings, regular_price_sqft: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Standard rate for all units.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Group Booking Price</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-2 text-slate-500">₹</span>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={settings.group_price_sqft}
                                        onChange={e => setSettings({...settings, group_price_sqft: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                                {loading ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
