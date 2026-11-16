// LGPD: the Google tag (GTM) and the Meta Pixel load only after the visitor accepts.
// The choice is kept in localStorage ('pt-consent' = 'yes' | 'no'); window.ptConsent.open() shows the banner again.
// Pages include it with <script src="/consent.js" defer></script>. Inside the home page's tour iframe (?embed=…) it does nothing.
(function () {
  var KEY = 'pt-consent', GTM = 'GTM-5PR2JMHL', PIXEL = '30063137429964715';
  if (/[?&]embed=/.test(location.search)) return;
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function put(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var loaded = false;
  function load() {
    if (loaded) return; loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    var g = document.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM; document.head.appendChild(g);
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL); fbq('track', 'PageView');
  }

  var box = null;
  function close() { if (box) { box.remove(); box = null; } }
  function choose(v) { put(v); close(); if (v === 'yes') load(); }
  function open() {
    if (box) return;
    if (!document.getElementById('ptc-css')) {
      var st = document.createElement('style'); st.id = 'ptc-css';
      st.textContent = '.ptc{position:fixed;left:16px;bottom:16px;z-index:2147483000;max-width:400px;padding:18px 18px 16px;border-radius:18px;background:#151c3a;color:#fff;font:400 14px/1.55 Manrope,system-ui,"Segoe UI",sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.35)}'
        + '.ptc p{margin:0 0 14px;color:rgba(255,255,255,.85)}.ptc a{color:#fff;font-weight:600}'
        + '.ptc div{display:flex;gap:8px;justify-content:flex-end}.ptc button{font:600 14px Manrope,system-ui,sans-serif;border-radius:999px;padding:11px 20px;cursor:pointer;border:1.5px solid rgba(255,255,255,.3);background:transparent;color:#fff}'
        + '.ptc button.y{background:#fff;color:#151c3a;border-color:#fff}.ptc button:focus-visible{outline:2px solid #a0d7ff;outline-offset:2px}'
        + '@media (max-width:600px){.ptc{left:12px;right:12px;bottom:12px;max-width:none}}';
      document.head.appendChild(st);
    }
    box = document.createElement('div'); box.className = 'ptc'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Cookies');
    box.innerHTML = '<p>Usamos cookies para medir as visitas e melhorar os nossos anúncios. Você escolhe. <a href="/privacidade/">Política de privacidade</a></p>'
      + '<div><button type="button" class="n">Recusar</button><button type="button" class="y">Aceitar</button></div>';
    box.querySelector('.n').onclick = function () { choose('no'); };
    box.querySelector('.y').onclick = function () { choose('yes'); };
    document.body.appendChild(box);
  }
  window.ptConsent = { open: open };

  var c = get();
  if (c === 'yes') load();
  else if (c !== 'no') { if (document.body) open(); else document.addEventListener('DOMContentLoaded', open); }
})();
