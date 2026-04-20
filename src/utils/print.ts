import { Pedido, Pago, Mesa, Producto } from '@/types';

interface PrintReceiptParams {
  pedido: Pedido;
  mesa: Mesa;
  productos: Producto[];
  pago?: Pago & { recibido?: number; propina?: number };
  restauranteNombre?: string;
}

interface PrintComandaParams {
  pedido: Pedido;
  mesa: Mesa;
  productos: Producto[];
  meseroNombre?: string;
  nuevosIds?: string[]; // IDs de los items nuevos a destacar
}

const RESTAURANTE = 'Comanda | POS';
const LINEA = '─'.repeat(32);
const LINEA_DOBLE = '═'.repeat(32);

function pad(text: string, width: number, align: 'left' | 'right' = 'left'): string {
  const str = String(text);
  if (str.length >= width) return str.slice(0, width);
  const spaces = ' '.repeat(width - str.length);
  return align === 'right' ? spaces + str : str + spaces;
}

function row(left: string, right: string, width = 32): string {
  const maxLeft = width - right.length - 1;
  const l = left.length > maxLeft ? left.slice(0, maxLeft - 1) + '…' : left;
  return pad(l, width - right.length) + right;
}

// ── Recibo para cliente (Caja) ──────────────────────────────────────────────
export function buildReceiptHTML(params: PrintReceiptParams): string {
  const { pedido, mesa, productos, pago, restauranteNombre = RESTAURANTE } = params;
  const now = new Date();
  const fecha = now.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora  = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  const subtotal = pedido.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const impuesto = subtotal * 0.16;
  const propina  = pago?.propina || 0;
  const total    = subtotal + impuesto + propina;
  const recibido = pago?.recibido || 0;
  const cambio   = recibido - total;

  const itemsHTML = pedido.items.map(item => {
    const prod = productos.find(p => p.id === item.productoId);
    const nombre = prod?.nombre || 'Producto';
    const lineTotal = `$${(item.precio * item.cantidad).toFixed(2)}`;
    return `
      <div class="item-row">
        <div class="item-name">${item.cantidad}x ${nombre}</div>
        <div class="item-price">${lineTotal}</div>
      </div>
      ${item.notas ? `<div class="item-note">  ↳ ${item.notas}</div>` : ''}
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Recibo Mesa #${mesa.numero}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    width: 80mm;
    max-width: 80mm;
    padding: 4mm 4mm 8mm;
    color: #000;
    background: #fff;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .large { font-size: 16px; }
  .xlarge { font-size: 20px; }
  .divider { border-top: 1px dashed #000; margin: 3mm 0; }
  .divider-solid { border-top: 2px solid #000; margin: 3mm 0; }
  .logo { font-size: 22px; font-weight: bold; letter-spacing: 1px; margin-bottom: 2mm; }
  .subtitle { font-size: 10px; color: #555; margin-bottom: 1mm; }
  .meta { font-size: 10px; margin-bottom: 1mm; }
  .item-row { display: flex; justify-content: space-between; margin: 1mm 0; }
  .item-name { flex: 1; word-break: break-word; }
  .item-price { white-space: nowrap; padding-left: 4px; font-weight: bold; }
  .item-note { font-size: 10px; color: #666; margin-bottom: 1mm; font-style: italic; }
  .total-row { display: flex; justify-content: space-between; margin: 0.5mm 0; }
  .grand-total { font-size: 16px; font-weight: bold; }
  .cambio { font-size: 14px; font-weight: bold; color: #000; }
  .footer { font-size: 10px; color: #555; text-align: center; margin-top: 3mm; }
  .barcode { margin: 3mm auto; font-size: 10px; text-align: center; }
  @media print {
    body { width: 80mm; }
    @page { size: 80mm auto; margin: 0; }
  }
</style>
</head>
<body>
  <div class="center">
    <div class="logo">${restauranteNombre}</div>
    <div class="subtitle">Sistema de Gestión de Restaurante</div>
  </div>
  <div class="divider"></div>
  <div class="meta">Fecha: ${fecha}  Hora: ${hora}</div>
  <div class="meta bold large">Mesa #${mesa.numero}${pedido.cliente ? ` — ${pedido.cliente}` : ''}</div>
  <div class="meta">Pedido: #${pedido.id.slice(0, 8).toUpperCase()}</div>
  <div class="divider"></div>
  <div class="bold" style="margin-bottom:2mm">DETALLE DEL CONSUMO</div>
  ${itemsHTML}
  <div class="divider"></div>
  <div class="total-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
  <div class="total-row"><span>IVA (16%)</span><span>$${impuesto.toFixed(2)}</span></div>
  ${propina > 0 ? `<div class="total-row"><span>Propina</span><span>$${propina.toFixed(2)}</span></div>` : ''}
  <div class="divider-solid"></div>
  <div class="total-row grand-total"><span>TOTAL</span><span>$${total.toFixed(2)}</span></div>
  ${pago ? `
  <div class="divider"></div>
  <div class="total-row"><span>Método</span><span class="bold">${pago.metodoPago.toUpperCase()}</span></div>
  ${recibido > 0 ? `<div class="total-row"><span>Recibido</span><span>$${recibido.toFixed(2)}</span></div>` : ''}
  ${cambio > 0 ? `<div class="total-row cambio"><span>CAMBIO</span><span>$${cambio.toFixed(2)}</span></div>` : ''}
  ` : ''}
  <div class="divider"></div>
  <div class="footer">
    ¡Gracias por su visita!<br/>
    Vuelva pronto 🍽️
  </div>
  <div class="barcode">${pedido.id.slice(0, 16).toUpperCase()}</div>
</body>
</html>`;
}

// ── Comanda para cocina/barra ───────────────────────────────────────────────
export function buildComandaHTML(params: PrintComandaParams): string {
  const { pedido, mesa, productos, meseroNombre, nuevosIds = [] } = params;
  
  // Si se pasa area, filtramos solo los items de esa área
  // Si no se pasa area, se procesan los items filtrados por nuevosIds
  const itemsBase = nuevosIds.length > 0
    ? pedido.items.filter(i => nuevosIds.includes(i.id))
    : pedido.items;

  return buildComandaAreaHTML({ ...params, items: itemsBase });
}

interface PrintComandaAreaParams extends PrintComandaParams {
  items: Pedido['items'];
  areaTitle?: string;
}

export function buildComandaAreaHTML(params: PrintComandaAreaParams): string {
  const { pedido, mesa, productos, meseroNombre, items, areaTitle } = params;
  const hora = new Date(pedido.fecha).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  const ahora = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  const renderItems = (itemsToRender: typeof items) => itemsToRender.map(item => {
    const prod = productos.find(p => p.id === item.productoId);
    return `
      <div class="comanda-item">
        <span class="qty">×${item.cantidad}</span>
        <span class="nombre">${prod?.nombre || 'Producto'}</span>
      </div>
      ${item.notas ? `<div class="nota">  📝 ${item.notas}</div>` : ''}
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Comanda Mesa #${mesa.numero}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    width: 80mm;
    max-width: 80mm;
    padding: 4mm 4mm 8mm;
    color: #000;
    background: #fff;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 3mm 0; }
  .divider-solid { border-top: 3px solid #000; margin: 3mm 0; }
  .mesa-header { font-size: 28px; font-weight: bold; text-align: center; margin: 2mm 0; }
  .area-header { font-size: 14px; font-weight: bold; background: #000; color: #fff; padding: 1mm 2mm; margin: 2mm 0; text-align: center; }
  .comanda-item { display: flex; gap: 8px; align-items: baseline; margin: 2mm 0; }
  .qty { font-size: 20px; font-weight: bold; min-width: 30px; }
  .nombre { font-size: 15px; font-weight: bold; }
  .nota { font-size: 11px; color: #555; margin: 1mm 0 2mm 8px; font-style: italic; }
  .meta { font-size: 10px; margin: 0.5mm 0; }
  @media print {
    body { width: 80mm; }
    @page { size: 80mm auto; margin: 0; }
  }
</style>
</head>
<body>
  <div class="divider-solid"></div>
  <div class="mesa-header">MESA #${mesa.numero}</div>
  ${pedido.cliente ? `<div class="center bold">${pedido.cliente}</div>` : ''}
  <div class="divider-solid"></div>
  <div class="meta">Pedido: ${hora} | Impreso: ${ahora}</div>
  ${meseroNombre ? `<div class="meta">Mesero: ${meseroNombre}</div>` : ''}
  <div class="divider"></div>
  ${areaTitle ? `<div class="area-header">${areaTitle}</div>` : ''}
  ${renderItems(items)}
  ${pedido.observaciones ? `<div class="divider"></div><div class="meta bold">Obs: ${pedido.observaciones}</div>` : ''}
  <div class="divider"></div>
  <div class="center" style="font-size:10px">─────────────────────</div>
</body>
</html>`;
}

// ── Función que abre ventana de impresión ───────────────────────────────────
export function printHTML(html: string, onDone?: () => void): void {
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) {
    alert('Habilita las ventanas emergentes para imprimir');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
    onDone?.();
  }, 400);
}

export function printReceipt(params: PrintReceiptParams, onDone?: () => void): void {
  printHTML(buildReceiptHTML(params), onDone);
}

export function printComanda(params: PrintComandaParams, separada = false, onDone?: () => void): void {
  const { pedido, productos, nuevosIds = [] } = params;
  
  const itemsToPrint = nuevosIds.length > 0
    ? pedido.items.filter(i => nuevosIds.includes(i.id))
    : pedido.items;

  if (separada) {
    const cocina = itemsToPrint.filter(i => productos.find(p => p.id === i.productoId)?.area === 'cocina');
    const barra  = itemsToPrint.filter(i => productos.find(p => p.id === i.productoId)?.area === 'barra');

    // Imprimir cocina
    if (cocina.length > 0) {
      const htmlCocina = buildComandaAreaHTML({ ...params, items: cocina, areaTitle: '🍳 COCINA' });
      printHTML(htmlCocina);
    }

    // Imprimir barra (con un pequeño delay para no saturar el bloqueador de popups si es posible)
    if (barra.length > 0) {
      const htmlBarra = buildComandaAreaHTML({ ...params, items: barra, areaTitle: '🍺 BARRA' });
      setTimeout(() => printHTML(htmlBarra, onDone), 1000);
    } else {
      onDone?.();
    }
  } else {
    // Modo tradicional (todo junto)
    const cocina = itemsToPrint.filter(i => productos.find(p => p.id === i.productoId)?.area === 'cocina');
    const barra  = itemsToPrint.filter(i => productos.find(p => p.id === i.productoId)?.area === 'barra');
    
    // Reconstruimos la lógica original de "todo junto" pero usando el nuevo helper
    let html = buildComandaAreaHTML({ ...params, items: itemsToPrint });
    // Inyectamos los títulos manualmente si queremos mantener el estilo anterior en modo "todo junto"
    // O podemos simplificar buildComandaAreaHTML para que acepte grupos.
    // Vamos a parchear buildComandaAreaHTML para que maneje el caso "todo junto" con separadores internos.
    
    printHTML(buildComandaCombinedHTML(params), onDone);
  }
}

export function buildComandaCombinedHTML(params: PrintComandaParams): string {
  const { pedido, mesa, productos, meseroNombre, nuevosIds = [] } = params;
  const hora = new Date(pedido.fecha).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  const ahora = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  const itemsToPrint = nuevosIds.length > 0
    ? pedido.items.filter(i => nuevosIds.includes(i.id))
    : pedido.items;

  const cocina = itemsToPrint.filter(i => productos.find(p => p.id === i.productoId)?.area === 'cocina');
  const barra  = itemsToPrint.filter(i => productos.find(p => p.id === i.productoId)?.area === 'barra');

  const renderItems = (items: typeof itemsToPrint) => items.map(item => {
    const prod = productos.find(p => p.id === item.productoId);
    return `
      <div class="comanda-item">
        <span class="qty">×${item.cantidad}</span>
        <span class="nombre">${prod?.nombre || 'Producto'}</span>
      </div>
      ${item.notas ? `<div class="nota">  📝 ${item.notas}</div>` : ''}
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Comanda Mesa #${mesa.numero}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    width: 80mm;
    max-width: 80mm;
    padding: 4mm 4mm 8mm;
    color: #000;
    background: #fff;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 3mm 0; }
  .divider-solid { border-top: 3px solid #000; margin: 3mm 0; }
  .mesa-header { font-size: 28px; font-weight: bold; text-align: center; margin: 2mm 0; }
  .area-header { font-size: 14px; font-weight: bold; background: #000; color: #fff; padding: 1mm 2mm; margin: 2mm 0; text-align: center; }
  .comanda-item { display: flex; gap: 8px; align-items: baseline; margin: 2mm 0; }
  .qty { font-size: 20px; font-weight: bold; min-width: 30px; }
  .nombre { font-size: 15px; font-weight: bold; }
  .nota { font-size: 11px; color: #555; margin: 1mm 0 2mm 8px; font-style: italic; }
  .meta { font-size: 10px; margin: 0.5mm 0; }
  @media print {
    body { width: 80mm; }
    @page { size: 80mm auto; margin: 0; }
  }
</style>
</head>
<body>
  <div class="divider-solid"></div>
  <div class="mesa-header">MESA #${mesa.numero}</div>
  ${pedido.cliente ? `<div class="center bold">${pedido.cliente}</div>` : ''}
  <div class="divider-solid"></div>
  <div class="meta">Pedido: ${hora} | Impreso: ${ahora}</div>
  ${meseroNombre ? `<div class="meta">Mesero: ${meseroNombre}</div>` : ''}
  ${nuevosIds.length > 0 ? '<div class="meta bold" style="color:#000;background:#eee;padding:1mm">⚡ ADICIÓN AL PEDIDO</div>' : ''}
  <div class="divider"></div>
  ${cocina.length > 0 ? `<div class="area-header">🍳 COCINA</div>${renderItems(cocina)}` : ''}
  ${cocina.length > 0 && barra.length > 0 ? '<div class="divider"></div>' : ''}
  ${barra.length > 0 ? `<div class="area-header">🍺 BARRA</div>${renderItems(barra)}` : ''}
  ${pedido.observaciones ? `<div class="divider"></div><div class="meta bold">Obs: ${pedido.observaciones}</div>` : ''}
  <div class="divider"></div>
  <div class="center" style="font-size:10px">─────────────────────</div>
</body>
</html>`;
}

// ── Comprobante de Egreso (Gastos) ──────────────────────────────────────────
export function buildEgresoHTML(mov: {
  id: string,
  monto: number,
  descripcion: string,
  categoria: string,
  fecha: string,
  usuarioNombre?: string
}): string {
  const fechaStr = new Date(mov.fecha).toLocaleDateString();
  const horaStr  = new Date(mov.fecha).toLocaleTimeString();

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Comprobante de Egreso</title>
<style>
  body { font-family: 'Courier New', Courier, monospace; font-size: 13px; width: 80mm; padding: 4mm; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .large { font-size: 16px; }
  .border { border: 1px solid #000; padding: 2mm; margin: 2mm 0; }
  .divider { border-top: 1px dashed #000; margin: 3mm 0; }
</style>
</head>
<body>
  <div class="center bold large">COMPROBANTE DE EGRESO</div>
  <div class="center">${RESTAURANTE}</div>
  <div class="divider"></div>
  <p><span class="bold">N°:</span> ${mov.id.slice(0, 8).toUpperCase()}</p>
  <p><span class="bold">Fecha:</span> ${fechaStr} ${horaStr}</p>
  <p><span class="bold">Categoría:</span> ${mov.categoria.toUpperCase()}</p>
  <div class="border">
    <p class="bold">CONCEPTO:</p>
    <p>${mov.descripcion}</p>
  </div>
  <p class="large bold center" style="background:#000; color:#fff; padding:1mm;">
    VALOR: $${mov.monto.toFixed(2)}
  </p>
  <div class="divider"></div>
  <p class="bold">Atentamente:</p>
  <p>${mov.usuarioNombre || 'Administración'}</p>
  <br/><br/>
  <div style="border-top: 1px solid #000; text-align: center; font-size: 10px; margin-top: 5mm;">
    Firma / Sello Recibido
  </div>
</body>
</html>`;
}

export function printEgreso(mov: any, onDone?: () => void): void {
  printHTML(buildEgresoHTML(mov), onDone);
}
