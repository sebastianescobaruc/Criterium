// Contenido original de la biblioteca Criterium (portado sin cambios del borrador anterior).
export const PROTOS = [
    { id:'cementado-pmma', corto:'Cementado PMMA', esp:'Rehabilitación oral', estadoTxt:'Borrador de estudiante v0.5',
      t:'Cementado de corona provisional de PMMA fresado CAD/CAM',
      s:'Corona unitaria sobre diente natural, de 6 a 24 meses, cementada por vía adhesiva con cemento de resina. Solo la sesión de cementado.',
      extraTxt:'Busca revisores', n:'', abre:true,
      k:'cementar cemento provisional pmma cadcam corona temporal eugenol adhesivo arenado primer mma resina superbond ferula larga duracion' },
    { id:'resina-clase-i', corto:'Resina clase I', esp:'Rehabilitación oral', estadoTxt:'Borrador v0.2',
      t:'Restauración de resina compuesta clase I oclusal',
      s:'Caries oclusal primaria en diente permanente vital. De la marca de oclusión al pulido.',
      extraTxt:'2 pasos en disputa', n:'', abre:true, estudio:true,
      k:'resina composite obturacion clase i oclusal caries operatoria aislamiento dique adhesivo grabado bulk fill incremental fotopolimerizar pulido' },
    { id:'exodoncia-18', corto:'Exodoncia 1.8 / 2.8', esp:'Cirugía', estadoTxt:'Borrador v0.2',
      t:'Exodoncia simple de tercer molar superior (1.8 / 2.8)',
      s:'Tercer molar superior erupcionado en paciente sano. Con los dos puntos donde este diente se complica.',
      extraTxt:'2 pasos críticos', n:'', abre:true, estudio:true,
      k:'exodoncia extraccion 18 28 tercer molar cordal superior erupcionado forceps elevador tuberosidad seno maxilar comunicacion bucosinusal antibiotico cirugia' },
    { id:'pulpectomia-premolar', corto:'Pulpectomía premolar', esp:'Endodoncia', estadoTxt:'Borrador v0.1', estudio:true,
      t:'Bio/necropulpectomía de primer premolar superior',
      s:'Dos conductos, pulpa vital o necrótica, con step-back. Con las dos medidas donde no hay acuerdo.',
      extraTxt:'2 pasos en disputa', n:'', abre:true,
      k:'endodoncia biopulpectomia necropulpectomia premolar superior 14 24 conducto step back gates glidden localizador apical hipoclorito edta hidroxido de calcio obturacion' },
    { id:'destartraje', corto:'Destartraje', esp:'Periodoncia', estadoTxt:'Borrador v0.1', estudio:true,
      t:'Destartraje y pulido radicular por cuadrante',
      s:'Periodontitis estadio I a III. Instrumental manual o ultrasónico, y la reevaluación que siempre se olvida.',
      extraTxt:'1 paso que suele faltar', n:'', abre:true,
      k:'destartraje pulido radicular raspado alisado curetas gracey ultrasonido periodoncia periodontitis cuadrante saco reevaluacion' },
    { id:'sellantes-ninos', corto:'Sellantes', esp:'Odontopediatría', estadoTxt:'Borrador v0.1', estudio:true,
      t:'Sellantes en niños (ionómero de vidrio y resina)',
      s:'Molares permanentes sanos o con lesión no cavitada. El material se elige según cuánto puedes mantener seco.',
      extraTxt:'1 paso en disputa', n:'', abre:true,
      k:'sellantes fosas fisuras niños ionomero vidrio resina odontopediatria grabado aislamiento molar' }
  ];

