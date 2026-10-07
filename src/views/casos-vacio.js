// Un caso nuevo, vacío. Va aparte de casos.jsx para que el resto de la app no tenga que descargar esa sección.
import { uid } from '../logic.js';

export function casoVacio(preset = {}) {
  return {
    id: uid(), ejemplo: false, estado: 'borrador', autor: { id: 'yo', nombre: 'Tú', rol: '' },
    titulo: '', dientes: '', especialidad: preset.especialidad || 'Rehabilitación oral',
    paciente: { iniciales: '', edad: '', sexo: '' }, protocoloId: preset.protocoloId || '',
    diagnostico: '', procedimiento: '', pasos: {}, evidencia: '', consentimiento: false, fotos: [],
    sesiones: [], revisiones: [], historial: [], creado: new Date().toISOString(), actualizado: new Date().toISOString(), nuevo: true
  };
}
