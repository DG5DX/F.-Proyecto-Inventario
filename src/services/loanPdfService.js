import senaLogoUrl from '../assets/sena_logo.jpg';
const VERDE      = [57, 169, 0];
const VERDE_OSC  = [26, 79, 0];
const NEGRO      = [17, 17, 17];
const GRIS       = [100, 100, 100];
const GRIS_CLARO = [240, 240, 240];
const BLANCO     = [255, 255, 255];

const ML = 10, MR = 10, CW = 190, PH = 297;


function pad(n) { return String(n).padStart(2, '0'); }
function formatDate(d) {
    if (!d) return '_______________';
    const dt = new Date(d);
    return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}
function monthName(d) {
    if (!d) return '_______________';
    return new Date(d).toLocaleString('es-CO', { month: 'long' });
}
function dayNum(d)  { if (!d) return '___';  return pad(new Date(d).getDate()); }
function yearFull(d){ if (!d) return '____'; return String(new Date(d).getFullYear()); }
function truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function cargarJsPDF() {
    return new Promise((resolve, reject) => {
        if (window.jspdf?.jsPDF) { resolve(window.jspdf.jsPDF); return; }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload  = () => window.jspdf?.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error('jsPDF no disponible'));
        script.onerror = () => reject(new Error('Error al cargar jsPDF'));
        document.head.appendChild(script);
    });
}