export const DATOS = {
    'cementado-pmma': {
      esp:'Rehabilitación oral',
      pdf:'protocolo-cementado-pmma-v0.5.pdf',
      // Camino a la publicación: lo redactó un estudiante y espera a los expertos (mínimo 5) y al filtro final
      flujo:{ autor:'un estudiante de Odontología', revisores:0, minimo:5 },
      titulo:'Cementado de corona provisional de PMMA fresado CAD/CAM sobre diente natural',
      bandera:'BORRADOR DE ESTUDIANTE · NUEVE FUENTES REALES VERIFICADAS · ESPERA REVISIÓN DE EXPERTOS',
      tags:['Provisional de larga duración','6–24 meses','v0.5 · borrador de estudiante','Vía adhesiva'],
      alcance:'la sesión de cementado de una corona unitaria de PMMA fresado sobre diente natural, con permanencia prevista entre 6 y 24 meses. Cubre solo la vía adhesiva, con cemento de resina. No cubre el diseño, el fresado ni la prueba previa del provisional, y no aplica sobre pilar de implante.',
      bandeja:[
        { fase:'Antes de sentar al paciente', items:['Registro del bloque: material, marca y lote','Sonda periodontal milimetrada','Radiografía periapical basal del pilar','Radiómetro para comprobar la lámpara'] },
        { fase:'Prueba y ajuste', items:['Papel de articular y pinza','Fresas de pulido para acrílico','Discos y puntas de silicona','Hilo dental','Sonda de exploración'] },
        { fase:'Cementación adhesiva', items:['Arenador con óxido de aluminio de 50 µm y manómetro','Ácido ortofosfórico al 37 %','Baño ultrasónico y alcohol de 96 %','Primer con MMA','Cemento de resina y su adhesivo','Microbrushes y pinceles desechables','Dique de goma, o hilo retractor y aspiración','Cinta de teflón o matriz para proximal','Lámpara de fotopolimerización','Gel de glicerina'] },
        { fase:'Acabado y cierre', items:['Hilo dental y superfloss','Papel de articular de 40 µm','Pasta de pulido para resina','Recubrimiento de superficie fotopolimerizable','Ficha clínica y agenda de controles'] }
      ],
      evidencia:[
        { n:'01', grado:'Grado D · documentación de fabricante', txt:'PMMA fresado reticulado: 135 MPa y permanencia máxima indicada de 12 meses.' },
        { n:'02', grado:'Grado B · revisión sistemática con metaanálisis', txt:'Férula de 2 mm o más: +165 N de resistencia a la fractura. En clínica el efecto es más débil.' },
        { n:'05', grado:'Grado B · in vitro comparativo', txt:'Rugosidad del PMMA fresado ya bajo el umbral de 0,2 µm.' },
        { n:'06', grado:'Grado C · in vitro', txt:'PMMA CAD/CAM sin acondicionar: casi no hay unión. El primer con MMA la levanta.' },
        { n:'07', grado:'Sin evidencia', txt:'Fotopolimerizar o no el adhesivo del muñón: depende del sistema de cemento.' },
        { n:'09', grado:'Grado C · población distinta', txt:'Cemento residual y enfermedad periimplantaria.' },
        { n:'10', grado:'Grado C · in vitro', txt:'El recubrimiento de resina mejora la estabilidad de color del PMMA fresado.' },
        { n:'11', grado:'Sin evidencia', txt:'Indicaciones al paciente: práctica habitual.' }
      ],
      nota:'Borrador v0.5, hecho por un estudiante. Solo la vía adhesiva: la vía convencional con óxido de zinc se eliminó. Generaliza el alcance a cualquier corona unitaria de PMMA fresado. Las fuentes están verificadas y con su referencia completa; lo que falta en todas es el localizador de párrafo, y en la documentación de fabricante, el documento exacto. Dos cifras no tienen fuente y se publican como extrapolación declarada: los 50 µm y los 1–2 bar del arenado. Ninguna versión de este documento debe usarse en un paciente hasta que el panel de expertos lo revise.',
      pasos:[
        { corto:'Confirma de qué material es la corona', hacer:'Confirma con el laboratorio el material exacto antes de tocar la corona.',
          listo:'Terminaste cuando tienes anotado en la ficha el material, la marca del bloque y el lote.',
          porque:['El acondicionamiento cambia por completo según el material. El PMMA es un polímero: se arena y se prima. Un bloque de composite CAD lleva ácido fluorhídrico y silano. Si los confundes, o pierdes la superficie interna o la corona se descementa.','El PMMA fresado reticulado tiene una resistencia flexural cercana a 135 MPa y el fabricante lo indica hasta 12 meses en coronas. Si tu plan son 24, estás usándolo fuera de la indicación del fabricante. Se puede hacer, pero tiene que quedar escrito: consentimiento, controles cada 3 meses y fecha de recambio fijada desde hoy.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado D · documentación de fabricante', cita:'Ivoclar Vivadent. Telio CAD: bloques de PMMA reticulado para provisionales de larga duración. Documentación de producto.', url:'https://www.ivoclar.com/en_li/products/digital-processes/telio-cad', loc:'Resistencia flexural 135 MPa · permanencia máxima 12 meses en coronas · localizador pendiente' }
            ] },
            { titulo:'dónde se equivoca la gente', parrafos:['Asumir que todo provisional fresado es PMMA. Los bloques de composite CAD se fresan igual y se ven parecidos, pero se acondicionan al revés.','Empezar a arenar sin saber qué material es. El arenado sobre un composite CAD no es el error grave; el grave es el fluorhídrico sobre PMMA, que no hace nada y te hace creer que grabaste.'] }
          ] },
        { anim:'pmma.ferula', corto:'Mide la férula si el pilar está endodonciado', hacer:'Mide con sonda milimetrada la dentina sana que queda por debajo del margen de la corona, en todo el perímetro.',
          cond:'→ solo si el pilar está endodonciado y llevará poste',
          listo:'Terminaste cuando la medida está registrada en la ficha y confirmas al menos 2 mm de dentina sana en todo el contorno.',
          porque:['La férula es ese anillo de dentina sana por debajo del margen. Reparte la carga sobre el diente en vez de concentrarla en la unión entre el poste y el muñón.','Una revisión sistemática de 2026 que reúne 33 estudios encontró que una férula de 2 mm o más aumenta la resistencia a la fractura en 165 N de media, y recomienda entre 1,5 y 2,0 mm de altura con al menos 1 mm de espesor de dentina. Si no la hay, no se arregla eligiendo mejor cemento: hay que conseguirla antes de coronar.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · revisión sistemática con metaanálisis', cita:'Hajeer O, Hasan A, Kanout C, Morad ML. Ferrule dimensions and restoration outcomes in endodontically treated teeth: a systematic review and meta-analysis. J Prosthodont. 2026.', loc:'Férula ≥2 mm: diferencia media +165 N (IC 95 % 110–215) · recomienda 1,5–2,0 mm de altura y ≥1 mm de espesor de dentina · DOI 10.1111/jopr.70099 · PMID 41601347 · localizador de párrafo pendiente' },
              { grado:'Grado B · revisión sistemática de estudios clínicos', cita:'Al-Dabbagh RA, Sindi MA, Sanari MA, Manna AI, Al-Dabbagh MA. Effect of a circumferential ferrule on the survival and success of endodontically treated teeth restored with fiber posts: a systematic review and meta-analysis. J Prosthet Dent. 2024;132(6):1251-1259.', loc:'RR 1,28 (IC 95 % 1,06–1,54) en 2 estudios y 123 dientes; sin diferencia significativa al ampliar a 8 estudios y 407 dientes · DOI 10.1016/j.prosdent.2023.12.002 · localizador pendiente' }
            ] },
            { titulo:'ojo con esta evidencia', parrafos:['Los 165 N vienen sobre todo de ensayos de laboratorio. En pacientes el efecto es menos claro: la revisión clínica de 2024 encuentra mejor éxito con férula en 2 estudios con 123 dientes, pero al ampliar a 8 estudios y 407 dientes la diferencia desaparece.','Exige los 2 mm porque el laboratorio y la práctica lo respaldan, no porque exista un ensayo clínico grande que lo demuestre.'] }
          ] },
        { anim:'pmma.probar', corto:'Retira el provisional anterior y prueba en seco', hacer:'Retira el provisional anterior, elimina todo resto de cemento del muñón y prueba la corona en boca antes de preparar nada.',
          listo:'Terminaste cuando asienta por completo sin presión, los márgenes contactan la preparación en todo el perímetro y el punto de contacto pasa hilo dental con resistencia leve.',
          porque:['Una corona que no asienta antes del cemento no va a asentar después. La película de cemento agrega espesor: si ya había interferencia en seco, al cementar queda alta y con el margen abierto.','Un margen abierto en un provisional de larga duración deja expuesta la dentina durante meses. Ahí es donde aparecen la sensibilidad y la caries recurrente que después obligan a rehacer.','Si el provisional anterior estaba cementado con óxido de zinc con eugenol, el eugenol que queda en la dentina inhibe la polimerización del cemento de resina. No basta con lavar: hay que limpiar mecánicamente, con piedra pómez sin flúor o con clorhexidina al 2 %. Nada de pastas de profilaxis con glicerina o aceites.'],
          sub:[{ titulo:'dónde se equivoca la gente', parrafos:['Probar el asentamiento empujando fuerte con el dedo. La presión enmascara la interferencia: la corona entra, pero rebota apenas se suelta. Si tienes que forzarla, no asienta.','No revisar el punto de contacto. Un provisional sin contacto proximal deja migrar al diente vecino en semanas, y la corona definitiva ya no calza.','Probar la corona en boca y después cementarla por vía adhesiva sin descontaminar la cara interna. La saliva deja una película que el agua no saca.'] }] },
        { anim:'pmma.oclusion', corto:'Ajusta la oclusión sin cementar', hacer:'Ajusta la oclusión con el provisional todavía sin cementar.',
          listo:'Terminaste cuando el papel de articular marca contactos del mismo grosor que en los dientes vecinos, en máxima intercuspidación y en lateralidades.',
          porque:['Ajustar después de cementar obliga a desgastar con el provisional fijo. El desgaste genera calor, y el calor sobre un cemento recién fraguado puede romper la unión que acabas de lograr.','Además el polvo de PMMA se mete en el surco y es difícil de retirar sin dañar el tejido.'] },
        { anim:'pmma.pulir', corto:'Pule solo lo que ajustaste', hacer:'Pule solo las zonas que ajustaste. No pulas el resto del provisional.',
          listo:'Terminaste cuando la zona ajustada devuelve brillo y la sonda recorre el margen sin engancharse.',
          porque:['Bajo 0,2 µm de rugosidad, seguir puliendo ya no reduce la adhesión bacteriana. Y un provisional fresado en PMMA sale de la fresadora entre 0,136 y 0,144 µm, o sea ya está bajo ese umbral.','Por eso pulir la superficie intacta no aporta nada. Lo que sí quedó rugoso es lo que tú desgastaste al ajustar oclusión y márgenes. Esa es la única zona que necesita pulido.'],
          sub:[{ titulo:'ver fuentes', fuentes:[
            { grado:'Grado B · estudio in vitro comparativo', cita:'Burduroglu HD, Kanpalta B, Şentürk H, Keleş ZH, Sismanoglu S. Surface roughness and bacterial adhesion of CAD/CAM and conventional provisional restorative materials. Materials. 2026.', url:'https://doi.org/10.3390/ma19163421', loc:'Telio CAD 0,136 ± 0,011 µm · Vita CAD-Temp 0,144 ± 0,005 µm · localizador pendiente' },
            { grado:'Grado B · umbral de referencia', cita:'Bollen CM, Lambrechts P, Quirynen M. Comparison of surface roughness of oral hard materials to the threshold surface roughness for bacterial plaque retention. Dent Mater. 1997.', url:'https://doi.org/10.1016/S0109-5641(97)80038-3', loc:'Umbral de 0,2 µm · localizador pendiente' }
          ] }] },
        { anim:'pmma.arenar', corto:'Arena la cara interna y prímala con MMA', hacer:'Descontamina la cara interna con ácido ortofosfórico al 37 % durante 60 segundos, lava y seca. Después arena con óxido de aluminio de 50 µm a 1–2 bar, limpia en ultrasonido y aplica una capa fina de primer con MMA.',
          cond:'→ fuera de la boca',
          listo:'Terminaste cuando la cara interna está mate y uniforme, seca, con el primer fotopolimerizado, y la corona guardada protegida de la luz.',
          porque:['El PMMA no tiene fase vítrea, así que el ácido fluorhídrico no disuelve nada y no deja ningún patrón de grabado. El ortofosfórico tampoco graba el acrílico: sirve solo para retirar la película de saliva que el agua no saca.','La unión a un PMMA ya polimerizado se consigue por dos caminos y solo dos: la rugosidad que deja el arenado y la unión química del MMA, que hincha el acrílico, penetra en él y copolimeriza. Un adhesivo universal corriente no hace eso.','La presión del arenado es el parámetro crítico. El acrílico se erosiona mucho antes que la cerámica: si arenas a presión alta pierdes ajuste marginal en una corona que tiene que durar meses. El objetivo del arenado aquí es rugosidad, no desgaste.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado C · estudio in vitro', cita:'Keul C, Martin A, Wimmer T, Roos M, Gernet W, Stawarczyk B. Tensile bond strength of PMMA- and composite-based CAD/CAM materials to luting cements after different conditioning methods. Int J Adhes Adhes. 2013;46:122-127.', loc:'El PMMA CAD/CAM sin acondicionar casi no adhiere, con cualquier cemento. El primer con MMA sube la resistencia de unión de forma significativa y falla de forma cohesiva dentro del cemento · DOI 10.1016/j.ijadhadh.2013.06.003 · localizador de párrafo pendiente' }
            ] },
            { titulo:'ojo con esta evidencia', parrafos:['La fuente que tenemos prueba el primer, no la presión. Lo demostrado es que sin acondicionar no hay unión y que un primer con MMA la levanta.','Las cifras de 50 µm y 1–2 bar no salen de un ensayo sobre tu bloque comercial: vienen de la práctica establecida. No existe una presión normalizada por material, así que Criterium las publica como extrapolación declarada, no como dato duro.'] },
            { titulo:'dónde se equivoca la gente', parrafos:['Grabar la cara interna con ácido fluorhídrico. No hay fase vítrea que disolver: solo añade riesgo de manipulación.','Saltarse el primer con MMA y confiar en un adhesivo universal. Ese es el escenario clásico del descementado a las pocas semanas: el cemento se queda pegado al diente y la corona sale entera.','Arenar a la presión que usarías sobre circonia. Sobre circonia retiras una capa despreciable; sobre acrílico desajustas la corona.'] }
          ] },
        { anim:'pmma.adhesivo', corto:'Acondiciona el muñón y cementa con resina', hacer:'Aísla, graba esmalte 30 segundos y dentina 15, aplica el adhesivo frotando 20 segundos, evapora el disolvente 5 segundos y cementa con resina.',
          cond:'→ una corona a la vez',
          listo:'Terminaste cuando el margen se comprueba con sonda, el exceso se retiró en fase gel, polimerizaste 20 a 40 segundos por cara y repolimerizaste 10 segundos con glicerina en los márgenes.',
          porque:['Se empieza grabando el esmalte y el ácido llega a la dentina después, nunca al revés. Sobregrabar la dentina colapsa la malla de colágeno y la capa híbrida queda incompleta: la adhesión empeora, no mejora.','El esmalte se seca hasta que queda con aspecto de tiza; la dentina solo hasta húmeda y brillante. Desecada, el colágeno se desploma.','La glicerina tapa el oxígeno del aire. Sin ella queda una capa superficial sin polimerizar justo en el margen, que es donde menos te conviene.','Una corona a la vez. Si cementas varias juntas, en alguna el exceso fragua antes de que llegues a retirarlo.'],
          sub:[
            { titulo:'dónde no hay acuerdo', parrafos:['Si el adhesivo del muñón se fotopolimeriza antes de asentar la corona depende del sistema de cemento que uses. Hay sistemas duales donde se indica y otros donde no.','No hay una regla general que valga para todos. Confírmalo en las instrucciones de uso del cemento antes de la sesión.'] },
            { titulo:'dónde se equivoca la gente', parrafos:['Dispensar el cemento sobre el muñón en vez de sobre la cara interna de la corona. Se incorporan burbujas y el exceso sale donde no quieres.','Cementar sobre restos de cemento provisional con eugenol. Inhibe la polimerización de la resina.'] }
          ] },
        { anim:'pmma.asentar', corto:'Asienta y retira el exceso en el momento justo', hacer:'Asienta con presión digital firme y sostenida, con vibración suave, hasta el asentamiento completo, y retira el exceso en el momento justo.',
          listo:'Terminaste cuando el margen se recorre con sonda sin escalón y el exceso salió entero, en fase gel.',
          porque:['El momento justo es la fase gel. Si el sistema lo permite, un destello de 1 a 3 segundos por cara lleva el cemento a esa consistencia y el exceso sale de una pieza.','Si lo retiras antes, arrastras cemento desde debajo del margen y la zona queda sin sellar. Si lo dejas endurecer del todo, después tienes que rasparlo y rayas la raíz.'] },
        { anim:'pmma.hilo', corto:'Revisa el margen con sonda y pasa hilo', hacer:'Revisa el margen con sonda cara por cara y pasa hilo dental por ambos contactos en vaivén, sacándolo hacia vestibular.',
          listo:'Terminaste cuando la sonda recorre todo el margen sin encontrar cemento y el hilo sale limpio.',
          porque:['El cemento que queda bajo la encía no se reabsorbe. Se comporta como un cuerpo extraño y mantiene inflamación mientras dure el provisional. A 24 meses eso no es un detalle estético.','Un estudio endoscópico de 2025 encontró cemento residual en el 80,4 % de los implantes que ya tenían enfermedad periimplantaria: 37 de 46. De esos, 64,9 % con mucositis y 35,1 % con periimplantitis.'],
          sub:[
            { titulo:'ojo con esta evidencia', parrafos:['Ese estudio es en implantes, no en dientes naturales. El surco periimplantario y el periodonto no se comportan igual, así que la cifra no se traslada directo a tu caso.','Sirve como advertencia de la magnitud del problema, no como prueba de lo que pasa en un diente natural. Criterium lo declara en vez de esconderlo.'],
              fuentes:[{ grado:'Grado C · transversal, población distinta', cita:'Montevecchi M, Valeriani L, Salvadori MF, Stefanini M, Zucchelli G. Excess cement and peri-implant disease: a cross-sectional clinical endoscopic study. J Periodontol. 2025;96(9):965–973.', url:'https://doi.org/10.1002/jper.24-0510', loc:'Cemento residual en 37 de 46 implantes con enfermedad periimplantaria (80,4 %) · localizador pendiente' }] },
            { titulo:'dónde se equivoca la gente', parrafos:['Pasar el hilo hacia abajo y tirarlo de vuelta hacia oclusal. Eso vuelve a meter el cemento en el contacto. El hilo se saca tirando hacia vestibular o lingual.','Rascar el exceso endurecido con instrumento. Genera fragmentos que se meten más profundo en el surco en vez de salir.'] }
          ] },
        { anim:'pmma.sellar', corto:'Sella toda superficie que hayas fresado', hacer:'Repule con fresa de acrílico, discos y pasta, y aplica un recubrimiento de superficie fotopolimerizable sobre la cara vestibular.',
          cond:'→ si la permanencia prevista pasa de 6 meses',
          listo:'Terminaste cuando ninguna zona fresada queda mate y la vestibular está recubierta y polimerizada.',
          porque:['En cuanto ajustas con fresa un contacto, un margen o la oclusión, pierdes el pulido de fábrica en esa zona. Queda una superficie rugosa que retiene placa y pigmento.','A dos años el modo de fallo más probable de esta corona no es la fractura ni el descementado: es el color. El PMMA absorbe agua y se tiñe más que la cerámica.','El recubrimiento de resina fotopolimerizable mejora bastante la estabilidad de color. En laboratorio, con 5000 termociclados y 28 días en café, cola o jugo de uva, los autores estiman color clínicamente aceptable durante unos 7 meses. Por eso se reaplica en cada control.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado C · estudio in vitro', cita:'Angwaravong O, Sirichay S, Pengsuk T, Sooksuwan P, Angwarawong T. Effect of surface coating, thermocycling, and staining solutions on the color stability of CAD-CAM polymethyl methacrylate interim fixed restorations. J Esthet Restor Dent. 2025.', loc:'144 probetas, 5000 termociclados y 28 días en café, cola o jugo de uva · el recubrimiento de resina mejoró la estabilidad de color de forma sustancial · DOI 10.1111/jerd.13513 · PMID 40611631 · localizador pendiente' },
              { grado:'Grado C · in vitro comparativo', cita:'Galbraith A, Doan M, Galbraith T, Abubakr NH. Evaluation of color stability and marginal integrity in provisional restorations: a study of milling, 3D printing, and conventional fabrication methods. Dent J. 2025;13(5):189.', loc:'Cambio de color: impreso 3D 0,46 · PMMA fresado 0,89 · bis-acryl 1,72 · acrílico convencional 3,98 · DOI 10.3390/dj13050189 · localizador pendiente' }
            ] },
            { titulo:'ojo con esta evidencia', parrafos:['Se suele decir que el PMMA fresado es el provisional más estable en color. Le gana al bis-acryl y al acrílico convencional, pero en el estudio de 2025 el impreso en 3D cambió menos color que el fresado.','Son cifras de laboratorio, sobre probetas y no sobre coronas en boca. Sirven para ordenar materiales entre sí, no para prometerle un color al paciente.'] }
          ] },
        { corto:'Indicaciones, ficha y controles', marca:'sin evidencia',
          hacer:'Da las indicaciones al paciente, registra en ficha y deja agendado el control.',
          listo:'Terminaste cuando el paciente puede repetirte la indicación con sus palabras y la ficha tiene material y lote del bloque, cemento y lote, y la fecha de recambio.',
          sinEv:'Sin evidencia — práctica habitual, sin respaldo de alto nivel',
          porque:['Las indicaciones que se dan son evitar alimentos pegajosos, no usar hilo en esa zona por 24 horas, y contar que el café, el té, el vino tinto y el tabaco pigmentan el acrílico mucho más que el esmalte. Se enseñan y se repiten en clínica, pero no encontramos evidencia que las respalde con un nivel aceptable. Criterium no las borra ni las disfraza: las publica marcadas.','Decirlo es parte del objetivo. Un estudiante tiene que poder distinguir lo que está fundamentado de lo que solo se hereda por costumbre.','Lo que sí depende de ti es la fecha. Si la permanencia prevista pasa de los 12 meses que indica el fabricante, la fecha de recambio se anota hoy, no dentro de dos años.'] }
      ]
    },

    'resina-clase-i': {
      esp:'Rehabilitación oral',
      pdf:'protocolo-resina-clase-i-v0.2.pdf',
      titulo:'Restauración de resina compuesta clase I oclusal en diente permanente',
      bandera:'BORRADOR · SIETE FUENTES VERIFICADAS · SIN REVISIÓN DE ESPECIALISTA',
      tags:['Lesión primaria cavitada','Diente vital','v0.2 · borrador','2 pasos en disputa'],
      alcance:'caries oclusal primaria, cavitada, poco o moderadamente profunda, en diente permanente vital y asintomático. No cubre lesión profunda con riesgo de exposición pulpar, recambio de una restauración antigua, ni cavidades que comprometan una cara proximal.',
      bandeja:[
        { fase:'Diagnóstico y registro', items:['Espejo, explorador y pinza','Papel de articular y pinza de Miller','Radiografía bitewing del diente'] },
        { fase:'Aislamiento', items:['Dique de goma, arco y perforador','Clamps para molar y premolar','Hilo dental para asentar el dique'] },
        { fase:'Preparación', items:['Fresas redondas de diamante y de carburo','Cucharetas de dentina','Jeringa triple'] },
        { fase:'Adhesión', items:['Ácido fosfórico en jeringa','Adhesivo y microaplicadores','Lámpara de fotopolimerización con su barrera','Radiómetro','Lentes de protección naranjas'] },
        { fase:'Restauración y terminación', items:['Resina compuesta del color elegido','Espátulas de modelado','Fresas de terminación y gomas de pulido'] }
      ],
      evidencia:[
        { n:'02', grado:'Grado B · revisión Cochrane, certeza baja', txt:'Dique de goma: ventaja a 6 meses que no se sostiene a 12 y 18 meses.' },
        { n:'03', grado:'Grado D · consenso internacional', txt:'Remoción selectiva a dentina firme en lesiones poco y moderadamente profundas.' },
        { n:'04', grado:'Grado B · revisión Cochrane, certeza baja', txt:'Liner bajo resina clase I y II: sin diferencia en duración de la restauración.' },
        { n:'05', grado:'Grado C · metaanálisis en red in vitro', txt:'La adhesión depende sobre todo de la estrategia de aplicación, no de un monómero en particular.' },
        { n:'07', grado:'Grado B · metaanálisis de 9 ensayos', txt:'Sin diferencia en fracaso entre bulk-fill e incremental.' },
        { n:'09', grado:'Grado B · metaanálisis de datos individuales', txt:'Caries secundaria y fractura son las causas de fracaso a 5 años o más.' }
      ],
      nota:'Borrador v0.2. Rehace la v0.1 con el formato del master prompt y carga como fuentes las referencias que la v0.1 solo nombraba. La revisión Cochrane de liners convierte el paso 04 de «sin evidencia» en un paso con fuente. Se retiró la cifra de 34,69 MPa del paso 05 y el «hasta 40 %» de la barrera de la lámpara, porque no se pudieron verificar en las fuentes. Faltan los localizadores de párrafo. No usar como estándar de atención hasta la revisión del panel.',
      pasos:[
        { anim:'molar.papel', corto:'Marca los contactos antes', marca:'sin evidencia',
          hacer:'Marca los contactos oclusales con papel de articular antes de tocar el diente.',
          listo:'Terminaste cuando tienes registrado en la ficha o en una foto dónde contacta el diente y dónde no.',
          sinEv:'Práctica habitual, sin estudio que la compare con no registrar',
          porque:['Cuando termines vas a tener que decidir qué marca sobra. Si no sabes cómo contactaba antes, no tienes contra qué comparar y terminas desgastando a ojo hasta que el papel deje de marcar.','Ese desgaste a ciegas deja la restauración baja: el diente deja de tocar, el antagonista se extruye con los meses y aparece una interferencia nueva.'],
          sub:[{ titulo:'dónde se equivoca la gente', parrafos:['Marcar recién al final, con el diente anestesiado y sin referencia previa.','Pedirle al paciente anestesiado que «muerda normal». Con anestesia no muerde normal: la referencia sirve solo si se toma antes.'] }] },
        { anim:'molar.dique', corto:'Aísla con dique de goma', marca:'en disputa',
          disputa:'La evidencia que respalda el dique de goma en restauraciones es de certeza baja a muy baja. Pendiente de resolución por el panel de expertos.',
          hacer:'Aísla con dique de goma.',
          listo:'Terminaste cuando el diente está seco, el dique no se mueve al soplar y el clamp no tapa ninguna parte de la cavidad.',
          porque:['La adhesión falla con humedad. La saliva contamina la superficie grabada y baja la unión. En un diente posterior, con el paciente hablando y respirando, mantener seco con rollos de algodón exige una vigilancia que casi nunca se sostiene toda la sesión.','Además el dique protege la vía aérea: evita que el paciente trague o aspire un instrumento o un trozo de material.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · revisión Cochrane, certeza baja a muy baja', cita:'Miao C, Yang X, Wong MC, Zou J, Zhou X, Li C, et al. Rubber dam isolation for restorative treatment in dental patients. Cochrane Database Syst Rev. 2021;5(5):CD009858.', loc:'Lesiones cervicales: OR 2,29 (IC 95 % 1,05–4,99) a 6 meses; sin diferencia a 12 y 18 meses · DOI 10.1002/14651858.CD009858.pub3 · PMID 33998662 · localizador de párrafo pendiente' }
            ] },
            { titulo:'dónde no hay acuerdo', parrafos:['Lo que se enseña: sin dique de goma no se puede adherir bien.','Lo que dice la evidencia: la revisión Cochrane de 2021 encontró que el dique mejora la supervivencia de restauraciones de resina en lesiones cervicales a los 6 meses, pero la ventaja no se mantiene a los 12 ni a los 18 meses. En restauraciones atraumáticas proximales en molares temporales hubo menos fracaso a 24 meses (HR 0,80; IC 95 % 0,66–0,97).','Por qué Criterium mantiene el dique: la certeza es baja a muy baja y ninguno de esos estudios es una clase I oclusal. La razón biológica (adhesión sin humedad) y la de seguridad (vía aérea) siguen en pie mientras el panel decide.'] }
          ] },
        { anim:'molar.fresa', corto:'Abre y remueve la caries', hacer:'Abre la cavidad y remueve la caries hasta dentina firme en la periferia y en el piso.',
          listo:'Terminaste cuando el margen de esmalte está sano y sin socavado, y la dentina de las paredes resiste la presión del explorador sin ceder.',
          porque:['El consenso internacional sobre remoción de tejido cariado recomienda, en lesiones poco y moderadamente profundas, remover hasta dentina firme. Es el caso típico de una clase I oclusal.','No se trata de dejar el diente «limpio a ojo»: se quita lo que impide sellar bien y se conserva el resto. Cada milímetro de dentina que sacas de más debilita el diente y acerca la pulpa.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado D · consenso internacional de expertos', cita:'Schwendicke F, Frencken JE, Bjørndal L, Maltz M, Manton DJ, Ricketts D, et al. Managing carious lesions: consensus recommendations on carious tissue removal. Adv Dent Res. 2016;28(2):58-67.', loc:'Remoción selectiva a dentina firme en lesiones poco y moderadamente profundas · DOI 10.1177/0022034516639271 · PMID 27099358 · localizador de párrafo pendiente' }
            ] },
            { titulo:'¿y si mi caso es otro?', arbol:[
              { q:'¿Lesión poco o moderadamente profunda?', a:'Remoción selectiva a dentina firme en toda la cavidad.' },
              { q:'¿Lesión profunda, con riesgo de exponer la pulpa?', a:'Otro escenario: se deja dentina blanda en el fondo, sobre la pulpa. Fuera del alcance de este protocolo.' },
              { q:'¿Ya hay exposición pulpar?', a:'Fuera del alcance. Es otro protocolo.' }
            ] }
          ] },
        { anim:'molar.sinliner', corto:'No pongas base ni liner', hacer:'No pongas base ni liner.', cond:'→ si la cavidad es poco o moderadamente profunda',
          listo:'Terminaste cuando confirmaste que queda dentina entre el piso de la cavidad y la pulpa, y la cavidad está lista para grabar.',
          porque:['Una revisión Cochrane de 2019 reunió los ensayos que comparan liner contra no liner bajo resinas clase I y II. No encontró diferencia en la duración de la restauración a 1 y 2 años, y la evidencia sobre sensibilidad después del tratamiento fue inconsistente.','El adhesivo sella la dentina. Un liner agrega una capa más donde algo puede fallar, sin un beneficio demostrado en una cavidad de rutina.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · revisión Cochrane, certeza baja', cita:'Schenkel AB, Veitz-Keenan A. Dental cavity liners for Class I and Class II resin-based composite restorations. Cochrane Database Syst Rev. 2019;3(3):CD010526.', loc:'8 estudios, más de 700 participantes · sin diferencia en fracaso a 1 y 2 años · DOI 10.1002/14651858.CD010526.pub3 · PMID 30834516 · localizador de párrafo pendiente' }
            ] },
            { titulo:'¿y si mi caso es otro?', arbol:[
              { q:'¿Cavidad poco o moderadamente profunda?', a:'Sin base. Adhesivo directo sobre la dentina.' },
              { q:'¿Cavidad profunda con poca dentina sobre la pulpa?', a:'La revisión Cochrane no lo resuelve. Consulta al docente: es un escenario fuera de este protocolo.' },
              { q:'¿Hubo exposición pulpar?', a:'Fuera del alcance de este protocolo.' }
            ] }
          ] },
        { anim:'molar.grabado', corto:'Grabado selectivo del esmalte', marca:'en disputa',
          disputa:'No hay acuerdo sobre si grabar el esmalte por separado cuando se usa un adhesivo universal. Pendiente de resolución por el panel.',
          hacer:'Graba solo el esmalte con ácido fosfórico durante 15 a 30 segundos. Lava y seca sin resecar la dentina.',
          cond:'→ grabado selectivo: ácido solo en esmalte, no en dentina',
          listo:'Terminaste cuando el esmalte grabado se ve blanco tiza y la dentina queda húmeda, sin charco y sin verse opaca.',
          porque:['El margen de una clase I oclusal es casi todo esmalte, y el ácido fosfórico deja en el esmalte los microporos donde se traba el adhesivo.','La dentina es al revés: si la grabas y después la secas de más, las fibras de colágeno colapsan y el adhesivo ya no penetra. Por eso el ácido va solo al esmalte.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado C · metaanálisis en red de estudios in vitro', cita:'Karaduman YD, Ercan M, Bedir F, Karadas M. Comparison of universal adhesives used in different etching modes on dentin bond strength: a systematic review and network meta-analysis. BMC Oral Health. 2026;26(1):1632.', loc:'82 estudios in vitro · la adhesión depende sobre todo de la estrategia de aplicación y de la composición, no de un monómero en particular · DOI 10.1186/s12903-026-08982-4 · PMID 42321697 · localizador de párrafo pendiente' }
            ] },
            { titulo:'dónde no hay acuerdo', parrafos:['Lo que se enseña en muchas clínicas: con un adhesivo universal en modo autograbante basta y no hay que grabar nada.','Lo que dice el laboratorio: un metaanálisis en red de 2026, con 82 estudios, concluye que la adhesión a dentina depende sobre todo de cómo se aplica el adhesivo y de su composición.','Por qué Criterium no lo convierte en regla: son estudios in vitro. La regla del validador les pone techo de grado C. Una cifra de resistencia en una probeta no es una restauración que duró años en boca.'] }
          ] },
        { anim:'molar.adhesivo', corto:'Adhesivo frotado y curado', marca:'sin evidencia',
          hacer:'Aplica el adhesivo frotando, sopla suave para evaporar el solvente y fotopolimeriza.',
          listo:'Terminaste cuando toda la cavidad se ve con brillo parejo, sin zonas mate ni acumulaciones en los ángulos, y fotopolimerizaste el adhesivo antes de poner resina.',
          sinEv:'Práctica habitual e instrucciones del fabricante del adhesivo; sin un ensayo clínico que la compare en clase I',
          porque:['Frotar ayuda a que el adhesivo penetre la dentina. Si lo dejas quieto, queda una capa que se despega.','El soplado evapora el solvente. Si queda solvente atrapado, el adhesivo no polimeriza bien. Una zona mate significa que ahí faltó adhesivo o sobró soplado.','El adhesivo se fotopolimeriza antes de poner la resina. Si no, la resina lo desplaza al condensarla.'],
          sub:[{ titulo:'dónde se equivoca la gente', parrafos:['Soplar fuerte y de cerca. Corre el adhesivo hacia un lado y deja los ángulos secos y el piso encharcado.','Saltarse la fotopolimerización del adhesivo para ahorrar tiempo.','Dejar el frasco abierto entre pacientes: el solvente se evapora y cambia lo que queda.'] }] },
        { anim:'molar.incrementos', corto:'Coloca la resina', hacer:'Coloca la resina en capas de hasta 2 mm, o en un solo bloque si usas una resina bulk-fill.',
          listo:'Terminaste cuando la resina reproduce la anatomía oclusal, sin excesos sobre el esmalte sano y sin burbujas en los ángulos.',
          porque:['Las dos técnicas funcionan. Un metaanálisis de 2025, con 9 ensayos clínicos y 632 restauraciones clase I y II, no encontró diferencia en fracaso entre bulk-fill e incremental (RR 0,82; IC 95 % 0,33–2,01). Tampoco en adaptación marginal, cambio de color ni sensibilidad.','Lo que sí importa es respetar el espesor máximo del material. Una resina convencional en un bloque de 4 mm no polimeriza en el fondo.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · metaanálisis de ensayos clínicos', cita:'Zailai A, Alharbi ZA, Dowairi F, Halawi O, Ghulaysan SA, Safhi RE, et al. Clinical performance and survival of bulk-fill resin composites compared to conventional resin composites in posterior permanent teeth: a systematic review and meta-analysis. Cureus. 2025;17(12):e99792.', loc:'9 ensayos, 632 restauraciones · RR 0,82 (IC 95 % 0,33–2,01; p = 0,67) · DOI 10.7759/cureus.99792 · PMID 41445995 · localizador de párrafo pendiente' }
            ] },
            { titulo:'¿y si mi caso es otro?', arbol:[
              { q:'¿Usas resina convencional?', a:'Capas de hasta 2 mm, cada una fotopolimerizada por separado.' },
              { q:'¿Usas bulk-fill con indicación del fabricante hasta 4 mm?', a:'Un solo incremento hasta el espesor del frasco. El último milímetro se puede terminar con resina convencional para pulir mejor.' },
              { q:'¿La cavidad mide menos de 2 mm de profundidad?', a:'Un solo incremento con cualquiera de las dos.' }
            ] }
          ] },
        { anim:'molar.luz', corto:'Fotopolimeriza bien', hacer:'Fotopolimeriza con la punta lo más cerca posible del material, perpendicular a la superficie, el tiempo que indica el fabricante.',
          listo:'Terminaste cuando polimerizaste cada capa por separado y la superficie no se raya con el explorador.',
          porque:['La luz pierde intensidad rápido con la distancia y con el ángulo. El consenso internacional sobre fotopolimerización pide la punta lo más cerca posible, perpendicular a la superficie, y protección para los ojos.','Una resina mal polimerizada en el fondo se ve perfecta el día que la pones. El problema aparece meses después, como sensibilidad o caries secundaria.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado D · consenso internacional de expertos', cita:'Price RB. Light curing guidelines for practitioners: a consensus statement from the 2014 symposium on light curing in dentistry, Dalhousie University, Halifax, Canada. J Can Dent Assoc. 2014;80:e61.', loc:'Recomendaciones para el operador · PMID 25437940 · sin resumen en PubMed: localizador de párrafo pendiente' }
            ] },
            { titulo:'dónde se equivoca la gente', parrafos:['Apoyar la punta en una cúspide y polimerizar en ángulo, dejando el fondo en sombra.','Usar tiempos ultracortos de alta potencia sin confirmar que el material los admite.','No medir nunca la salida de la lámpara. Mídela con el radiómetro y con la funda de barrera puesta, porque la funda también le quita luz.'] }
          ] },
        { anim:'molar.pulir', corto:'Ajusta oclusión y pule', hacer:'Retira el aislamiento, ajusta la oclusión contra el registro del paso 01 y pule.',
          listo:'Terminaste cuando el diente contacta como antes, el paciente no siente nada raro al morder y la superficie brilla sin enganchar el explorador en el margen.',
          porque:['El ajuste se hace sin dique: con el dique puesto la mordida no es la real.','Aquí sirve el registro del paso 01. Sin él comparas contra tu memoria, y la memoria de hace 40 minutos con un paciente anestesiado no sirve.','Un metaanálisis de 12 estudios con al menos 5 años de seguimiento encontró que las causas principales de fracaso son la caries secundaria y la fractura. El riesgo sube en pacientes con alto riesgo de caries y con más superficies restauradas. Una clase I tiene una sola superficie: es la de mejor pronóstico.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · metaanálisis de datos individuales de estudios clínicos', cita:'Opdam NJ, van de Sande FH, Bronkhorst E, Cenci MS, Bottenberg P, Pallesen U, et al. Longevity of posterior composite restorations: a systematic review and meta-analysis. J Dent Res. 2014;93(10):943-9.', loc:'12 estudios, 5 años o más · caries y fractura como causas principales · más riesgo con alto riesgo de caries y más superficies · DOI 10.1177/0022034514544217 · PMID 25048250 · localizador de párrafo pendiente' }
            ] },
            { titulo:'cuánto dura esto en realidad', parrafos:['Si el paciente sigue con alto riesgo de caries, una resina perfecta va a fallar igual. Controlar el riesgo de caries es parte del tratamiento, no un extra.'] }
          ] }
      ]
    },

    'exodoncia-18': {
      esp:'Cirugía bucal',
      pdf:'protocolo-exodoncia-tercer-molar-superior-v0.2.pdf',
      titulo:'Exodoncia simple de tercer molar superior erupcionado (1.8 / 2.8)',
      bandera:'BORRADOR · NUEVE FUENTES VERIFICADAS · SIN REVISIÓN DE ESPECIALISTA',
      tags:['Tercer molar superior','1.8 y 2.8','Erupcionado','v0.2 · borrador','2 pasos críticos'],
      alcance:'exodoncia simple de un tercer molar superior erupcionado, derecho o izquierdo, en paciente sano, sin infección activa y sin necesidad de colgajo ni ostectomía. No cubre dientes incluidos o semiincluidos, ni exodoncia quirúrgica.',
      bandeja:[
        { fase:'Previo', items:['Consentimiento informado de cirugía firmado','Radiografía del diente a la vista','Clorhexidina para enjuague y para piel perioral'] },
        { fase:'Anestesia', items:['Jeringa carpule y agujas cortas','Lidocaína al 2 % con epinefrina 1:100.000, al menos 4 tubos disponibles'] },
        { fase:'Campo', items:['Campo estéril, gasas y aspiración quirúrgica','Lámpara orientada al sector posterior'] },
        { fase:'Exodoncia', items:['Sonda o sindesmótomo','Elevador recto mediano','Fórceps para molar superior','Cureta de Lucas y lima de hueso','Jeringa con suero fisiológico'] },
        { fase:'Cierre', items:['Gasas para compresión','Sutura por si hay que afrontar bordes','Indicaciones escritas impresas'] }
      ],
      evidencia:[
        { n:'01', grado:'Grado A · guía de agencia nacional', txt:'NICE: sin patología no hay indicación de extraer un tercer molar.' },
        { n:'02', grado:'Grado B · ensayo clínico', txt:'La clorhexidina antes de extraer baja la bacteriemia del 52 % al 27 %.' },
        { n:'03', grado:'Grado D · ficha técnica del fabricante', txt:'Lidocaína: máximo 7 mg/kg, sin pasar de 500 mg.' },
        { n:'06', grado:'Grado C · estudio retrospectivo', txt:'Fractura de tuberosidad en 18,1 % de 403 terceros molares superiores; sube con la edad y con raíces divergentes.' },
        { n:'08', grado:'Grado C · revisión sistemática', txt:'Comunicación al seno: menor de 5 mm, manejo conservador; mayor, cierre quirúrgico.' },
        { n:'10', grado:'Grado A · revisión Cochrane', txt:'Antibiótico preventivo: NNT 19 en terceros molares impactados. No se usa de rutina.' }
      ],
      nota:'Borrador v0.2. Rehace la v0.1 con el formato del master prompt y amplía el alcance al 2.8. Corrige tres cifras de la v0.1 que no se pudieron verificar: la frecuencia de fractura de tuberosidad (0,15–0,6 %), el resultado de 3 contra 8 fracturas del ensayo de técnica y la sensibilidad del 52 % de la maniobra de Valsalva. Las nueve fuentes están verificadas en PubMed o en DailyMed; faltan los localizadores de párrafo. Cuatro pasos quedan como práctica habitual. No usar en pacientes hasta la revisión del panel de expertos.',
      pasos:[
        { corto:'Confirma indicación y radiografía', hacer:'Confirma la indicación y mira la radiografía antes de anestesiar.',
          listo:'Terminaste cuando tienes por escrito la patología que justifica la exodoncia y viste en la radiografía la forma de las raíces y su relación con el seno maxilar.',
          porque:['La guía NICE es clara: no se extrae un tercer molar sano «por si acaso». Hace falta una razón concreta, como caries que no se puede restaurar, patología pulpar o periapical, infección, reabsorción o fractura. Un primer episodio de pericoronitis no basta, salvo que sea grave.','La radiografía te dice dos cosas que cambian la sesión. Primero, si las raíces son divergentes: en un estudio de 403 terceros molares superiores, las raíces divergentes o muy curvas se fracturaron con la tuberosidad en 30,7 % de los casos, contra 13,1 % con raíces convergentes. Segundo, qué tan cerca está el piso del seno maxilar.'],
          sub:[{ titulo:'ver fuentes', fuentes:[
            { grado:'Grado A · guía de agencia nacional', cita:'National Institute for Health and Care Excellence. Guidance on the extraction of wisdom teeth. NICE technology appraisal guidance TA1.', url:'https://www.nice.org.uk/guidance/ta1/chapter/1-Recommendations', loc:'Sección 1, Recomendaciones · localizador de párrafo pendiente' },
            { grado:'Grado C · estudio retrospectivo', cita:'Shmuly T, Winocur-Arias O, Kahn A, Findler M, Adam I. Maxillary tuberosity fractures following third molar extraction, prevalence, and risk factors. J Craniofac Surg. 2022;33(7):e708-e712.', loc:'403 terceros molares superiores · raíces divergentes 30,7 % contra convergentes 13,1 % · DOI 10.1097/SCS.0000000000008654 · PMID 35765135 · localizador de párrafo pendiente' }
          ] }] },
        { corto:'Enjuague y posición', hacer:'Haz que el paciente se enjuague con clorhexidina durante 1 minuto y ubícalo en decúbito supino.',
          listo:'Terminaste cuando completó el minuto de enjuague y el sillón quedó reclinado, con el maxilar superior a la vista sin que tengas que forzar la postura.',
          porque:['El enjuague baja la cantidad de bacterias que entran a la sangre al extraer. En un ensayo clínico, la clorhexidina al 0,2 % durante 1 minuto bajó la bacteriemia después de la exodoncia del 52,4 % al 27,1 %, comparada con agua.','La posición importa más de lo que parece: el tercer molar superior es el diente más posterior del maxilar. Si el paciente queda muy sentado, trabajas con la muñeca en un ángulo que te quita fuerza controlada justo al luxar.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · ensayo clínico aleatorizado', cita:'Ugwumba CU, Adeyemo WL, Odeniyi OM, Arotiba GT, Ogunsola FT. Preoperative administration of 0.2% chlorhexidine mouthrinse reduces the risk of bacteraemia associated with intra-alveolar tooth extraction. J Craniomaxillofac Surg. 2014;42(8):1783-8.', loc:'Bacteriemia 52,4 % con agua contra 27,1 % con clorhexidina al 0,2 % · DOI 10.1016/j.jcms.2014.06.015 · PMID 25028067 · localizador de párrafo pendiente' },
              { grado:'Grado B · metaanálisis de ensayos clínicos · población distinta', cita:'Teshome A. The efficacy of chlorhexidine gel in the prevention of alveolar osteitis after mandibular third molar extraction: a systematic review and meta-analysis. BMC Oral Health. 2017;17(1):82.', loc:'Gel de clorhexidina en el alveolo: RR 0,43 (IC 95 % 0,32–0,58) para alveolitis · DOI 10.1186/s12903-017-0376-3 · PMID 28526078 · localizador de párrafo pendiente' }
            ] },
            { titulo:'ojo con esta evidencia', parrafos:['El ensayo de la bacteriemia usó clorhexidina al 0,2 %. Si en tu clínica hay al 0,12 %, el efecto puede ser menor: no está medido.','El dato de la alveolitis es de otro escenario: gel puesto dentro del alveolo después de extraer, y en terceros molares inferiores, donde la alveolitis es mucho más frecuente. No se puede trasladar tal cual a un enjuague antes de extraer un tercer molar superior.'] }
          ] },
        { anim:'exo.anestesia', corto:'Anestesia vestibular y palatina', hacer:'Infiltra por vestibular y completa con una punción palatina. Empieza con un tubo y ten más a mano.',
          listo:'Terminaste cuando el paciente no siente dolor al presionar el surco vestibular con la sonda y la mucosa palatina vecina se ve isquémica.',
          porque:['El hueso del maxilar posterior es delgado y poroso, así que la anestesia infiltrativa vestibular difunde bien y no hace falta una técnica troncular. La punción palatina cubre la mucosa del paladar, que la vestibular no alcanza.','Cada tubo de lidocaína al 2 % trae 36 mg. La ficha técnica pone el techo en 7 mg por kilo, sin pasar de 500 mg: en un adulto de 60 kg son 420 mg, unos 11 tubos. Cuatro tubos quedan lejos del límite. Quedarse corto por miedo a la dosis es más frecuente que pasarse.'],
          sub:[{ titulo:'ver fuentes', fuentes:[
            { grado:'Grado D · ficha técnica del fabricante', cita:'Dentsply Pharmaceutical. Xylocaine Dental (lidocaine HCl and epinephrine) injection. Ficha técnica aprobada por la FDA, publicada en DailyMed.', url:'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=14b55cf9-f7cd-4bb4-a7c5-aba61abadef1', loc:'Dosificación en adultos: bajo 500 mg y nunca más de 7 mg/kg · localizador de párrafo pendiente' }
          ] }] },
        { corto:'Antisepsia y campo', marca:'sin evidencia',
          hacer:'Haz antisepsia de la piel perioral y arma el campo estéril con el instrumental en el orden en que lo vas a usar.',
          listo:'Terminaste cuando la piel perioral está tratada, el campo cubre y el instrumental está ordenado de izquierda a derecha según su uso.',
          sinEv:'Práctica habitual de asepsia quirúrgica, sin un estudio que la compare en exodoncia simple',
          porque:['El orden del instrumental no es manía: en el tercer molar superior el momento crítico dura segundos y no quieres buscar el fórceps con el elevador dentro de la boca.'] },
        { anim:'exo.sindesmotomia', corto:'Sindesmotomía completa', marca:'sin evidencia',
          hacer:'Separa la encía del cuello del diente con la sonda o el sindesmótomo, en todo el contorno.',
          listo:'Terminaste cuando el instrumento recorre el perímetro completo sin encontrar resistencia de tejido blando.',
          sinEv:'Práctica habitual, sin estudio que la compare con no hacerla',
          porque:['Separar la encía antes de luxar evita desgarrarla cuando el diente sale. Un desgarro en la zona de la tuberosidad sangra más de lo esperado y tapa la vista del alveolo.','En este diente hay una razón más: si sale arrastrando encía, la sangre tapa la primera señal de una comunicación con el seno.'],
          sub:[{ titulo:'dónde se equivoca la gente', parrafos:['Separar solo por vestibular porque es lo que se ve. Las caras palatina y distal son las que cuesta ver y las que se desgarran.'] }] },
        { anim:'exo.luxar', corto:'Luxa sosteniendo la tuberosidad', marca:'paso crítico',
          hacer:'Luxa con el elevador mientras sostienes la tuberosidad con los dedos de la otra mano.',
          listo:'Terminaste cuando el diente tiene movilidad clara y los dedos que sostienen la tuberosidad no sienten que el hueso se mueva junto con el diente.',
          porque:['La fractura de la tuberosidad es la complicación propia de este diente, y es más frecuente de lo que se enseña. En un estudio de 403 terceros molares superiores apareció en 18,1 %. El riesgo subió con la edad, un 3,1 % por año, y con las raíces divergentes.','La mano que sostiene es tu alarma. Si sientes que se mueve un bloque y no solo el diente, para. Esa diferencia solo se percibe con los dedos puestos ahí.','Un ensayo clínico con 100 pacientes comparó dos técnicas de extracción de terceros molares superiores: la técnica con apoyo y movimiento controlado tuvo menos fracturas de tuberosidad y de raíz.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado C · estudio retrospectivo', cita:'Shmuly T, Winocur-Arias O, Kahn A, Findler M, Adam I. Maxillary tuberosity fractures following third molar extraction, prevalence, and risk factors. J Craniofac Surg. 2022;33(7):e708-e712.', loc:'73 de 403 (18,1 %) · +3,1 % de riesgo por año de edad · DOI 10.1097/SCS.0000000000008654 · PMID 35765135 · localizador de párrafo pendiente' },
              { grado:'Grado B · ensayo clínico aleatorizado', cita:'Edward J, Aziz MA, Madhu Usha A, Narayanan JK. Comparing the efficiency of two different extraction techniques in removal of maxillary third molars: a randomized controlled trial. J Maxillofac Oral Surg. 2017;16(4):424-429.', loc:'100 pacientes · menos fracturas de tuberosidad y de raíz con la técnica nueva · DOI 10.1007/s12663-016-0935-1 · PMID 29038624 · localizador de párrafo pendiente' }
            ] },
            { titulo:'¿y si mi caso es otro?', arbol:[
              { q:'¿Se mueve solo el diente?', a:'Sigue con la luxación normal.' },
              { q:'¿Se mueve un bloque de hueso junto con el diente?', a:'Detente. No sigas luxando ni tomes el fórceps. Avisa al docente antes de cualquier otro movimiento.' },
              { q:'¿El paciente tiene más de 30 años o las raíces son divergentes?', a:'Riesgo mayor: luxa con más paciencia y menos fuerza, y avisa al docente antes de empezar.' }
            ] }
          ] },
        { anim:'exo.forceps', corto:'Prehensión y avulsión', marca:'sin evidencia',
          hacer:'Toma el diente con el fórceps y extráelo con un movimiento controlado hacia vestibular y oclusal.',
          listo:'Terminaste cuando el diente salió completo y comparaste sus raíces con la radiografía.',
          sinEv:'Sin estudio sobre la dirección del movimiento: fundamento anatómico y práctica habitual',
          porque:['Comparar el diente con la radiografía es la única forma de saber si quedó un ápice dentro. Hacerlo cuando el paciente ya se fue no sirve.','El movimiento va hacia vestibular porque la tabla vestibular del maxilar posterior es más delgada que la palatina. Forzar hacia palatino es empujar contra el hueso más grueso.'],
          sub:[{ titulo:'dónde se equivoca la gente', parrafos:['Botar el diente sin mirarlo. Si falta un tercio de raíz, quieres saberlo ahora.','Rotar un molar de tres raíces. La rotación sirve en dientes de una sola raíz cónica.'] }] },
        { anim:'exo.seno', corto:'Descarta comunicación al seno', marca:'paso que suele faltar',
          hacer:'Antes de soltar al paciente, mira el fondo del alveolo con buena luz y descarta una comunicación con el seno maxilar.',
          listo:'Terminaste cuando inspeccionaste el fondo del alveolo y, si hubo sospecha, estimaste el tamaño del defecto y avisaste al docente.',
          porque:['El piso del seno maxilar queda justo sobre las raíces de este diente. Si se abre una comunicación y nadie la ve, el paciente vuelve en unos días con paso de líquido a la nariz y una sinusitis.','La maniobra de Valsalva (soplar con la nariz tapada y mirar si burbujea el alveolo) se usa mucho, pero una prueba negativa no descarta una comunicación pequeña. Por eso manda la inspección con buena luz.','El tamaño decide qué hacer. Una revisión sistemática de 2025 resume que los defectos menores de 5 mm se manejaron de forma conservadora, y los mayores necesitaron cierre quirúrgico.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado C · revisión sistemática de series clínicas', cita:'Dipalma G, Inchingolo AM, Trilli I, Ferrante L, Noia AD, de Ruvo E, et al. Management of oro-antral communication: a systemic review of diagnostic and therapeutic strategies. Diagnostics (Basel). 2025;15(2):194.', loc:'Menor de 5 mm: manejo conservador · mayor de 5 mm: cierre quirúrgico · DOI 10.3390/diagnostics15020194 · PMID 39857078 · localizador de párrafo pendiente' }
            ] },
            { titulo:'¿y si mi caso es otro?', arbol:[
              { q:'¿No ves comunicación y el paciente no tiene síntomas?', a:'Sigue con el paso siguiente.' },
              { q:'¿Hay una comunicación menor de 5 mm?', a:'Manejo conservador: protege el coágulo, afronta los bordes si hace falta e indica no sonarse ni usar bombilla. Avisa igual al docente y agenda control.' },
              { q:'¿El defecto mide más de 5 mm?', a:'Necesita cierre quirúrgico con colgajo. Fuera del alcance de este protocolo: docente o derivación.' }
            ] }
          ] },
        { anim:'exo.hemostasia', corto:'Alveolo, irrigación y hemostasia', marca:'sin evidencia',
          hacer:'Revisa el alveolo, irriga suave con suero fisiológico y logra la hemostasia con compresión.',
          listo:'Terminaste cuando no quedan esquirlas ni bordes de hueso filosos al pasar el dedo, y el coágulo se mantiene al retirar la gasa a los 10 minutos.',
          sinEv:'Práctica habitual, sin estudio que la compare en exodoncia simple',
          porque:['Los bordes filosos duelen después y retrasan la cicatrización de la encía. Se revisan con el dedo, no con la vista.','La compresión basta en casi todas las exodoncias simples. Si a los 10 minutos sigue sangrando activo, ya no es un sangrado normal: avisa.'],
          sub:[{ titulo:'dónde se equivoca la gente', parrafos:['Irrigar fuerte hacia el fondo del alveolo. Si hay una comunicación pequeña, le mandas suero al seno.','Raspar el alveolo para que sangre. El coágulo se forma solo; el raspado agresivo daña el hueso que lo sostiene.'] }] },
        { corto:'Indicaciones y analgesia', hacer:'Da las indicaciones de palabra y por escrito, y receta analgesia. Sin antibiótico.',
          cond:'→ paciente sano, exodoncia simple, sin infección previa',
          listo:'Terminaste cuando el paciente te repite con sus palabras qué no debe hacer y lleva la receta en la mano.',
          porque:['El antibiótico no va de rutina. Una revisión Cochrane de 2021 calculó que hay que dar antibiótico a 19 personas sanas para evitar una infección después de extraer terceros molares impactados. Un tercer molar superior erupcionado, en un paciente sano, es un escenario de menor riesgo que ese.','Para el dolor, la evidencia más fuerte es para los antiinflamatorios: en cirugía de terceros molares, 400 mg de ibuprofeno alivian más que 1 g de paracetamol. Si tu pauta usa otro antiinflamatorio, respeta su dosis máxima y las contraindicaciones del paciente.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado A · revisión Cochrane · población distinta', cita:'Lodi G, Azzi L, Varoni EM, Pentenero M, Del Fabbro M, Carrassi A, et al. Antibiotics to prevent complications following tooth extractions. Cochrane Database Syst Rev. 2021;2(2):CD003811.', loc:'NNT 19 (IC 95 % 15–34) para evitar una infección tras extraer terceros molares impactados · certeza baja · DOI 10.1002/14651858.CD003811.pub3 · PMID 33624847 · localizador de párrafo pendiente' },
              { grado:'Grado A · revisión Cochrane · población distinta', cita:'Bailey E, Worthington H, Coulthard P. Ibuprofen and/or paracetamol (acetaminophen) for pain relief after surgical removal of lower wisdom teeth, a Cochrane systematic review. Br Dent J. 2014;216(8):451-5.', loc:'Ibuprofeno 400 mg superior a paracetamol 1 g: RR 1,47 (IC 95 % 1,28–1,69) · DOI 10.1038/sj.bdj.2014.330 · PMID 24762895 · localizador de párrafo pendiente' }
            ] },
            { titulo:'ojo con esta evidencia', parrafos:['Las dos revisiones estudian terceros molares inferiores o impactados, con cirugía. Una exodoncia simple de un superior erupcionado tiene menos dolor y menos riesgo de infección, así que las cifras sirven de techo, no de estimación exacta.'] },
            { titulo:'¿y si mi caso es otro?', arbol:[
              { q:'¿Paciente sano, exodoncia simple sin colgajo ni ostectomía?', a:'Sin antibiótico. Solo analgesia.' },
              { q:'¿Había infección activa antes de extraer?', a:'Ahí el antibiótico es tratamiento, no prevención. Decide el docente.' },
              { q:'¿El paciente tiene una enfermedad que aumenta el riesgo de infección?', a:'Las revisiones no estudiaron a estos pacientes. Decide el docente según la condición.' }
            ] }
          ] }
      ]
    },

    'pulpectomia-premolar': {
      esp:'Endodoncia',
      pdf:'protocolo-pulpectomia-premolar-superior-v0.1.pdf',
      titulo:'Biopulpectomía y necropulpectomía de primer premolar superior (1.4 / 2.4)',
      bandera:'BORRADOR · DIECISÉIS FUENTES VERIFICADAS · SIN REVISIÓN DE ESPECIALISTA',
      tags:['Primer premolar superior','Dos conductos','Pulpa vital o necrótica','v0.1 · borrador','2 pasos en disputa'],
      alcance:'tratamiento de conductos de un primer premolar superior, derecho o izquierdo, con dos conductos (vestibular y palatino), con pulpa vital (biopulpectomía) o necrótica (necropulpectomía), con instrumentación manual y técnica de step-back. No cubre retratamientos, dientes con tres raíces, conductos calcificados ni reabsorciones.',
      bandeja:[
        { fase:'Diagnóstico', items:['Espejo, sonda curva, sonda recta y sonda periodontal','Spray de frío y torundas','Papel de articular','Regla de endodoncia','Radiografías periapicales'] },
        { fase:'Acceso y aislamiento', items:['Fresa redonda de diamante de alta velocidad','Fresa redonda de carburo de baja velocidad','Fresa de punta inactiva (tipo Endo Z)','Dique, arco, perforador, portaclamp y clamps','Hilo dental para amarrar el clamp','Resina compuesta y adhesivo, si hay que reconstruir'] },
        { fase:'Preparación del conducto', items:['Fresas Gates Glidden','Limas K de primera y segunda serie','Topes de goma','Localizador apical con su asa labial y clip','Jeringas con aguja de irrigación y tope','Hipoclorito de sodio','Suero fisiológico','EDTA al 17 %','Clorhexidina al 2 %, si corresponde','Cánulas de aspiración y conos de papel estériles'] },
        { fase:'Entre sesiones', items:['Hidróxido de calcio con vehículo o en jeringa','Torundas de algodón estériles','Material de obturación provisional','Ionómero de vidrio'] },
        { fase:'Obturación y sellado', items:['Conos de gutapercha maestro y accesorios','Cemento sellador','Loseta y espátula','Espaciadores y atacadores','Fuente de calor para cortar la gutapercha','Alcohol y torundas'] }
      ],
      evidencia:[
        { n:'01', grado:'Grado B · metaanálisis de estudios diagnósticos', txt:'La prueba de frío distingue bien pulpa vital de no vital; el oxímetro de pulso, mejor.' },
        { n:'02', grado:'Grado B · revisión sistemática', txt:'El primer premolar superior tiene casi siempre dos raíces y dos conductos.' },
        { n:'06', grado:'Grado B · cohorte poblacional', txt:'Con dique de goma, menos dientes extraídos tras la endodoncia: HR 0,81.' },
        { n:'08', grado:'Grado B · revisión sistemática', txt:'Mejor resultado con obturación dentro de 2 mm del ápice, sin vacíos y con buena restauración coronaria.' },
        { n:'10', grado:'Grado B · metaanálisis de ensayos clínicos', txt:'Mantener la permeabilidad apical reduce el dolor después del tratamiento.' },
        { n:'11', grado:'Grado C · in vitro', txt:'Hipoclorito después de EDTA erosiona la dentina; hipoclorito con clorhexidina forma paracloroanilina.' },
        { n:'14', grado:'Grado B · metaanálisis', txt:'La calidad de la restauración coronaria pesa tanto como la de la obturación.' }
      ],
      nota:'Borrador v0.1, construido con la secuencia de un protocolo docente de box (material de clase, no publicado) y con evidencia buscada aparte. Dos medidas quedan en disputa porque el material de clase y un apunte de aula no coinciden: la longitud de trabajo (LRD − 1 mm o − 0,5 mm) y la lima de permeabilidad (LT + 1 mm o + 0,5 mm). Las concentraciones de hipoclorito que usa la escuela (2,25 % en necropulpectomía, 2,5 a 5,25 % en biopulpectomía) no tienen respaldo propio: un ensayo clínico no encontró diferencia de resultado entre 1 % y 5 %. Faltan los localizadores de párrafo. No usar en pacientes hasta la revisión del panel.',
      pasos:[
        { anim:'endo.frio', corto:'Diagnóstico pulpar y periapical', hacer:'Haz las pruebas de sensibilidad al frío, primero en dos o tres dientes control y después en el diente en estudio. Completa con percusión, palpación y sondaje.',
          listo:'Terminaste cuando tienes anotado el diagnóstico pulpar y el periapical, y sabes si es una biopulpectomía (pulpa vital) o una necropulpectomía (pulpa necrótica).',
          porque:['El diagnóstico decide todo lo que sigue: la longitud de trabajo, la irrigación y si se medica entre sesiones. Una biopulpectomía y una necropulpectomía se parecen en la técnica, pero no en el objetivo.','Los dientes control sirven para saber cómo responde ese paciente al frío. Así no confundes una respuesta débil normal con una pulpa enferma. Una revisión sistemática de 2022 encontró que la prueba de frío distingue razonablemente bien la pulpa vital de la no vital, aunque el oxímetro de pulso, que mide circulación y no nervio, lo hace mejor.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · metaanálisis de estudios diagnósticos', cita:'Patro S, Meto A, Mohanty A, Chopra V, Miglani S, Das A, et al. Diagnostic accuracy of pulp vitality tests and pulp sensibility tests for assessing pulpal health in permanent teeth: a systematic review and meta-analysis. Int J Environ Res Public Health. 2022;19(15):9599.', loc:'Odds ratio diagnóstico: frío 17,24; eléctrica 10,75; calor 3,47; oxímetro de pulso 628,5 · DOI 10.3390/ijerph19159599 · PMID 35954958 · localizador de párrafo pendiente' }
            ] },
            { titulo:'¿y si mi caso es otro?', arbol:[
              { q:'¿El diente responde al frío con dolor intenso que se queda?', a:'Pulpa vital con pulpitis irreversible: biopulpectomía.' },
              { q:'¿El diente no responde al frío y los dientes control sí?', a:'Pulpa probablemente necrótica: necropulpectomía. Confirma con la radiografía y el resto del examen.' },
              { q:'¿El diente ya tiene una endodoncia?', a:'Es un retratamiento. Fuera del alcance de este protocolo.' },
              { q:'¿Responde igual que los dientes control y no hay otros signos?', a:'No hay indicación de endodoncia. Revisa el diagnóstico con el docente.' }
            ] },
            { titulo:'dónde se equivoca la gente', parrafos:['Probar primero el diente sospechoso. El paciente se asusta y después responde mal en los dientes control.','Medir la movilidad con los dedos. Se toma el diente entre los extremos romos de dos instrumentos.'] }
          ] },
        { anim:'endo.rx', corto:'Radiografía y cálculos previos', hacer:'En la radiografía mide la longitud aparente del diente (LAD), marca sus dos tercios y mide la distancia desde tu referencia coronal hasta el techo de la cámara.',
          listo:'Terminaste cuando tienes anotados la LAD, los 2/3 de la LAD y la distancia al techo de la cámara, y sabes cuántas raíces ves.',
          porque:['Los 2/3 de la LAD son el tope de las fresas Gates Glidden y de la aguja de irrigación. La distancia al techo de la cámara te avisa si te estás desviando: si ya pasaste esa medida y no llegaste a la cámara, detente y reorienta.','El primer premolar superior casi siempre tiene dos raíces y dos conductos, uno vestibular y uno palatino. Una revisión sistemática de 2025 lo confirma, aunque hay variantes de una raíz y, rara vez, de tres. Si en la radiografía ves algo distinto, no es este protocolo.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · revisión sistemática de estudios anatómicos', cita:'Wolf TG, Ulugöl DS, Wierichs RJ, Holtkamp AKM, Spagnuolo G, Donnermeyer D, et al. Maxillary first premolars internal morphology: a systematic review and meta-analysis. Dent J (Basel). 2025;13(11):510.', loc:'Predominan dos raíces y configuración 2-2-2/2 (tipo IV); tres raíces entre 0,4 y 6,5 % · DOI 10.3390/dj13110510 · PMID 41294491 · localizador de párrafo pendiente' }
            ] }
          ] },
        { anim:'endo.preparar', corto:'Prepara el diente antes de entrar', marca:'sin evidencia',
          hacer:'Elimina la caries y las restauraciones defectuosas, y reconstruye las paredes que falten con resina compuesta.',
          listo:'Terminaste cuando el diente tiene cuatro paredes firmes que permiten poner el clamp y mantener sellada la cámara entre sesiones.',
          sinEv:'Práctica habitual, sin un ensayo que compare reconstruir antes con no hacerlo',
          porque:['Sin paredes, el dique filtra y el irrigante y la saliva se mezclan. Y entre sesiones no hay dónde sostener el sellado provisional.','También es el momento de mirar al paciente completo: con gingivitis, periodontitis o muchas caries activas, la carga de bacterias es alta y el pronóstico empeora. Eso se trata antes o en paralelo.'] },
        { anim:'endo.acceso', corto:'Anestesia y cavidad de acceso', hacer:'Anestesia. Entra por el tercio del surco hacia la cúspide vestibular con fresa de diamante perpendicular a la superficie y, al llegar a dentina, sigue con carburo de baja velocidad paralelo al eje del diente.',
          listo:'Terminaste cuando la cavidad es ovoide en sentido vestíbulo-palatino, ves las dos entradas de los conductos y los instrumentos entran en línea recta.',
          porque:['El premolar superior es angosto de mesial a distal y ancho de vestibular a palatino. Por eso el acceso es ovoide en ese sentido, y por eso es fácil perforar hacia mesial o distal si pierdes el eje.','Krasner y Rankow describieron, tras estudiar 500 cámaras pulpares, reglas para ubicar la cámara y las entradas de los conductos: la cámara está centrada a la altura del límite amelocementario, sus paredes siguen la forma externa del diente y el piso es más oscuro que las paredes. Te sirven para no perder el eje.','La fresa de punta inactiva desgasta las paredes sin tocar el piso, así no borras las entradas de los conductos.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado C · estudio anatómico en dientes extraídos', cita:'Krasner P, Rankow HJ. Anatomy of the pulp-chamber floor. J Endod. 2004;30(1):5-16.', loc:'500 cámaras pulpares · leyes para ubicar la cámara y las entradas de los conductos · DOI 10.1097/00004770-200401000-00002 · PMID 14760900 · localizador de párrafo pendiente' }
            ] },
            { titulo:'dónde se equivoca la gente', parrafos:['Esperar la «sensación de caída» al llegar a la cámara. Solo aparece en cámaras altas; en las estrechas no la vas a sentir.','Rebajar el piso con una fresa de punta activa y perder las entradas de los conductos.'] }
          ] },
        { anim:'endo.dique', corto:'Aislamiento absoluto', marca:'paso crítico',
          hacer:'Instala el dique de goma y amarra el clamp al arco con hilo dental. Desinfecta el campo. Nunca dejes algodón bajo el dique.',
          listo:'Terminaste cuando el dique sella alrededor del diente, el clamp está amarrado y no hay algodón entre el dique y la encía.',
          porque:['El dique impide que la saliva contamine el conducto y que el paciente trague un instrumento o el irrigante. Las guías de calidad de la Sociedad Europea de Endodoncia lo consideran obligatorio en todo tratamiento de conductos.','Y tiene un efecto que se puede medir: en un estudio con más de 500.000 dientes tratados, los que se trataron con dique tuvieron menos riesgo de terminar extraídos (HR 0,81; IC 95 % 0,79–0,84).','El algodón bajo el dique es peligroso: si el dique filtra, el algodón se empapa en hipoclorito y quema la mucosa. Sin algodón, una filtración solo da mal sabor y el paciente avisa.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado D · consenso de sociedad científica', cita:'European Society of Endodontology. Quality guidelines for endodontic treatment: consensus report of the European Society of Endodontology. Int Endod J. 2006;39(12):921-30.', loc:'Aislamiento con dique de goma en todo tratamiento · DOI 10.1111/j.1365-2591.2006.01180.x · PMID 17180780 · localizador de párrafo pendiente' },
              { grado:'Grado B · cohorte poblacional', cita:'Lin PY, Huang SH, Chang HJ, Chi LY. The effect of rubber dam usage on the survival rate of teeth receiving initial root canal treatment: a nationwide population-based study. J Endod. 2014;40(11):1733-7.', loc:'517.234 dientes · supervivencia 90,3 % con dique contra 88,8 % sin dique · HR 0,81 (IC 95 % 0,79–0,84) · DOI 10.1016/j.joen.2014.07.007 · PMID 25175849 · localizador de párrafo pendiente' }
            ] },
            { titulo:'dónde se equivoca la gente', parrafos:['Dejar una torunda bajo el dique «para que no filtre». Es exactamente lo que convierte una filtración en una quemadura química.','No amarrar el clamp. Si se suelta, el hilo evita que el paciente se lo trague.'] }
          ] },
        { anim:'endo.tercios', corto:'Prepara los tercios cervical y medio', hacer:'Explora con una lima #10 hasta los 2/3 de la LAD e irriga. Después ensancha los tercios cervical y medio con fresas Gates Glidden, sin pasar de los 2/3 de la LAD.',
          cond:'→ secuencia 1-2-1 si el conducto es fino o medio, 3-2-1 si es amplio',
          listo:'Terminaste cuando las Gates entraron hasta los 2/3 de la LAD sin forzarlas, como máximo tres veces cada una, irrigando entre cada cambio.',
          porque:['Los tercios cervical y medio son los que tienen más bacterias. Si los limpias primero, no las arrastras hacia el ápice cuando llegues con las limas.','Además, abrir el tercio cervical antes de medir mejora la medición: en un ensayo en conductos curvos, la lima llegó más cerca de la longitud real cuando se ensanchó primero la parte coronal.','Las Gates no se fuerzan. Forzarlas deja escalones, desgasta de más y debilita la raíz.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · ensayo clínico · población distinta', cita:'Iqbal A, Akbar I, Al-Omiri MK. An in vivo study to determine the effects of early preflaring on the working length in curved mesial canals of mandibular molars. J Contemp Dent Pract. 2013;14(2):163-7.', loc:'La lima quedó más cerca de la longitud real con preensanchado coronal · DOI 10.5005/jp-journals-10024-1293 · PMID 23811639 · localizador de párrafo pendiente' }
            ] },
            { titulo:'ojo con esta evidencia', parrafos:['El ensayo es en conductos mesiales curvos de molares inferiores, no en premolares superiores. El principio es el mismo, pero el tamaño del efecto en este diente no está medido. Población distinta.'] },
            { titulo:'dónde se equivoca la gente', parrafos:['Meter la Gates sin probar antes, fuera de la boca, que gira centrada. Una Gates doblada gira en hélice y daña la pared.','Seguir empujando cuando la Gates no baja. Si no entra a los 2/3, no se empuja.'] }
          ] },
        { anim:'endo.localizador', corto:'Mide la longitud con el localizador', marca:'en disputa',
          disputa:'El protocolo docente usa LT = LRD − 1 mm y un apunte de aula usa LRD − 0,5 mm. Pendiente de resolución por el panel.',
          hacer:'Con el conducto húmedo y la cámara seca, lleva una lima K10 o K15 con el localizador hasta «0.0», ajusta el tope y mide. Repite para confirmar. Resta 1 mm y toma la radiografía de conductometría.',
          listo:'Terminaste cuando tienes la longitud real (LRD) y la longitud de trabajo (LT) de cada conducto anotadas por separado, confirmadas con una segunda lectura y con la radiografía.',
          porque:['El localizador detecta el paso de la pulpa al ligamento, que está muy cerca de la constricción apical. Una revisión sistemática concluye que el método electrónico mide mejor que la radiografía sola y reduce la radiación.','La radiografía igual se toma: confirma la lima en el conducto correcto y detecta errores del localizador. Juntos dan la medida más segura.','Una revisión de los factores que cambian el resultado de una endodoncia encontró que la obturación que termina dentro de los 2 mm del ápice radiográfico se asocia a mejor resultado. Tanto − 1 mm como − 0,5 mm caen en ese rango.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · revisión sistemática de estudios clínicos', cita:'Martins JN, Marques D, Mata A, Caramês J. Clinical efficacy of electronic apex locators: systematic review. J Endod. 2014;40(6):759-77.', loc:'El método electrónico mide mejor y reduce la radiación; evidencia corta y con riesgo de sesgo · DOI 10.1016/j.joen.2014.03.011 · PMID 24862702 · localizador de párrafo pendiente' },
              { grado:'Grado B · revisión sistemática', cita:'Ng YL, Mann V, Rahbaran S, Lewsey J, Gulabivala K. Outcome of primary root canal treatment: systematic review of the literature -- Part 2. Influence of clinical factors. Int Endod J. 2008;41(1):6-31.', loc:'Mejor resultado con obturación dentro de 2 mm del ápice radiográfico · DOI 10.1111/j.1365-2591.2007.01323.x · PMID 17931388 · localizador de párrafo pendiente' }
            ] },
            { titulo:'dónde no hay acuerdo', parrafos:['Lo que usa el protocolo docente: longitud de trabajo igual a la longitud real menos 1 mm.','Lo que usa un apunte de aula: menos 0,5 mm.','Lo que dice la evidencia: terminar dentro de los 2 mm del ápice se asocia a mejor resultado, y las dos medidas caen ahí. Ninguna fuente que encontramos decide entre 1 y 0,5 mm. Mientras el panel resuelve, Criterium usa − 1 mm y lo marca en disputa.'] },
            { titulo:'¿y si mi caso es otro?', arbol:[
              { q:'¿El paciente usa marcapasos?', a:'No uses el localizador. Mide con radiografía y avisa al docente.' },
              { q:'¿El localizador no marca o salta de lectura?', a:'Revisa que la cámara esté seca y el conducto húmedo, y que el conducto esté permeable. Si sigue, mide con radiografía.' }
            ] }
          ] },
        { anim:'endo.irrigar', corto:'Irriga durante toda la preparación', hacer:'Irriga con hipoclorito de sodio durante toda la preparación, con la aguja precurvada y con tope a 2/3 de la LT, sin trabar la aguja ni empujar fuerte. Aspira de forma continua.',
          cond:'→ concentración según el protocolo de tu clínica: la evidencia no muestra diferencia entre 1 % y 5 %',
          listo:'Terminaste cuando irrigaste entre cada lima, la aguja nunca quedó trabada en el conducto y el irrigante siempre volvió hacia la cámara.',
          porque:['El hipoclorito disuelve tejido y mata bacterias. Las limas solas no llegan a todas las paredes: el irrigante limpia donde la lima no toca.','La concentración pesa menos de lo que se cree. En un ensayo con 100 molares con necrosis y lesión apical, irrigar al 5 % o al 1 % dio la misma cicatrización (81,4 % contra 72,1 %, sin diferencia significativa).','Lo que no se discute es la seguridad: el irrigante entra y sale del conducto, nunca se inyecta hacia el periápice. Por eso la aguja va con tope y nunca trabada.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · ensayo clínico aleatorizado · población distinta', cita:'Verma N, Sangwan P, Tewari S, Duhan J. Effect of different concentrations of sodium hypochlorite on outcome of primary root canal treatment: a randomized controlled trial. J Endod. 2019;45(4):357-363.', loc:'100 molares con necrosis · cicatrización 81,4 % (5 %) contra 72,1 % (1 %), sin diferencia significativa · DOI 10.1016/j.joen.2019.01.003 · PMID 30827769 · localizador de párrafo pendiente' }
            ] },
            { titulo:'ojo con esta evidencia', parrafos:['El ensayo es en molares inferiores con necrosis, no en premolares superiores ni en biopulpectomía. Población distinta: sugiere que la concentración no es decisiva, pero no reemplaza la indicación de tu docente.'] }
          ] },
        { anim:'endo.apical', corto:'Instrumenta el tercio apical', hacer:'Define la lima inicial (la primera que llega a la LT con leve retención). Amplía 4 o 5 limas sobre ella, con entrada pasiva y salida activa, hasta una lima maestra de al menos #30. Pasa una lima fina de permeabilidad entre cada lima.',
          listo:'Terminaste cuando tienes anotadas la lima inicial y la lima maestra de cada conducto, la LT se mantiene y la lima de permeabilidad pasa sin resistencia.',
          porque:['Entrar cortando empuja limalla hacia el ápice y forma un tapón que bloquea el conducto. Por eso la lima entra pasiva y corta al salir.','La lima de permeabilidad es una lima fina que pasa apenas más allá de la LT, sin cortar, solo para mantener limpio el final del conducto. Un metaanálisis de 2024 encontró menos dolor después del tratamiento cuando se mantiene la permeabilidad (OR 0,59 para dolor a las 24 horas).'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · metaanálisis de ensayos clínicos', cita:'Xiqian L, Ying Z, Mian M. The effect of apical patency on postoperative pain following endodontic therapy: a systematic review and meta-analysis. Eur J Oral Sci. 2024;132(3):e12986.', loc:'Menos dolor con permeabilidad: OR 0,59 a las 24 horas · certeza baja a moderada · DOI 10.1111/eos.12986 · PMID 38632110 · localizador de párrafo pendiente' }
            ] },
            { titulo:'dónde no hay acuerdo', parrafos:['Hasta dónde pasa la lima de permeabilidad: el protocolo docente la lleva a LT + 1 mm y un apunte de aula a LT + 0,5 mm.','La evidencia apoya mantener la permeabilidad, pero no fija la distancia. Pregunta a tu docente cuál usa antes de la sesión.'] },
            { titulo:'dónde se equivoca la gente', parrafos:['Precurvar limas de calibre mayor que 25. Sobre ese calibre ya no se precurvan.','Usar la lima de permeabilidad para cortar. Solo limpia; si corta, agranda el foramen.'] }
          ] },
        { anim:'endo.stepback', corto:'Escalona con recapitulación (step-back)', hacer:'Lleva la lima siguiente a LT − 1 mm, después a − 2 mm y a − 3 mm, y sigue hasta empalmar con el tercio medio. Entre cada lima: irriga, recapitula con la lima maestra a LT, irriga, pasa la lima de permeabilidad e irriga.',
          cond:'→ completo en el conducto vestibular y después, desde el principio, en el palatino',
          listo:'Terminaste cuando el escalonado llegó al menos a una lima #50 a la altura de los 2/3 de la LAD y la lima maestra sigue llegando a LT.',
          sinEv:'Técnica docente de instrumentación manual; no encontramos un ensayo que compare la recapitulación con no hacerla',
          porque:['Cada lima que escalona deja limalla en apical. Volver con la lima maestra a LT la saca antes de que se compacte. Si te saltas la recapitulación formas un tapón y pierdes la longitud de trabajo.','Se llega al menos a #50 porque ese es el diámetro de la primera Gates. Así el step-back empalma con lo que ya preparaste arriba y la conicidad queda continua, sin escalón.'],
          sub:[{ titulo:'dónde se equivoca la gente', parrafos:['Saltarse la recapitulación «porque la lima maestra ya llegó». Es justo cuando se forma el tapón.','Quedarse corto con el escalonado y dejar un escalón entre el tercio apical y el medio.'] }] },
        { anim:'endo.irrigacionfinal', corto:'Irrigación final', hacer:'Irriga en este orden: hipoclorito, suero fisiológico, EDTA al 17 % durante 1 minuto y suero fisiológico. Si usas clorhexidina, va al final, después del suero.',
          listo:'Terminaste cuando hiciste la secuencia completa en cada conducto, sin hipoclorito directo después del EDTA, y secaste con conos de papel.',
          porque:['El EDTA retira la capa de barro dentinario que dejan las limas. Pero el hipoclorito justo después del EDTA erosiona la dentina: en laboratorio, esa secuencia agrandó la entrada de los túbulos en más de 100 %. Por eso va suero entre medio.','Nunca mezcles hipoclorito con clorhexidina. Forman un precipitado café que contiene paracloroanilina. Si vas a usar clorhexidina, lava antes el hipoclorito con suero.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado C · estudio in vitro', cita:'Qian W, Shen Y, Haapasalo M. Quantitative analysis of the effect of irrigant solution sequences on dentin erosion. J Endod. 2011;37(10):1437-41.', loc:'Hipoclorito después de EDTA: erosión marcada y más de 100 % de aumento en el área de los túbulos · DOI 10.1016/j.joen.2011.06.005 · PMID 21924198 · localizador de párrafo pendiente' },
              { grado:'Grado C · estudio in vitro', cita:'Basrani BR, Manek S, Sodhi RN, Fillery E, Manzur A. Interaction between sodium hypochlorite and chlorhexidine gluconate. J Endod. 2007;33(8):966-9.', loc:'Precipitado con paracloroanilina desde 0,19 % de hipoclorito · retirar el hipoclorito antes de la clorhexidina · DOI 10.1016/j.joen.2007.04.001 · PMID 17878084 · localizador de párrafo pendiente' }
            ] },
            { titulo:'dónde se equivoca la gente', parrafos:['Saltarse el suero entre el EDTA y el hipoclorito porque «es solo agua».','Pasar de hipoclorito a clorhexidina directo y ver aparecer el precipitado café dentro del conducto.'] }
          ] },
        { anim:'endo.medicacion', corto:'Medica si no terminas hoy', hacer:'Si el tratamiento sigue en otra sesión, lleva hidróxido de calcio hasta LT − 1 o − 2 mm, girando la lima en sentido antihorario o con jeringa. Sella con torunda estéril, 2 mm de obturación provisional e ionómero encima.',
          cond:'→ solo si el tratamiento no se completa en una sesión',
          listo:'Terminaste cuando el conducto está lleno de hidróxido de calcio, el sellado provisional es doble y el paciente sabe que debe avisar si se le cae.',
          porque:['Entre sesiones el conducto no puede quedar vacío ni abierto. Un metaanálisis de 2022 encontró que el hidróxido de calcio reduce el dolor a las 24 horas comparado con no medicar.','Hacerlo en una o en dos sesiones da resultados parecidos: una revisión Cochrane de 2022 no encontró que una forma sea más eficaz que la otra. Lo que sí cambia es el dolor de la primera semana, algo más frecuente en una sola sesión.','El giro antihorario deposita la pasta. En horario, la lima la arrastra hacia afuera.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · metaanálisis de ensayos clínicos', cita:'Ahmad MZ, Sadaf D, Merdad KA, Almohaimeed A, Onakpoya IJ. Calcium hydroxide as an intracanal medication for postoperative pain during primary root canal therapy: a systematic review and meta-analysis with trial sequential analysis of randomised controlled trials. J Evid Based Dent Pract. 2022;22(1):101680.', loc:'Menos dolor a las 24 horas que sin medicación (4 ensayos, 226 pacientes) · evidencia limitada · DOI 10.1016/j.jebdp.2021.101680 · PMID 35219466 · localizador de párrafo pendiente' },
              { grado:'Grado A · revisión Cochrane', cita:'Mergoni G, Ganim M, Lodi G, Figini L, Gagliani M, Manfredi M. Single versus multiple visits for endodontic treatment of permanent teeth. Cochrane Database Syst Rev. 2022;12(12):CD005296.', loc:'Sin diferencia de eficacia entre una y varias sesiones · más dolor la primera semana en una sesión (RR 1,55) · DOI 10.1002/14651858.CD005296.pub4 · PMID 36512807 · localizador de párrafo pendiente' }
            ] },
            { titulo:'¿y si mi caso es otro?', arbol:[
              { q:'¿Es una necropulpectomía que sigue en otra sesión?', a:'Medica con hidróxido de calcio y doble sellado.' },
              { q:'¿Es una biopulpectomía que sigue en otra sesión?', a:'Según el protocolo docente, el conducto puede quedar solo húmedo con hipoclorito. Confírmalo con tu docente.' },
              { q:'¿Terminas en esta sesión?', a:'No medicas. Pasa a la conometría.' }
            ] }
          ] },
        { anim:'endo.obturar', corto:'Conometría y obturación', hacer:'Elige un cono maestro que llegue a la LT con retención en los últimos 2 a 3 mm y confírmalo con radiografía. Cementa con sellador, compacta lateralmente con al menos tres conos accesorios y toma la radiografía de control.',
          listo:'Terminaste cuando la radiografía muestra el conducto lleno hasta la LT, sin espacios vacíos y sin material pasado del ápice.',
          porque:['Una revisión de los factores del resultado encontró que la obturación sin vacíos y dentro de los 2 mm del ápice se asocia a mejor cicatrización.','La técnica de condensación lateral en frío sigue siendo válida: en un metaanálisis de 2026 tuvo más éxito que el cono único en el corto plazo, y después de 3 años no hubo diferencia entre las técnicas.','Pasar gutapercha más allá del ápice provoca una reacción a cuerpo extraño. Si la radiografía muestra vacíos, sigue compactando.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · revisión sistemática', cita:'Ng YL, Mann V, Rahbaran S, Lewsey J, Gulabivala K. Outcome of primary root canal treatment: systematic review of the literature -- Part 2. Influence of clinical factors. Int Endod J. 2008;41(1):6-31.', loc:'Obturación sin vacíos y dentro de 2 mm del ápice radiográfico · DOI 10.1111/j.1365-2591.2007.01323.x · PMID 17931388 · localizador de párrafo pendiente' },
              { grado:'Grado B · metaanálisis de estudios clínicos', cita:'Mushtaq A, Alsanafi S, Elmsmari F, González JA, Garcia-Font M, Abella Sans F, et al. Effect of root canal filling techniques and materials on endodontic treatment outcomes: a systematic review and meta-analysis. Sci Rep. 2026;16(1).', loc:'Condensación lateral en frío: 5 % más de éxito que cono único a corto plazo; sin diferencias después de 3 años · DOI 10.1038/s41598-026-37936-7 · PMID 41872366 · localizador de párrafo pendiente' }
            ] }
          ] },
        { anim:'endo.sellar', corto:'Sella la corona y rehabilita pronto', marca:'paso que suele faltar',
          hacer:'Corta la gutapercha 1 mm bajo el cuello, limpia la cámara con alcohol y haz el doble sellado coronario. Ajusta la oclusión, da las indicaciones y deja agendada la rehabilitación definitiva.',
          listo:'Terminaste cuando el sellado coronario está completo, la oclusión ajustada y la cita de rehabilitación quedó agendada en ese momento.',
          porque:['Una endodoncia bien hecha fracasa igual si la corona filtra. Un metaanálisis encontró que la probabilidad de que sane la lesión apical sube tanto con una buena endodoncia como con una buena restauración coronaria, y que una buena endodoncia con mala restauración no rinde más que lo contrario.','Por eso la cita de rehabilitación se agenda ahí mismo y no se deja en manos del paciente.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · metaanálisis', cita:'Gillen BM, Looney SW, Gu LS, Loushine BA, Weller RN, Loushine RJ, et al. Impact of the quality of coronal restoration versus the quality of root canal fillings on success of root canal treatment: a systematic review and meta-analysis. J Endod. 2011;37(7):895-902.', loc:'La cicatrización mejora con buena endodoncia y con buena restauración; ninguna compensa a la otra · DOI 10.1016/j.joen.2011.04.002 · PMID 21689541 · localizador de párrafo pendiente' }
            ] },
            { titulo:'dónde se equivoca la gente', parrafos:['Dejar el diente meses con el provisional. La filtración coronaria arruina una obturación correcta.','Delegar el control en el paciente. Si no queda agendado, no vuelve.'] }
          ] }
      ]
    },

    'sellantes-ninos': {
      esp:'Odontopediatría',
      pdf:'protocolo-sellantes-ninos-v0.1.pdf',
      titulo:'Sellantes de fosas y fisuras en niños: resina o ionómero de vidrio',
      bandera:'BORRADOR · SIETE FUENTES VERIFICADAS · SIN REVISIÓN DE ESPECIALISTA',
      tags:['Molares permanentes','Niños y adolescentes','Resina o ionómero','v0.1 · borrador','1 paso en disputa'],
      alcance:'sellado de fosas y fisuras oclusales de molares permanentes sanos o con lesiones no cavitadas, en niños y adolescentes, con sellante de resina o de ionómero de vidrio. No cubre lesiones cavitadas (esas se restauran), sellantes en dientes temporales ni sellado de superficies lisas.',
      bandeja:[
        { fase:'Diagnóstico', items:['Espejo, sonda de punta roma y pinza','Jeringa triple','Cepillo dental o escobilla para limpiar la superficie'] },
        { fase:'Aislamiento', items:['Dique de goma con arco y clamp, o rollos de algodón y eyector','Aspiración'] },
        { fase:'Rama resina', items:['Ácido fosfórico al 37 %','Adhesivo de grabado y lavado','Sellante de resina con su aplicador','Microaplicadores','Lámpara de fotopolimerización','Lentes de protección naranjas'] },
        { fase:'Rama ionómero', items:['Ionómero de vidrio para sellar y su acondicionador','Instrumento de aplicación','Vaselina o barniz protector'] },
        { fase:'Control', items:['Papel de articular','Fresa de terminación para excesos','Ficha con fecha del próximo control'] }
      ],
      evidencia:[
        { n:'01', grado:'Grado A · guía de práctica clínica', txt:'Los sellantes previenen y detienen caries oclusales en niños y adolescentes.' },
        { n:'01', grado:'Grado A · revisión Cochrane', txt:'Sellantes de resina: entre 11 y 51 % menos caries a 24 meses que sin sellante.' },
        { n:'03', grado:'Grado B · revisión de ensayos', txt:'Limpiar con cepillo retiene igual que la profilaxis con pasta y contraángulo.' },
        { n:'04', grado:'Grado B · metaanálisis', txt:'Con dique, más retención a 12 meses que con rollos de algodón.' },
        { n:'06', grado:'Grado B · metaanálisis', txt:'Adhesivo bajo el sellante: más retención (OR 3,29).' },
        { n:'02', grado:'Grado B · metaanálisis', txt:'Ionómero y resina previenen caries igual; la resina se retiene mucho más.' }
      ],
      nota:'Borrador v0.1, construido solo con literatura. La guía conjunta de las asociaciones dental y de odontopediatría de Estados Unidos no recomienda un material sobre otro por falta de evidencia, así que la elección entre resina e ionómero queda como árbol de decisión. Faltan los localizadores de párrafo. No usar en pacientes hasta la revisión del panel.',
      pasos:[
        { anim:'fisura.revisar', corto:'Decide si el diente se sella', hacer:'Revisa la superficie oclusal limpia y seca, y decide si está sana o tiene una lesión no cavitada que se pueda sellar.',
          listo:'Terminaste cuando anotaste en la ficha qué molares se sellan y por qué, y descartaste cavidades que necesitan restauración.',
          porque:['El sellante es una barrera que tapa las fisuras donde se acumula la placa. Una revisión Cochrane encontró que los sellantes de resina reducen la caries entre 11 y 51 % a los 24 meses, comparados con no sellar.','La guía de práctica clínica de las asociaciones dental y de odontopediatría de Estados Unidos agrega que el sellante también puede frenar una lesión no cavitada. Pero si ya hay cavidad, no es un sellante: es una restauración.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado A · guía de práctica clínica', cita:'Wright JT, Crall JJ, Fontana M, Gillette EJ, Nový BB, Dhar V, et al. Evidence-based clinical practice guideline for the use of pit-and-fissure sealants: a report of the American Dental Association and the American Academy of Pediatric Dentistry. J Am Dent Assoc. 2016;147(8):672-682.e12.', loc:'Los sellantes previenen y detienen lesiones oclusales y frenan las no cavitadas · DOI 10.1016/j.adaj.2016.06.001 · PMID 27470525 · localizador de párrafo pendiente' },
              { grado:'Grado A · revisión Cochrane', cita:'Ahovuo-Saloranta A, Forss H, Walsh T, Nordblad A, Mäkelä M, Worthington HV. Pit and fissure sealants for preventing dental decay in permanent teeth. Cochrane Database Syst Rev. 2017;7(7):CD001830.', loc:'Sellante de resina contra nada: OR 0,12 a 24 meses · 11 a 51 % menos caries · certeza moderada · DOI 10.1002/14651858.CD001830.pub5 · PMID 28759120 · localizador de párrafo pendiente' }
            ] },
            { titulo:'¿y si mi caso es otro?', arbol:[
              { q:'¿La fisura está sana o tiene una lesión sin cavidad?', a:'Se sella.' },
              { q:'¿Hay una cavidad o la sonda roma se traba en dentina blanda?', a:'No es un sellante. Va a restauración: fuera del alcance de este protocolo.' },
              { q:'¿Es un diente temporal?', a:'Hay otra revisión Cochrane para temporales. Fuera del alcance de este protocolo.' }
            ] }
          ] },
        { corto:'Elige resina o ionómero', marca:'en disputa',
          disputa:'La guía no recomienda un material sobre otro por falta de evidencia. Pendiente de resolución por el panel.',
          hacer:'Elige el material según cuánto puedes mantener seco el diente: resina si lo puedes aislar bien, ionómero de vidrio si no.',
          listo:'Terminaste cuando el material está decidido y anotado, y la bandeja tiene solo lo de esa rama.',
          porque:['Los dos previenen caries de forma parecida. Un metaanálisis no encontró diferencia en caries entre ionómero y resina, pero la resina se mantiene puesta mucho más tiempo (OR 6,0 a favor de la resina).','La resina necesita un campo seco: la saliva sobre el esmalte grabado baja la unión y aumenta la filtración. El ionómero tolera mejor la humedad. Por eso la pregunta clave es si puedes mantener el diente seco.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · metaanálisis de estudios clínicos', cita:'Alirezaei M, Bagherian A, Sarraf Shirazi A. Glass ionomer cements as fissure sealing materials: yes or no?: a systematic review and meta-analysis. J Am Dent Assoc. 2018;149(7):640-649.e9.', loc:'Caries: sin diferencia (OR 0,938) · retención: a favor de la resina (OR 6,006) · DOI 10.1016/j.adaj.2018.02.001 · PMID 29735163 · localizador de párrafo pendiente' }
            ] },
            { titulo:'¿y si mi caso es otro?', arbol:[
              { q:'¿Molar erupcionado del todo y niño que coopera?', a:'Resina, con aislamiento.' },
              { q:'¿Molar a medio erupcionar, con encía sobre la cara oclusal?', a:'Ionómero de vidrio: tolera la humedad. Programa el recambio por resina cuando el molar termine de erupcionar.' },
              { q:'¿Niño que no tolera el aislamiento?', a:'Ionómero de vidrio, en una sesión corta.' }
            ] },
            { titulo:'dónde no hay acuerdo', parrafos:['Lo que se enseña en muchas clínicas: la resina es el sellante «de verdad» y el ionómero es de segunda.','Lo que dice la evidencia: el ionómero previene caries igual, aunque se cae más. La guía de 2016 no pudo recomendar un material sobre otro.','Mientras el panel resuelve, Criterium decide por la humedad del campo.'] }
          ] },
        { anim:'fisura.limpiar', corto:'Limpia la superficie', hacer:'Limpia la cara oclusal con cepillo dental seco o con agua y aire de la jeringa triple.',
          listo:'Terminaste cuando no se ve placa ni restos en las fisuras al secar con aire.',
          porque:['No hace falta profilaxis con pasta y contraángulo. Una revisión encontró que la retención del sellante después de limpiar con cepillo es al menos igual a la de limpiar con profilaxis.'],
          sub:[{ titulo:'ver fuentes', fuentes:[
            { grado:'Grado B · revisión de ensayos clínicos', cita:'Kolavic Gray S, Griffin SO, Malvitz DM, Gooch BF. A comparison of the effects of toothbrushing and handpiece prophylaxis on retention of sealants. J Am Dent Assoc. 2009;140(1):38-46.', loc:'Dos ensayos: sin diferencia en retención completa · retención con cepillo igual o mayor · DOI 10.14219/jada.archive.2009.0016 · PMID 19119165 · localizador de párrafo pendiente' }
          ] }] },
        { anim:'fisura.aislar', corto:'Aísla el diente', hacer:'Aísla con dique de goma si se puede. Si no, usa rollos de algodón y aspiración, con un ayudante.',
          listo:'Terminaste cuando el diente está seco y lo puedes mantener seco el tiempo que dura la aplicación.',
          porque:['La saliva es la principal enemiga del sellante de resina. Un metaanálisis de 2025 encontró más retención a los 12 meses con dique de goma que con rollos de algodón, aunque a los 6 meses no había diferencia.'],
          sub:[{ titulo:'ver fuentes', fuentes:[
            { grado:'Grado B · metaanálisis de ensayos clínicos', cita:'Shukla N, Akram Z, Kumar PGN, Khairnar MR, Jadhav SK, Priyadarsini S. Comparative evaluation of pit and fissure sealant retention using cotton roll and rubber dam isolation techniques: a systematic review and meta-analysis. Evid Based Dent. 2025;26(2):112.', loc:'Sin diferencia a 6 meses (OR 1,15) · más retención con dique a 12 meses · DOI 10.1038/s41432-024-01092-6 · PMID 39622909 · localizador de párrafo pendiente' }
          ] }] },
        { anim:'fisura.grabar', corto:'Rama resina: graba el esmalte', hacer:'Graba las fisuras con ácido fosfórico al 37 % por el tiempo que indica el fabricante, lava bien y seca.',
          cond:'→ rama resina',
          listo:'Terminaste cuando el esmalte grabado se ve blanco tiza y opaco, y nada de saliva lo tocó.',
          porque:['El ácido deja en el esmalte microporos donde se traba el sellante al endurecer.','Si la saliva toca el esmalte grabado, tapa esos poros. En laboratorio, la contaminación con saliva bajó claramente la unión y aumentó la filtración, y volver a grabar recuperó la unión. Si se contamina, se vuelve a grabar: no se sigue.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado C · estudio in vitro', cita:'Gok A, Bilge K, Gok T. The effects of material type, salivary contamination and adhesive application on the performance of pit and fissure sealants. PLoS One. 2026;21(7):e0352985.', loc:'La saliva bajó la unión y aumentó la filtración; regrabar la recuperó · DOI 10.1371/journal.pone.0352985 · PMID 42384668 · localizador de párrafo pendiente' }
            ] },
            { titulo:'¿y si mi caso es otro?', arbol:[
              { q:'¿La saliva tocó el esmalte grabado?', a:'Lava, seca y vuelve a grabar. No apliques sellante sobre esmalte contaminado.' },
              { q:'¿El esmalte no se ve blanco tiza después de secar?', a:'Graba de nuevo el sector que no cambió de color.' }
            ] }
          ] },
        { anim:'fisura.sellante', corto:'Rama resina: adhesivo y sellante', hacer:'Aplica una capa fina de adhesivo de grabado y lavado, fotopolimeriza y después aplica el sellante en las fisuras, sin burbujas, y fotopolimeriza.',
          cond:'→ rama resina',
          listo:'Terminaste cuando el sellante cubre todas las fisuras, está duro y no se levanta al pasarle la sonda por el borde.',
          porque:['Un metaanálisis encontró que poner adhesivo bajo el sellante aumenta su retención (OR 3,29), y que los adhesivos de grabado y lavado rinden mucho mejor que los autograbantes en este uso.','El sellante va solo en las fisuras, en capa fina. El exceso sobre las vertientes de las cúspides queda alto y se fractura.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · metaanálisis', cita:'Bagherian A, Sarraf Shirazi A, Sadeghi R. Adhesive systems under fissure sealants: yes or no?: a systematic review and meta-analysis. J Am Dent Assoc. 2016;147(6):446-56.', loc:'Adhesivo bajo el sellante: OR 3,294 a favor · grabado y lavado mejor que autograbante: OR 14,569 · DOI 10.1016/j.adaj.2016.01.014 · PMID 26993212 · localizador de párrafo pendiente' }
            ] },
            { titulo:'dónde se equivoca la gente', parrafos:['Dejar burbujas en el fondo de la fisura. Se pasan con el aplicador antes de polimerizar.','Pasarse a las vertientes. El sellante alto se cae primero.'] }
          ] },
        { anim:'fisura.ionomero', corto:'Rama ionómero: aplica y protege', marca:'sin evidencia',
          hacer:'Acondiciona la superficie según el fabricante, aplica el ionómero en las fisuras presionando con el dedo enguantado y protégelo con vaselina o barniz.',
          cond:'→ rama ionómero',
          listo:'Terminaste cuando el ionómero cubre las fisuras, fraguó y quedó protegido de la saliva durante el fraguado.',
          sinEv:'Técnica según las instrucciones del fabricante; no encontramos un ensayo que compare las formas de aplicarlo',
          porque:['El ionómero libera flúor y tolera algo de humedad, pero mientras fragua es sensible al agua: si la saliva lo moja, queda débil y se desgasta antes.','Aunque se caiga antes que la resina, el ionómero sigue protegiendo: el metaanálisis del paso 02 no encontró más caries con ionómero que con resina.'] },
        { anim:'fisura.oclusion', corto:'Revisa oclusión y agenda control', hacer:'Retira el aislamiento, revisa la oclusión con papel de articular, quita los excesos y agenda el control.',
          listo:'Terminaste cuando no hay contactos altos sobre el sellante y la fecha del control quedó en la ficha.',
          porque:['Un sellante que se cae deja de proteger la fisura. La revisión Cochrane mostró que el efecto de los sellantes de resina todavía se ve a los 48 a 54 meses (OR 0,21).','El control sirve para encontrar a tiempo un sellante parcial y repararlo, antes de que la fisura vuelva a quedar expuesta.'],
          sub:[{ titulo:'ver fuentes', fuentes:[
            { grado:'Grado A · revisión Cochrane', cita:'Ahovuo-Saloranta A, Forss H, Walsh T, Nordblad A, Mäkelä M, Worthington HV. Pit and fissure sealants for preventing dental decay in permanent teeth. Cochrane Database Syst Rev. 2017;7(7):CD001830.', loc:'Efecto mantenido a 48–54 meses: OR 0,21 (IC 95 % 0,16–0,28) · DOI 10.1002/14651858.CD001830.pub5 · PMID 28759120 · localizador de párrafo pendiente' }
          ] }] }
      ]
    },

    'destartraje': {
      esp:'Periodoncia',
      pdf:'protocolo-destartraje-pulido-radicular-v0.1.pdf',
      titulo:'Destartraje y pulido radicular por cuadrante en periodontitis estadio I a III',
      bandera:'BORRADOR · CINCO FUENTES VERIFICADAS · SIN REVISIÓN DE ESPECIALISTA',
      tags:['Periodontitis estadio I–III','Un cuadrante por sesión','Manual y ultrasónico','v0.1 · borrador'],
      alcance:'una sesión de destartraje supragingival y raspado y alisado radicular subgingival de un cuadrante, en un adulto con periodontitis estadio I, II o III ya diagnosticada, con instrumental manual (curetas Gracey) y ultrasónico. No cubre periodontitis estadio IV, cirugía periodontal, antibióticos ni pacientes con implantes en el cuadrante.',
      bandeja:[
        { fase:'Registro', items:['Periodontograma vigente','Sonda periodontal milimetrada','Radiografías del cuadrante'] },
        { fase:'Preparación', items:['Clorhexidina para enjuague previo','Anestesia local, jeringa carpule y agujas','Revelador de placa y cepillo para instruir'] },
        { fase:'Instrumentación', items:['Ultrasonido con puntas para supra y subgingival','Curetas Gracey 5-6, 7-8, 11-12 y 13-14 afiladas','Hoz para supragingival','Piedra de afilar','Aspiración de alto volumen'] },
        { fase:'Cierre', items:['Suero fisiológico para irrigar','Gasas','Indicaciones escritas','Ficha con la fecha de reevaluación'] }
      ],
      evidencia:[
        { n:'01', grado:'Grado D · consenso de clasificación', txt:'Estadio y grado de la periodontitis según la clasificación de 2017.' },
        { n:'02', grado:'Grado A · guía de práctica clínica S3', txt:'El tratamiento va por pasos: primero control de placa y factores de riesgo, después instrumentación.' },
        { n:'05', grado:'Grado A · revisión sistemática', txt:'La instrumentación subgingival reduce 1,4 mm la profundidad y cierra 74 % de los sacos a 6–8 meses.' },
        { n:'05', grado:'Grado A · revisión sistemática', txt:'Manual y ultrasónico dan resultados parecidos.' },
        { n:'06', grado:'Grado A · revisión Cochrane', txt:'Por cuadrantes o boca completa en 24 horas: sin diferencia clara.' }
      ],
      nota:'Borrador v0.1, construido solo con literatura. La guía europea S3 de periodontitis estadio I a III es la base de la secuencia. Faltan los localizadores de párrafo. No usar en pacientes hasta la revisión del panel.',
      pasos:[
        { corto:'Confirma diagnóstico y periodontograma', hacer:'Confirma el estadio y el grado de la periodontitis y revisa el periodontograma del cuadrante que vas a tratar.',
          listo:'Terminaste cuando sabes qué sacos de 4 mm o más vas a instrumentar y están marcados en la ficha.',
          porque:['La clasificación de 2017 describe la periodontitis por estadio (cuánto daño hay) y grado (qué tan rápido avanza). Este protocolo cubre los estadios I a III; el IV necesita un plan más amplio.','El periodontograma es tu mapa. Sin él instrumentas a ciegas y no puedes comparar en la reevaluación.'],
          sub:[{ titulo:'ver fuentes', fuentes:[
            { grado:'Grado D · consenso de clasificación', cita:'Tonetti MS, Greenwell H, Kornman KS. Staging and grading of periodontitis: framework and proposal of a new classification and case definition. J Clin Periodontol. 2018;45 Suppl 20:S149-S161.', loc:'Estadios I a IV y grados A a C · DOI 10.1111/jcpe.12945 · PMID 29926495 · localizador de párrafo pendiente' }
          ] }] },
        { anim:'perio.placa', corto:'Primero, control de placa', hacer:'Muestra la placa con revelador, enseña la técnica de cepillado y de limpieza interdental, y revisa los factores de riesgo (tabaco, diabetes).',
          listo:'Terminaste cuando el paciente vio su placa teñida, practicó la técnica frente a ti y quedó anotado su índice de placa.',
          porque:['La guía europea S3 ordena el tratamiento en pasos. El primero es siempre el control de la placa supragingival y de los factores de riesgo. La instrumentación viene después y no reemplaza ese paso.','Si el paciente no controla su placa, los sacos que instrumentas hoy se vuelven a llenar.'],
          sub:[{ titulo:'ver fuentes', fuentes:[
            { grado:'Grado A · guía de práctica clínica S3', cita:'Sanz M, Herrera D, Kebschull M, Chapple I, Jepsen S, Berglundh T, et al. Treatment of stage I-III periodontitis: the EFP S3 level clinical practice guideline. J Clin Periodontol. 2020;47 Suppl 22:4-60.', loc:'Tratamiento por pasos: primero cambio de conducta, control de placa y de factores de riesgo · DOI 10.1111/jcpe.13290 · PMID 32383274 · localizador de párrafo pendiente' }
          ] }] },
        { corto:'Enjuague previo', hacer:'Pide al paciente que se enjuague con clorhexidina antes de empezar.',
          listo:'Terminaste cuando completó el enjuague antes de encender el ultrasonido.',
          porque:['El ultrasonido genera aerosoles con bacterias de la boca. Una revisión Cochrane de 2022 encontró que la clorhexidina antes del procedimiento puede reducir la contaminación bacteriana de esos aerosoles.','Ojo con lo que no dice: ningún estudio midió si eso reduce las infecciones del equipo clínico.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado B · revisión Cochrane, certeza baja a muy baja', cita:'Kumbargere Nagraj S, Eachempati P, Paisi M, Nasser M, Sivaramakrishnan G, Francis T, et al. Preprocedural mouth rinses for preventing transmission of infectious diseases through aerosols in dental healthcare providers. Cochrane Database Syst Rev. 2022;8(8):CD013826.', loc:'La clorhexidina puede reducir las unidades formadoras de colonias en el aerosol · sin datos sobre infecciones · DOI 10.1002/14651858.CD013826.pub2 · PMID 35994295 · localizador de párrafo pendiente' }
            ] }
          ] },
        { anim:'perio.anestesia', corto:'Anestesia si la necesitas', marca:'sin evidencia',
          hacer:'Anestesia el cuadrante si los sacos son profundos o el paciente siente dolor al sondaje.',
          cond:'→ sacos de 5 mm o más, o paciente sensible',
          listo:'Terminaste cuando el paciente no siente dolor al pasar la sonda en los sacos que vas a instrumentar.',
          sinEv:'Práctica habitual; no encontramos un ensayo que compare con y sin anestesia en raspado',
          porque:['Con dolor, el paciente se mueve y tú instrumentas con miedo. El alisado incompleto deja cálculo, y el cálculo que queda mantiene la inflamación.'] },
        { anim:'perio.raspar', corto:'Instrumenta supra y subgingival', hacer:'Retira el cálculo supragingival y después instrumenta cada saco subgingival con ultrasonido, curetas Gracey o ambos, hasta dejar la raíz lisa.',
          listo:'Terminaste cuando la sonda de exploración recorre la raíz de cada saco sin encontrar cálculo ni rugosidades.',
          porque:['Una revisión sistemática para la guía europea encontró que la instrumentación subgingival reduce en promedio 1,4 mm la profundidad de los sacos y cierra el 74 % de ellos a los 6–8 meses.','La misma revisión no encontró diferencias importantes entre instrumentos manuales y ultrasónicos. Usa los que domines, pero termina siempre explorando la raíz.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado A · revisión sistemática con metaanálisis', cita:'Suvan J, Leira Y, Moreno Sancho FM, Graziani F, Derks J, Tomasi C. Subgingival instrumentation for treatment of periodontitis. A systematic review. J Clin Periodontol. 2020;47 Suppl 22:155-175.', loc:'Reducción de 1,4 mm (IC 95 % 1,0–1,7) · 74 % de cierre de sacos a 6–8 meses · eficaz con cualquier tipo de instrumento · DOI 10.1111/jcpe.13245 · PMID 31889320 · localizador de párrafo pendiente' }
            ] },
            { titulo:'dónde se equivoca la gente', parrafos:['Instrumentar con curetas sin filo. Pulen el cálculo en vez de sacarlo y dejan una superficie que parece lisa pero no lo está.','Trabajar solo lo que se ve. El cálculo que importa está en el fondo del saco.','Usar la parte equivocada de la Gracey: cada número tiene su zona (5-6 anteriores, 7-8 caras libres de posteriores, 11-12 mesiales, 13-14 distales).'] }
          ] },
        { corto:'¿Cuadrante o boca completa?', hacer:'Sigue con el plan por cuadrantes, una sesión cada uno, separadas por al menos una semana.',
          cond:'→ si el plan es por cuadrantes',
          listo:'Terminaste cuando quedó agendada la sesión del cuadrante siguiente.',
          porque:['Una revisión Cochrane de 2022 comparó tratar la boca completa en 24 horas contra hacerlo por cuadrantes, y no encontró diferencias claras en profundidad de saco, nivel de inserción ni sangrado a los 6–8 meses.','Así que la elección depende de lo práctico: el tiempo del paciente, cuánto tolera por sesión y la agenda de la clínica.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado A · revisión Cochrane', cita:'Jervøe-Storm PM, Eberhard J, Needleman I, Worthington HV, Jepsen S. Full-mouth treatment modalities (within 24 hours) for periodontitis in adults. Cochrane Database Syst Rev. 2022;6(6):CD004622.', loc:'Sin beneficio de la boca completa frente a cuadrantes en profundidad de saco: diferencia 0,03 mm (IC 95 % −0,14 a 0,20) · DOI 10.1002/14651858.CD004622.pub4 · PMID 35763286 · localizador de párrafo pendiente' }
            ] },
            { titulo:'¿y si mi caso es otro?', arbol:[
              { q:'¿El paciente puede venir varias veces y tolera sesiones cortas?', a:'Por cuadrantes, una semana entre cada uno.' },
              { q:'¿El paciente viene de lejos o le cuesta volver?', a:'Boca completa en 24 horas: da resultados parecidos. Coordínalo con el docente.' }
            ] }
          ] },
        { anim:'perio.irrigar', corto:'Irriga e indica', marca:'sin evidencia', hacer:'Irriga los sacos con suero, revisa que no quede cálculo visible y explica qué sentirá en los próximos días.',
          listo:'Terminaste cuando el paciente sabe que puede tener sensibilidad y algo de sangrado, y cómo seguir limpiando la zona.',
          sinEv:'Práctica habitual; no encontramos un ensayo sobre estas indicaciones',
          porque:['Después del raspado la encía se desinflama y se retrae un poco. Eso puede dejar la raíz sensible al frío. Si el paciente lo sabe, no deja de limpiar por miedo.'] },
        { corto:'Agenda la reevaluación', marca:'paso que suele faltar',
          hacer:'Agenda la reevaluación con un periodontograma nuevo, unas semanas después de terminar el último cuadrante, en el plazo que use tu clínica.',
          listo:'Terminaste cuando la fecha de reevaluación quedó en la ficha antes de que el paciente se vaya.',
          porque:['La guía europea S3 indica reevaluar después de la instrumentación para decidir el paso siguiente: mantención si los sacos cerraron, o más tratamiento si quedan sacos profundos que sangran.','Sin reevaluación no sabes si el tratamiento funcionó. Es el paso que más se olvida.'],
          sub:[{ titulo:'ver fuentes', fuentes:[
            { grado:'Grado A · guía de práctica clínica S3', cita:'Sanz M, Herrera D, Kebschull M, Chapple I, Jepsen S, Berglundh T, et al. Treatment of stage I-III periodontitis: the EFP S3 level clinical practice guideline. J Clin Periodontol. 2020;47 Suppl 22:4-60.', loc:'Reevaluación tras el paso 2 para decidir el paso siguiente · DOI 10.1111/jcpe.13290 · PMID 32383274 · localizador de párrafo pendiente' }
          ] }] }
      ]
    }
  };
