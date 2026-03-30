// Modern Custom Modal Logic
    function showCustomModal(title, iconHtml, message, isConfirm, onConfirm) {
        const overlay = document.getElementById('customModal');
        document.getElementById('modalTitle').innerHTML = iconHtml + ' ' + title;
        document.getElementById('modalBody').innerHTML = message;
        
        const footer = document.getElementById('modalFooter');
        footer.innerHTML = '';
        
        const btnCancel = document.createElement('button');
        btnCancel.textContent = isConfirm ? 'Batal' : 'Tutup';
        btnCancel.className = 'modal-btn modal-btn-secondary';
        btnCancel.onclick = () => overlay.classList.remove('show');
        footer.appendChild(btnCancel);
        
        if (isConfirm) {
            const btnOk = document.createElement('button');
            btnOk.textContent = 'Ya, Lanjutkan';
            btnOk.className = 'modal-btn modal-btn-primary';
            btnOk.onclick = () => { overlay.classList.remove('show'); if(onConfirm) onConfirm(); };
            footer.appendChild(btnOk);
        }
        
        overlay.classList.add('show');
    }

    const htmlTextArea = document.getElementById("htmlCode");
    const mockTextArea = document.getElementById("mockCode");
    const defaultHtml = `\n<div style="font-family: 'Inter', sans-serif; text-align:center; padding-top: 60px; color: #334155;">\n  <div style="font-size: 3rem; margin-bottom: 15px;">👋</div>\n  <h2 style="font-weight: 700; color: #0f172a;">Selamat Datang!</h2>\n  <p style="color: #64748b;">Hapus teks ini, paste kodemu, lalu klik <b>Jalankan Preview</b>.</p>\n</div>`;
    const defaultMock = `// Objek ini menyamar menjadi Fungsi Server Apps Script (.gs)\n{\n  contohFungsiMu: function(parameter) {\n    console.log("Menerima data:", parameter);\n    return "Ini respon dari server (dummy)";\n  }\n}`;

    let htmlEditor, mockEditor;
    
    // Editor Initialization
    if (typeof CodeMirror !== 'undefined') {
      htmlEditor = CodeMirror.fromTextArea(htmlTextArea, { mode: "htmlmixed", theme: "dracula", lineNumbers: true, matchBrackets: true, autoCloseBrackets: true });
      mockEditor = CodeMirror.fromTextArea(mockTextArea, { mode: "javascript", theme: "dracula", lineNumbers: true, matchBrackets: true, autoCloseBrackets: true });
      htmlEditor.setValue(localStorage.getItem('gas_sim_html') || defaultHtml);
      mockEditor.setValue(localStorage.getItem('gas_sim_mock') || defaultMock);
      htmlEditor.on('change', () => localStorage.setItem('gas_sim_html', htmlEditor.getValue()));
      mockEditor.on('change', () => localStorage.setItem('gas_sim_mock', mockEditor.getValue()));
      setTimeout(() => { htmlEditor.refresh(); mockEditor.refresh(); }, 200);
    } else {
      htmlTextArea.value = localStorage.getItem('gas_sim_html') || defaultHtml;
      mockTextArea.value = localStorage.getItem('gas_sim_mock') || defaultMock;
      htmlTextArea.addEventListener('input', () => localStorage.setItem('gas_sim_html', htmlTextArea.value));
      mockTextArea.addEventListener('input', () => localStorage.setItem('gas_sim_mock', mockTextArea.value));
      htmlEditor = { getValue: () => htmlTextArea.value, setValue: (v) => htmlTextArea.value = v, refresh: ()=>{} };
      mockEditor = { getValue: () => mockTextArea.value, setValue: (v) => mockTextArea.value = v, refresh: ()=>{} };
    }

    function resetSimulator() {
      showCustomModal("Reset Project", "<i class='fas fa-triangle-exclamation text-warning'></i>", "Apakah Anda yakin ingin menghapus kode saat ini dan memulai project kosong baru? Data yang belum disimpan akan hilang.", true, () => {
        localStorage.clear(); htmlEditor.setValue(defaultHtml); mockEditor.setValue(defaultMock); document.getElementById('previewFrame').srcdoc = "";
      });
    }

    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.editor-container').forEach(ed => ed.classList.remove('active'));
      if(tab === 'html') { document.querySelectorAll('.tab-btn')[0].classList.add('active'); document.getElementById('htmlEditorWrapper').classList.add('active'); htmlEditor.refresh(); }
      else { document.querySelectorAll('.tab-btn')[1].classList.add('active'); document.getElementById('mockEditorWrapper').classList.add('active'); mockEditor.refresh(); }
    }

    /* ════════════════════════════════════════════════════════
       KECERDASAN ULTIMATE V6: RANDOMIZER & FIXED SNIFFER
    ═════════════════════════════════════════════════════════ */
    function generateMock() {
      try {
        const htmlCode = htmlEditor.getValue();
        const parts = htmlCode.split('google.script.run');
        const funcs = new Set();
        
        if (parts.length <= 1) { 
            showCustomModal("Informasi", "<i class='fas fa-info-circle text-primary'></i>", "Tidak ditemukan pemanggilan <b>google.script.run</b> di dalam kodemu. Pastikan kamu sudah menempelkan kode frontend dengan benar.", false); 
            return; 
        }

        // 1. Ekstrak Nama Fungsi
        for(let i = 1; i < parts.length; i++) {
            let chunk = parts[i].substring(0, 1500).replace(/(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, '""'); 
            let res = '', depth = 0;
            for(let j=0; j<chunk.length; j++) {
                if(chunk[j] === '{') depth++; else if(chunk[j] === '}') { depth--; if(depth < 0) depth = 0; } else if(depth === 0) res += chunk[j];
            }
            let subParts = res.split('.');
            for(let k = 1; k < subParts.length; k++) {
                let token = subParts[k].trim(); let parenIndex = token.indexOf('(');
                if (parenIndex !== -1) {
                    let funcName = token.substring(0, parenIndex).trim();
                    if (/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(funcName) && !['withSuccessHandler', 'withFailureHandler', 'withUserObject'].includes(funcName)) {
                        funcs.add(funcName); break;
                    }
                }
            }
        }

        // 2. ULTRA SNIFFER 2D ARRAY INDEX (Hanya awalan valid, hindari 'e' event)
        const indexRegex = /\b(?:res|result|data|row|item|val|response|user|r|obj)\[(\d+)\]/g;
        let maxIndex = -1, match;
        const accessedIndices = new Set();
        while ((match = indexRegex.exec(htmlCode)) !== null) {
            let idx = parseInt(match[1], 10);
            accessedIndices.add(idx);
            if (idx > maxIndex) maxIndex = idx;
        }

        // Deteksi apakah HTML mengharapkan balikan berupa { rows: [...] }
        const requiresRows = /\b(?:res|result|data|response|payload|d)\.rows\b/.test(htmlCode);

        // 3. ULTRA SNIFFER OBJECT PROPERTIES
        const propRegex = /\b(?:res|result|data|row|item|val|response|user|r|obj)\.([a-zA-Z0-9_]+)\b/g;
        const foundProps = new Set();
        const ignoreProps = ['length','forEach','map','filter','push','includes','toLowerCase','toUpperCase','toString','trim','split','replace','style','display','innerHTML','innerText','textContent','value','classList','add','remove','dataset','getElementById','querySelector','log','error','target','src','href','className','id','name','type','checked','preventDefault','stopPropagation','clientX','clientY','ctrlKey','metaKey','key'];
        while ((match = propRegex.exec(htmlCode)) !== null) {
            if (!ignoreProps.includes(match[1]) && match[1].length > 1) foundProps.add(match[1]);
        }
        const extractedKeys = Array.from(foundProps);
        
        // Penentu mutlak 2D Array vs Object
        const is2DArray = maxIndex >= 0 && (maxIndex >= 3 || extractedKeys.length < 3);

        // 4. HARDCODED STRING SNIFFER
        const strRegex = /(?:===|==|!==|!=)\s*(["'])([A-Z0-9\s_-]+)\1/g; 
        const foundStrings = new Set();
        while ((match = strRegex.exec(htmlCode)) !== null) {
            if (match[2].length > 2 && isNaN(match[2])) foundStrings.add(match[2]);
        }
        const hardcodedStrings = Array.from(foundStrings);
        if (hardcodedStrings.length === 0) hardcodedStrings.push("MAINTENANCE", "RUSAK", "HILANG", "ADMIN", "SEWA", "AKTIF", "EXPIRED"); 

        const funcArray = Array.from(funcs);
        if (funcArray.length === 0) { showCustomModal("Info", "<i class='fas fa-search text-warning'></i>", "Sistem mendeteksi google.script.run, tetapi gagal mengekstrak nama fungsi backend.", false); return; }

        let analysisMsg = `Sistem Berhasil Menganalisa Pola Kodemu secara Mendalam!<br><br>
           <b>Fungsi yang akan dibuat:</b> <div class="modal-code">${funcArray.join(', ')}</div>
           <b>Struktur Data:</b> <div class="modal-code">${is2DArray ? `Array 2D (Index 0 - ${maxIndex})` : 'Array of Objects / Standard'} ${requiresRows ? '→ Dibungkus { rows: [] }' : ''}</div>
           <b>Properti Tertangkap:</b> <div class="modal-code">${extractedKeys.length > 0 ? extractedKeys.slice(0,8).join(', ') + (extractedKeys.length>8?'...':'') : 'Tidak ada (Mengandalkan Array)'}</div>
           <br>Sistem akan merakit 25 baris data <b>acak bervariasi</b> agar lolos dari validasi HTML-mu.`;

        showCustomModal("Generate Dummy Pintar", "<i class='fas fa-wand-magic-sparkles text-warning'></i>", analysisMsg, true, 
          () => {
             // KAMUS DATA SUPER LENGKAP & RANDOMIZER
             const dict = {
               names: ["Andi Pratama", "Siti Aisyah", "Budi Santoso", "Fajar Nugraha", "Rina Marlina", "Hendra Wijaya", "Kartika Putri", "Agus Setiawan", "Dewi Lestari", "Reza Rahadian"],
               stores: ["Cab. Pusat", "Cab. Utara", "Store Alpha", "Outlet Beta", "Gudang Utama", "Cab. Selatan", "BTP", "Perdos", "Panakkukang", "Antang", "Sunu"],
               statuses: ["AKTIF", "EXPIRED", "HAMPIR EXPIRE", "On Proses", "Selesai", "Pending", "Batal", "Menunggu Sparepart", "RUSAK", "HILANG", "MAINTENANCE"],
               areas: ["DAPUR", "CUSTOMER", "KASIR", "HEAD OFFICE", "GUDANG", "TOILET", "PARKIR", "LOBBY"],
               items: ["Laptop Asus", "Kertas Kasir", "Kabel LAN 10m", "Mesin Printer Epson", "Router Mikrotik", "AC Daikin 1PK", "Scanner Barcode", "Mesin EDC", "CCTV Indoor", "Kursi Kantor", "Meja Kasir", "Monitor Samsung"],
               descs: ["Barang rusak pemakaian normal", "Perlu maintenance rutin", "Minta diganti segera", "Korsleting ringan", "Stok menipis", "Kondisi fisik retak", "Mati total tidak nyala", "Masih berfungsi baik", "Terdapat goresan"],
               roles: ["ADMIN", "USER", "GUEST", "SUPERVISOR", "MANAGER"]
             };
             
             // Fungsi Acak (Randomizer)
             const getRand = (arr) => (arr && arr.length > 0) ? arr[Math.floor(Math.random() * arr.length)] : "Data Dummy";
             const getSmartStr = () => getRand(hardcodedStrings.filter(s=>s.length<20));
             const getRandDate = () => {
                 let d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * 60));
                 return d.toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'});
             };
             const getRandPrice = () => Math.floor(Math.random() * 40 + 1) * 50000;

             let newMock = "// Objek Simulasi Backend (.gs)\n{\n";
             
             funcArray.forEach((f, index) => {
               let fLower = f.toLowerCase();
               let smartReturnStr = '';
               
               // === 1. LOGIKA LOGIN / AUTH ===
               if (fLower.includes('login') || fLower.includes('cek') || fLower.includes('auth')) {
                 let roleToUse = hardcodedStrings.find(s => s.includes('ADMIN') || s.includes('USER')) || "ADMIN";
                 let loginObj = { success: true, status: "sukses", message: "Login Berhasil", role: roleToUse, name: "Super Admin", username: "admin", data: { role: roleToUse, nama: "Super Admin" }, token: "token-ai-123" };
                 smartReturnStr = `return ${JSON.stringify(loginObj, null, 6)};`;
               } 
               // === 2. LOGIKA SCAN AI (Objek Kompleks) ===
               else if (fLower.includes('scan')) {
                 let scanObj = {};
                 extractedKeys.forEach(k => {
                     let kl = k.toLowerCase();
                     if (kl.includes('tgl') || kl.includes('date')) scanObj[k] = getRandDate();
                     else if (kl.includes('jumlah') || kl.includes('total') || kl.includes('harga') || kl.includes('biaya')) scanObj[k] = getRandPrice();
                     else if (kl.includes('id') || kl.includes('pel')) scanObj[k] = "100" + Math.floor(Math.random() * 90000);
                     else if (kl.includes('nama')) scanObj[k] = getRand(dict.names);
                     else scanObj[k] = "Data " + k;
                 });
                 if (htmlCode.includes('.items')) {
                     scanObj.items = [
                         {namaBarang: getRand(dict.items), qty: Math.floor(Math.random()*5)+1, satuan: "UNIT", harga: getRandPrice(), totalHarga: getRandPrice() * 2},
                         {namaBarang: getRand(dict.items), qty: Math.floor(Math.random()*5)+1, satuan: "RIM", harga: 50000, totalHarga: 250000}
                     ];
                 }
                 smartReturnStr = `return {\n      success: true,\n      message: "Scan Sukses",\n      data: ${JSON.stringify(scanObj, null, 6).replace(/\n/g, '\n      ')}\n    };`;
               }
               // === 3. LOGIKA AMBIL DATA (GET, SEARCH, LIST) ===
               else if (fLower.includes('get') || fLower.includes('data') || fLower.includes('search') || fLower.includes('list') || fLower.includes('read') || fLower.includes('load')) {
                 let mockArray = [];
                 
                 // JIKA TERDETEKSI 2D ARRAY
                 if (is2DArray) { 
                     for(let i=0; i<25; i++) {
                         let rowArr = [];
                         for(let j=0; j<=maxIndex; j++) {
                             if (maxIndex === 6) { // App Barang Rusak
                                 if (j === 0) rowArr.push(getRandDate());
                                 else if (j === 1) rowArr.push(getRand(dict.stores));
                                 else if (j === 2) rowArr.push(getRand(["RUSAK", "HILANG"]));
                                 else if (j === 3) rowArr.push(getRand(["Hilang", "Rusak Pemakaian", "Terbakar", "Terjatuh", "Korslet"]));
                                 else if (j === 4) rowArr.push(getRand(dict.items));
                                 else if (j === 5) rowArr.push(getRand(dict.descs));
                                 else if (j === 6) rowArr.push(getRandPrice());
                                 else rowArr.push("Data " + j);
                             } else if (maxIndex >= 17) { // App Asset Management (Contoh ke-4)
                                 if (j === 0) rowArr.push("AST-" + (1000 + i) + Math.floor(Math.random() * 99));
                                 else if (j === 1) rowArr.push(getRand(dict.items));
                                 else if (j === 5) rowArr.push("SN-" + Math.floor(Math.random() * 90000 + 10000));
                                 else if (j === 6) rowArr.push(getRand(dict.stores));
                                 else if (j === 8) rowArr.push(getRand(dict.areas));
                                 else if (j === 17) rowArr.push(getRand(["AKTIF", "EXPIRED", "HAMPIR EXPIRE"]));
                                 else rowArr.push("Data " + j);
                             } else if (maxIndex >= 12) { // App Nota
                                 if (j === 2) rowArr.push(getRandDate());
                                 else if (j === 4) rowArr.push(getRand(dict.stores));
                                 else if (j === 6) rowArr.push(getRand(["MAINTENANCE", "RENOVASI", "EKSPANSI", "PENGADAAN", "TAGIHAN BULANAN"]));
                                 else if (j === 8) rowArr.push(getRand(dict.items));
                                 else if (j === 9) rowArr.push(Math.floor(Math.random() * 10) + 1);
                                 else if (j === 12) rowArr.push(getRandPrice());
                                 else rowArr.push("Data " + j);
                             } else { // Generic / Future Apps
                                 if (j === 0) rowArr.push(getRandDate());
                                 else if (j === 1) rowArr.push(getRand(dict.items));
                                 else if (j === maxIndex) rowArr.push(getSmartStr() || getRand(dict.statuses));
                                 else if (j === maxIndex - 1 || j === maxIndex - 2) rowArr.push(getRandPrice());
                                 else rowArr.push("Data " + j);
                             }
                         }
                         mockArray.push(rowArr);
                     }
                 } 
                 // JIKA TERDETEKSI ARRAY OF OBJECTS
                 else {
                     for(let i=0; i<25; i++) {
                         let rowObj = {};
                         if (extractedKeys.length > 0) {
                             extractedKeys.forEach(k => {
                                 let kl = k.toLowerCase();
                                 if (kl.includes('nama') || kl.includes('user') || kl.includes('pic')) rowObj[k] = getRand(dict.names);
                                 else if (kl.includes('store') || kl.includes('divisi') || kl.includes('cabang')) rowObj[k] = getRand(dict.stores);
                                 else if (kl.includes('status') || kl.includes('kategori')) rowObj[k] = getSmartStr() || getRand(dict.statuses);
                                 else if (kl.includes('harga') || kl.includes('total') || kl === 'qty' || kl.includes('biaya') || kl.includes('nominal')) rowObj[k] = getRandPrice();
                                 else if (kl.includes('tgl') || kl.includes('date') || kl.includes('waktu')) rowObj[k] = getRandDate();
                                 else if (kl.includes('deskripsi') || kl.includes('ket') || kl.includes('masalah')) rowObj[k] = getRand(dict.descs);
                                 else if (kl.includes('inv') || kl.includes('barang') || kl.includes('item')) rowObj[k] = getRand(dict.items);
                                 else rowObj[k] = "Data " + k;
                             });
                         } else { 
                             rowObj = { id: 100+i, info: "Tidak ada properti terbaca" }; 
                         }
                         mockArray.push(rowObj);
                     }
                 }
                 
                 // FORMAT OUTPUT (Dengan atau Tanpa Object Wrapper {rows: []})
                 if (requiresRows) {
                     smartReturnStr = `return ${JSON.stringify({ success: true, rows: mockArray }, null, 6).replace(/\n/g, '\n    ')};`;
                 } else {
                     smartReturnStr = `return ${JSON.stringify(mockArray, null, 6).replace(/\n/g, '\n    ')};`;
                 }
               } 
               // === 4. LOGIKA POST / SAVE / SUBMIT ===
               else if (fLower.includes('save') || fLower.includes('upload') || fLower.includes('submit') || fLower.includes('process') || fLower.includes('clear') || fLower.includes('update') || fLower.includes('delete')) {
                 smartReturnStr = `return "SUKSES";`;
               }
               // === 5. DEFAULT ===
               else {
                 smartReturnStr = `return { success: true, message: "OK" };`;
               }

               newMock += `  ${f}: function(...args) {\n    console.log("[GAS Mock] Fungsi ${f} dipanggil dengan param:", args);\n    ${smartReturnStr}\n  }`;
               if (index < funcArray.length - 1) newMock += ",\n\n"; else newMock += "\n";
             });
             newMock += "\n}";
             mockEditor.setValue(newMock); switchTab('mock');
          }
        );
      } catch (err) { showCustomModal("Kesalahan", "<i class='fas fa-times-circle text-danger'></i>", "Gagal auto-generate: " + err.message, false); }
    }

    function runPreview() {
      const htmlCode = htmlEditor.getValue();
      const mockCode = mockEditor.getValue();
      const injectorCode = `
      <script>
        window.__mockBackend = ${mockCode};
        window.google = { script: { get run() {
              const state = { success: null, failure: null, userObject: undefined };
              return new Proxy({}, { get: function(target, prop) {
                  if (prop === 'withSuccessHandler') return function(cb) { state.success = cb; return this; };
                  if (prop === 'withFailureHandler') return function(cb) { state.failure = cb; return this; };
                  if (prop === 'withUserObject') return function(obj) { state.userObject = obj; return this; };
                  return function(...args) {
                    console.log('%c🚀 [Backend Call]: ' + prop, 'color:#3b82f6;font-weight:bold;');
                    setTimeout(() => {
                      try {
                        if (!window.__mockBackend[prop]) throw new Error("Fungsi '" + prop + "' belum disiapkan di Data Dummy!");
                        const result = window.__mockBackend[prop](...args);
                        if (state.success) { if (state.userObject !== undefined) state.success(result, state.userObject); else state.success(result); }
                      } catch (e) {
                        console.error("❌ Error API:", e.message);
                        const errDiv = document.createElement('div');
                        errDiv.style.cssText = 'background:#ef4444;color:white;padding:12px;text-align:center;position:fixed;top:0;left:0;right:0;z-index:99999;font-family:sans-serif;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3); font-weight: 500; display: flex; justify-content: center; align-items: center; gap: 15px;';
                        errDiv.innerHTML = '<span><i class="fas fa-exclamation-triangle"></i> Simulator Error: ' + e.message + '</span> <button onclick="this.parentElement.remove()" style="padding:4px 12px;cursor:pointer;background:white;color:#ef4444;border:none;border-radius:6px;font-weight:bold;font-size:12px;">Tutup</button>';
                        document.body.appendChild(errDiv);
                        if (state.failure) { if (state.userObject !== undefined) state.failure(e, state.userObject); else state.failure(e); }
                      }
                    }, 300); // Simulasi delay internet yang realistis
                  }
                }
              });
            } } };
      <\/script>`;
      
      let finalHtml = htmlCode.replace(/<head>/i, '<head>\n' + injectorCode);
      if(finalHtml === htmlCode) finalHtml = injectorCode + '\n' + htmlCode;
      document.getElementById('previewFrame').srcdoc = finalHtml;
    }

    /* ════════════════════════════════════════════════════════
       UI INTERACTIONS (RESIZER & SHORTCUTS)
    ═════════════════════════════════════════════════════════ */
    const resizer = document.getElementById('resizer');
    const leftPane = document.querySelector('.editor-pane');
    const rightPane = document.querySelector('.preview-pane');
    let isDragging = false;
    
    resizer.addEventListener('mousedown', function(e) { isDragging = true; resizer.classList.add('dragging'); document.body.style.cursor = window.innerWidth > 768 ? 'col-resize' : 'row-resize'; rightPane.style.pointerEvents = 'none'; });
    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      if (window.innerWidth > 768) { let w = (e.clientX / document.querySelector('.main-area').offsetWidth) * 100; if (w > 10 && w < 90) { leftPane.style.width = w + '%'; rightPane.style.width = (100 - w) + '%'; } }
      else { let h = ((e.clientY - document.querySelector('.main-area').offsetTop) / document.querySelector('.main-area').offsetHeight) * 100; if (h > 10 && h < 90) { leftPane.style.height = h + '%'; rightPane.style.height = (100 - h) + '%'; } }
    });
    document.addEventListener('mouseup', function(e) { if (isDragging) { isDragging = false; resizer.classList.remove('dragging'); document.body.style.cursor = 'default'; rightPane.style.pointerEvents = 'auto'; } });
    document.addEventListener('keydown', function(e) { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runPreview(); } });