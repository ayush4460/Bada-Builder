import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getStructure, createTower, deleteTower, updateTower } from '../services/api';
import UnitEditorModal from '../components/UnitEditorModal';
import { 
    Plus, Trash2, Layers, Grid, Edit, PlusCircle, MinusCircle, 
    Home, Briefcase, Store, Car, ArrowDownToLine, Tent, Check
} from 'lucide-react';
import clsx from 'clsx';

const Builder = () => {
    const [towers, setTowers] = useState([]);
    
    // Wizard State
    const [isWizardActive, setIsWizardActive] = useState(false);
    const [wizardStep, setWizardStep] = useState(1); // 1: Site Info, 2: Tower Config Loop
    const [siteName, setSiteName] = useState('');
    const [structureCount, setStructureCount] = useState(1);
    
    // Config State
    const [currentConfigIndex, setCurrentConfigIndex] = useState(0); 
    const [currentConfig, setCurrentConfig] = useState({
        name: '',
        type: 'TOWER', // TOWER | BUNGALOW
        basement_levels: 0,
        podium_levels: 0, // Parking
        shop_levels: 0,
        office_levels: 0,
        residential_levels: 10,
        units_per_floor: 4
    });

    const [editingTowerId, setEditingTowerId] = useState(null);
    const [selectedUnitId, setSelectedUnitId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await getStructure();
            setTowers(res.data);
            // Ideally fetch Project Name here too
        } catch (err) {
            console.error(err);
        } finally {
            // Loading done
        }
    };

    const startWizard = () => {
        setIsWizardActive(true);
        setWizardStep(1);
        setSiteName('');
        setStructureCount(1);
        setCurrentConfigIndex(0);
        resetConfig();
    };

    const resetConfig = () => {
        setCurrentConfig({
            name: '',
            type: 'TOWER',
            basement_levels: 0,
            podium_levels: 0,
            shop_levels: 0,
            office_levels: 0,
            residential_levels: 10,
            units_per_floor: 4
        });
    };

    const handleSiteSubmit = (e) => {
        e.preventDefault();
        setWizardStep(2);
        setCurrentConfig(prev => ({ ...prev, name: `Tower ${getChar(0)}` }));
    };

    const getChar = (i) => String.fromCharCode(65 + i); // 0->A, 1->B

    const handleConfigSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Send to API
            await createTower({
                ...currentConfig,
                site_name: siteName // Send site name with every request (or just the first one)
            });

            // If more structures to configure
            if (currentConfigIndex < structureCount - 1) {
                setCurrentConfigIndex(prev => prev + 1);
                // Reset config but maybe keep some defaults?
                const nextIndex = currentConfigIndex + 1;
                setCurrentConfig({
                    ...currentConfig,
                    name: `Tower ${getChar(nextIndex)}`
                });
            } else {
                // Done
                setIsWizardActive(false);
                loadData();
            }
        } catch (err) {
            alert("Error creating structure: " + err.message);
        }
    };

    const handleRegularEdit = (tower) => {
        setEditingTowerId(tower.id);
        setCurrentConfig({
            name: tower.name,
            type: tower.type || 'TOWER',
            basement_levels: tower.basement_levels,
            shop_levels: tower.shop_levels || 0,
            office_levels: tower.office_levels || 0,
            podium_levels: tower.podium_levels,
            residential_levels: tower.residential_levels,
            units_per_floor: 4 // This is lost in retrieval unless we check Unit count, defaulting
        });
        setIsWizardActive(true);
        setWizardStep(2); // Jump straight to config
        setStructureCount(1);
        setCurrentConfigIndex(0);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateTower(editingTowerId, currentConfig);
            setIsWizardActive(false);
            setEditingTowerId(null);
            loadData();
        } catch (err) {
            alert("Error updating: " + err.message);
        }
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

    // --- Render Helpers ---

    const getFloorIcon = (type) => {
        switch (type) {
            case 'RESIDENTIAL': return <Home className="w-4 h-4 text-emerald-400" />;
            case 'SHOP': return <Store className="w-4 h-4 text-amber-400" />;
            case 'OFFICE': return <Briefcase className="w-4 h-4 text-blue-400" />;
            case 'PARKING': return <Car className="w-4 h-4 text-slate-400" />;
            case 'BASEMENT': return <ArrowDownToLine className="w-4 h-4 text-slate-500" />;
            default: return <Layers className="w-4 h-4 text-slate-500" />;
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
                    onClick={startWizard}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20"
                >
                    <Plus className="w-5 h-5" />
                    Add Structure
                </button>
            </div>

            {/* WIZARD MODAL / OVERLAY */}
            {isWizardActive && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                        
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                            <h3 className="text-xl font-bold text-white">
                                {editingTowerId ? 'Edit Configuration' : 
                                 wizardStep === 1 ? 'Step 1: Project Setup' : 
                                 `Step 2: Configure ${currentConfig.type === 'BUNGALOW' ? 'Bungalow' : 'Tower'} (${currentConfigIndex + 1}/${structureCount})`}
                            </h3>
                            <button onClick={() => { setIsWizardActive(false); setEditingTowerId(null); }} className="text-slate-500 hover:text-white">✕</button>
                        </div>

                        <div className="p-8">
                            {/* STEP 1: SITE SETUP */}
                            {wizardStep === 1 && !editingTowerId && (
                                <form onSubmit={handleSiteSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">What is the Site Name?</label>
                                        <input 
                                            autoFocus
                                            type="text" 
                                            required
                                            value={siteName}
                                            onChange={e => setSiteName(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                                            placeholder="e.g. Green Valley Estates"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">How many Towers or Bungalows?</label>
                                        <input 
                                            type="number" 
                                            min="1"
                                            max="20"
                                            required
                                            value={structureCount}
                                            onChange={e => setStructureCount(parseInt(e.target.value) || 1)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                                        />
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2">
                                            Next Step <PlusCircle className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* STEP 2: CONFIGURATION */}
                            {wizardStep === 2 && (
                                <form onSubmit={editingTowerId ? handleUpdate : handleConfigSubmit} className="space-y-6">
                                    
                                    {/* Type Selection */}
                                    <div className="flex gap-4 p-1 bg-slate-800 rounded-xl mb-6">
                                        <button 
                                            type="button"
                                            onClick={() => setCurrentConfig({...currentConfig, type: 'TOWER'})}
                                            className={clsx(
                                                "flex-1 py-3 rounded-lg font-medium transition-all flex justify-center items-center gap-2",
                                                currentConfig.type === 'TOWER' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
                                            )}
                                        >
                                            <Building2Icon /> Tower
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setCurrentConfig({...currentConfig, type: 'BUNGALOW'})}
                                            className={clsx(
                                                "flex-1 py-3 rounded-lg font-medium transition-all flex justify-center items-center gap-2",
                                                currentConfig.type === 'BUNGALOW' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
                                            )}
                                        >
                                            <Tent className="w-5 h-5" /> Bungalow / Villa
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Structure Name</label>
                                            <input 
                                                type="text" 
                                                value={currentConfig.name}
                                                onChange={e => setCurrentConfig({...currentConfig, name: e.target.value})}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                            />
                                        </div>
                                         <div>
                                            <label className="block text-sm text-slate-400 mb-1">Units per Floor</label>
                                            <input 
                                                type="number" min="1"
                                                value={currentConfig.units_per_floor}
                                                onChange={e => setCurrentConfig({...currentConfig, units_per_floor: parseInt(e.target.value) || 0})}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t border-slate-700 pt-6">
                                        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Level Configuration</h4>
                                        
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                            <ConfigInput 
                                                label="Basements" icon={<ArrowDownToLine className="w-4 h-4 text-slate-400"/>}
                                                value={currentConfig.basement_levels} 
                                                onChange={v => setCurrentConfig({...currentConfig, basement_levels: v})} 
                                            />
                                            <ConfigInput 
                                                label="Shops" icon={<Store className="w-4 h-4 text-amber-400"/>}
                                                value={currentConfig.shop_levels} 
                                                onChange={v => setCurrentConfig({...currentConfig, shop_levels: v})} 
                                            />
                                            <ConfigInput 
                                                label="Offices" icon={<Briefcase className="w-4 h-4 text-blue-400"/>}
                                                value={currentConfig.office_levels} 
                                                onChange={v => setCurrentConfig({...currentConfig, office_levels: v})} 
                                            />
                                            <ConfigInput 
                                                label="Parking / Podium" icon={<Car className="w-4 h-4 text-slate-400"/>}
                                                value={currentConfig.podium_levels} 
                                                onChange={v => setCurrentConfig({...currentConfig, podium_levels: v})} 
                                            />
                                            <ConfigInput 
                                                label="Residential Floors" icon={<Home className="w-4 h-4 text-emerald-400"/>}
                                                value={currentConfig.residential_levels} 
                                                onChange={v => setCurrentConfig({...currentConfig, residential_levels: v})} 
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 flex justify-between items-center border-t border-slate-700 mt-6">
                                         <div className="text-sm text-slate-500">
                                            {editingTowerId ? 'Updating existing structure...' : `Configuring ${currentConfigIndex + 1} of ${structureCount}`}
                                         </div>
                                         <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20">
                                            {editingTowerId ? 'Save Changes' : 
                                             (currentConfigIndex < structureCount - 1 ? 'Next Structure' : 'Finish & Create')}
                                            <Check className="w-5 h-5" />
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                     </div>
                </div>
            )}


            {/* Existing Grid View of Towers */}
            <div className="grid grid-cols-1 gap-8">
                {towers.map((tower) => (
                    <div key={tower.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
                            <div className="flex items-center gap-4">
                                <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center", tower.type === 'BUNGALOW' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400")}>
                                     {tower.type === 'BUNGALOW' ? <Tent className="w-6 h-6" /> : <Building2Icon />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-200">{tower.name}</h3>
                                    <p className="text-slate-500 text-xs mt-0.5">{tower.total_floors} Levels • {tower.type || 'TOWER'}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleRegularEdit(tower)} className="text-blue-400 hover:bg-blue-900/20 p-2 rounded-lg"><Edit className="w-5 h-5" /></button>
                                <button onClick={() => handleDelete(tower.id)} className="text-rose-400 hover:bg-rose-900/20 p-2 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        </div>
                        
                            {/* Compact Floor Stack Visualization */}
                         <div className="p-6 overflow-x-auto">
                           <div className="flex flex-col-reverse gap-1.5 min-w-[300px]">
                               {tower.Floors?.map(floor => (
                                   <div key={floor.id} className="flex items-center gap-4 group">
                                        <div className="w-8 flex justify-end">
                                            {getFloorIcon(floor.type)}
                                        </div>
                                        <div className="w-28 text-right text-[10px] text-slate-500 font-mono uppercase tracking-wider truncate" title={floor.name}>
                                            {floor.name}
                                        </div>
                                        <div className="flex-1 flex gap-1.5 p-1.5 bg-slate-950/30 rounded-lg border border-slate-800/50">
                                            {floor.Units?.map(unit => (
                                                <div 
                                                    key={unit.id}
                                                    title={`Unit ${unit.unit_number}`}
                                                    onClick={() => setSelectedUnitId(unit.id)}
                                                    className={clsx(
                                                        "h-6 min-w-[32px] px-1 rounded flex items-center justify-center gap-1 text-[9px] font-bold border transition-all cursor-pointer hover:scale-110",
                                                        unit.status === 'AVAILABLE' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                                        unit.status === 'BOOKED' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                                                        "bg-slate-700/50 border-slate-600 text-slate-400"
                                                    )}
                                                >
                                                    {floor.type === 'SHOP' && <Store className="w-3 h-3 opacity-50" />}
                                                    {floor.type === 'OFFICE' && <Briefcase className="w-3 h-3 opacity-50" />}
                                                    {floor.type === 'PARKING' && <Car className="w-3 h-3 opacity-50" />}
                                                    {floor.type === 'RESIDENTIAL' && <Home className="w-3 h-3 opacity-50" />}
                                                    {unit.unit_number.split('-').pop()}
                                                </div>
                                            ))}
                                            {floor.Units?.length === 0 && <span className="text-[10px] text-slate-600 italic px-2">Empty Floor</span>}
                                        </div>
                                   </div>
                               ))}
                           </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Modal for Units */}
            {selectedUnitId && (
                <UnitEditorModal 
                    unitId={selectedUnitId} 
                    onClose={() => setSelectedUnitId(null)}
                    onSave={loadData}
                />
            )}
        </Layout>
    );
};

const ConfigInput = ({ label, value, onChange, icon }) => (
    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
        <div className="flex items-center gap-2 mb-2 text-slate-400">
            {icon}
            <span className="text-xs font-semibold uppercase">{label}</span>
        </div>
        <div className="flex items-center gap-3">
            <button 
                type="button" 
                onClick={() => onChange(Math.max(0, value - 1))}
                className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white"
            >
                <MinusCircle className="w-4 h-4" />
            </button>
            <span className="text-xl font-bold text-white w-8 text-center">{value}</span>
            <button 
                type="button" 
                onClick={() => onChange(value + 1)}
                className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white"
            >
                <PlusCircle className="w-4 h-4" />
            </button>
        </div>
    </div>
);

const Building2Icon = () => (
    <Grid className="w-5 h-5" />
);

export default Builder;
