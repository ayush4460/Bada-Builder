import React, { useState, useEffect } from 'react';
import { Home, Briefcase, Store, Car, ArrowDownToLine, Save, X } from 'lucide-react';
import { updateFloor } from '../services/api';

const FloorEditorModal = ({ floor, onClose, onSave }) => {
    const [name, setName] = useState(floor.name || '');
    const [type, setType] = useState(floor.type || 'RESIDENTIAL');
    const [unitCount, setUnitCount] = useState(floor.Units?.length || 4);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateFloor(floor.id, {
                name,
                type,
                unit_count: parseInt(unitCount)
            });
            onSave(); // Refresh parent
            onClose();
        } catch (err) {
            alert('Failed to update floor: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const types = [
        { id: 'RESIDENTIAL', label: 'Residential', icon: Home, color: 'text-emerald-400' },
        { id: 'SHOP', label: 'Shops / Commercial', icon: Store, color: 'text-amber-400' },
        { id: 'OFFICE', label: 'Office Space', icon: Briefcase, color: 'text-blue-400' },
        { id: 'PARKING', label: 'Parking', icon: Car, color: 'text-slate-400' },
        { id: 'BASEMENT', label: 'Basement', icon: ArrowDownToLine, color: 'text-slate-500' },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h3 className="font-bold text-white">Edit Floor Configuration</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Floor Name</label>
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 12th Floor"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Floor Type</label>
                        <div className="grid grid-cols-1 gap-2">
                            {types.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setType(t.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                        type === t.id 
                                        ? 'bg-blue-600/20 border-blue-500/50 text-white' 
                                        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg bg-slate-900 ${t.color}`}>
                                        <t.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">{t.label}</span>
                                    {type === t.id && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Number of Units</label>
                        <input 
                            type="number" 
                            min="0"
                            max="50"
                            required
                            value={unitCount}
                            onChange={(e) => setUnitCount(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Changing unit count will regenerate all units on this floor (resetting status/prices).
                        </p>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Update Floor
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FloorEditorModal;
