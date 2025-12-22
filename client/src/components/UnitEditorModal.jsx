import React, { useState, useEffect } from 'react';
import { getUnit, updateUnit, getUnitTypes } from '../services/api';
import { X, Save, Ruler, Tag, Home, Currency } from 'lucide-react';

const UnitEditorModal = ({ unitId, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        unit_number: '',
        unit_type_id: '',
        carpet_area: 0,
        super_built_up_area: 0,
        status: 'AVAILABLE',
        price: 0
    });
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [uRes, tRes] = await Promise.all([getUnit(unitId), getUnitTypes()]);
                setFormData(uRes.data);
                setTypes(tRes.data);
            } catch (err) {
                console.error(err);
                alert("Failed to load unit details");
                onClose();
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [unitId, onClose]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateUnit(unitId, formData);
            onSave();
            onClose();
        } catch (err) {
            alert("Update failed: " + err.message);
        }
    };

    if (loading) return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-white">Loading...</div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Home className="w-5 h-5 text-blue-400" />
                        Edit Unit {formData.unit_number}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Status & Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                            <select 
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="AVAILABLE">Available</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="BOOKED">Booked</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Unit Type</label>
                            <select 
                                name="unit_type_id"
                                value={formData.unit_type_id || ''}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Select Type</option>
                                {types.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Areas */}
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                                <Ruler className="w-3 h-3" /> Carpet Area (sqft)
                            </label>
                            <input 
                                type="number" 
                                name="carpet_area"
                                value={formData.carpet_area}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                                <Ruler className="w-3 h-3" /> Super Area (sqft)
                            </label>
                            <input 
                                type="number" 
                                name="super_built_up_area"
                                value={formData.super_built_up_area}
                                onChange={handleChange}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Price Display (Calculated in backend, but shown here for ref) */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                            <Currency className="w-3 h-3" /> Current Price
                        </p>
                        <p className="text-2xl font-bold text-emerald-400">
                            ₹ {parseFloat(formData.price || 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                            Price updates automatically based on Super Area * Project Rate
                        </p>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                        >
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UnitEditorModal;
