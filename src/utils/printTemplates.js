export const generateBillHtml = (order, settings) => {
    const formatCurrency = (amount) => Number(amount).toFixed(2);
    // const taxableAmount = order.totalAmount - order.taxAmount - (order.roundOff || 0);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page { margin: 0; }
            body { 
                font-family: 'Arial', 'Helvetica', sans-serif; 
                width: auto;
                margin: 0; 
                padding: 0; 
                background: white; 
                color: black;
                font-size: 11px;
                line-height: 1.3;
            }
            .container { 
                width: 68mm; 
                margin: 0; 
                padding-right: 4mm;
                padding-bottom: 20px;
                box-sizing: border-box;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            
            .header { margin-bottom: 5px; }
            .store-name { font-size: 16px; font-weight: 800; margin-bottom: 4px; }
            .store-info { font-size: 11px; margin-bottom: 2px; }
            
            .divider { border-top: 1px solid black; margin: 4px 0; }
            .divider-dashed { border-top: 1px dashed black; margin: 4px 0; }
            
            .metadata-grid { display: flex; flex-wrap: wrap; margin-bottom: 5px; }
            .meta-item { width: 50%; display: flex; margin-bottom: 2px; }
            .meta-label { font-weight: bold; margin-right: 5px; }
            
            .table-header { display: flex; font-weight: bold; border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 0; margin: 5px 0; font-size: 11px; }
            .col-item { flex: 2; text-align: left; padding-right: 2px; }
            .col-qty { width: 15%; text-align: center; }
            .col-price { width: 20%; text-align: right; }
            .col-amt { width: 20%; text-align: right; }

            .item-row { display: flex; padding: 3px 0; }
            .item-name { flex: 2; text-align: left; padding-right: 2px; word-wrap: break-word; }
            
            .addon-row, .note-row { display: flex; font-size: 10px; color: #333; margin-top: -2px; padding-bottom: 2px; }
            .note-row { font-style: italic; color: #555; }
            
            .totals-section { margin-top: 5px; border-top: 1px solid black; padding-top: 5px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            
            .grand-total-row { 
                display: flex; 
                justify-content: space-between; 
                border-top: 1px solid black; 
                border-bottom: 1px solid black; 
                padding: 6px 0; 
                margin-top: 5px; 
                font-size: 14px; 
                font-weight: 800; 
            }
            
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header text-center">
                <div class="store-name uppercase">${settings.store_name || 'QSR STORE'}</div>
                <div class="store-info">${settings.store_address || ''}</div>
                <div class="store-info">${settings.store_phone ? 'Ph: ' + settings.store_phone : ''}</div>
                ${settings.gst_no ? `<div class="store-info bold">GSTIN: ${settings.gst_no}</div>` : ''}
            </div>

            <div class="divider"></div>

            <div class="metadata-grid">
                <div class="meta-item"><span class="meta-label">Date:</span> <span>${new Date().toLocaleDateString('en-GB')}</span></div>
                <div class="meta-item text-right" style="justify-content: flex-end;"><span class="meta-label">Time:</span> <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                <div class="meta-item"><span class="meta-label">Bill No:</span> <span>${order.orderNumber ? order.orderNumber.slice(-5) : '---'}</span></div>
                <div class="meta-item text-right" style="justify-content: flex-end;"><span class="meta-label">Type:</span> <span class="uppercase">${order.type}</span></div>
                ${settings.cashier_name ? `<div class="meta-item"><span class="meta-label">Cashier:</span> <span>${settings.cashier_name}</span></div>` : ''}
            </div>

            <div class="table-header">
                <div class="col-item">Item</div>
                <div class="col-qty">Qty</div>
                <div class="col-price">Rate</div>
                <div class="col-amt">Amt</div>
            </div>

            ${order.items.map(item => `
                <div class="item-row">
                    <div class="col-item">
                        ${item.itemName}
                        ${item.variantName ? `<br><span style="font-size:9px;">(${item.variantName})</span>` : ''}
                    </div>
                    <div class="col-qty">${item.quantity}</div>
                    <div class="col-price">${formatCurrency(item.price)}</div>
                    <div class="col-amt">${formatCurrency(item.total)}</div>
                </div>
                ${item.addons && item.addons.length > 0 ? item.addons.map(addon => `
                    <div class="addon-row">
                        <div style="flex:2; padding-left: 10px;">+ ${addon.name}</div>
                        <div style="width:15%; text-center;">1</div>
                        <div style="width:20%; text-right;">${formatCurrency(addon.price)}</div>
                        <div style="width:20%; text-right;">${formatCurrency(addon.price)}</div>
                    </div>
                `).join('') : ''}
                ${item.note ? `
                    <div class="note-row">
                        <div style="flex:1; padding-left: 10px;">Note: ${item.note}</div>
                    </div>
                ` : ''}
            `).join('')}

            <div class="totals-section">
                <!-- Subtotal calculation if needed, else using order totals -->
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>${formatCurrency(order.totalAmount - (order.taxAmount || 0) + (order.discount || 0))}</span>
                </div>
                ${order.discount > 0 ? `
                    <div class="total-row">
                        <span>Discount</span>
                        <span>- ${formatCurrency(order.discount)}</span>
                    </div>
                ` : ''}
                ${order.taxAmount > 0 ? `
                    <div class="total-row">
                        <span>CGST + SGST (5%)</span>
                        <span>${formatCurrency(order.taxAmount)}</span>
                    </div>
                ` : ''}
                ${order.containerCharge > 0 ? `
                    <div class="total-row" style="font-size: 10px;">
                        <span>Packing Charges</span>
                        <span>${formatCurrency(order.containerCharge)}</span>
                    </div>
                ` : ''}
                ${Math.abs(order.roundOff) > 0.001 ? `
                    <div class="total-row" style="font-size: 10px;">
                        <span>Round Off</span>
                        <span>${order.roundOff > 0 ? '+' : ''}${formatCurrency(order.roundOff)}</span>
                    </div>
                ` : ''}

                <div class="grand-total-row">
                    <span>Grand Total</span>
                    <span>₹ ${formatCurrency(Math.round(order.totalAmount))}</span>
                </div>
            </div>

            <div class="footer">
                ${settings.fssai_no ? `<p>FSSAI Lic No. ${settings.fssai_no}</p>` : ''}
                <p>Thank You, Visit Again!!!</p>
                <p style="margin-top: 5px; font-size: 9px; color: #666;">Powered by QSR POS</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

export const generateKotHtml = (order) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page { margin: 0; }
            body { 
                font-family: 'Arial', 'Helvetica', sans-serif; 
                width: 66mm; 
                margin: 0; 
                padding: 0;
                padding-right: 4mm;
                background: white; 
                color: black;
                font-size: 12px;
                line-height: 1.3;
            }
            .container { 
                width: 100%;
                margin: 0;
                padding: 10px 0;
                padding-bottom: 20px;
                box-sizing: border-box;
            }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .header { margin-bottom: 10px; border-bottom: 2px solid black; padding-bottom: 5px; }
            .meta-item { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 14px; font-weight: bold; }
            .item-row { display: flex; padding: 4px 0; border-bottom: 1px dashed #999; }
            .item-qty { width: 15%; font-weight: bold; font-size: 14px; }
            .item-name { flex: 1; font-weight: bold; font-size: 14px; }
            .addon-row, .note-row { margin-left: 15%; font-size: 11px; color: #333; }
            .note-row { font-weight: bold; font-style: italic; font-size: 12px; margin-top: 2px; border: 1px solid black; padding: 2px; display: inline-block;}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header text-center">
                <div style="font-size: 18px; font-weight: 900;">KITCHEN TICKET</div>
                <div class="uppercase bold">${order.type}</div>
                ${order.source && order.source !== 'POS' ? `<div style="font-size:12px; margin-top:2px;">SOURCE: ${order.source}</div>` : ''}
            </div>

            <div class="meta-item">
                <span>Bill No: ${order.orderNumber ? order.orderNumber.slice(-5) : '---'}</span>
                <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="meta-item">
                <span>Date: ${new Date().toLocaleDateString('en-GB')}</span>
            </div>

            <div style="border-bottom: 2px solid black; margin: 5px 0;"></div>

            ${order.items.map(item => `
                <div class="item-row">
                    <div class="item-qty">${item.quantity}</div>
                    <div class="item-name">
                        ${item.itemName} 
                        ${item.variantName ? `<span style="font-size:12px; font-weight:normal;">(${item.variantName})</span>` : ''}
                    </div>
                </div>
                ${item.addons && item.addons.length > 0 ? item.addons.map(addon => `
                    <div class="addon-row">
                        <span>+ ${addon.name}</span>
                    </div>
                `).join('') : ''}
                ${item.note ? `
                    <div class="note-row">Note: ${item.note}</div>
                ` : ''}
            `).join('')}
             
             ${order.notes ? `
                <div style="margin-top:10px; border:1px solid black; padding:5px; font-weight:bold;">
                    ORDER NOTE: ${order.notes}
                </div>
             ` : ''}
        </div>
    </body>
    </html>
    `;
};
