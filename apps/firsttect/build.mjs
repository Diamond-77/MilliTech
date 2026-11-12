// Builds ../../demo-firsttect.html from the data below. Run: node apps/firsttect/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, f), 'utf8');

const SITE = 'https://www.firsttect.in/';
const PREVIEW = process.env.PREVIEW === '1';
const IMG = '/demo/firsttect/img/';
const b64 = (f, mime) => `data:${mime};base64,` + readFileSync(join(here, '../../demo/firsttect/img/', f)).toString('base64');
const LOGO = PREVIEW ? b64('logo.png', 'image/png') : IMG + 'logo.png';
const HERO = PREVIEW ? b64('hero-fallback.jpg', 'image/jpeg') : IMG + 'hero-fallback.jpg';
const TEL = '+916009896955';
const WA = 'https://wa.me/916009896955';
const MAP = 'https://maps.app.goo.gl/MECq9wbpPm55zcJH8';
const FB = 'https://www.facebook.com/FirstTectComputer';
const IG = 'https://www.instagram.com/firsttectofficial';
const YT = 'https://www.youtube.com/@firsttect';

const courses = [
  { t: 'CCC / CBC', d: 'Computer fundamentals and essential digital skills.', m: 3, span: 3 },
  { t: 'DCA', d: 'Diploma in Computer Applications with practical computer training.', m: 6, span: 4 },
  { t: 'ADCA', d: 'Advanced Diploma in Computer Applications.', m: 12, span: 5 },
  { t: 'Programming', d: 'Learn C, C++, Java, Python and MySQL programming.', m: 0, span: 6, langs: ['C', 'C++', 'Java', 'Python', 'MySQL'] },
  { t: 'Accounting Tally', d: 'Professional computerized accounting and Tally training.', m: 4, span: 3 },
  { t: 'DTP', d: 'Desktop publishing, graphic layouts and document design.', m: 3, span: 3 },
  { t: 'Data Entry', d: 'Practical data-entry and office computer skills.', m: 2, span: 3 },
  { t: 'Multimedia', d: 'Digital multimedia and creative computer skills.', m: 4, span: 4 },
  { t: 'PGDCA', d: 'Post Graduate Diploma in Computer Applications.', m: 12, span: 5 },
];
const slots = [['06:00', '08:00', 'AM'], ['08:00', '10:00', 'AM'], ['10:00', '12:00', 'AM'], ['12:00', '02:00', 'PM'], ['02:00', '04:00', 'PM'], ['04:00', '06:00', 'PM']];
const slotText = ['06:00 AM – 08:00 AM', '08:00 AM – 10:00 AM', '10:00 AM – 12:00 PM', '12:00 PM – 02:00 PM', '02:00 PM – 04:00 PM', '04:00 PM – 06:00 PM'];
const stats = [['17+', 'Professional Courses'], ['100%', 'Practical Training'], ['6', 'Daily Class Batches'], ['FT', 'Digital Learning']];
const services = [
  { t: 'Exam Application', d: 'View exams for your batch and submit an application with online payment.', href: 'login.php', lock: true, ic: 'file' },
  { t: 'Admit Card Download', d: 'Access released admit cards showing exam date, timing, system number and centre.', href: 'login.php', lock: true, ic: 'card' },
  { t: 'Student Dashboard', d: 'View student details, course progress, syllabus, exercises and released exam info.', href: 'login.php', lock: true, ic: 'user' },
  { t: 'Exam Result', d: 'Check published results using Roll or Enrollment Number plus email OTP verification.', href: 'public_exam_results.php', lock: false, ic: 'check' },
];
const faculty = [
  ['Oinam Ranjita Devi', 'IT Faculty', 'ranjita.jpg'],
  ['Khumukcham Meiteileima Devi', 'IT Faculty', 'meiteileima.jpg'],
  ['Mayanglambam Naresh Singh', 'IT Faculty', 'naresh.jpg'],
  ['Maibam Yaiphabi Chanu', 'IT Faculty', 'yaiphabi.jpg'],
  ['Sawalkumar Toijam', 'IT Faculty', 'sawalkumar.jpg'],
  ['Ringkhuanliu', 'Faculty (Stenography)', 'ringkhualiu.jpg'],
  ['Kritika Moirangthem', 'Faculty (Spoken English)', 'kritika.jpg'],
  ['Khangembam Sinthaleima', 'Receptionist', 'faculty_ca2794c79282cd37671d2990.jpg'],
];
const centres = ['FirstTect Institute of Information Technology Pvt. Ltd.', 'Future Tech (Franchise)', 'Shilnah Infotech Pallel (Franchise)', 'Shivid Computer (Franchise)'];

