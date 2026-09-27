// Datos de ejemplo. Todo lo que lleva ejemplo:true se muestra marcado como ejemplo y se puede borrar.
const dia = 86400000;
const iso = (dMenos, h = 10) => { const d = new Date(Date.now() - dMenos * dia); d.setHours(h, 15, 0, 0); return d.toISOString(); };
const isoDia = (dMas) => new Date(Date.now() + dMas * dia).toISOString().slice(0, 10);

export function casosIniciales() {
  return [
    {
      id: 'ej-mf-36', ejemplo: true, estado: 'enviado',
      autor: { id: 'mf', nombre: 'm.fuentes', rol: 'Estudiante 5º' },
      titulo: 'Resina clase I oclusal en 3.6 con aislamiento relativo',
      dientes: '3.6', especialidad: 'Operatoria',
      paciente: { iniciales: 'R. P.', edad: '34', sexo: 'Femenino' },
      protocoloId: 'resina-clase-i',
      diagnostico: 'Caries oclusal primaria cavitada en 3.6, ICDAS 5, sin síntomas. Test de frío normal. Bitewing sin compromiso proximal.',
      procedimiento: 'Remoción selectiva a dentina firme, grabado selectivo de esmalte, adhesivo universal frotado 20 s, resina bulk-fill en un incremento de 4 mm y capa oclusal convencional.',
      pasos: {
        0: { estado: 'hecho' },
        1: { estado: 'modificado', nota: 'Aislamiento relativo con rollos y eyector: reflejo nauseoso intenso al probar el clamp. Campo seco verificado antes del grabado.' },
        2: { estado: 'hecho' }, 3: { estado: 'hecho' }, 4: { estado: 'hecho' }, 5: { estado: 'hecho' },
        6: { estado: 'hecho' }, 7: { estado: 'hecho' }, 8: { estado: 'hecho' }
      },
      evidencia: '', consentimiento: true, fotos: [],
      sesiones: [{ id: 's1', fecha: isoDia(-3), txt: 'Restauración terminada. Oclusión ajustada contra la foto previa.', proximo: '' }],
      revisiones: [],
      historial: [{ fecha: iso(4), txt: 'Caso creado' }, { fecha: iso(3), txt: 'Enviado a revisión' }],
      creado: iso(4), actualizado: iso(3)
    },
    {
      id: 'ej-ca-21', ejemplo: true, estado: 'enviado',
      autor: { id: 'ca', nombre: 'c.aguilera', rol: 'Estudiante 5º' },
      titulo: 'Provisional PMMA en 2.1 cementado con eugenol',
      dientes: '2.1', especialidad: 'Rehabilitación oral',
      paciente: { iniciales: 'L. M.', edad: '52', sexo: 'Masculino' },
      protocoloId: 'cementado-pmma',
      diagnostico: 'Pilar 2.1 endodonciado con poste de fibra, tallado para corona de disilicato. Provisional de PMMA fresado mientras termina el tratamiento periodontal (8 meses estimados).',
      procedimiento: 'Prueba en seco, ajuste oclusal y pulido de la zona ajustada. Cementado convencional con óxido de zinc con eugenol, el único disponible en el pañol.',
      pasos: {
        0: { estado: 'hecho' }, 1: { estado: 'hecho' },
        2: { estado: 'hecho' }, 3: { estado: 'hecho' }, 4: { estado: 'hecho' }, 5: { estado: 'hecho' },
        6: { estado: 'modificado', nota: 'Solo había cemento con eugenol en el pañol.' },
        7: { estado: 'noaplica' }, 8: { estado: 'noaplica' },
        9: { estado: 'hecho' }, 10: { estado: 'hecho' }, 11: { estado: 'hecho' }, 12: { estado: 'hecho' }
      },
      evidencia: '', consentimiento: true, fotos: [],
      sesiones: [{ id: 's1', fecha: isoDia(-2), txt: 'Cementado del provisional.', proximo: isoDia(88) }],
      revisiones: [],
      historial: [{ fecha: iso(2), txt: 'Caso creado' }, { fecha: iso(2, 16), txt: 'Enviado a revisión' }],
      creado: iso(2), actualizado: iso(2, 16)
    },
    {
      id: 'ej-jb-18', ejemplo: true, estado: 'enviado',
      autor: { id: 'jb', nombre: 'j.bravo', rol: 'Estudiante 5º' },
      titulo: 'Exodoncia del 1.8 con Valsalva negativo',
      dientes: '1.8', especialidad: 'Cirugía bucal',
      paciente: { iniciales: 'A. S.', edad: '27', sexo: 'Femenino' },
      protocoloId: 'exodoncia-18',
      diagnostico: '1.8 erupcionado con caries distal extensa no restaurable. Paciente ASA I, sin infección activa.',
      procedimiento: 'Exodoncia simple con elevador y fórceps. Maniobra de Valsalva negativa, sin más revisión del alveolo. Compresión con gasa.',
      pasos: {
        0: { estado: 'hecho' }, 1: { estado: 'hecho' }, 2: { estado: 'hecho' }, 3: { estado: 'hecho' },
        4: { estado: 'hecho' }, 5: { estado: 'hecho' }, 6: { estado: 'hecho' },
        7: { estado: 'omitido', nota: 'El Valsalva salió negativo y el alveolo estaba lleno de sangre.' },
        8: { estado: 'hecho' }, 9: { estado: 'hecho' }
      },
      evidencia: '', consentimiento: true, fotos: [],
      sesiones: [{ id: 's1', fecha: isoDia(-1), txt: 'Exodoncia realizada.', proximo: isoDia(6) }],
      revisiones: [],
      historial: [{ fecha: iso(1), txt: 'Caso creado' }, { fecha: iso(1, 18), txt: 'Enviado a revisión' }],
      creado: iso(1), actualizado: iso(1, 18)
    },
    {
      id: 'ej-yo-11', ejemplo: true, estado: 'aprobado',
      autor: { id: 'yo', nombre: 'Tú', rol: '' },
      titulo: 'Provisional PMMA en 1.1 por vía adhesiva',
      dientes: '1.1', especialidad: 'Rehabilitación oral',
      paciente: { iniciales: 'C. R.', edad: '41', sexo: 'Femenino' },
      protocoloId: 'cementado-pmma',
      diagnostico: 'Pilar 1.1 endodonciado con poste, férula de 2 mm en todo el contorno. Provisional de larga duración (18 meses) mientras se hace ortodoncia.',
      procedimiento: 'Vía adhesiva: descontaminación, arenado a 1,5 bar, primer con MMA y cemento de resina dual. Recubrimiento de superficie en vestibular.',
      pasos: {
        0: { estado: 'hecho' }, 1: { estado: 'hecho' }, 2: { estado: 'hecho' }, 3: { estado: 'hecho' },
        4: { estado: 'hecho' }, 5: { estado: 'hecho' }, 6: { estado: 'noaplica' }, 7: { estado: 'hecho' },
        8: { estado: 'hecho' }, 9: { estado: 'hecho' }, 10: { estado: 'hecho' }, 11: { estado: 'hecho' }, 12: { estado: 'hecho' }
      },
      evidencia: '', consentimiento: true, fotos: [],
      sesiones: [
        { id: 's1', fecha: isoDia(-20), txt: 'Cementado adhesivo del provisional.', proximo: isoDia(4) }
      ],
      revisiones: [{
        id: 'r1', fecha: iso(15), revisor: { nombre: 'r.sepulveda', area: 'Rehabilitación oral', verificado: true },
        puntajes: { pertinencia: 5, claridad: 4, evidencia: 4 }, veredicto: 'aprobado', motivos: [],
        justificacion: 'La vía adhesiva está bien indicada: 18 meses de permanencia y pilar con poste. La férula quedó medida y registrada. Falta la foto final, pero el registro de pasos es completo.'
      }],
      historial: [{ fecha: iso(21), txt: 'Caso creado' }, { fecha: iso(20), txt: 'Enviado a revisión' }, { fecha: iso(15), txt: 'Aprobado por r.sepulveda' }],
      creado: iso(21), actualizado: iso(15)
    },
    {
      id: 'ej-yo-46', ejemplo: true, estado: 'borrador',
      autor: { id: 'yo', nombre: 'Tú', rol: '' },
      titulo: 'Resina clase I en 4.6',
      dientes: '4.6', especialidad: 'Operatoria',
      paciente: { iniciales: 'F. T.', edad: '19', sexo: 'Masculino' },
      protocoloId: 'resina-clase-i',
      diagnostico: 'Caries oclusal cavitada en fosa central del 4.6, vital y asintomático.',
      procedimiento: '',
      pasos: { 0: { estado: 'hecho' }, 1: { estado: 'hecho' } },
      evidencia: '', consentimiento: false, fotos: [],
      sesiones: [{ id: 's1', fecha: isoDia(-1), txt: 'Diagnóstico, foto oclusal y registro de contactos.', proximo: isoDia(1) }],
      revisiones: [],
      historial: [{ fecha: iso(1), txt: 'Caso creado' }],
      creado: iso(1), actualizado: iso(1)
    }
  ];
}

