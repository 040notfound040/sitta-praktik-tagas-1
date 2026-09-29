/* SITTA - script.js (DOM, validasi, modal) */
var $ = function (s, r) { return (r || document).querySelector(s); };
var halaman = document.body.dataset.page;

function toast(pesan, error) {
  var t = $('#toast');
  t.textContent = pesan;
  t.className = 'toast' + (error ? ' error' : '');
  t.style.display = 'block';
  setTimeout(function () { t.style.display = 'none'; }, 2800);
}
function setErr(input, pesan) {
  var e = input.parentElement.querySelector('.err');
  if (e) e.textContent = pesan || '';
  input.style.borderColor = pesan ? '#c0392b' : '';
  return !pesan;
}
function emailValid(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

/* Modal generik */
document.addEventListener('click', function (e) {
  var o = e.target.closest('[data-open]');
  if (o) { $('#' + o.dataset.open).classList.add('show'); return; }
  if (e.target.closest('[data-close]') || e.target.classList.contains('modal')) {
    document.querySelectorAll('.modal.show').forEach(function (m) { m.classList.remove('show'); });
  }
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') document.querySelectorAll('.modal.show').forEach(function (m) { m.classList.remove('show'); });
});

/* Guard & navbar */
var user = JSON.parse(sessionStorage.getItem('sittaUser') || 'null');
if (halaman !== 'login') {
  if (!user) { location.replace('index.html'); }
  else renderNavbar();
}
function renderNavbar() {
  var a = function (h, t) { return '<a href="' + h + '"' + (location.pathname.endsWith(h) ? ' class="active"' : '') + '>' + t + '</a>'; };
  $('#navbar').innerHTML =
    '<span class="logo">SITTA</span>' + a('dashboard.html', 'Dashboard') + a('stok.html', 'Informasi Bahan Ajar') +
    a('tracking.html', 'Tracking Pengiriman') +
    '<div class="dropdown"><button class="dropbtn" aria-haspopup="true">Laporan &#9662;</button><div class="dropdown-content">' +
    '<a href="#" data-soon="Monitoring Progress DO Bahan Ajar">Monitoring Progress DO Bahan Ajar</a>' +
    '<a href="#" data-soon="Rekap Bahan Ajar">Rekap Bahan Ajar</a></div></div>' +
    '<a href="#" data-soon="Histori Transaksi Bahan Ajar">Histori Transaksi Bahan Ajar</a>' +
    '<span class="spacer"></span><a href="#" class="keluar" id="btnKeluar">Keluar</a>';
  $('#navbar').addEventListener('click', function (e) {
    var s = e.target.closest('[data-soon]');
    if (s) { e.preventDefault(); alert('Halaman "' + s.dataset.soon + '" belum tersedia pada Tugas Praktik 1.'); }
    if (e.target.id === 'btnKeluar') {
      e.preventDefault();
      if (confirm('Yakin ingin keluar?')) { sessionStorage.removeItem('sittaUser'); location.href = 'index.html'; }
    }
  });
}

/* ===== LOGIN ===== */
if (halaman === 'login') {
  $('#formLogin').addEventListener('submit', function (e) {
    e.preventDefault();
    var em = $('#email'), pw = $('#password');
    var ok1 = setErr(em, em.value.trim() ? (emailValid(em.value.trim()) ? '' : 'Format email tidak valid') : 'Email wajib diisi');
    var ok2 = setErr(pw, pw.value ? '' : 'Password wajib diisi');
    if (!ok1 || !ok2) return;
    var ketemu = dataPengguna.find(function (u) { return u.email === em.value.trim().toLowerCase() && u.password === pw.value; });
    if (!ketemu) { alert('Email/password yang anda masukkan salah'); return; }
    sessionStorage.setItem('sittaUser', JSON.stringify(ketemu));
    location.href = 'dashboard.html';
  });
  $('#formLupa').addEventListener('submit', function (e) {
    e.preventDefault();
    var i = $('#emailLupa'), v = i.value.trim().toLowerCase();
    if (!setErr(i, !v ? 'Email wajib diisi' : (!emailValid(v) ? 'Format email tidak valid' : ''))) return;
    if (!dataPengguna.some(function (u) { return u.email === v; })) { setErr(i, 'Email tidak terdaftar'); return; }
    $('#modalLupa').classList.remove('show'); i.value = '';
    alert('Tautan reset password telah dikirim ke ' + v + ' (simulasi).');
  });
  $('#formDaftar').addEventListener('submit', function (e) {
    e.preventDefault();
    var n = $('#dNama'), em = $('#dEmail'), p1 = $('#dPass'), p2 = $('#dPass2'), v = em.value.trim().toLowerCase();
    var r = [
      setErr(n, n.value.trim().length < 3 ? 'Nama minimal 3 karakter' : ''),
      setErr(em, !emailValid(v) ? 'Format email tidak valid' : (dataPengguna.some(function (u) { return u.email === v; }) ? 'Email sudah terdaftar' : '')),
      setErr(p1, p1.value.length < 6 ? 'Password minimal 6 karakter' : ''),
      setErr(p2, p2.value !== p1.value ? 'Password tidak sama' : '')
    ];
    if (r.indexOf(false) > -1) return;
    dataPengguna.push({ id: dataPengguna.length + 1, nama: n.value.trim(), email: v, password: p1.value, role: $('#dRole').value, lokasi: '-' });
    $('#modalDaftar').classList.remove('show'); this.reset();
    alert('Pendaftaran berhasil (data hanya disimpan sementara di memori). Silakan login.');
  });
}

/* ===== DASHBOARD ===== */
if (halaman === 'dashboard' && user) {
  var jam = new Date().getHours();
  var sapa = jam < 11 ? 'pagi' : jam < 15 ? 'siang' : jam < 18 ? 'sore' : 'malam';
  $('#greeting').textContent = 'Selamat ' + sapa + ', ' + user.nama + '!';
  $('#userInfo').textContent = user.role + ' \u2022 ' + user.lokasi;
  var totalStok = dataBahanAjar.reduce(function (s, b) { return s + b.stok; }, 0);
  var kartu = [['Judul Bahan Ajar', dataBahanAjar.length], ['Total Stok', totalStok.toLocaleString('id-ID')], ['Delivery Order', Object.keys(dataTracking).length]];
  $('#stats').innerHTML = kartu.map(function (k) { return '<div class="stat"><b>' + k[1] + '</b>' + k[0] + '</div>'; }).join('');
  (function tick() {
    $('#jam').textContent = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' });
    setTimeout(tick, 1000);
  })();
}

/* ===== TRACKING ===== */
if (halaman === 'tracking' && user) {
  var pctStatus = { 'Diproses': 25, 'Dikirim': 50, 'Dalam Perjalanan': 75, 'Selesai': 100 };
  $('#formCari').addEventListener('submit', function (e) {
    e.preventDefault();
    var no = $('#noDO').value.trim(), err = $('#errDO'), hasil = $('#hasil');
    hasil.classList.add('hidden'); err.textContent = '';
    if (!no) { err.textContent = 'Nomor Delivery Order wajib diisi.'; return; }
    if (!/^\d+$/.test(no)) { err.textContent = 'Nomor DO hanya boleh berisi angka.'; return; }
    var d = dataTracking[no];
    if (!d) { alert('Nomor DO ' + no + ' tidak ditemukan.'); return; }
    var selesai = /^Selesai/.test(d.perjalanan[d.perjalanan.length - 1].keterangan);
    var status = selesai ? 'Selesai' : d.status;
    $('#hNama').textContent = d.nama; $('#hDO').textContent = d.nomorDO; $('#hStatus').textContent = status;
    $('#hEks').textContent = d.ekspedisi;
    $('#hTgl').textContent = new Date(d.tanggalKirim).toLocaleDateString('id-ID', { dateStyle: 'long' });
    $('#hPaket').textContent = d.paket; $('#hTotal').textContent = d.total;
    $('#bar').style.width = (pctStatus[status] || 50) + '%';
    var urut = d.perjalanan.slice().sort(function (a, b) { return b.waktu.localeCompare(a.waktu); });
    $('#timeline').innerHTML = urut.map(function (p) {
      return '<li><time>' + p.waktu + '</time>' + p.keterangan + '</li>';
    }).join('');
    hasil.classList.remove('hidden');
  });
}

/* ===== STOK ===== */
if (halaman === 'stok' && user) {
  function renderStok(kata) {
    kata = (kata || '').toLowerCase();
    var tb = $('#tbodyStok'); tb.innerHTML = '';
    var data = dataBahanAjar.filter(function (b) { return (b.namaBarang + b.kodeBarang + b.kodeLokasi).toLowerCase().indexOf(kata) > -1; });
    if (!data.length) { tb.innerHTML = '<tr><td colspan="7">Data tidak ditemukan.</td></tr>'; return; }
    data.forEach(function (b) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + (b.cover ? '<img src="' + b.cover + '" alt="Cover ' + b.namaBarang + '" onerror="this.style.display=\'none\'">' : '') + '</td>' +
        '<td>' + b.kodeLokasi + '</td><td>' + b.kodeBarang + '</td><td>' + b.namaBarang + '</td><td>' + b.jenisBarang +
        '</td><td>' + b.edisi + '</td><td class="' + (b.stok < 100 ? 'low' : '') + '">' + b.stok + '</td>';
      tb.appendChild(tr);
    });
  }
  renderStok();
  $('#cariStok').addEventListener('input', function () { renderStok(this.value); });
  $('#formTambah').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = { lok: $('#tKodeLok'), brg: $('#tKodeBrg'), nama: $('#tNama'), edisi: $('#tEdisi'), stok: $('#tStok') };
    var r = [
      setErr(f.lok, f.lok.value.trim() ? '' : 'Kode lokasi wajib diisi'),
      setErr(f.brg, !f.brg.value.trim() ? 'Kode barang wajib diisi' : (dataBahanAjar.some(function (b) { return b.kodeBarang.toLowerCase() === f.brg.value.trim().toLowerCase(); }) ? 'Kode barang sudah ada' : '')),
      setErr(f.nama, f.nama.value.trim() ? '' : 'Nama barang wajib diisi'),
      setErr(f.edisi, parseInt(f.edisi.value) >= 1 ? '' : 'Edisi minimal 1'),
      setErr(f.stok, f.stok.value !== '' && parseInt(f.stok.value) >= 0 ? '' : 'Stok harus angka \u2265 0')
    ];
    if (r.indexOf(false) > -1) return;
    dataBahanAjar.push({ kodeLokasi: f.lok.value.trim().toUpperCase(), kodeBarang: f.brg.value.trim().toUpperCase(), namaBarang: f.nama.value.trim(),
      jenisBarang: $('#tJenis').value, edisi: f.edisi.value, stok: parseInt(f.stok.value), cover: '' });
    renderStok($('#cariStok').value);
    $('#modalTambah').classList.remove('show'); this.reset();
    toast('Stok baru berhasil ditambahkan');
  });
}