const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v14H6a2 2 0 0 0 0 4h14"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  building: '<path d="M4 21V5l8-2v18M12 9l8 2v10M2 21h20M8 8h.01M8 12h.01M8 16h.01M16 14h.01M16 17h.01"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  out: '<path d="M7 17 17 7M8 7h9v9"/>',
  right: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chev: '<path d="m9 18 6-6-6-6"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h4M7 14h10"/>',
  down: '<path d="M12 4v12M6 11l6 6 6-6M5 21h14"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  fb: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  ig: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  yt: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
};
const ic = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
const ext = 'target="_blank" rel="noopener"';
const pad = (n) => String(n).padStart(2, '0');
const ini = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('');
const photo = (f) => `<div class="ph"><img src="${SITE}images/faculty/${f[2]}" alt="${f[0]}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentNode.className+=' noimg'"><span class="ini" aria-hidden="true">${ini(f[0])}</span></div>`;
const heroImg = `<img class="hero-img" src="${HERO}" alt="Two FIRSTTECT Institute students holding their course books" referrerpolicy="no-referrer">`;

const form = (id) => `<form class="form enq-form" id="${id}">
  <label>Your Name<input name="name" required autocomplete="name"></label>
  <label>Mobile Number<input name="mobile" required inputmode="tel" autocomplete="tel"></label>
  <label>Email (optional)<input name="email" type="email" autocomplete="email"></label>
  <label>Enquiry About<select name="topic" required><option value="">Choose topic</option><option>Admission</option><option>Course Fees</option><option>Class Timings</option><option>Franchise</option><option>Other</option></select></label>
  <label class="w">Your Message<textarea name="message" required></textarea></label>
  <div class="foot"><p>Please do not send passwords or sensitive documents. Your enquiry opens in WhatsApp, ready to send.</p><button class="btn pri" type="submit">Send Enquiry ${ic('right')}</button></div>
</form>`;

const notice = `<div class="note-row">
  <div class="m mono"><span>13 Oct 2026</span><span>Official Notice</span><i>Important</i></div>
  <b>Exam</b>
  <div class="ls"><a href="${SITE}website_notice_file.php?id=7" ${ext}>${ic('file')} View PDF</a><a href="${SITE}website_notice_file.php?id=7&amp;download=1" ${ext}>${ic('down')} Download PDF</a></div>
</div>`;

const dur = (c) => c.m ? `<div class="dur"><b>${c.m}</b>${c.m === 1 ? 'Month' : 'Months'}</div>` : `<div class="langs">${c.langs.map((l) => `<span class="tag">${l}</span>`).join('')}</div>`;