export function feedInicial() {
  return [
    { id: 'f1', ejemplo: true, autor: { nombre: 'j.bravo', rol: 'Estudiante 5º' }, protocoloId: 'exodoncia-18', fecha: new Date(Date.now() - 2 * 3600000).toISOString(),
      txt: '¿Cómo saben de verdad si se abrió comunicación cuando el alveolo está lleno de sangre? Aspirar para mirar mejor me da miedo de que sea peor.',
      likes: 7, liked: false, respuestas: [] },
    { id: 'f2', ejemplo: true, autor: { nombre: 'r.sepulveda', rol: 'Especialista · Rehabilitación oral', verificado: true }, protocoloId: 'resina-clase-i', fecha: new Date(Date.now() - 5 * 3600000).toISOString(),
      txt: 'Sobre el pulido: es correcto que un fresado CAD/CAM ya viene bajo el umbral, pero ojo con extrapolarlo a una resina que ustedes acaban de modelar a mano. Ahí sí hay que pulir todo.',
      likes: 31, liked: false, respuestas: [] },
    { id: 'f3', ejemplo: true, autor: { nombre: 'm.fuentes', rol: 'Estudiante 5º' }, protocoloId: 'cementado-pmma', fecha: iso(1),
      txt: 'Si en mi clínica solo hay cemento con eugenol y la definitiva va adherida, ¿qué hago? ¿Pido que compren o uso el que hay?',
      likes: 19, liked: false,
      respuestas: [{ id: 'r1', autor: { nombre: 'p.tapia', rol: 'Cirujano dentista', verificado: true }, fecha: iso(1, 14),
        txt: 'Usa el que hay y limpia bien la preparación antes del cementado definitivo. El metaanálisis de 2023 apunta justo a eso. Pero deja registrado en la ficha qué cemento usaste.' }] },
    { id: 'f4', ejemplo: true, autor: { nombre: 'c.aguilera', rol: 'Estudiante 5º' }, protocoloId: 'resina-clase-i', fecha: iso(2),
      txt: '¿Alguien mide la lámpara de su box con radiómetro? En la mía nadie sabe dónde está.',
      likes: 28, liked: false, respuestas: [] }
  ];
}
