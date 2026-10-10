// node scripts/pubmed.mjs buscar "consulta" ["otra consulta" …]   → 5 resultados por consulta: PMID · año · autor · título · revista · DOI
// node scripts/pubmed.mjs resumen PMID [PMID …]                    → resumen (abstract) completo
// node scripts/pubmed.mjs cita PMID [PMID …]                       → cita en formato Vancouver con su DOI, lista para «Fuentes»
// node scripts/pubmed.mjs pmc PMID "palabra" ["otra" …]            → si el artículo está libre en PMC, frases del texto completo con esas palabras
// Lo usan las clases de Materia (docs/MASTER_PROMPT_MATERIA.md) para verificar cada fuente. Solo lee la API pública de PubMed (E-utilities).
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const E = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const traer = async (url, tipo = 'json') => {
  for (let i = 0; i < 4; i++) {
    try { const r = await fetch(url); if (r.status === 429) { await espera(1500 * (i + 1)); continue; } if (!r.ok) throw new Error('HTTP ' + r.status); return tipo === 'json' ? r.json() : r.text(); }
    catch (e) { if (i === 3) throw e; await espera(1000 * (i + 1)); }
  }
};
const resumenes = async (ids) => (await traer(`${E}esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`)).result;
const doiDe = (d) => ((d.articleids || []).find((a) => a.idtype === 'doi') || {}).value || '';
export function citaDe(d) {
  const au = (d.authors || []).map((a) => a.name);
  const autores = au.length > 6 ? au.slice(0, 6).join(', ') + ', et al' : au.join(', ');
  return `${autores ? autores + '. ' : ''}${d.title.replace(/\.$/, '')}. ${d.source}. ${d.pubdate.slice(0, 4)};${d.volume || ''}${d.issue ? '(' + d.issue + ')' : ''}${d.pages ? ':' + d.pages : ''}.`;
}
export async function datosPubmed(ids) { await espera(350); return resumenes(ids); }

const [orden, ...args] = process.argv.slice(2);
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (orden === 'buscar') {
    for (const q of args) {
      const s = await traer(`${E}esearch.fcgi?db=pubmed&retmode=json&retmax=5&term=${encodeURIComponent(q)}`); await espera(350);
      const ids = s.esearchresult.idlist; console.log(`### ${q} (${s.esearchresult.count} resultados)`);
      if (!ids.length) continue;
      const r = await resumenes(ids); await espera(350);
      for (const id of ids) { const d = r[id]; console.log(`  ${id} · ${d.pubdate.slice(0, 4)} · ${(d.authors[0] || {}).name || '-'} · ${d.title} · ${d.source} · doi ${doiDe(d) || '-'}`); }
    }
  } else if (orden === 'resumen') {
    for (const id of args) { const t = await traer(`${E}efetch.fcgi?db=pubmed&id=${id}&rettype=abstract&retmode=text`, 'text'); console.log('=== ' + id + '\n' + t.trim() + '\n'); await espera(400); }
  } else if (orden === 'cita') {
    const r = await resumenes(args);
    for (const id of args) { const d = r[id]; if (!d || d.error) { console.log(`${id} · NO EXISTE`); continue; } console.log(`${id} | ${citaDe(d)} | doi ${doiDe(d) || '-'}`); }
  } else if (orden === 'pmc') {
    const [id, ...palabras] = args;
    const l = await traer(`${E}elink.fcgi?dbfrom=pubmed&db=pmc&id=${id}&retmode=json`); await espera(350);
    const pmc = (((l.linksets || [])[0] || {}).linksetdbs || []).find((x) => x.linkname === 'pubmed_pmc');
    if (!pmc) { console.log('No está libre en PMC.'); process.exit(0); }
    let t = await traer(`${E}efetch.fcgi?db=pmc&id=${pmc.links[0]}&rettype=xml`, 'text');
    t = t.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ');
    for (const p of palabras) {
      const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); let m, n = 0;
      while ((m = re.exec(t)) && n < 4) { console.log(`[${p}] …${t.slice(Math.max(0, m.index - 220), m.index + 260)}…\n`); n++; }
      if (!n) console.log(`[${p}] sin coincidencias`);
    }
  } else {
    console.log('Uso: node scripts/pubmed.mjs buscar|resumen|cita|pmc …');
  }
}