/* ---------------- desktop ---------------- */
const desktop = `
<div class="desk" id="home">
  <div class="d-notice"><div class="in mono"><span class="dot"></span><span>Latest notice</span><span class="t">Welcome to FIRSTTECT Institute. Check here for new announcements</span><a href="${SITE}notifications.php" ${ext}>View all notifications</a></div></div>
  <header class="d-head"><div class="in">
    <a class="brand" href="#home"><img src="${LOGO}" alt="FirstTect Logo" width="40" height="40"><span><b>FIRSTTECT INSTITUTE</b><small>of Information Technology Pvt Ltd</small></span></a>
    <nav class="d-nav" aria-label="Main">
      <a href="#courses">Courses</a><a href="#services">Student Services</a><a href="#faculty">Faculties</a><a href="${SITE}about.php" ${ext}>About</a><a href="#notices">Notifications</a><a href="#contact">Contact</a>
    </nav>
    <a class="login" href="${SITE}login.php" ${ext}>Student Login</a>
    <a class="btn pri sm" href="${SITE}register.php" ${ext}>Register Now</a>
  </div></header>

  <main class="frame">
    <section class="sec hero">
      <div class="txt">
        <div class="prompt"><b>$</b> Build Your Digital Future</div>
        <h1>Learn. Create. Grow Your Career.</h1>
        <p>FirstTect Institute of Information Technology Pvt Ltd provides computer education and professional skill development with emphasis on practical learning.</p>
        <div class="acts"><a class="btn pri" href="${SITE}register.php" ${ext}>Register Now</a><a class="btn" href="#courses">Explore Courses</a></div>
      </div>
      <div class="vis">
        <div class="ph">${heroImg}</div>
        <div class="cap"><b>Start Your Journey</b><span>Learn skills. Build confidence.</span></div>
      </div>
    </section>

    <section class="sec svc grid" id="services">
      <div class="cell lead">
        <div><div class="prompt"><b>$</b> Student Online Services</div>
        <h2>FirstTect Student Services</h2>
        <p>Registered students can apply for exams, download admit cards and open their student dashboard online. Exam results are public and need no login.</p></div>
        <div class="acts"><a class="btn" href="${SITE}login.php" ${ext}>Student Login</a><a class="q" href="${SITE}student_activate.php" ${ext}>First Time / Activate Account</a></div>
      </div>
      <div class="list">
        ${services.map((s) => `<a class="it" href="${SITE}${s.href}" ${ext}><h3>${s.t}${ic('out')}</h3><p>${s.d}</p><span class="req mono${s.lock ? '' : ' open'}">${ic(s.lock ? 'lock' : 'check')}${s.lock ? 'Student login required' : 'No student login required'}</span></a>`).join('\n        ')}
      </div>
    </section>

    <section class="sec stats grid">
      ${stats.map((s, i) => `<div class="cell${i === 3 ? ' end' : ''}"><div class="n">${s[0]}</div><div class="l">${s[1]}</div></div>`).join('')}
    </section>

    <section class="sec crs" id="courses">
      <div class="sec-h"><div><div class="prompt"><b>$</b> ls courses/</div><h2>Our Courses</h2></div><p>Duration is shown with each course. For the one-time course fee, please confirm with the institute.</p></div>
      <div class="grid">
        ${courses.map((c, i) => `<div class="cell c${[2, 5, 8].includes(i) ? ' end' : ''}" style="grid-column:span ${c.span}"><div class="top mono"><span>${pad(i + 1)}</span><span>${c.m ? 'Duration' : 'Languages'}</span></div>${dur(c)}<h3>${c.t}</h3><p>${c.d}</p></div>`).join('\n        ')}
      </div>
      <div class="batches">
        <div class="hd"><b>Class timings</b><span class="mono">6 daily batches</span></div>
        ${slotText.map((s, i) => `<div class="slot"><span class="mono">Batch ${i + 1}</span><b>${s.replace(' – ', '<br>')}</b></div>`).join('')}
      </div>
      <div class="grid" style="border-top:1px solid var(--line)"><div class="cell fee end last"><p><b>One-time course fee.</b> Fees and installment terms are confirmed with the institute at admission.</p><a class="btn pri" href="#contact">Enquire About Admission</a></div></div>
    </section>

    <section class="sec fac grid" id="faculty">
      <div class="cell lead">
        <div><div class="prompt"><b>$</b> ls faculty/</div><h2>Our Faculty</h2>
        <p>Meet the educators and trainers supporting practical learning at FIRSTTECT Institute of Information Technology Pvt. Ltd.</p></div>
        <div><div class="prompt"><b>$</b> Training centres</div><ul>${centres.map((c, i) => `<li><span>${c.replace(' (Franchise)', '')}</span><span class="mono">${i ? 'Franchise' : 'Main'}</span></li>`).join('')}</ul><a class="more" href="${SITE}faculty.php" ${ext}>View Faculty ${ic('out')}</a></div>
      </div>
      ${faculty.map((f, i) => `<div class="cell p${i === 3 || i === 7 ? ' end' : ''}${i > 3 ? ' last' : ''}">${photo(f)}<div class="who"><b>${f[0]}</b><span class="mono">${f[1]}</span></div></div>`).join('\n      ')}
    </section>

    <section class="sec grid" id="notices">
      <div class="cell ntc">
        <div class="blk"><div class="prompt"><b>$</b> tail notices/</div><h2>Notice Board</h2>${notice}<a class="more" href="${SITE}notifications.php" ${ext}>View all notifications ${ic('out')}</a></div>
        <div class="blk"><div class="prompt"><b>$</b> Contact Information</div>
          <div class="clist" style="margin-top:12px">
            <a href="tel:${TEL}">${ic('phone')} Phone <span class="mono">+91 6009896955</span></a>
            <a href="${WA}" ${ext}>${ic('chat')} WhatsApp <span class="mono">+91 6009896955</span></a>
            <a href="${MAP}" ${ext}>${ic('pin')} Google Maps <span class="mono">Imphal, Manipur</span></a>
            <a href="${FB}" ${ext}>${ic('fb')} Facebook <span class="mono">FirstTectComputer</span></a>
            <a href="${IG}" ${ext}>${ic('ig')} Instagram <span class="mono">firsttectofficial</span></a>
            <a href="${YT}" ${ext}>${ic('yt')} YouTube <span class="mono">@firsttect</span></a>
          </div>
        </div>
      </div>
      <div class="cell enq end" id="contact"><div class="prompt"><b>$</b> Enquiry Form</div><h2>Ready to Join? Send an enquiry</h2>${form('enq-d')}</div>
    </section>
  </main>

  <footer class="d-foot">
    <div class="cols">
      <div><a class="brand" href="#home"><img src="${LOGO}" alt="FIRSTTECT Institute logo" width="40" height="40"><span><b>FIRSTTECT INSTITUTE</b><small>of Information Technology Pvt Ltd</small></span></a><p>Computer education and professional skill development with emphasis on practical learning. Imphal, Manipur.</p></div>
      <div><h4>Related Links</h4><ul><li><a href="#home">Home</a></li><li><a href="${SITE}about.php" ${ext}>About FIRSTTECT</a></li><li><a href="#courses">Our Courses</a></li><li><a href="#faculty">Our Faculties</a></li><li><a href="${SITE}register.php" ${ext}>Online Admission</a></li><li><a href="#contact">Enquiry Form</a></li></ul></div>
      <div><h4>Student Services</h4><ul class="two"><li><a href="${SITE}login.php" ${ext}>Student Login</a></li><li><a href="${SITE}public_exam_results.php" ${ext}>Exam Results</a></li><li><a href="${SITE}login.php" ${ext}>Exam Apply</a></li><li><a href="${SITE}login.php" ${ext}>Certificate Apply</a></li><li><a href="${SITE}login.php" ${ext}>Admit Card</a></li><li><a href="${SITE}certificate_verify.php" ${ext}>Certificate Verification</a></li><li><a href="${SITE}franchise_login.php" ${ext}>Franchise Login</a></li><li><a href="#contact">Contact Us</a></li></ul></div>
    </div>
    <div class="base"><span class="mono">© 2026 FIRSTTECT Institute of Information Technology Pvt Ltd. All Rights Reserved.</span><span class="sp"></span><button type="button" data-replay>Replay intro</button><a href="#home">Back to Top</a></div>
  </footer>
</div>`;

