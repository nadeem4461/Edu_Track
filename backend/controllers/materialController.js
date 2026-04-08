import Material from '../models/Material.js';

export const getMaterials = async (req, res) => {
  try {
    const materials = await Material.find().sort({ date: -1 });
    res.json(materials);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const addMaterial = async (req, res) => {
  try {
    const newMaterial = await Material.create(req.body);
    res.status(201).json(newMaterial);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const deleteMaterial = async (req, res) => {
  try {
    await Material.findByIdAndDelete(req.params.id);
    res.json({ message: 'Material deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};