async function precargarLogo() {
    if (drawHeader._logoB64) return; 
    try {
        const resp = await fetch(senaLogoUrl);
        const blob = await resp.blob();
        drawHeader._logoB64 = await new Promise((res) => {
            const r = new FileReader();
            r.onloadend = () => res(r.result);
            r.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn('No se pudo cargar el logo SENA:', e.message);
    }
}

export async function generarPdfSalida(loan) {
    let JsPDF;
    try { JsPDF = await cargarJsPDF(); }
    catch (e) {
        alert('No se pudo cargar la librería PDF. Verifica tu conexión a internet.');
        console.error(e); return;
    }

    await precargarLogo();

    const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    let y = ML;
    y = drawHeader(doc, y);
    y = drawAutorizacion(doc, loan, y + 3);
    y = drawItemsTable(doc, loan, y + 2);
    y = drawCuentadante(doc, loan, y + 2);
    y = drawTipoPermiso(doc, y + 2);
    y = drawFechas(doc, loan, y + 2);
    y = drawFirmas(doc, y + 4);
    drawPorteria(doc, y + 2);
    drawFooter(doc);

    const idCorto = (loan._id || 'prestamo').toString().slice(-8).toUpperCase();
    doc.save(`autorizacion_salida_${idCorto}.pdf`);
}


function R(doc, x, y, w, h, { fill, stroke, lw = 0.3 } = {}) {
    if (fill)   { doc.setFillColor(...fill);   doc.rect(x, y, w, h, 'F'); }
    if (stroke) { doc.setDrawColor(...stroke); doc.setLineWidth(lw); doc.rect(x, y, w, h, 'S'); }
}
function T(doc, text, x, y, { size = 8, bold = false, color = NEGRO, align = 'left' } = {}) {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    doc.text(String(text), x, y, { align });
}
function L(doc, x1, y1, x2, y2, color = GRIS, lw = 0.2) {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    doc.line(x1, y1, x2, y2);
}

function _drawLogoFallback(doc, y, logoW, totalH) {
    R(doc, ML, y, logoW, totalH, { fill: VERDE_OSC });
    T(doc, 'SENA', ML + logoW / 2, y + 9,    { size: 14, bold: true, color: BLANCO, align: 'center' });
    T(doc, 'SERVICIO NACIONAL',  ML + logoW / 2, y + 13.5, { size: 5, color: BLANCO, align: 'center' });
    T(doc, 'DE APRENDIZAJE',     ML + logoW / 2, y + 16.5, { size: 5, color: BLANCO, align: 'center' });
    T(doc, 'Regional Santander', ML + logoW / 2, y + 19.5, { size: 4.5, color: BLANCO, align: 'center' });
}

function drawHeader(doc, y) {
    R(doc, ML, y, CW, 1.5, { fill: VERDE });
    y += 2;
    const totalH = 22, logoW = 30, infoW = 32;
    const titleW = CW - logoW - infoW - 4;

    R(doc, ML, y, logoW, totalH, { fill: BLANCO, stroke: VERDE, lw: 0.5 });
    if (drawHeader._logoB64) {
        try { doc.addImage(drawHeader._logoB64, 'PNG', ML + 1, y + 1, logoW - 2, totalH - 2); } catch(e) { _drawLogoFallback(doc, y, logoW, totalH); }
    } else {
        _drawLogoFallback(doc, y, logoW, totalH);
    }

    const tx = ML + logoW + 2;
    R(doc, tx, y, titleW, totalH, { stroke: VERDE });
    const lines = [
        'SERVICIO NACIONAL DE APRENDIZAJE - SENA',
        'SISTEMA INTEGRADO DE GESTIÓN Y AUTOCONTROL',
        'PROCESO GESTIÓN DE INFRAESTRUCTURA Y LOGISTICA',
        '',
        'AUTORIZACIÓN PRÉSTAMO Y SALIDA DE ELEMENTOS,',
        'MÁQUINAS Y EQUIPOS DE LAS DEPENDENCIAS',
    ];
    let ty = y + 4.5;
    lines.forEach(l => { if (l) T(doc, l, tx + titleW / 2, ty, { size: 6, bold: true, align: 'center' }); ty += 3.2; });

    const ix = tx + titleW + 2;
    R(doc, ix, y, infoW, totalH, { stroke: VERDE });
    T(doc, 'Versión: 2',          ix + 2, y + 5,    { size: 6, bold: true });
    T(doc, 'Fecha de actualización:', ix + 2, y + 9, { size: 5, color: GRIS });
    T(doc, '01/03/2017',          ix + 2, y + 12.5, { size: 5.5 });
    T(doc, 'Documento de apoyo',  ix + 2, y + 16.5, { size: 5, color: GRIS });
    T(doc, 'Regional Santander.', ix + 2, y + 19.5, { size: 5, color: GRIS });

    y += totalH + 1;
    R(doc, ML, y, CW, 1.5, { fill: VERDE });
    return y + 2.5;
}

function drawAutorizacion(doc, loan, y) {
    const h = 14;
    R(doc, ML, y, CW, h, { stroke: VERDE });
    const nombre  = loan.usuario?.nombre || '______________________________________';
    const dia     = dayNum(loan.fecha_prestamo  || loan.createdAt);
    const mes     = monthName(loan.fecha_prestamo || loan.createdAt);
    const anio    = yearFull(loan.fecha_prestamo || loan.createdAt);
    const idPrest = (loan._id || '').toString().slice(-8).toUpperCase();

    T(doc, `San Gil, a los ${dia} días del mes de ${mes} de ${anio}   |   N.° de préstamo: #${idPrest}`, ML + 3, y + 4,   { size: 7 });
    T(doc, `El (la) señor(a) ${truncate(nombre, 55)}, está autorizado(a) para retirar de las instalaciones del Centro Agroturístico,`, ML + 3, y + 8.5, { size: 7 });
    T(doc, 'SENA Regional Santander, los siguientes elementos:', ML + 3, y + 12.5, { size: 7 });
    return y + h;
}

function drawItemsTable(doc, loan, y) {
    const cols = [
        { label: 'CANTIDAD',                 w: 18 },
        { label: 'CÓDIGO INTERNO / PLACA',   w: 42 },
        { label: 'CATEGORÍA',               w: 35 },
        { label: 'DESCRIPCIÓN DEL ELEMENTO', w: CW - 18 - 42 - 35 },
    ];
    let cx = ML;
    cols.forEach(c => { c.x = cx; cx += c.w; });

    const headerH = 6, rowH = 5.5, maxRows = 10;

    R(doc, ML, y, CW, headerH, { fill: VERDE });
    cols.forEach((col, i) => {
        if (i > 0) L(doc, col.x, y, col.x, y + headerH, BLANCO, 0.2);
        T(doc, col.label, col.x + col.w / 2, y + 4, { size: 5.5, bold: true, color: BLANCO, align: 'center' });
    });

    const aprobados = (loan.items || []).filter(li => ['Aprobado', 'Devuelto', 'Usado'].includes(li.estado_item));

    for (let r = 0; r < maxRows; r++) {
        const ry = y + headerH + r * rowH;
        const li = aprobados[r];
        const bg = r % 2 === 0 ? BLANCO : [244, 251, 237];
        R(doc, ML, ry, CW, rowH, { fill: bg, stroke: [200, 200, 200], lw: 0.15 });

        if (li) {
            const item   = li.item || {};
            const cant   = String(li.cantidad_aprobada ?? li.cantidad_prestamo ?? '-');
            const placa  = item.numero_placa || '-';
            const tipo   = item.tipo_categoria || '-';
            const nombre = item.nombre || '-';
            T(doc, cant,               cols[0].x + cols[0].w / 2, ry + 3.8, { size: 7,   align: 'center' });
            T(doc, truncate(placa, 22),cols[1].x + cols[1].w / 2, ry + 3.8, { size: 6.5, align: 'center' });
            T(doc, truncate(tipo, 18), cols[2].x + cols[2].w / 2, ry + 3.8, { size: 6,   color: GRIS, align: 'center' });
            T(doc, truncate(nombre,55),cols[3].x + 2,             ry + 3.8, { size: 7 });
        }
        cols.forEach((col, i) => { if (i > 0) L(doc, col.x, ry, col.x, ry + rowH, [187,187,187], 0.15); });
    }
    R(doc, ML, y, CW, headerH + maxRows * rowH, { stroke: VERDE, lw: 0.4 });
    return y + headerH + maxRows * rowH;
}

function drawCuentadante(doc, loan, y) {
    const h = 7;
    R(doc, ML, y, CW, h, { stroke: VERDE });
    // Tomar el cuentadante del primer ítem aprobado del préstamo
    const aprobados = (loan?.items || []).filter(li => ['Aprobado', 'Devuelto', 'Usado'].includes(li.estado_item));
    // Si el préstamo tiene cuentadante_principal seleccionado al aprobar, usarlo; si no, tomar del primer ítem
    const cuentadante = loan.cuentadante_principal || aprobados[0]?.item?.cuentadante;
    const nombreCuentadante = cuentadante?.nombre || '______________________________________';
    T(doc, `Cuentadante Principal:  Nombre completo: ${nombreCuentadante}  Firma: _______________________________`, ML + 3, y + 4.5, { size: 6.5 });
    return y + h;
}

function drawTipoPermiso(doc, y) {
    T(doc, 'En calidad de:', ML, y + 3.5, { size: 6.5, bold: true, color: VERDE_OSC });
    y += 5;
    const bw = (CW - 8) / 3, bh = 16;
    const tipos = [
        { label: 'Permiso Temporal    (   )',    desc: 'El elemento tiene autorización para salir y regresa en la fecha establecida, por una sola vez. (Registrar la salida y entrada del elemento).' },
        { label: 'Permiso Permanente  (   )',    desc: 'El elemento tiene autorización para salir y regresa varias veces en el periodo de tiempo establecido. (Registrar salidas y entradas del elemento).' },
        { label: 'Retiro Definitivo    (   )',   desc: 'El elemento tiene autorización para salir y no vuelve a ingresar.' },
    ];
    tipos.forEach((t, i) => {
        const bx = ML + i * (bw + 4);
        R(doc, bx, y, bw, bh, { stroke: VERDE, lw: 0.3 });
        R(doc, bx + 2, y + 2.5, 3.5, 3.5, { stroke: VERDE_OSC, lw: 0.4 });
        T(doc, t.label, bx + 7, y + 5, { size: 6, bold: true, color: VERDE_OSC });
        doc.setFontSize(5.5); doc.setFont('helvetica','normal'); doc.setTextColor(...GRIS);
        const wrapped = doc.splitTextToSize(t.desc, bw - 4);
        doc.text(wrapped, bx + 2, y + 9);
    });
    return y + bh;
}

function drawFechas(doc, loan, y) {
    const h = 11;
    R(doc, ML, y, CW, h, { stroke: VERDE });
    const fechaSalida  = formatDate(loan.fecha_prestamo);
    const fechaRegreso = formatDate(loan.fecha_estimada || loan.fecha_retorno);
    const aulaName     = loan.items?.[0]?.aula?.nombre || '_______________________________';
    T(doc, `Fecha de salida autorizada:  ${fechaSalida}`,   ML + 3,      y + 4.5, { size: 7 });
    T(doc, `Fecha de regreso autorizada:  ${fechaRegreso}`, ML + 3,      y + 9,   { size: 7 });
    T(doc, `Préstamo del ambiente:  ${truncate(aulaName, 35)}`,     ML + CW / 2, y + 4.5, { size: 7 });
    T(doc, `Préstamo con destino a:  ${truncate(loan.destino_salida || '____________________', 30)}`,   ML + CW / 2, y + 9,   { size: 7 });
    L(doc, ML + CW / 2 + 24, y + 5.5, ML + CW - 2, y + 5.5, GRIS, 0.2);
    
    return y + h;
}

function drawFirmas(doc, y) {
    const fw = (CW - 12) / 3;
    ['Verificación Inventarios','V°B° Coordinación del solicitante','Solicitante de los elementos'].forEach((label, i) => {
        const fx = ML + i * (fw + 6);
        L(doc, fx + 3, y + 6, fx + fw - 3, y + 6, VERDE, 0.4);
        T(doc, label, fx + fw / 2, y + 10, { size: 6, bold: true, color: VERDE_OSC, align: 'center' });
        T(doc, 'Nombre: ________________________________', fx + fw / 2, y + 14, { size: 5.5, color: GRIS, align: 'center' });
    });
    return y + 16;
}

function drawPorteria(doc, y) {
    R(doc, ML, y, CW, 5.5, { fill: VERDE_OSC });
    T(doc, 'ESPACIO PARA USO EXCLUSIVO DEL PERSONAL DE VIGILANCIA Y PORTERÍA', ML + CW / 2, y + 3.8, { size: 6, bold: true, color: BLANCO, align: 'center' });
    y += 6;
    const half = (CW - 3) / 2;
    ['SALIDA','ENTRADA'].forEach((label, col) => {
        const bx = ML + col * (half + 3);
        R(doc, bx, y, half, 5, { fill: VERDE });
        T(doc, label, bx + half / 2, y + 3.5, { size: 7, bold: true, color: BLANCO, align: 'center' });
        const subW = half / 3;
        ['FECHA','HORA','FIRMA VIGILANTE'].forEach((sl, si) => {
            const sx = bx + si * subW;
            R(doc, sx, y + 5, subW, 4.5, { fill: GRIS_CLARO, stroke: [180,180,180], lw: 0.15 });
            T(doc, sl, sx + subW / 2, y + 8.2, { size: 5, color: GRIS, align: 'center' });
        });
        for (let r = 0; r < 3; r++) {
            const ry = y + 9.5 + r * 5.5;
            for (let si = 0; si < 3; si++) {
                R(doc, bx + si * subW, ry, subW, 5.5, { stroke: [200,200,200], lw: 0.15 });
            }
        }
        R(doc, bx, y, half, 5 + 4.5 + 3 * 5.5, { stroke: VERDE, lw: 0.5 });
    });
}

function drawFooter(doc) {
    const y = PH - 10;
    R(doc, ML, y, CW, 0.8, { fill: VERDE });
    T(doc, 'Este permiso se debe dejar en la portería y debe ser diligenciado de acuerdo a la autorización otorgada al solicitante.', ML + CW / 2, y + 3.5, { size: 5.5, color: GRIS, align: 'center' });
    T(doc, 'Sistema de Inventario · Centro Agroturístico SENA Regional Santander', ML + CW / 2, y + 6.5, { size: 5, color: GRIS, align: 'center' });
}