/* ---------------- phone ---------------- */
const mMeta = [
  ['FIRSTTECT Institute', 'of Information Technology Pvt Ltd'],
  ['Our Courses', '9 courses · 6 daily batches'],
  ['Student Services', 'Exams · admit cards · results'],
  ['Institute', 'Faculty · centres · contact'],
];
const row = (href, icon, title, sub, cls = '') => `<a class="row" href="${href}" ${ext}>${ic(icon)}<span class="b"><b>${title}</b><span class="${cls}">${sub}</span></span>${ic('chev')}</a>`;

const mobile = `
<div class="mob">
  <header class="m-top"><img src="${LOGO}" alt="FirstTect Logo" width="32" height="32"><div class="tt"><b>${mMeta[0][0]}</b><span>${mMeta[0][1]}</span></div><button class="m-ib" type="button" data-sheet="sh-notice" aria-label="Latest notice">${ic('bell')}<i></i></button></header>

  <div class="m-pager">
    <section class="m-view m-home" aria-label="Home">
      <div class="m-pad">
        <div class="prompt"><b>$</b> Build Your Digital Future</div>
        <h1>Learn. Create. Grow Your Career.</h1>
        <p class="m-sub">FirstTect Institute of Information Technology Pvt Ltd provides computer education and professional skill development with emphasis on practical learning.</p>
      </div>
      <div style="height:16px;flex:none"></div>
      <div class="ph">${heroImg}</div>
      <div class="capm"><b>Start Your Journey</b><span>Learn skills. Build confidence.</span></div>
      <div style="height:16px;flex:none"></div>
      <div class="snap">${stats.map((s) => `<div class="stat"><div class="n">${s[0]}</div><div class="l">${s[1]}</div></div>`).join('')}</div>
      <div class="acts"><a class="btn pri" href="${SITE}register.php" ${ext}>Register Now</a><button class="btn" type="button" data-tab="1">Explore Courses</button></div>
    </section>

    <section class="m-view m-courses" aria-label="Courses">
      <div class="m-lbl" style="margin-top:0"><span class="prompt"><b>$</b> ls courses/</span><span class="mono" id="cc-count">01 / 09</span></div>
      <div class="snap cards">
        ${courses.map((c, i) => `<button class="cc" type="button" data-course="${i}"><span class="top mono"><span>${pad(i + 1)}</span><span>${c.m ? 'Duration' : 'Languages'}</span></span>${dur(c)}<h3>${c.t}</h3><p>${c.d}</p><span class="go">Details and admission ${ic('chev')}</span></button>`).join('\n        ')}
      </div>
      <div class="m-lbl"><span class="prompt"><b>$</b> Class timings</span><span class="mono">6 daily batches</span></div>
      <div class="snap">${slotText.map((s, i) => `<div class="slotc"><span>Batch ${i + 1}</span>${s}</div>`).join('')}</div>
    </section>

    <section class="m-view m-students" aria-label="Student Services">
      <div class="m-pad"><div class="prompt"><b>$</b> Student Online Services</div><h2 class="m-h">FirstTect Student Services</h2><p class="m-sub">Registered students can apply for exams, download admit cards and open their dashboard online.</p></div>
      <div class="rows">
        ${row(SITE + 'public_exam_results.php', 'check', 'Exam Result', 'No student login required', 'open')}
        ${row(SITE + 'login.php', 'file', 'Exam Application', 'Student login required')}
        ${row(SITE + 'login.php', 'card', 'Admit Card Download', 'Student login required')}
        ${row(SITE + 'login.php', 'user', 'Student Dashboard', 'Student login required')}
        ${row(SITE + 'certificate_verify.php', 'check', 'Certificate Verify', 'No student login required', 'open')}
      </div>
      <div class="acts"><button class="btn" type="button" data-sheet="sh-login">${ic('lock')} Login</button></div>
    </section>

    <section class="m-view m-inst" aria-label="Institute">
      <div class="m-pad"><div class="prompt"><b>$</b> About FIRSTTECT</div><h2 class="m-h">Practical computer education in Imphal</h2></div>
      <div class="snap" style="margin-top:8px">
        <div class="mv"><span class="mono">Mission</span><b>Practical, accessible, relevant</b><p>Make practical, accessible and relevant computer education available to learners at different skill levels.</p></div>
        <div class="mv"><span class="mono">Vision</span><b>Confident, digitally skilled learners</b><p>Support confident, digitally skilled learners through structured instruction and hands-on practice.</p></div>
      </div>
      <div class="m-lbl"><span class="prompt"><b>$</b> ls faculty/</span><a class="mono" href="${SITE}faculty.php" ${ext} style="min-height:48px;display:flex;align-items:center">View Faculty</a></div>
      <div class="snap">${faculty.map((f) => `<div class="fc">${photo(f)}<div class="who"><b>${f[0]}</b><span>${f[1]}</span></div></div>`).join('')}</div>
      <div class="m-lbl"><span class="prompt"><b>$</b> Training centres</span><span class="mono">4</span></div>
      <div class="snap">${centres.map((c, i) => `<div class="slotc"><span>${i === 0 ? 'Main centre' : 'Franchise'}</span>${c.replace(' (Franchise)', '')}</div>`).join('')}</div>
      <div class="m-lbl"><span class="prompt"><b>$</b> Contact Information</span><span class="mono">+91 6009896955</span></div>
      <div class="cgrid">
        <a href="${MAP}" ${ext}>${ic('pin')}Google Maps</a><a href="${FB}" ${ext}>${ic('fb')}Facebook</a><a href="${IG}" ${ext}>${ic('ig')}Instagram</a>
        <a href="${YT}" ${ext}>${ic('yt')}YouTube</a><a href="${WA}" ${ext}>${ic('chat')}WhatsApp</a><a href="${SITE}about.php" ${ext}>${ic('building')}About</a>
      </div>
      <div class="m-fine"><span class="mono">© 2026 FIRSTTECT Institute</span><button type="button" data-replay>Replay intro</button></div>
    </section>
  </div>

  <div class="m-dock">
    <div class="m-action"><button class="btn pri" type="button" data-sheet="sh-enquiry">Enquire About Admission</button><a class="btn sq" href="tel:${TEL}" aria-label="Call +91 6009896955">${ic('phone')}</a></div>
    <nav class="m-tabs" role="tablist" aria-label="Main">
      <button type="button" role="tab" aria-selected="true">${ic('home')}Home</button>
      <button type="button" role="tab" aria-selected="false">${ic('book')}Courses</button>
      <button type="button" role="tab" aria-selected="false">${ic('user')}Students</button>
      <button type="button" role="tab" aria-selected="false">${ic('building')}Institute</button>
    </nav>
  </div>

  <div class="scrim"></div>
  ${sheet('sh-course', '<span id="cs-title">Course</span>', `<p id="cs-desc"></p>
    <dl class="kv"><dt>Duration</dt><dd id="cs-dur"></dd><dt>Class timings</dt><dd>6 daily batches, 06:00 AM to 06:00 PM</dd><dt>Course fee</dt><dd>One-time fee or installment, confirmed with the institute</dd></dl>
    <div class="acts"><button class="btn pri" type="button" id="cs-enq">Enquire About Admission</button><a class="btn" href="${SITE}register.php" ${ext}>Register Now</a></div>`)}
  ${sheet('sh-enquiry', 'Enquiry Form', form('enq-m'))}
  ${sheet('sh-login', 'Login', `<div class="rows">
      ${row(SITE + 'login.php', 'user', 'Student Login', 'Exam apply, admit card, dashboard')}
      ${row(SITE + 'student_activate.php', 'check', 'First Time / Activate Account', 'For newly registered students')}
      ${row(SITE + 'franchise_login.php', 'building', 'Franchise Login', 'For franchise centres')}
    </div>`)}
  ${sheet('sh-notice', 'Notice Board', `<p>Welcome to FIRSTTECT Institute. Check here for new announcements.</p>${notice}<div class="acts"><a class="btn" href="${SITE}notifications.php" ${ext}>View all notifications</a></div>`)}
</div>`;

