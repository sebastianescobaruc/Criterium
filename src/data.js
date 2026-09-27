// Contenido original de la biblioteca Criterium (portado sin cambios del borrador anterior).
export const PROTOS = [
    { id:'cementado-pmma', esp:'Rehabilitación oral', estadoTxt:'Borrador v0.4',
      t:'Cementado de corona provisional de PMMA fresado CAD/CAM',
      s:'Corona unitaria sobre diente natural, de 6 a 24 meses. Dos vías: convencional y adhesiva. Solo la sesión de cementado.',
      extraTxt:'1 paso en disputa', n:'5 aportes', abre:true,
      k:'cementar cemento provisional pmma cadcam corona temporal eugenol adhesivo arenado primer mma resina superbond ferula larga duracion' },
    { id:'tallado', esp:'Rehabilitación oral', estadoTxt:'Planificado',
      t:'Tallado para corona completa cerámica',
      s:'Reducción, terminación cervical y criterios de conservación de estructura.',
      extraTxt:'', n:'', abre:false, k:'tallar tallado preparacion corona ceramica reduccion hombro chamfer' },
    { id:'impresion', esp:'Rehabilitación oral', estadoTxt:'Planificado',
      t:'Impresión con silicona de adición',
      s:'Técnica de doble mezcla, manejo del hilo separador y criterios de aceptación.',
      extraTxt:'', n:'', abre:false, k:'impresion silicona adicion cubeta hilo separador retraccion' },
    { id:'resina-clase-i', esp:'Rehabilitación oral', estadoTxt:'Borrador v0.1',
      t:'Restauración de resina compuesta clase I oclusal',
      s:'Caries oclusal primaria en diente permanente vital. De la marca de oclusión al pulido.',
      extraTxt:'2 pasos en disputa', n:'7 aportes', abre:true,
      k:'resina composite obturacion clase i oclusal caries operatoria aislamiento dique adhesivo grabado bulk fill incremental fotopolimerizar pulido' },
    { id:'cementado-def', esp:'Rehabilitación oral', estadoTxt:'Planificado',
      t:'Cementado adhesivo de corona cerámica',
      s:'Acondicionamiento de la cerámica y del diente, aislamiento y fotopolimerización.',
      extraTxt:'', n:'', abre:false, k:'cementar adhesivo ceramica disilicato grabado silano resina definitiva' },
    { id:'instrumentacion', esp:'Periodoncia', estadoTxt:'Planificado',
      t:'Instrumentación subgingival de un sextante',
      s:'Secuencia por cara, criterio de término por superficie y control a las 6 semanas.',
      extraTxt:'', n:'', abre:false, k:'destartraje instrumentacion subgingival raspado curetas periodoncia sextante' },
    { id:'exodoncia-18', esp:'Cirugía', estadoTxt:'Borrador v0.1',
      t:'Exodoncia simple del 1.8 erupcionado',
      s:'Tercer molar superior en paciente sano. Con los dos puntos donde este diente se complica.',
      extraTxt:'2 pasos críticos', n:'4 aportes', abre:true,
      k:'exodoncia extraccion 18 28 tercer molar cordal superior erupcionado forceps elevador tuberosidad seno maxilar comunicacion bucosinusal antibiotico cirugia' },
    { id:'necropulpectomia', esp:'Endodoncia', estadoTxt:'Planificado',
      t:'Necropulpectomía de molar',
      s:'Longitud de trabajo, secuencia de instrumentación e irrigación.',
      extraTxt:'', n:'', abre:false, k:'endodoncia necropulpectomia molar conducto irrigacion limas longitud trabajo' }
  ];

