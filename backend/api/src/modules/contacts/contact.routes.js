const { Router } = require('express');
const prisma = require('../../config/prisma');
const { authenticate, authorize } = require('../../middleware/auth');
const router = Router();
const out = row => row && ({ ...row, _id: row.id });

router.post('/public', async (req, res, next) => {
  try {
    const { name, email, phone = '', company = '', subject = 'general', message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, error: 'Nombre, email y mensaje son requeridos.' });
    const contact = await prisma.contact.create({ data: { name, email: email.toLowerCase(), phone, company, subject, message } });
    res.status(201).json({ success: true, message: '¡Mensaje recibido! Te contactaremos pronto.', data: { id: contact.id } });
  } catch (error) { next(error); }
});
router.get('/', authenticate, authorize('admin','manager','seller'), async (req,res,next) => {
  try {
    const where = req.query.status ? { status: req.query.status } : {};
    const [items,total] = await Promise.all([prisma.contact.findMany({ where, orderBy:{created_at:'desc'}, take:100 }), prisma.contact.count({where})]);
    res.json({ success:true, data:items.map(out), total });
  } catch(error){ next(error); }
});
router.patch('/:id/status', authenticate, authorize('admin','manager'), async (req,res,next) => {
  try {
    if (!['new','read','replied'].includes(req.body.status)) return res.status(400).json({error:'Estado inválido.'});
    const item = await prisma.contact.update({where:{id:req.params.id},data:{status:req.body.status}});
    res.json({success:true,data:out(item)});
  } catch(error){ if(error.code==='P2025') return res.status(404).json({error:'Mensaje no encontrado.'}); next(error); }
});
router.delete('/:id', authenticate, authorize('admin','manager'), async(req,res,next)=>{
  try { await prisma.contact.delete({where:{id:req.params.id}}); res.json({success:true,message:'Mensaje eliminado.'}); }
  catch(error){ next(error); }
});
module.exports = router;