function sheet(id, title, body) {
  return `<div class="sheet" id="${id}" role="dialog" aria-modal="true" aria-label="${title.replace(/<[^>]+>/g, '')}"><div class="grab"></div><div class="sh"><h3>${title}</h3><button class="m-ib" type="button" data-close aria-label="Close">${ic('x')}</button></div>${body}</div>`;
}

/* ---------------- intro ---------------- */
const intro = `
<div id="intro" data-s="" role="dialog" aria-label="Intro">
  <button class="i-skip" type="button">Skip</button>
  <div class="i-logo"><img src="${LOGO}" alt="FIRSTTECT Institute"></div>
  <div class="i-stage">
    <div class="i-dots" aria-hidden="true"></div>
    <div class="i-term">
      <div class="i-bar"><i></i><i></i><i></i><span>firsttect ~ imphal</span></div>
      <div class="i-body"><div class="i-log" aria-live="off"></div><div class="i-cmd"><span class="p">$</span> <span class="i-typed"></span><span class="i-caret"></span></div></div>
      <div class="i-foot"><span>Press Run to install</span><button class="i-run" type="button">Run <kbd>Enter</kbd></button></div>
    </div>
  </div>
</div>`;

const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>FIRSTTECT Institute of Information Technology Pvt Ltd</title>
<meta name="description" content="FirstTect Institute of Information Technology Pvt Ltd, Imphal. Computer education and professional skill development with emphasis on practical learning.">
<meta name="theme-color" content="#100e1c">
<meta name="robots" content="noindex">
<link rel="icon" type="image/png" href="${IMG}favicon.png">
<link rel="apple-touch-icon" href="${IMG}apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<script>
(function(){var h=document.documentElement,q=location.search,seen=false;
try{if(/[?&]intro/.test(q))sessionStorage.removeItem('ft-intro');seen=!!sessionStorage.getItem('ft-intro');}catch(e){}
if(!seen&&!/[?&]skip/.test(q))h.className+=' intro-on intro-lock';})();
</script>
<style>
${read('style.css')}
</style>
</head>
<body>`;

const out = `${head}
${intro}
${desktop}
${mobile}
<script type="application/json" id="m-meta">${JSON.stringify(mMeta)}</script>
<script type="application/json" id="c-data">${JSON.stringify(courses.map(({ t, d, m }) => ({ t, d, m })))}</script>
<script>
${read('intro.js')}
</script>
<script>
${read('app.js')}
</script>
</body>
</html>
`;
writeFileSync(PREVIEW ? process.env.OUT : join(here, '../../demo-firsttect.html'), out);
console.log('demo-firsttect.html', (out.length / 1024).toFixed(1) + ' KB');