export const DATOS = {
    'cementado-pmma': {
      esp:'Rehabilitación oral',
      pdf:'protocolo-cementado-pmma-v0.4.pdf',
      titulo:'Cementado de corona provisional de PMMA fresado CAD/CAM sobre diente natural',
      bandera:'BORRADOR · DIEZ FUENTES REALES VERIFICADAS · SIN REVISIÓN DE ESPECIALISTA',
      tags:['Provisional de larga duración','6–24 meses','v0.4 · borrador','Dos vías de cementación','1 paso en disputa'],
      alcance:'la sesión de cementado de una corona unitaria de PMMA fresado sobre diente natural, con permanencia prevista entre 6 y 24 meses. Cubre las dos vías: la convencional con óxido de zinc y la adhesiva con cemento de resina. No cubre el diseño, el fresado ni la prueba previa del provisional, y no aplica sobre pilar de implante.',
      bandeja:[
        { fase:'Antes de sentar al paciente', items:['Registro del bloque: material, marca y lote','Sonda periodontal milimetrada','Radiografía periapical basal del pilar','Radiómetro para comprobar la lámpara'] },
        { fase:'Prueba y ajuste', items:['Papel de articular y pinza','Fresas de pulido para acrílico','Discos y puntas de silicona','Hilo dental','Sonda de exploración'] },
        { fase:'Vía convencional', items:['Cemento de óxido de zinc sin eugenol','Loseta y espátula de cemento','Rollos de algodón para aislamiento relativo'] },
        { fase:'Vía adhesiva', items:['Arenador con óxido de aluminio de 50 µm y manómetro','Ácido ortofosfórico al 37 %','Baño ultrasónico y alcohol de 96 %','Primer con MMA','Cemento de resina y su adhesivo','Microbrushes y pinceles desechables','Dique de goma, o hilo retractor y aspiración','Cinta de teflón o matriz para proximal','Lámpara de fotopolimerización','Gel de glicerina'] },
        { fase:'Acabado y cierre', items:['Hilo dental y superfloss','Papel de articular de 40 µm','Pasta de pulido para resina','Recubrimiento de superficie fotopolimerizable','Ficha clínica y agenda de controles'] }
      ],
      evidencia:[
        { n:'01', grado:'Grado D · documentación de fabricante', txt:'PMMA fresado reticulado: 135 MPa y permanencia máxima indicada de 12 meses.' },
        { n:'03', grado:'Grado B · revisión sistemática con metaanálisis', txt:'Férula de 2 mm o más: +165 N de resistencia a la fractura. En clínica el efecto es más débil.' },
        { n:'06', grado:'Grado B · in vitro comparativo', txt:'Rugosidad del PMMA fresado ya bajo el umbral de 0,2 µm.' },
        { n:'07', grado:'Grado C · metaanálisis in vitro', txt:'En disputa: eugenol y adhesión a dentina a 14 días.' },
        { n:'08', grado:'Grado C · in vitro', txt:'PMMA CAD/CAM sin acondicionar: casi no hay unión. El primer con MMA la levanta.' },
        { n:'09', grado:'Sin evidencia', txt:'Fotopolimerizar o no el adhesivo del muñón: depende del sistema de cemento.' },
        { n:'11', grado:'Grado C · población distinta', txt:'Cemento residual y enfermedad periimplantaria.' },
        { n:'12', grado:'Grado C · in vitro', txt:'El recubrimiento de resina mejora la estabilidad de color del PMMA fresado.' },
        { n:'13', grado:'Sin evidencia', txt:'Indicaciones al paciente: práctica habitual.' }
      ],
      nota:'Borrador v0.4. Fusiona la versión convencional publicada antes con la vía adhesiva de larga duración, y generaliza el alcance a cualquier corona unitaria de PMMA fresado. Las diez fuentes están verificadas y con su referencia completa; lo que falta en todas es el localizador de párrafo, y en la documentación de fabricante, el documento exacto. Dos cifras no tienen fuente y se publican como extrapolación declarada: los 50 µm y los 1–2 bar del arenado. Ninguna versión de este documento debe usarse en un paciente hasta que el panel de expertos lo revise.',
      pasos:[
        { corto:'Confirma de qué material es la corona', hacer:'Confirma con el laboratorio el material exacto antes de tocar la corona.',
          listo:'Terminaste cuando tienes anotado en la ficha el material, la marca del bloque y el lote.',
          porque:['El acondicionamiento cambia por completo según el material. El PMMA es un polímero: se arena y se prima. Un bloque de composite CAD lleva ácido fluorhídrico y silano. Si los confundes, o pierdes la superficie interna o la corona se descementa.','El PMMA fresado reticulado tiene una resistencia flexural cercana a 135 MPa y el fabricante lo indica hasta 12 meses en coronas. Si tu plan son 24, estás usándolo fuera de la indicación del fabricante. Se puede hacer, pero tiene que quedar escrito: consentimiento, controles cada 3 meses y fecha de recambio fijada desde hoy.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado D · documentación de fabricante', cita:'Ivoclar Vivadent. Telio CAD: bloques de PMMA reticulado para provisionales de larga duración. Documentación de producto.', loc:'Resistencia flexural 135 MPa · permanencia máxima 12 meses en coronas · localizador pendiente' }
            ] },
            { titulo:'dónde se equivoca la gente', parrafos:['Asumir que todo provisional fresado es PMMA. Los bloques de composite CAD se fresan igual y se ven parecidos, pero se acondicionan al revés.','Empezar a arenar sin saber qué material es. El arenado sobre un composite CAD no es el error grave; el grave es el fluorhídrico sobre PMMA, que no hace nada y te hace creer que grabaste.'] }
          ] },
        { corto:'Elige la vía de cementación antes de preparar nada', hacer:'Elige la vía ahora: cementa con óxido de zinc sin eugenol.',
          cond:'→ si el provisional durará menos de 12 meses, el muñón es alto y retentivo y la definitiva irá adherida',
          listo:'Terminaste cuando la vía está decidida y el cemento está en la bandeja, antes de retirar el provisional anterior.',
          porque:['Decidir con la corona ya en la mano termina en usar lo que había en el pañol. Las dos vías piden materiales distintos, y la adhesiva necesita arenado y primer que no se improvisan.','La diferencia práctica es cómo termina la corona. La vía convencional permite retirarla entera. La adhesiva retiene mucho más, pero para sacarla hay que fresarla: la corona se pierde y eso hay que asumirlo desde el principio.'],
          sub:[
            { titulo:'¿y si mi caso es otro?', arbol:[
              { q:'¿El provisional dura menos de 12 meses, el muñón es alto y retentivo y la definitiva irá cementada con resina?', a:'Vía convencional con óxido de zinc sin eugenol — el caso más frecuente.' },
              { q:'¿La definitiva se cementará con vidrio ionómero o con un cemento convencional?', a:'Vía convencional. Aquí la restricción del eugenol deja de aplicar y puedes usar óxido de zinc con eugenol.' },
              { q:'¿La permanencia prevista pasa de 12 meses, o el muñón es corto o cónico, o el pilar está endodonciado con poste?', a:'Vía adhesiva: arenado, primer con MMA y cemento de resina. Asume que la corona se destruye al retirarla.' },
              { q:'¿No tienes primer con MMA?', a:'Vía adhesiva con un cemento de 4-META/MMA-TBB, cuyo propio monómero penetra el acrílico. No te ahorra el arenado.' },
              { q:'¿Quieres poder retirar la corona sin romperla para rebasarla, y el muñón tiene retención de sobra?', a:'Ionómero de vidrio modificado con resina. Ojo: no une al PMMA, toda la retención viene del tallado. Con muñón corto o cónico no es una opción.' },
              { q:'¿Es sobre un pilar de implante?', a:'Fuera del alcance de este protocolo.' }
            ] },
            { titulo:'dónde se equivoca la gente', parrafos:['Elegir ionómero modificado con resina en un muñón corto pensando que el cemento compensa la falta de retención. No la compensa: ese cemento no se une al acrílico.','Dejar la decisión para el momento del cementado. Si eliges la vía adhesiva a esa altura, la corona ya se probó en boca y está contaminada con saliva, y el arenador no está montado.'] }
          ] },
        { corto:'Mide la férula si el pilar está endodonciado', hacer:'Mide con sonda milimetrada la dentina sana que queda por debajo del margen de la corona, en todo el perímetro.',
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
        { corto:'Retira el provisional anterior y prueba en seco', hacer:'Retira el provisional anterior, elimina todo resto de cemento del muñón y prueba la corona en boca antes de preparar nada.',
          listo:'Terminaste cuando asienta por completo sin presión, los márgenes contactan la preparación en todo el perímetro y el punto de contacto pasa hilo dental con resistencia leve.',
          porque:['Una corona que no asienta antes del cemento no va a asentar después. La película de cemento agrega espesor: si ya había interferencia en seco, al cementar queda alta y con el margen abierto.','Un margen abierto en un provisional de larga duración deja expuesta la dentina durante meses. Ahí es donde aparecen la sensibilidad y la caries recurrente que después obligan a rehacer.','Si el provisional anterior estaba cementado con óxido de zinc con eugenol y vas por la vía adhesiva, el eugenol que queda en la dentina inhibe la polimerización del cemento de resina. No basta con lavar: hay que limpiar mecánicamente, con piedra pómez sin flúor o con clorhexidina al 2 %. Nada de pastas de profilaxis con glicerina o aceites.'],
          sub:[{ titulo:'dónde se equivoca la gente', parrafos:['Probar el asentamiento empujando fuerte con el dedo. La presión enmascara la interferencia: la corona entra, pero rebota apenas se suelta. Si tienes que forzarla, no asienta.','No revisar el punto de contacto. Un provisional sin contacto proximal deja migrar al diente vecino en semanas, y la corona definitiva ya no calza.','Probar la corona en boca y después cementarla por vía adhesiva sin descontaminar la cara interna. La saliva deja una película que el agua no saca.'] }],
          aportes:[
            { av:'MF', quien:'m.fuentes', txt:'A mí me pasó que asentaba perfecto en seco y después de cementar quedó alto. Era el punto de contacto, no la oclusión. Ahora reviso el contacto con hilo antes de mezclar.', rol:'Estudiante 5º', cuando:'5 d', likes:'14 les pasó lo mismo' },
            { av:'JB', quien:'j.bravo', txt:'Ojo con probarlo apretando fuerte. Entra igual y uno cree que asienta. Si lo sueltas y rebota, no asienta.', rol:'Estudiante 5º', cuando:'1 sem', likes:'9 les pasó lo mismo' }
          ] },
        { corto:'Ajusta la oclusión sin cementar', hacer:'Ajusta la oclusión con el provisional todavía sin cementar.',
          listo:'Terminaste cuando el papel de articular marca contactos del mismo grosor que en los dientes vecinos, en máxima intercuspidación y en lateralidades.',
          porque:['Ajustar después de cementar obliga a desgastar con el provisional fijo. El desgaste genera calor, y el calor sobre un cemento recién fraguado puede romper la unión que acabas de lograr.','Además el polvo de PMMA se mete en el surco y es difícil de retirar sin dañar el tejido.'] },
        { corto:'Pule solo lo que ajustaste', hacer:'Pule solo las zonas que ajustaste. No pulas el resto del provisional.',
          listo:'Terminaste cuando la zona ajustada devuelve brillo y la sonda recorre el margen sin engancharse.',
          porque:['Bajo 0,2 µm de rugosidad, seguir puliendo ya no reduce la adhesión bacteriana. Y un provisional fresado en PMMA sale de la fresadora entre 0,136 y 0,144 µm, o sea ya está bajo ese umbral.','Por eso pulir la superficie intacta no aporta nada. Lo que sí quedó rugoso es lo que tú desgastaste al ajustar oclusión y márgenes. Esa es la única zona que necesita pulido.'],
          sub:[{ titulo:'ver fuentes', fuentes:[
            { grado:'Grado B · estudio in vitro comparativo', cita:'Burduroglu HD, Kanpalta B, Şentürk H, Keleş ZH, Sismanoglu S. Surface roughness and bacterial adhesion of CAD/CAM and conventional provisional restorative materials. Materials. 2026.', loc:'Telio CAD 0,136 ± 0,011 µm · Vita CAD-Temp 0,144 ± 0,005 µm · localizador pendiente' },
            { grado:'Grado B · umbral de referencia', cita:'Bollen CM, Lambrechts P, Quirynen M. Comparison of surface roughness of oral hard materials to the threshold surface roughness for bacterial plaque retention. Dent Mater. 1997.', loc:'Umbral de 0,2 µm · localizador pendiente' }
          ] }] },
        { corto:'Vía convencional: cementa sin eugenol', marca:'en disputa',
          disputa:'La evidencia de 2023 contradice la práctica establecida. Pendiente de resolución por el panel de expertos.',
          hacer:'Carga el cemento de óxido de zinc sin eugenol en una capa fina sobre la cara interna, sin llenar la cofia.',
          cond:'→ vía convencional, cuando la definitiva se cementará con un cemento resinoso',
          listo:'Terminaste cuando el cemento está mezclado según el fabricante y cargado en una capa fina en la cara interna, sin llenar la cofia.',
          porque:['El eugenol residual queda en la dentina e interfiere con la polimerización de los cementos resinosos. Si vas a cementar la definitiva con resina, un provisional con eugenol te puede costar la retención de la corona final.','Se carga una capa fina y no se llena la cofia porque el exceso tiene que salir por algún lado: si llenas, sale todo por el margen hacia el surco.'],
          sub:[
            { titulo:'dónde no hay acuerdo', parrafos:['Lo que se enseña: el eugenol residual interfiere con la polimerización de los cementos resinosos, así que hay que evitarlo si la definitiva va adherida.','Lo que dice la evidencia más reciente: una revisión sistemática con metaanálisis de 2023 concluye que los materiales temporales con eugenol no tienen efecto adverso sobre la adhesión a dentina pasados 14 días.','Por qué Criterium no cambia la recomendación todavía: ese metaanálisis reúne solo estudios in vitro. La regla del validador impide que una revisión otorgue un grado superior al de los estudios que resume, así que su techo es grado C. Un grado C no basta para desplazar una práctica establecida.','El paso queda marcado en disputa hasta que lo resuelva el panel.'],
              fuentes:[{ grado:'Grado C · metaanálisis de estudios in vitro', cita:'da Rosa LS, Ribeiro JF, Pinto LT, Gonçalves LS, Rocha RO, Soares FZM. No adverse effect of eugenol-based temporary materials on bonding to dentin after 14 days: a systematic review and meta-analysis of in vitro studies. Int J Adhes Adhes. 2023.', loc:'DOI 10.1016/j.ijadhadh.2023.103398 · localizador de párrafo pendiente' }] }
          ],
          aportes:[
            { av:'RS', quien:'r.sepulveda', marca:'✓', txt:'Llevo años cementando provisionales con eugenol y después adhiriendo cerámica sin problemas de retención. Mi impresión coincide con el metaanálisis. Pero una impresión no es un dato: por eso vale la pena que el panel lo resuelva bien.', rol:'Especialista · Rehabilitación oral', cuando:'2 d', likes:'31 les pasó lo mismo' },
            { av:'CA', quien:'c.aguilera', txt:'En el pañol el que casi siempre hay es el con eugenol. Saber que hay evidencia de que no pasa nada me sirve más que la regla a secas.', rol:'Estudiante 5º', cuando:'4 d', likes:'22 les pasó lo mismo' },
            { av:'PT', quien:'p.tapia', txt:'Cuidado con el resinoso en provisionales largos: retiene muy bien, pero cuando toca sacarlo a los 18 meses se fractura el provisional y hay que rehacerlo.', rol:'Cirujano dentista', cuando:'1 sem', likes:'17 les pasó lo mismo' }
          ] },
        { corto:'Vía adhesiva: arena la cara interna y prímala con MMA', hacer:'Descontamina la cara interna con ácido ortofosfórico al 37 % durante 60 segundos, lava y seca. Después arena con óxido de aluminio de 50 µm a 1–2 bar, limpia en ultrasonido y aplica una capa fina de primer con MMA.',
          cond:'→ vía adhesiva, fuera de la boca',
          listo:'Terminaste cuando la cara interna está mate y uniforme, seca, con el primer fotopolimerizado, y la corona guardada protegida de la luz.',
          porque:['El PMMA no tiene fase vítrea, así que el ácido fluorhídrico no disuelve nada y no deja ningún patrón de grabado. El ortofosfórico tampoco graba el acrílico: sirve solo para retirar la película de saliva que el agua no saca.','La unión a un PMMA ya polimerizado se consigue por dos caminos y solo dos: la rugosidad que deja el arenado y la unión química del MMA, que hincha el acrílico, penetra en él y copolimeriza. Un adhesivo universal corriente no hace eso.','La presión del arenado es el parámetro crítico. El acrílico se erosiona mucho antes que la cerámica: si arenas a presión alta pierdes ajuste marginal en una corona que tiene que durar meses. El objetivo del arenado aquí es rugosidad, no desgaste.'],
          sub:[
            { titulo:'ver fuentes', fuentes:[
              { grado:'Grado C · estudio in vitro', cita:'Keul C, Martin A, Wimmer T, Roos M, Gernet W, Stawarczyk B. Tensile bond strength of PMMA- and composite-based CAD/CAM materials to luting cements after different conditioning methods. Int J Adhes Adhes. 2013;46:122-127.', loc:'El PMMA CAD/CAM sin acondicionar casi no adhiere, con cualquier cemento. El primer con MMA sube la resistencia de unión de forma significativa y falla de forma cohesiva dentro del cemento · DOI 10.1016/j.ijadhadh.2013.06.003 · localizador de párrafo pendiente' }
            ] },
            { titulo:'ojo con esta evidencia', parrafos:['La fuente que tenemos prueba el primer, no la presión. Lo demostrado es que sin acondicionar no hay unión y que un primer con MMA la levanta.','Las cifras de 50 µm y 1–2 bar no salen de un ensayo sobre tu bloque comercial: vienen de la práctica establecida. No existe una presión normalizada por material, así que Criterium las publica como extrapolación declarada, no como dato duro.'] },
            { titulo:'dónde se equivoca la gente', parrafos:['Grabar la cara interna con ácido fluorhídrico. No hay fase vítrea que disolver: solo añade riesgo de manipulación.','Saltarse el primer con MMA y confiar en un adhesivo universal. Ese es el escenario clásico del descementado a las pocas semanas: el cemento se queda pegado al diente y la corona sale entera.','Arenar a la presión que usarías sobre circonia. Sobre circonia retiras una capa despreciable; sobre acrílico desajustas la corona.'] }
          ] },
        { corto:'Vía adhesiva: acondiciona el muñón y cementa con resina', hacer:'Aísla, graba esmalte 30 segundos y dentina 15, aplica el adhesivo frotando 20 segundos, evapora el disolvente 5 segundos y cementa con resina.',
          cond:'→ vía adhesiva, una corona a la vez',
          listo:'Terminaste cuando el margen se comprueba con sonda, el exceso se retiró en fase gel, polimerizaste 20 a 40 segundos por cara y repolimerizaste 10 segundos con glicerina en los márgenes.',
          porque:['Se empieza grabando el esmalte y el ácido llega a la dentina después, nunca al revés. Sobregrabar la dentina colapsa la malla de colágeno y la capa híbrida queda incompleta: la adhesión empeora, no mejora.','El esmalte se seca hasta que queda con aspecto de tiza; la dentina solo hasta húmeda y brillante. Desecada, el colágeno se desploma.','La glicerina tapa el oxígeno del aire. Sin ella queda una capa superficial sin polimerizar justo en el margen, que es donde menos te conviene.','Una corona a la vez. Si cementas varias juntas, en alguna el exceso fragua antes de que llegues a retirarlo.'],
          sub:[
            { titulo:'dónde no hay acuerdo', parrafos:['Si el adhesivo del muñón se fotopolimeriza antes de asentar la corona depende del sistema de cemento que uses. Hay sistemas duales donde se indica y otros donde no.','No hay una regla general que valga para todos. Confírmalo en las instrucciones de uso del cemento antes de la sesión.'] },
            { titulo:'dónde se equivoca la gente', parrafos:['Dispensar el cemento sobre el muñón en vez de sobre la cara interna de la corona. Se incorporan burbujas y el exceso sale donde no quieres.','Cementar sobre restos de cemento provisional con eugenol. Inhibe la polimerización de la resina.'] }
          ] },
        { corto:'Asienta y retira el exceso en el momento justo', hacer:'Asienta con presión digital firme y sostenida, con vibración suave, hasta el asentamiento completo, y retira el exceso en el momento justo.',
          listo:'Terminaste cuando el margen se recorre con sonda sin escalón y el exceso salió entero: en la vía convencional cuando ya no se deforma y se quiebra, en la adhesiva en fase gel.',
          porque:['En la vía convencional, el exceso se retira entero justo cuando pierde el brillo. Si lo sacas antes, todavía está pegajoso y arrastras cemento desde debajo del margen, dejando la zona sin sellar. Si lo dejas endurecer del todo, después tienes que rasparlo y rayas la raíz.','En la vía adhesiva el momento es la fase gel. Si el sistema lo permite, un destello de 1 a 3 segundos por cara lleva el cemento a esa consistencia y el exceso sale de una pieza.'] },
        { corto:'Revisa el margen con sonda y pasa hilo', hacer:'Revisa el margen con sonda cara por cara y pasa hilo dental por ambos contactos en vaivén, sacándolo hacia vestibular.',
          listo:'Terminaste cuando la sonda recorre todo el margen sin encontrar cemento y el hilo sale limpio.',
          porque:['El cemento que queda bajo la encía no se reabsorbe. Se comporta como un cuerpo extraño y mantiene inflamación mientras dure el provisional. A 24 meses eso no es un detalle estético.','Un estudio endoscópico de 2025 encontró cemento residual en el 80,4 % de los implantes que ya tenían enfermedad periimplantaria: 37 de 46. De esos, 64,9 % con mucositis y 35,1 % con periimplantitis.'],
          sub:[
            { titulo:'ojo con esta evidencia', parrafos:['Ese estudio es en implantes, no en dientes naturales. El surco periimplantario y el periodonto no se comportan igual, así que la cifra no se traslada directo a tu caso.','Sirve como advertencia de la magnitud del problema, no como prueba de lo que pasa en un diente natural. Criterium lo declara en vez de esconderlo.'],
              fuentes:[{ grado:'Grado C · transversal, población distinta', cita:'Montevecchi M, Valeriani L, Salvadori MF, Stefanini M, Zucchelli G. Excess cement and peri-implant disease: a cross-sectional clinical endoscopic study. J Periodontol. 2025;96(9):965–973.', loc:'Recomienda óxido de zinc por ser más detectable y removible · localizador pendiente' }] },
            { titulo:'dónde se equivoca la gente', parrafos:['Pasar el hilo hacia abajo y tirarlo de vuelta hacia oclusal. Eso vuelve a meter el cemento en el contacto. El hilo se saca tirando hacia vestibular o lingual.','Rascar el exceso endurecido con instrumento. Genera fragmentos que se meten más profundo en el surco en vez de salir.'] }
          ] },
        { corto:'Sella toda superficie que hayas fresado', hacer:'Repule con fresa de acrílico, discos y pasta, y aplica un recubrimiento de superficie fotopolimerizable sobre la cara vestibular.',
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
          listo:'Terminaste cuando el paciente puede repetirte la indicación con sus palabras y la ficha tiene material y lote del bloque, vía de cementación, cemento y lote, y la fecha de recambio.',
          sinEv:'Sin evidencia — práctica habitual, sin respaldo de alto nivel',
          porque:['Las indicaciones que se dan son evitar alimentos pegajosos, no usar hilo en esa zona por 24 horas, y contar que el café, el té, el vino tinto y el tabaco pigmentan el acrílico mucho más que el esmalte. Se enseñan y se repiten en clínica, pero no encontramos evidencia que las respalde con un nivel aceptable. Criterium no las borra ni las disfraza: las publica marcadas.','Decirlo es parte del objetivo. Un estudiante tiene que poder distinguir lo que está fundamentado de lo que solo se hereda por costumbre.','Lo que sí depende de ti es la fecha. Si la permanencia prevista pasa de los 12 meses que indica el fabricante, la fecha de recambio se anota hoy, no dentro de dos años.'] }
      ]
    },

    'resina-clase-i': {
      esp:'Rehabilitación oral',
      titulo:'Restauración de resina compuesta clase I oclusal en diente permanente',
      bandera:'BORRADOR · NUEVE FUENTES REALES VERIFICADAS · SIN REVISIÓN DE ESPECIALISTA',
      tags:['Lesión primaria cavitada','Diente vital','v0.1 · borrador','2 pasos en disputa'],
      alcance:'caries oclusal primaria, cavitada, poco o moderadamente profunda, en diente permanente vital y asintomático. No cubre lesión profunda con riesgo de exposición, recambio de restauración antigua, ni cavidades que comprometan una cara proximal.',
      bandeja:[
        { fase:'Diagnóstico y registro', items:['Espejo, explorador y pinza','Papel de articular y pinza de Miller','Radiografía bitewing del diente'] },
        { fase:'Aislamiento', items:['Dique de goma, arco y perforador','Clamps surtidos para molar y premolar','Hilo dental para asentar el dique'] },
        { fase:'Preparación', items:['Fresas redondas de diamante y de carburo','Cucharetas de dentina','Jeringa triple'] },
        { fase:'Adhesión', items:['Ácido fosfórico en jeringa','Adhesivo y microaplicadores','Lámpara de fotopolimerización con barrera','Gafas de protección naranjas'] },
        { fase:'Restauración y terminación', items:['Resina compuesta del color seleccionado','Espátulas de modelado','Fresas de terminación y gomas de pulido','Discos y tiras de pulido'] }
      ],
      evidencia:[
        { n:'02', grado:'Certeza baja a muy baja', txt:'Cochrane 2021: ventaja del dique no sostenida a 12 y 18 meses.' },
        { n:'03', grado:'Consenso', txt:'Remoción selectiva a dentina firme en lesiones poco y moderadamente profundas.' },
        { n:'05', grado:'Grado C · metaanálisis en red in vitro', txt:'Grabado-y-lavado con mejores valores tras envejecimiento.' },
        { n:'07', grado:'Metaanálisis de ECAs', txt:'Sin diferencia entre bulk-fill e incremental.' },
        { n:'08', grado:'Consenso · ADA', txt:'La barrera plástica reduce la irradiancia hasta un 40 %.' },
        { n:'09', grado:'Metaanálisis a 5 años', txt:'Caries secundaria y fractura son las causas de fracaso.' }
      ],
      nota:'Protocolo en borrador. Las nueve referencias son reales y verificadas; los localizadores de párrafo están pendientes. Dos pasos quedan marcados en disputa a la espera del panel de expertos. Ninguna versión de este documento debe usarse como estándar de atención hasta que un especialista lo revise y lo firme.',
      pasos:[
        { corto:'Marca los contactos antes', marca:'sin evidencia',
          hacer:'Marca los contactos oclusales con papel de articular antes de tocar el diente.',
          listo:'Terminaste cuando tienes registrado en la ficha o en una foto dónde contacta el diente y dónde no.',
          sinEv:'Sin evidencia directa — práctica habitual, sin respaldo de alto nivel',
          porque:['Cuando termines la restauración vas a tener que decidir qué marca sobra. Si no sabes cómo contactaba antes, no tienes contra qué comparar y terminas desgastando a ojo hasta que el papel deje de marcar.','Ese desgaste a ciegas es la causa más común de que una restauración quede en infraoclusión: el diente deja de tocar, el antagonista extruye con los meses y aparece una interferencia que no estaba.'],
          sub:[{ titulo:'dónde se equivoca la gente', parrafos:['Marcar recién al final. Para entonces el diente ya está anestesiado, el paciente no siente bien y no hay referencia previa.','Marcar con el paciente anestesiado y pedirle que “muerda normal”. Con anestesia no muerde normal: la referencia sirve solo si se toma antes.'] }],
          aportes:[{ av:'MF', quien:'m.fuentes', txt:'Yo tomo una foto con el celular al papel de articular antes de anestesiar. Toma cinco segundos y después tengo con qué comparar.', rol:'Estudiante 5º', cuando:'3 d', likes:'18 les pasó lo mismo' }] },
        { corto:'Aísla con dique de goma', marca:'en disputa',
          disputa:'La evidencia que respalda el dique de goma es de certeza baja a muy baja. Pendiente de resolución por el panel de expertos.',
          hacer:'Mientras tanto, haz esto: aísla con dique de goma.',
          listo:'Terminaste cuando el diente está seco, el dique no se mueve al soplar y ninguna zona de la cavidad queda tapada por el clamp.',
          porque:['La adhesión falla con humedad. La saliva contamina la superficie grabada y baja la resistencia de unión, y en un diente posterior con el paciente hablando y respirando, mantener seco con rollos exige una vigilancia que casi nunca se sostiene toda la sesión.','Además el dique protege la vía aérea. Eso no se discute y no depende de ninguna revisión sistemática.'],
          sub:[{ titulo:'dónde no hay acuerdo', parrafos:['Lo que se enseña: sin dique de goma no se puede adherir bien, punto.','Lo que dice la evidencia: la revisión Cochrane de 2021 encontró una ventaja del dique frente a rollos de algodón a los 6 meses en lesiones cervicales no cariosas (OR 2,29; IC 95 % 1,05–4,99), pero esa ventaja desaparece a los 12 y 18 meses. En tratamiento restaurador atraumático en niños sí hubo menos fracaso a 24 meses (HR 0,80; IC 95 % 0,66–0,97).','La certeza de esa evidencia es baja a muy baja, y los propios autores piden estudios mejores. La práctica está bien fundamentada por razones biológicas y de seguridad, pero no por ensayos clínicos sólidos que demuestren que las restauraciones duran más.'] }] },
        { corto:'Abre y remueve la caries', hacer:'Abre la cavidad y remueve la caries hasta dentina firme en la periferia y el piso.',
          listo:'Terminaste cuando el margen de esmalte está sano y sin socavado, y la dentina de las paredes resiste la presión del explorador sin ceder.',
          porque:['La remoción selectiva a dentina firme es la recomendación de consenso para lesiones poco y moderadamente profundas, que es el caso típico de una clase I oclusal. No se trata de dejar el diente “limpio a ojo”: se trata de quitar lo que compromete el sellado y conservar todo el resto.','Cada milímetro de dentina que sacas de más debilita el diente y acerca la pulpa. La cavidad la define la lesión, no una forma de libro.'],
          sub:[{ titulo:'¿y si mi caso es otro?', arbol:[
            { q:'¿Lesión poco o moderadamente profunda?', a:'Remoción selectiva a dentina firme en toda la cavidad. Prioriza que la restauración dure — tu caso.' },
            { q:'¿Lesión profunda, con riesgo de exponer la pulpa?', a:'Remoción selectiva a dentina blanda en el piso: se deja dentina reblandecida sobre la pulpa y se remueve a dentina firme solo en la periferia. Esto queda fuera del alcance de este protocolo.' },
            { q:'¿Ya hay exposición pulpar?', a:'Fuera del alcance. Es otro protocolo.' }
          ] }] },
        { corto:'No pongas base ni liner', marca:'sin evidencia directa',
          hacer:'No pongas base ni liner.', cond:'→ si la cavidad es poco o moderadamente profunda',
          listo:'Terminaste cuando confirmaste que queda dentina entre el piso de la cavidad y la pulpa, y la cavidad está lista para grabar.',
          sinEv:'Recomendación por razonamiento clínico — la evidencia directa compara liner contra no-liner en caries profunda, no en cavidades de rutina',
          porque:['En una clase I oclusal típica queda dentina de sobra sobre la pulpa. El adhesivo sella; una base intermedia solo agrega una interfase más donde puede fallar algo.','La base tiene sentido cuando hay muy poca dentina remanente o cuando quieres reducir el volumen de resina en una cavidad profunda. En una oclusal de rutina, no es el caso.'],
          sub:[{ titulo:'¿y si mi caso es otro?', arbol:[
            { q:'¿Cavidad poco o moderadamente profunda?', a:'Sin base. Adhesivo directo sobre dentina — tu caso.' },
            { q:'¿Cavidad profunda con dentina remanente escasa?', a:'Considera hidróxido de calcio o cemento de silicato cálcico solo en el punto más profundo, y vidrio ionómero encima. Nunca cubriendo toda la cavidad.' },
            { q:'¿Hubo exposición pulpar?', a:'Fuera del alcance de este protocolo.' }
          ] }] },
        { corto:'Grabado selectivo del esmalte', hacer:'Graba el esmalte con ácido fosfórico 15 a 30 segundos. Lava y seca sin desecar la dentina.',
          cond:'→ grabado selectivo: ácido solo en esmalte, no en dentina',
          listo:'Terminaste cuando el esmalte grabado se ve blanco tiza y la dentina queda visiblemente húmeda, sin charco y sin aspecto opaco.',
          porque:['El esmalte necesita ácido fosfórico para que la unión dure. Los adhesivos autograbantes, solos, dejan el margen de esmalte más débil, y el margen de una clase I oclusal es casi todo esmalte.','La dentina es al revés: si la grabas y después la secas, colapsan las fibras de colágeno y el adhesivo ya no las penetra. Por eso el ácido va solo en esmalte y la dentina se deja húmeda.'],
          sub:[{ titulo:'dónde no hay acuerdo', parrafos:['Lo que se enseña en muchas facultades: con adhesivo universal en modo autograbante basta, no hay que grabar nada.','Lo que dice el laboratorio: un metaanálisis en red de 2026 sobre 82 estudios encontró que en dentina el modo grabado-y-lavado dio los mejores valores de resistencia adhesiva tras envejecimiento (hasta 34,69 MPa), y que lo que más pesa es la estrategia de aplicación y no qué monómero trae el frasco.','Por qué Criterium no lo convierte en regla: son 82 estudios in vitro. La regla del validador le pone techo de grado C a cualquier revisión que sintetice laboratorio. Una cifra de MPa en una probeta no es una restauración que duró cinco años en boca.'] }] },
        { corto:'Adhesivo frotado y curado', hacer:'Aplica el adhesivo frotando activamente, sopla suave para evaporar el solvente y fotopolimeriza.',
          listo:'Terminaste cuando toda la cavidad se ve con brillo parejo, sin zonas mate ni acumulaciones en los ángulos, y ya fotopolimerizaste el adhesivo antes de poner resina.',
          porque:['Frotar no es decorativo: mejora la penetración del adhesivo en la dentina. Aplicarlo y dejarlo quieto deja una capa que se despega.','El soplado evapora el solvente. Si queda solvente atrapado, el adhesivo no polimeriza bien y la interfase queda porosa. Una zona mate significa que ahí faltó adhesivo o sobró soplado.','Y el adhesivo se fotopolimeriza antes de poner la resina. Si lo dejas sin curar, la resina lo desplaza al condensarla.'],
          sub:[{ titulo:'dónde se equivoca la gente', parrafos:['Soplar fuerte y de cerca. Corre el adhesivo hacia un lado y deja los ángulos secos y el piso encharcado.','Saltarse la fotopolimerización del adhesivo para ahorrar tiempo.','Dejar el frasco abierto entre pacientes: el solvente se evapora y cambia la composición de lo que queda.'] }] },
        { corto:'Coloca la resina', hacer:'Coloca la resina en incrementos de hasta 2 mm, o en un solo bloque si usas una resina bulk-fill.',
          listo:'Terminaste cuando la resina reproduce la anatomía oclusal sin excesos sobre el esmalte sano y sin burbujas visibles en los ángulos.',
          porque:['Las dos técnicas funcionan. Un metaanálisis de 2025 sobre nueve ensayos clínicos y 632 restauraciones clase I y II no encontró diferencia en fracaso entre bulk-fill e incremental (RR 0,82; IC 95 % 0,33–2,01; p = 0,67), y tampoco en adaptación marginal, decoloración ni sensibilidad postoperatoria.','Lo que sí importa es respetar el límite de espesor del material que estás usando. Una resina convencional en un bloque de 4 mm no polimeriza en el fondo, y eso sí es un fracaso seguro.'],
          sub:[{ titulo:'¿y si mi caso es otro?', arbol:[
            { q:'¿Resina convencional?', a:'Incrementos de hasta 2 mm, cada uno fotopolimerizado por separado — tu caso.' },
            { q:'¿Resina bulk-fill, con indicación del fabricante hasta 4 mm?', a:'Un solo incremento hasta el espesor que indique el frasco. El último milímetro oclusal se puede terminar con resina convencional si quieres mejor pulido.' },
            { q:'¿Cavidad muy somera, menos de 2 mm de profundidad?', a:'Un solo incremento con cualquiera de las dos. La discusión no aplica.' }
          ] }] },
        { corto:'Fotopolimeriza bien', hacer:'Fotopolimeriza con la punta lo más cerca posible del material, paralela a la superficie, el tiempo que indique el fabricante.',
          listo:'Terminaste cuando polimerizaste cada incremento por separado y la superficie no se raya con el explorador.',
          porque:['La intensidad de la luz cae rápido con la distancia. El consenso de fotopolimerización es explícito: la punta va lo más cerca posible sin tocar, y paralela a la superficie. Sostenerla a varios milímetros o en ángulo es de los errores más frecuentes y más invisibles.','Invisible es la palabra clave: una resina mal polimerizada en el fondo se ve perfecta el día que la pones. El problema aparece meses después como sensibilidad o caries secundaria.'],
          sub:[
            { titulo:'lo que casi nadie sabe', parrafos:['La funda plástica de barrera que le pones a la lámpara puede reducir la irradiancia hasta un 40 % según la ADA. Si la usas — y deberías, por control de infecciones — hay que compensar con más tiempo de exposición.','Nadie mide esto en clínica. Es probablemente la causa silenciosa más común de restauraciones submicropolimerizadas.'] },
            { titulo:'dónde se equivoca la gente', parrafos:['Apoyar la punta en la cúspide y polimerizar en ángulo, dejando el fondo de la cavidad en sombra.','Usar una lámpara de alta potencia con los tiempos ultracortos de 1 a 5 segundos que promete el fabricante. El consenso advierte expresamente sobre eso.','No revisar nunca la salida de la lámpara.'] }
          ],
          aportes:[{ av:'RS', quien:'r.sepulveda', marca:'✓', txt:'Lo de la funda plástica de la lámpara es real y casi no se habla.', rol:'Especialista', cuando:'1 d', likes:'51 les pasó lo mismo' }] },
        { corto:'Ajusta oclusión y pule', hacer:'Retira el aislamiento, ajusta la oclusión contra el registro del paso 01 y pule.',
          listo:'Terminaste cuando el diente contacta como contactaba antes, el paciente no siente nada raro al morder y la superficie devuelve brillo sin enganchar el explorador en el margen.',
          porque:['El ajuste se hace sin dique: con el dique puesto la mordida no es la real. Por eso este paso viene después de retirar el aislamiento.','Aquí es donde sirve la foto del paso 01. Sin ella estás comparando contra tu memoria, y la memoria de hace cuarenta minutos con un paciente anestesiado no sirve.','El pulido no es estética: una superficie rugosa en el margen retiene placa justo donde empieza la caries secundaria.'],
          sub:[{ titulo:'cuánto dura esto en realidad', parrafos:['Un metaanálisis de 12 estudios con seguimiento de al menos cinco años, sobre 2.816 restauraciones posteriores, encontró que las dos razones principales de fracaso son caries secundaria y fractura.','El riesgo de fracaso depende más del riesgo de caries de la persona y del número de superficies restauradas que del material que uses. Una clase I es la de menos superficies, o sea la de mejor pronóstico que vas a hacer.','Si el paciente sigue con alto riesgo de caries, tu resina perfecta va a fallar igual. El control del riesgo no es un extra, es parte del tratamiento.'] }] }
      ]
    },

    'exodoncia-18': {
      esp:'Cirugía bucal',
      titulo:'Exodoncia simple del 1.8 erupcionado',
      bandera:'BORRADOR · SIETE FUENTES REALES VERIFICADAS · SIN REVISIÓN DE ESPECIALISTA',
      tags:['Tercer molar superior','Erupcionado','v0.1 · borrador','2 pasos críticos'],
      alcance:'exodoncia simple de tercer molar superior erupcionado, en paciente sano, sin infección activa y sin necesidad de colgajo ni ostectomía. No cubre dientes incluidos, semi-incluidos, ni exodoncia quirúrgica.',
      bandeja:[
        { fase:'Previo', items:['Consentimiento informado de cirugía firmado','Radiografía del diente a la vista','Clorhexidina 0,12 % para enjuague y 2 % para piel perioral'] },
        { fase:'Anestesia', items:['Jeringa carpule y agujas cortas','Lidocaína 2 % con epinefrina 1:100.000 — al menos 4 tubos disponibles'] },
        { fase:'Campo', items:['Campo estéril, gasas y aspiración quirúrgica','Lámpara bien orientada al sector posterior'] },
        { fase:'Exodoncia', items:['Sonda de caries para sindesmotomía','Elevador mediano recto','Fórceps inglés grueso','Cureta de Lucas y lima de hueso','Jeringa con suero fisiológico'] },
        { fase:'Cierre', items:['Gasas para compresión','Sutura por si hay que afrontar bordes','Indicaciones escritas impresas'] }
      ],
      evidencia:[
        { n:'01', grado:'Grado A · guía de agencia nacional', txt:'NICE: no hay indicación profiláctica sin patología.' },
        { n:'02', grado:'Grado B · población distinta', txt:'El gel intraalveolar reduce alveolitis; el enjuague previo no tiene ensayo.' },
        { n:'03', grado:'Ficha técnica FDA', txt:'Máximo 7 mg/kg de lidocaína, sin pasar de 500 mg.' },
        { n:'06', grado:'ECA + incidencia', txt:'Fractura de tuberosidad en 0,15–0,6 % de molares superiores.' },
        { n:'08', grado:'Estudio diagnóstico', txt:'Valsalva: 52 % de sensibilidad. No descarta comunicación.' },
        { n:'10', grado:'Revisión de revisiones', txt:'Profilaxis antibiótica selectiva, no rutinaria. NNT 18.' }
      ],
      nota:'Protocolo en borrador, construido sobre la secuencia que se usa hoy en clínica. Las siete referencias son reales y verificadas; los localizadores de párrafo están pendientes. Cuatro pasos quedan declarados sin respaldo de alto nivel. Ninguna versión debe usarse como estándar de atención hasta que un especialista en cirugía bucal la revise y la firme.',
      pasos:[
        { corto:'Confirma indicación y radiografía', hacer:'Confirma la indicación y mira la radiografía antes de anestesiar.',
          listo:'Terminaste cuando tienes por escrito cuál es la patología que justifica la exodoncia, y viste en la radiografía la forma de las raíces y su relación con el seno maxilar.',
          porque:['La guía NICE es tajante: la extracción profiláctica de terceros molares sin patología no está indicada. Hace falta una razón concreta: caries irrecuperable, patología pulpar o periapical no tratable, infección, resorción, fractura, o patología del folículo.','Y hay un matiz que casi siempre se pasa por alto: un primer episodio de pericoronitis no es indicación de exodoncia, salvo que sea grave. Los episodios recurrentes sí.','La radiografía te dice dos cosas que cambian la sesión: si las raíces son divergentes o están fusionadas, y qué tan cerca está el piso del seno maxilar.'],
          sub:[{ titulo:'ver fuente', fuentes:[{ grado:'Grado A · guía de agencia nacional', cita:'National Institute for Health and Care Excellence. Guidance on the extraction of wisdom teeth. NICE technology appraisal guidance TA1.', loc:'Sección 1, Recomendaciones · localizador de párrafo pendiente' }] }] },
        { corto:'Enjuague y posición', hacer:'Haz que el paciente se enjuague con clorhexidina al 0,12 % durante 1 minuto y ubícalo en decúbito supino.',
          listo:'Terminaste cuando completó el minuto completo y el respaldo del sillón quedó reclinado con el maxilar superior accesible sin que tengas que forzar la postura.',
          porque:['El enjuague baja la carga bacteriana antes de abrir un alveolo. Es una medida barata y sin riesgo.','La posición importa más de lo que parece en el 1.8: es el diente más posterior del maxilar y el acceso es malo. Si el paciente queda muy sentado, terminas trabajando con la muñeca en un ángulo que te quita fuerza controlada justo en el momento de luxar.'],
          sub:[{ titulo:'dónde no hay acuerdo', parrafos:['Lo que se enseña: el enjuague previo con clorhexidina reduce las complicaciones postoperatorias.','Lo que hay en realidad: la evidencia sólida de clorhexidina es sobre el gel intraalveolar aplicado después de la extracción, no sobre el enjuague de antes. Un metaanálisis de 10 ensayos y 862 pacientes mostró que el gel al 0,2 % colocado en el alveolo reduce la alveolitis un 57 % (RR 0,43; IC 95 % 0,32–0,58).','Y ese estudio es en terceros molares inferiores. La alveolitis seca es mucho más frecuente abajo que arriba, así que trasladar la cifra a un 1.8 es una extrapolación, no un dato.','El enjuague previo se mantiene por sentido común higiénico, no porque haya un ensayo que lo respalde para este caso.'] }] },
        { corto:'Anestesia vestibular y palatina', hacer:'Anestesia infiltrativa vestibular más punción palatina. Un tubo por diente antes de armar el campo.',
          listo:'Terminaste cuando el paciente no refiere dolor al presionar el surco vestibular con la sonda y la zona palatina adyacente está isquémica.',
          porque:['El maxilar posterior tiene hueso cortical delgado y poroso, así que la infiltración vestibular difunde bien y no hace falta troncular. La punción palatina cubre la fibromucosa palatina, que la infiltrativa vestibular no alcanza.','Un tubo por diente antes de empezar y un tubo más si aparece dolor al luxar es una pauta razonable: no sobreanestesias de entrada y tienes margen de sobra para reforzar.'],
          sub:[{ titulo:'cuánto margen tienes en realidad', parrafos:['Cuatro tubos de lidocaína al 2 % con epinefrina suman 144 mg — unos 36 mg por cartucho de 1,8 ml.','La ficha técnica de la FDA fija el máximo en 7 mg/kg, sin pasar de 500 mg. Para un adulto de 60 kg eso son 420 mg. Los 144 mg de dos exodoncias equivalen a cerca de un tercio del máximo.','Quedarse corto con la anestesia por miedo a la dosis es un error más frecuente que pasarse.'] }] },
        { corto:'Antisepsia y campo', marca:'sin evidencia',
          hacer:'Antisepsia peribucal con clorhexidina al 2 % y arma el campo estéril.',
          listo:'Terminaste cuando la piel perioral está tratada, el campo cubre y el instrumental está ordenado en el orden en que lo vas a usar.',
          sinEv:'Sin evidencia directa — práctica habitual de asepsia quirúrgica',
          porque:['El orden del instrumental no es manía: en el 1.8 el momento crítico dura segundos y no quieres estar buscando el fórceps con el elevador dentro de la boca.'] },
        { corto:'Sindesmotomía completa', marca:'sin evidencia',
          hacer:'Sindesmotomía con sonda de caries alrededor de todo el cuello.',
          listo:'Terminaste cuando la sonda recorre el perímetro completo sin encontrar resistencia de tejido blando y el paciente no refiere dolor.',
          sinEv:'Sin evidencia directa — práctica habitual, sin respaldo de alto nivel',
          porque:['Separar la encía antes de luxar evita desgarrarla cuando el diente salga. Un desgarro en la zona retromolar sangra más de lo que uno espera y complica ver el alveolo después.','Y hay una razón específica del 1.8: si el diente sale arrastrando encía, la primera señal de una comunicación al seno queda tapada por sangre.'],
          sub:[{ titulo:'dónde se equivoca la gente', parrafos:['Sindesmotomizar solo por vestibular porque es lo accesible. La cara palatina y la distal son justamente las que cuesta ver y las que se desgarran.'] }] },
        { corto:'Luxa sosteniendo la tuberosidad', marca:'paso crítico',
          disputa:'Aquí ocurre la complicación propia de este diente: la fractura de tuberosidad.',
          hacer:'Luxa con elevador mediano sosteniendo la tuberosidad con los dedos de la otra mano.',
          listo:'Terminaste cuando el diente tiene movilidad evidente y los dedos que sostienen la tuberosidad no perciben que se mueva el hueso junto con el diente.',
          porque:['La fractura de tuberosidad maxilar ocurre en 0,15 a 0,6 % de las extracciones de molares superiores. Es poco frecuente, pero cuando pasa cambia el procedimiento completo y puede terminar en derivación.','La mano que sostiene es tu sistema de alarma. Si sientes que se mueve un bloque en vez del diente, para. Un diente móvil se siente distinto de una tuberosidad móvil, y la diferencia solo se percibe con los dedos puestos ahí.','Un ensayo clínico sobre 100 extracciones de terceros molares superiores describe apoyar el segundo molar con el pulgar de la mano contraria y luxar en dirección oclusal y distal. En ese estudio la técnica más eficiente tuvo 3 fracturas de tuberosidad frente a 8 del grupo control.'],
          sub:[{ titulo:'¿y si sientes que se mueve el hueso?', arbol:[
            { q:'¿Se mueve solo el diente?', a:'Continúa con la luxación normal — tu caso.' },
            { q:'¿Se mueve un bloque de hueso junto con el diente?', a:'Detente. No sigas luxando ni tomes el fórceps. Avisa al docente antes de cualquier otro movimiento.' }
          ] }],
          aportes:[{ av:'RS', quien:'r.sepulveda', marca:'✓', txt:'La mano de apoyo es lo primero que el estudiante saca cuando se pone nervioso.', rol:'Especialista', cuando:'2 d', likes:'47 les pasó lo mismo' }] },
        { corto:'Prehensión y avulsión', marca:'sin evidencia',
          hacer:'Prehensión con fórceps y avulsión con movimiento controlado hacia vestibular y oclusal.',
          listo:'Terminaste cuando el diente sale completo y verificas que las raíces están íntegras comparándolas con la radiografía.',
          sinEv:'Sin evidencia directa para la dirección del movimiento — fundamento anatómico y práctica habitual',
          porque:['Comparar el diente extraído con la radiografía es el único modo de saber si quedó un ápice dentro. Hacerlo después, cuando el paciente ya se fue, no sirve de nada.','El movimiento es hacia vestibular porque la tabla vestibular del maxilar posterior es más delgada que la palatina. Forzar hacia palatino es empujar contra el hueso más grueso.'],
          sub:[{ titulo:'dónde se equivoca la gente', parrafos:['Botar el diente al chasquero sin mirarlo. Si falta un tercio apical, quieres saberlo ahora.','Hacer movimientos de rotación en un molar de tres raíces. La rotación es para dientes de raíz cónica única.'] }] },
        { corto:'Descarta comunicación al seno', marca:'paso que suele faltar',
          disputa:'No estaba en el protocolo original. Es la segunda complicación propia del 1.8 y la que más se pasa por alto.',
          hacer:'Descarta comunicación bucosinusal antes de soltar al paciente.',
          listo:'Terminaste cuando inspeccionaste el fondo del alveolo con buena luz y, si hay sospecha, mediste el defecto.',
          porque:['El piso del seno maxilar está justo encima de las raíces del 1.8. Si se abre una comunicación y nadie la ve, el paciente vuelve en unos días con paso de líquido por la nariz y una sinusitis instalada.','La maniobra de Valsalva — pedirle que sople con la nariz tapada y mirar si burbujea el alveolo — es lo que todos usan. Pero tiene apenas 52 % de sensibilidad: falla en casi la mitad de los casos reales. Un Valsalva negativo no descarta nada.','Por eso la inspección visual con buena luz manda sobre la maniobra.'],
          sub:[{ titulo:'¿y si hay comunicación?', arbol:[
            { q:'¿Defecto menor de 5 mm?', a:'Suele cerrar solo. Sutura de los bordes, indicaciones de no sonarse ni usar bombilla, y control. Avisa igual al docente — tu caso.' },
            { q:'¿Defecto entre 5 mm y 2 cm?', a:'Necesita cierre quirúrgico con colgajo. Fuera del alcance de este protocolo: requiere al docente o derivación.' },
            { q:'¿Defecto mayor de 2 cm?', a:'Derivación a cirugía maxilofacial.' }
          ] }],
          aportes:[{ av:'PT', quien:'p.tapia', txt:'Este paso me salvó una vez. El Valsalva salió negativo y al mirar bien había comunicación.', rol:'Cirujano dentista', cuando:'4 d', likes:'39 les pasó lo mismo' }] },
        { corto:'Alveolo, irrigación y hemostasia', marca:'sin evidencia',
          hacer:'Acondiciona el alveolo, irriga con suero fisiológico y logra hemostasia por compresión.',
          listo:'Terminaste cuando no quedan esquirlas ni bordes óseos filosos al pasar el dedo, y el coágulo se mantiene tras retirar la gasa a los 10 minutos.',
          sinEv:'Sin evidencia directa — práctica habitual, sin respaldo de alto nivel',
          porque:['Los bordes filosos duelen después y retrasan la cicatrización del tejido blando. Se revisan con el dedo, no con la vista.','La compresión local es suficiente en la gran mayoría de las exodoncias simples. Si a los 10 minutos sigue sangrando activamente, eso ya no es sangrado normal y hay que avisar.'],
          sub:[{ titulo:'dónde se equivoca la gente', parrafos:['Irrigar con fuerza directo al fondo del alveolo. Si hay una comunicación pequeña, le estás mandando suero al seno.','Legrar enérgicamente “para que sangre”. El coágulo se forma solo; el legrado agresivo destruye el hueso alveolar que lo sostiene.'] }] },
        { corto:'Indicaciones y analgesia', hacer:'Indicaciones orales y escritas, y analgesia. Sin antibiótico.',
          cond:'→ paciente sano, exodoncia simple, sin infección previa',
          listo:'Terminaste cuando el paciente puede repetirte con sus palabras qué no debe hacer, y lleva la receta escrita en la mano.',
          porque:['La pauta del protocolo es paracetamol 1 g cada 8 horas por 5 días más ketoprofeno 50 mg cada 8 horas por 3 días. El paracetamol suma 3 g diarios, dentro del límite habitual de 4 g en adulto sano.','El antibiótico no va, y hay evidencia detrás: una revisión de 16 revisiones sistemáticas concluye que la profilaxis antibiótica debe usarse de forma selectiva y no rutinaria. Reduce infecciones entre 57 y 71 %, pero el número necesario a tratar es 18 pacientes para evitar una infección.','Y el dato que decide en este caso: los terceros molares inferiores tienen diez veces más riesgo de infección que los superiores. Un 1.8 erupcionado en un paciente sano es el escenario de menor riesgo posible.'],
          sub:[{ titulo:'¿y si mi caso es otro?', arbol:[
            { q:'¿Paciente sano, exodoncia simple sin colgajo ni ostectomía?', a:'Sin antibiótico. Solo analgesia — tu caso.' },
            { q:'¿Hubo infección activa antes de la extracción?', a:'Ahí el antibiótico es tratamiento, no profilaxis. Decisión del docente.' }
          ] }] }
      ]
    }
  };
