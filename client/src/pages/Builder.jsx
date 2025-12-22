import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getStructure, createTower, deleteTower, updateTower, createFloor, deleteFloor } from '../services/api';
import UnitEditorModal from '../components/UnitEditorModal';
import { Plus, Trash2, Layers, Grid, Edit, PlusCircle, MinusCircle } from 'lucide-react';
import clsx from 'clsx';

const Builder = () => {
    const [towers, setTowers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTowerId, setEditingTowerId] = useState(null);
    const [selectedUnitId, setSelectedUnitId] = useState(null);
    
    // New Tower Form State
    const [formData, setFormData] = useState({
        name: '',
        basement_levels: 0,
        podium_levels: 0,
        residential_levels: 0,
        units_per_floor: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await getStructure();
            setTowers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTowerId) {
                await updateTower(editingTowerId, formData);
            } else {
                await createTower(formData);
            }
            setShowForm(false);
            setEditingTowerId(null);
            setFormData({ name: '', basement_levels: 0, podium_levels: 0, residential_levels: 10, units_per_floor: 4 });
            loadData();
        } catch (err) {
            alert(`Error ${editingTowerId ? 'updating' : 'creating'} tower: ` + (err.response?.data?.error || err.message));
        }
    };

    const handleEdit = (tower) => {
        setEditingTowerId(tower.id);
        const unitsCount = tower.Floors?.find(f => f.type === 'RESIDENTIAL')?.Units?.length || 4;
        setFormData({
            name: tower.name,
            basement_levels: tower.basement_levels || 0,
            podium_levels: tower.podium_levels || 0,
            residential_levels: tower.residential_levels || 10,
            units_per_floor: unitsCount
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This will delete all floors and units in this tower.')) return;
        try {
            await deleteTower(id);
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleAddFloor = async (towerId) => {
        const name = prompt("Enter Floor Name (e.g. 25th Floor):");
        if (!name) return;
        const number = parseInt(prompt("Enter Floor Number:") || "0");
        
        try {
            await createFloor({
                tower_id: towerId,
                floor_number: number,
                name: name,
                type: 'RESIDENTIAL'
            });
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteFloor = async (floorId) => {
        if (!window.confirm('Delete this floor and all its units?')) return;
        try {
            await deleteFloor(floorId);
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Structure Builder</h2>
                    <p className="text-slate-400 mt-2">Configure towers, floors, and initial unit layouts.</p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20"
                >
                    <Plus className="w-5 h-5" />
                    Add Tower
                </button>
            </div>

            {/* Creation Form */}
            {showForm && (
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        {editingTowerId ? 'Edit Tower Configuration' : 'New Tower Configuration'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Tower Name</label>
                            <input 
                                type="text" 
                                required
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Tower A"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Basement Levels</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={formData.basement_levels}
                                    onChange={e => setFormData({...formData, basement_levels: parseInt(e.target.value) || 0})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Podium (Parking)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={formData.podium_levels}
                                    onChange={e => setFormData({...formData, podium_levels: parseInt(e.target.value) || 0})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Residential Floors</label>
                                <input 
                                    type="number" 
                                    required
                                    min="1"
                                    value={formData.residential_levels}
                                    onChange={e => setFormData({...formData, residential_levels: parseInt(e.target.value) || 0})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Units per Floor</label>
                                <input 
                                    type="number" 
                                    required
                                    min="0" 
                                    value={formData.units_per_floor}
                                    onChange={e => setFormData({...formData, units_per_floor: parseInt(e.target.value) || 0})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                {editingTowerId ? 'Update Structure' : 'Initialize Structure'}
                            </button>
                            {editingTowerId && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setEditingTowerId(null);
                                        setShowForm(false);
                                        setFormData({ name: '', total_floors: '', units_per_floor: '' });
                                    }}
                                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* Towers Grid */}
            <div className="grid grid-cols-1 gap-8">
                {towers.map((tower) => (
                    <div key={tower.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
                            <div className="flex items-center gap-3">
                                <Building2Icon />
                                <h3 className="text-xl font-bold text-slate-200">{tower.name}</h3>
                                <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full border border-slate-700">
                                    {tower.total_floors} Floors
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleAddFloor(tower.id)}
                                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 p-2 rounded-lg transition-colors"
                                    title="Add Floor"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => handleEdit(tower)}
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 p-2 rounded-lg transition-colors"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(tower.id)}
                                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-900/20 p-2 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Visual Stack of Floors (Preview) */}
                        <div className="p-6 overflow-x-auto">
                           <div className="flex flex-col-reverse gap-2">
                               {tower.Floors?.map(floor => (
                                   <div key={floor.id} className="flex items-center gap-4 group">
                                        <div className="w-8 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleDeleteFloor(floor.id)}
                                                className="text-slate-600 hover:text-rose-500 transition-colors"
                                                title="Delete Floor"
                                            >
                                                <MinusCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="w-24 text-right text-xs text-slate-500 font-mono uppercase tracking-wider">
                                            {floor.name}
                                        </div>
                                        <div className="flex-1 flex gap-2">
                                            {floor.Units?.map(unit => (
                                                <div 
                                                    key={unit.id}
                                                    title={`Unit ${unit.unit_number}`}
                                                    onClick={() => setSelectedUnitId(unit.id)}
                                                    className={clsx(
                                                        "h-8 w-12 rounded flex items-center justify-center text-[10px] font-medium border transition-all cursor-pointer hover:scale-110",
                                                        unit.status === 'AVAILABLE' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                                                        unit.status === 'BOOKED' ? "bg-rose-500/10 border-rose-500/30 text-rose-400" :
                                                        "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                                    )}
                                                >
                                                    {unit.unit_number}
                                                </div>
                                            ))}
                                            {floor.Units?.length === 0 && (
                                                <div className="h-8 flex items-center text-xs text-slate-600 italic px-2">
                                                    No units
                                                </div>
                                            )}
                                        </div>
                                   </div>
                               ))}
                           </div>
                        </div>
                    </div>
                ))}

                {/* Modal */}
                {selectedUnitId && (
                    <UnitEditorModal 
                        unitId={selectedUnitId} 
                        onClose={() => setSelectedUnitId(null)}
                        onSave={loadData}
                    />
                )}

                {towers.length === 0 && !loading && (
                    <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl border-dashed">
                        <Layers className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">No towers configured yet.</p>
                        <p className="text-slate-600 text-sm">Use the "Add Tower" button to get started.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

const Building2Icon = () => (
    <div className="w-8 h-8 bg-indigo-500/20 rounded flex items-center justify-center text-indigo-400">
        <Grid className="w-5 h-5" />
    </div>
);

export default Builder;
