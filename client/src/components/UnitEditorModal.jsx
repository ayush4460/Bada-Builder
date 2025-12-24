import React, { useState, useEffect } from 'react';
import { X, Save, Building, Tag, Ruler } from 'lucide-react';
import { getUnit, updateUnit, getProjectSettings } from '../services/api';

const UnitEditorModal = ({ unitId, onClose, onSave }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Data
    const [unit, setUnit] = useState(null);
    const [globalSettings, setGlobalSettings] = useState({});

    // Form State
    const [formData, setFormData] = useState({
        status: 'AVAILABLE',
        bhk_type: 'N/A',
        carpet_area: 0,
        super_built_up_area: 0,
        price_per_sqft: 0,
        discounted_price_per_sqft: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [uRes, pRes] = await Promise.all([
                    getUnit(unitId),
                    getProjectSettings()
                ]);
                setUnit(uRes.data);
                setGlobalSettings(pRes.data);
                
                // Initial Form Data
                setFormData({
                    status: uRes.data.status || 'AVAILABLE',
                    bhk_type: uRes.data.bhk_type || 'N/A',
                    carpet_area: uRes.data.carpet_area || 0,
                    super_built_up_area: uRes.data.super_built_up_area || 0,
                    price_per_sqft: uRes.data.price_per_sqft || 0,
                    discounted_price_per_sqft: uRes.data.discounted_price_per_sqft || 0
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [unitId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUnit(unitId, formData);
            if (onSave) onSave();
            onClose();
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    // --- Helpers ---

    const getUnitLabel = () => {
        if (!unit) return 'Unit';
        // Try to guess label from unit number or just generic
        return `Unit ${unit.unit_number}`;
    };

    const getEffRegularRate = () => {
        const override = parseFloat(formData.price_per_sqft);
        if (override > 0) return override;
        
        // Fallback to Global based on Floor Type if available in unit data
        // unit.Floor is included from backend
        const type = unit?.Floor?.type;
        if (type === 'RESIDENTIAL') return parseFloat(globalSettings.residential_rate) || 0;
        if (type === 'OFFICE') return parseFloat(globalSettings.office_rate) || 0;
        if (type === 'SHOP') return parseFloat(globalSettings.shop_rate) || 0;
        
        return parseFloat(globalSettings.regular_price_sqft) || 0;
    };
    
    // Calculation Display
    const effRate = getEffRegularRate();
    const totalReg = (parseFloat(formData.super_built_up_area) || 0) * effRate;
    const totalDisc = (parseFloat(formData.super_built_up_area) || 0) * (parseFloat(formData.discounted_price_per_sqft) || 0);

    if (loading) return <div className="fixed inset-0 z-50 flex items-center justify-center text-white bg-black/50">Loading...</div>;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
            <div className={`bg-slate-900 border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
                formData.status === 'BOOKED' ? 'border-rose-500/50 shadow-rose-900/20' : 
                formData.status === 'ON_HOLD' ? 'border-amber-500/50 shadow-amber-900/20' : 'border-slate-700'
            }`}>
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 pl-7">
                            {globalSettings?.name}
                        </div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                             <Building className="w-5 h-5 text-blue-400" />
                             {getUnitLabel()}
                        </h3>
                        <p className="text-slate-400 text-xs mt-1 pl-7">
                            {unit?.Floor?.Tower?.name} • Floor {unit?.Floor?.floor_number}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                    
                    {/* 1. Status & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({...formData, status: e.target.value})}
                                className={`w-full bg-slate-800 border-2 rounded-xl px-4 py-3 text-white font-medium outline-none transition-colors ${
                                    formData.status === 'BOOKED' ? 'border-rose-500 text-rose-400' : 
                                    formData.status === 'ON_HOLD' ? 'border-amber-500 text-amber-400' : 'border-emerald-500 text-emerald-400'
                                }`}
                            >
                                <option value="AVAILABLE">Available</option>
                                <option value="BOOKED">Booked</option>
                                <option value="ON_HOLD">On Hold</option>
                            </select>
                        </div>
                        {unit?.Floor?.type === 'RESIDENTIAL' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">BHK Configuration</label>
                                <select
                                    value={formData.bhk_type}
                                    onChange={e => setFormData({...formData, bhk_type: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                                >
                                    <option value="N/A">Select Type</option>
                                    <option value="STUDIO">Studio</option>
                                    <option value="1BHK">1 BHK</option>
                                    <option value="2BHK">2 BHK</option>
                                    <option value="3BHK">3 BHK</option>
                                    <option value="4BHK">4 BHK</option>
                                    <option value="5BHK">5 BHK</option>
                                    <option value="PENTHOUSE">Penthouse</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* 2. Areas */}
                    <div className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Ruler className="w-3 h-3" /> Carpet Area (sqft)
                            </label>
                            <input
                                type="number"
                                value={formData.carpet_area}
                                onChange={e => setFormData({...formData, carpet_area: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Ruler className="w-3 h-3" /> Super Built-Up Area (sqft)
                            </label>
                            <input
                                type="number"
                                value={formData.super_built_up_area}
                                onChange={e => setFormData({...formData, super_built_up_area: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-mono"
                            />
                        </div>
                    </div>

                    {/* 3. Pricing */}
                    <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800 space-y-6">
                         <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Tag className="w-5 h-5" />
                            <h4 className="font-bold">Pricing Configuration</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Regular Rate (/sqft)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-500">₹</span>
                                    <input
                                        type="number"
                                        value={formData.price_per_sqft}
                                        onChange={e => setFormData({...formData, price_per_sqft: e.target.value})}
                                        placeholder={effRate}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white outline-none focus:border-blue-500 font-mono"
                                    />
                                    {parseFloat(formData.price_per_sqft) === 0 && (
                                        <div className="absolute right-3 top-3.5 text-[10px] bg-slate-800 px-2 rounded text-slate-400">
                                            Using Global: {effRate}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Discounted Rate (/sqft)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-500">₹</span>
                                    <input
                                        type="number"
                                        value={formData.discounted_price_per_sqft}
                                        onChange={e => setFormData({...formData, discounted_price_per_sqft: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-emerald-400 outline-none focus:border-emerald-500 font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Totals */}
                         <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Regular Price</p>
                                <p className="text-xl font-bold text-white font-mono mt-1">
                                    ₹ {totalReg.toLocaleString('en-IN')}
                                </p>
                            </div>
                             <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Discounted Price</p>
                                <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
                                    {totalDisc > 0 ? `₹ ${totalDisc.toLocaleString('en-IN')}` : '-'}
                                </p>
                            </div>
                         </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 font-medium transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                        {saving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnitEditorModal;
