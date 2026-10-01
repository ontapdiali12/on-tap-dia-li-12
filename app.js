
const app=document.querySelector("#app"),$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let student=JSON.parse(localStorage.getItem("geo_student")||'{"name":"","className":""}');
let results=JSON.parse(localStorage.getItem("geo_natural_results")||"[]");
let session=null, submitting=false;
document.addEventListener("click",e=>{if(e.target.dataset.r)location.hash=e.target.dataset.r});window.addEventListener("hashchange",render);

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function identity(){return `<div class="identity"><div><b>Thông tin học sinh</b><div style="color:var(--muted)">Nhập trước khi làm bài.</div></div><div class="identity-fields"><input id="sname" placeholder="Họ và tên" value="${esc(student.name)}"><input id="sclass" placeholder="Lớp, VD 12A1" value="${esc(student.className)}"><button id="saveStudent" class="primary">Lưu</button></div></div>`}
function bindIdentity(){let b=$("#saveStudent");if(!b)return;b.onclick=()=>{student={name:$("#sname").value.trim(),className:$("#sclass").value.trim()};localStorage.setItem("geo_student",JSON.stringify(student));alert("Đã lưu thông tin học sinh.")}}
function lessonCards(mode){return `<div class="cards">${GEO_LESSONS.map(l=>`<article class="card ${l.color}"><h2>${l.short}. ${l.title}</h2><div class="actions" style="justify-content:flex-start"><button onclick="openLesson('${l.id}','theory')">Ôn lí thuyết ›</button><button onclick="openLesson('${l.id}','practice')">Làm bài 28 câu ›</button></div></article>`).join("")}</div>`}
function home(){app.innerHTML=`<section class="hero"><h1>ÔN TẬP ĐỊA LÍ 12</h1><div class="globe">🌍</div><p>Chuyên đề: Địa lí tự nhiên Việt Nam — học lí thuyết và luyện tập theo đúng tài liệu giáo viên cung cấp.</p><div class="actions"><button class="primary" data-r="theory">📚 Ôn lí thuyết</button><button class="secondary" data-r="practice">✍️ Bài tập</button></div></section><h2 class="section-title">ĐỊA LÍ TỰ NHIÊN VIỆT NAM</h2>${lessonCards()}`}
function listing(mode){app.innerHTML=`${mode==="practice"?identity():""}<div class="pagehead"><h1>${mode==="theory"?"📚 Lí thuyết Địa lí tự nhiên":"✍️ Bài tập Địa lí tự nhiên"}</h1><p>${mode==="practice"?"Mỗi bài: 21 câu nhiều lựa chọn + 4 câu đúng/sai + 3 câu trả lời ngắn = 10 điểm.":"Nội dung được lấy từ các tệp Word bạn cung cấp."}</p></div>${lessonCards(mode)}`;bindIdentity()}
window.openLesson=(id,mode)=>location.hash=`lesson/${id}/${mode}`;
function lesson(id,mode){const l=GEO_LESSONS.find(x=>x.id===id);if(!l)return home();if(mode==="theory"){
  app.innerHTML=`<div class="pagehead"><div>${l.short} • Địa lí tự nhiên Việt Nam</div><h1>${l.title}</h1><p>Ôn nhanh bằng sơ đồ tư duy / infographic.</p></div>
  ${l.images&&l.images.length?`<div class="gallery theory-only">${l.images.map((x,i)=>`<figure class="mindmap"><img src="${x}" loading="lazy" alt="Sơ đồ ${i+1} - ${esc(l.title)}"><figcaption>Sơ đồ ${i+1}</figcaption></figure>`).join("")}</div>`:`<div class="panel"><b>Chưa có sơ đồ tư duy cho bài này.</b></div>`}
  <div class="actions"><button class="primary" onclick="openLesson('${l.id}','practice')">Làm bài 28 câu</button><button class="secondary" data-r="theory">← Danh sách bài</button></div>`;
}else{practiceIntro(l)}}
function practiceIntro(l){app.innerHTML=`${identity()}<div class="pagehead"><div>${l.short}</div><h1>${l.title}</h1><p>Đề ôn gồm <b>28 câu</b>: 21 câu nhiều lựa chọn, 4 câu đúng/sai, 3 câu trả lời ngắn. Tổng cộng 40 lệnh, mỗi lệnh đúng 0,25 điểm = 10 điểm.</p></div><div class="panel"><p>Ngân hàng nguồn của bài: <b>${l.bank.mcq.length}</b> câu nhiều lựa chọn, <b>${l.bank.tf.length}</b> câu đúng/sai, <b>${l.bank.short.length}</b> câu trả lời ngắn.</p><button class="primary" onclick="startQuiz('${l.id}')">Bắt đầu làm bài</button></div>`;bindIdentity()}
function renderParts(parts){return parts.map(x=>x.type==="text"?`<p>${esc(x.text)}</p>`:`<div class="prompt-table"><table>${x.rows.map((r,i)=>`<tr>${r.map(c=>`<${i===0?"th":"td"}>${esc(c)}</${i===0?"th":"td"}>`).join("")}</tr>`).join("")}</table></div>`).join("")}
window.startQuiz=function(id){if(!student.name||!student.className){alert("Vui lòng nhập Họ tên và Lớp trước khi làm bài.");return}const l=GEO_LESSONS.find(x=>x.id===id);const qs=[...l.quiz.mcq.map(x=>({type:"mcq",...x})),...l.quiz.tf.map(x=>({type:"tf",...x})),...l.quiz.short.map(x=>({type:"short",...x}))];submitting=false;session={lesson:l,qs,i:0,answers:Array(qs.length).fill(null),attemptId:(crypto.randomUUID?crypto.randomUUID():(Date.now()+"-"+Math.random().toString(36).slice(2)))};drawQ()}

function shortPromptText(q){
  const a=(q.q||"").trim();
  const b=((q.prompt||[]).filter(x=>x.type==="text").map(x=>x.text).join(" ")).trim();
  if(a && b && a.replace(/\s+/g," ")===b.replace(/\s+/g," ")) return "";
  return b;
}

function drawQ(){const {lesson:l,qs,i}=session,q=qs[i];let body="",label=i<21?"Phần I • Nhiều lựa chọn":i<25?"Phần II • Đúng/Sai":"Phần III • Trả lời ngắn";if(q.type==="mcq"){body=`<div class="answers">${q.a.map((x,j)=>`<button class="answer ${session.answers[i]===j?"selected":""}" data-i="${j}">${"ABCD"[j]}. ${esc(x)}</button>`).join("")}</div>`}else if(q.type==="tf"){body=`${renderParts(q.intro)}${q.statements.map((s,j)=>`<div class="tfrow"><div><b>${String.fromCharCode(97+j)})</b> ${esc(s.text)}</div><div class="tfopts"><label><input type="radio" name="tf${j}" value="1" ${Array.isArray(session.answers[i])&&session.answers[i][j]===true?"checked":""}> Đúng</label><label><input type="radio" name="tf${j}" value="0" ${Array.isArray(session.answers[i])&&session.answers[i][j]===false?"checked":""}> Sai</label></div></div>`).join("")}` }else{body=`${renderParts(q.prompt)}<div class="short"><input id="shortAnswer" value="${esc(session.answers[i]??"")}" placeholder="Nhập đáp án"></div>`}app.innerHTML=`<div class="quiz"><div class="pagehead"><div>${l.short} • ${label}</div><h1>${l.title}</h1></div><div class="progress"><div style="width:${(i+1)/28*100}%"></div></div><article class="qbox"><div class="qmeta"><span>Câu ${i+1}/28</span><span>Mỗi lệnh đúng 0,25 điểm</span></div><h2>${q.type==="mcq"?esc(q.q):q.type==="tf"?"Câu đúng/sai":esc(q.prompt?.[0]?.text||"Trả lời ngắn")}</h2>${body}<div class="actions" style="justify-content:flex-start"><button class="secondary" id="prevBtn" ${i===0?"disabled":""}>← Trước</button>${i<27?'<button class="primary" id="nextBtn">Tiếp →</button>':'<button class="primary" id="submitBtn">Nộp bài</button>'}</div></article></div>`;if(q.type==="mcq")$$(".answer").forEach(b=>b.onclick=()=>{session.answers[i]=+b.dataset.i;drawQ()});if(q.type==="tf")q.statements.forEach((_,j)=>$$(`input[name="tf${j}"]`).forEach(inp=>inp.onchange=()=>{let a=Array.isArray(session.answers[i])?[...session.answers[i]]:[];a[j]=inp.value==="1";session.answers[i]=a}));if(q.type==="short")$("#shortAnswer").oninput=e=>session.answers[i]=e.target.value;$("#prevBtn").onclick=()=>{saveShort();session.i--;drawQ()};if($("#nextBtn"))$("#nextBtn").onclick=()=>{saveShort();session.i++;drawQ()};if($("#submitBtn"))$("#submitBtn").onclick=finishQuiz}
function saveShort(){if(session&&session.qs[session.i].type==="short"&&$("#shortAnswer"))session.answers[session.i]=$("#shortAnswer").value}
function norm(v){return String(v??"").trim().toLowerCase().replace(",",".").replace(/\s+/g,"")}

function answerLabelMCQ(q,a){
  if(a===null||a===undefined) return "Chưa trả lời";
  return `${"ABCD"[a]}. ${q.a[a]||""}`;
}
function correctLabelMCQ(q){
  return `${"ABCD"[q.correct]}. ${q.a[q.correct]||""}`;
}
function tfText(v){return v===true?"Đúng":v===false?"Sai":"Chưa trả lời";}
function reviewQuiz(){
  if(!session){location.hash="practice";return}
  const cards=session.qs.map((q,i)=>{
    const a=session.answers[i];
    if(q.type==="mcq"){
      const ok=a===q.correct;
      return `<article class="review-card ${ok?"review-ok":"review-bad"}">
        <div class="review-head"><b>Câu ${i+1}</b><span>${ok?"✅ Đúng":"❌ Sai"}</span></div>
        <div class="review-q">${esc(q.q)}</div>
        <div><b>Em chọn:</b> ${esc(answerLabelMCQ(q,a))}</div>
        <div><b>Đáp án đúng:</b> ${esc(correctLabelMCQ(q))}</div>
      </article>`;
    }
    if(q.type==="tf"){
      let good=0;
      const details=q.statements.map((s,j)=>{
        const chosen=Array.isArray(a)?a[j]:undefined;
        const ok=chosen===s.correct; if(ok) good++;
        return `<div class="review-tf"><div><b>${String.fromCharCode(97+j)})</b> ${esc(s.text)}</div>
          <div>Em chọn: <b>${tfText(chosen)}</b> • Đáp án: <b>${tfText(s.correct)}</b> ${ok?"✅":"❌"}</div></div>`;
      }).join("");
      return `<article class="review-card ${good===4?"review-ok":"review-bad"}">
        <div class="review-head"><b>Câu ${i+1} • Đúng/Sai</b><span>${good}/4 ý đúng = ${(good*.25).toFixed(2).replace(".",",")} điểm</span></div>
        ${details}
      </article>`;
    }
    const ok=norm(a)===norm(q.answer);
    const qtext=(q.prompt||[]).filter(x=>x.type==="text").map(x=>x.text).join(" ");
    return `<article class="review-card ${ok?"review-ok":"review-bad"}">
      <div class="review-head"><b>Câu ${i+1} • Trả lời ngắn</b><span>${ok?"✅ Đúng":"❌ Sai"}</span></div>
      <div class="review-q">${esc(qtext)}</div>
      <div><b>Em trả lời:</b> ${esc(a||"Chưa trả lời")}</div>
      <div><b>Đáp án đúng:</b> ${esc(q.answer)}</div>
    </article>`;
  }).join("");
  app.innerHTML=`<div class="pagehead"><div>${session.lesson.short}</div><h1>Đáp án chi tiết</h1><p>Đối chiếu câu trả lời với đáp án đúng.</p></div>
  <div class="review-list">${cards}</div>
  <div class="actions"><button class="primary" onclick="openLesson('${session.lesson.id}','practice')">Làm lại</button><button class="secondary" data-r="practice">← Danh sách bài</button></div>`;
}

async function finishQuiz(){
  if(submitting) return;
  submitting=true;
  saveShort();

  let commands=0,correct=0;
  session.qs.forEach((q,i)=>{
    const a=session.answers[i];
    if(q.type==="mcq"){
      commands++;
      if(a===q.correct)correct++;
    }else if(q.type==="tf"){
      q.statements.forEach((s,j)=>{
        commands++;
        if(Array.isArray(a)&&a[j]===s.correct)correct++;
      });
    }else{
      commands++;
      if(norm(a)===norm(q.answer))correct++;
    }
  });

  const score=Math.round(correct*.25*100)/100;
  const row={
    attemptId:session.attemptId,
    timestamp:new Date().toISOString(),
    studentName:student.name,
    className:student.className,
    lessonId:session.lesson.id,
    lessonTitle:session.lesson.title,
    score,correct,commands
  };

  // Chống lưu trùng trên trình duyệt.
  const exists=results.some(r=>r.attemptId && r.attemptId===row.attemptId);
  if(!exists){
    results.unshift(row);
    localStorage.setItem("geo_natural_results",JSON.stringify(results));
  }

  if(RESULT_API_URL){
    try{
      await fetch(RESULT_API_URL,{
        method:"POST",
        mode:"no-cors",
        headers:{"Content-Type":"text/plain;charset=utf-8"},
        body:JSON.stringify(row)
      });
    }catch(e){console.warn("Không gửi được kết quả online",e)}
  }

  app.innerHTML=`<div class="quiz"><article class="panel result-panel" style="text-align:center">
    <div class="score">${String(score).replace(".",",")}/10</div>
    <h1>Hoàn thành ${session.lesson.short}</h1>
    <p>Bạn đúng <b>${correct}/${commands}</b> lệnh.</p>
    <div class="actions">
      <button class="primary" onclick="reviewQuiz()">🔎 Xem đáp án chi tiết</button>
      <button class="secondary" data-r="mine">Kết quả của em</button>
      <button class="secondary" onclick="openLesson('${session.lesson.id}','practice')">Làm lại</button>
    </div>
  </article></div>`;
}
function mine(){const mine=results.filter(r=>r.studentName===student.name&&r.className===student.className),avg=mine.length?mine.reduce((s,r)=>s+Number(r.score),0)/mine.length:0;app.innerHTML=`${identity()}<div class="pagehead"><h1>📈 Kết quả của em</h1></div><div class="statgrid"><div class="stat"><b>${mine.length}</b><span>Lượt làm</span></div><div class="stat"><b>${avg.toFixed(2)}</b><span>Điểm TB</span></div></div>${mine.length?`<div class="tablewrap"><table><tr><th>Thời gian</th><th>Bài</th><th>Điểm</th><th>Đúng</th></tr>${mine.map(r=>`<tr><td>${new Date(r.timestamp).toLocaleString("vi-VN")}</td><td>${esc(r.lessonTitle)}</td><td><b>${r.score}/10</b></td><td>${r.correct}/40</td></tr>`).join("")}</table></div>`:"<div class='panel'>Chưa có kết quả.</div>"}`;bindIdentity()}
async function teacher(){
  app.innerHTML=`<div class="pagehead"><h1>👩‍🏫 Thống kê giáo viên</h1><p>Nhập khóa giáo viên để xem dữ liệu từ Google Sheets.</p></div>
  <div class="panel" id="teacherLogin">
    <label><b>Khóa giáo viên</b></label>
    <input id="teacherKey" type="password" placeholder="Nhập khóa giáo viên" style="width:100%;max-width:420px;padding:12px;border:1px solid #d6e2dd;border-radius:11px;margin:8px 0">
    <div><button id="loadTeacher" class="primary">Xem thống kê</button></div>
  </div>
  <div id="tv"></div>`;

  $("#loadTeacher").onclick=async()=>{
    const key=$("#teacherKey").value.trim();
    if(!key){alert("Vui lòng nhập khóa giáo viên.");return}
    $("#tv").innerHTML=`<div class="panel">Đang tải dữ liệu...</div>`;
    let rows=results;

    if(!RESULT_API_URL){
      $("#tv").innerHTML=`<div class="note"><b>Chưa cấu hình Google Sheets.</b> Hiện chỉ có dữ liệu trên trình duyệt này.</div>`;
      drawTeacher(results);
      return;
    }

    try{
      const u=RESULT_API_URL+"?action=list&key="+encodeURIComponent(key)+"&t="+Date.now();
      const x=await fetch(u);
      const data=await x.json();
      if(!data.ok){
        $("#tv").innerHTML=`<div class="note"><b>Không truy cập được:</b> khóa giáo viên không đúng hoặc Apps Script chưa cấu hình.</div>`;
        return;
      }
      rows=data.rows||[];
      drawTeacher(rows);
    }catch(e){
      $("#tv").innerHTML=`<div class="note"><b>Lỗi kết nối Google Sheets.</b> Kiểm tra URL Web App trong config.js và quyền triển khai Apps Script.</div>`;
    }
  };
}
function drawTeacher(rows){const seen=new Set();rows=(rows||[]).filter(r=>{const k=r.attemptId||`${r.timestamp}|${r.studentName}|${r.className}|${r.lessonId}|${r.score}`;if(seen.has(k))return false;seen.add(k);return true});const students=new Set(rows.map(r=>`${r.className}|${r.studentName}`)).size,classes=new Set(rows.map(r=>r.className).filter(Boolean)).size,avg=rows.length?rows.reduce((s,r)=>s+Number(r.score||0),0)/rows.length:0;$("#tv").innerHTML=`<div class="statgrid"><div class="stat"><b>${students}</b><span>Học sinh</span></div><div class="stat"><b>${rows.length}</b><span>Lượt làm</span></div><div class="stat"><b>${avg.toFixed(2)}</b><span>Điểm TB</span></div><div class="stat"><b>${classes}</b><span>Lớp</span></div></div><div class="tablewrap"><table><tr><th>Thời gian</th><th>Học sinh</th><th>Lớp</th><th>Bài</th><th>Điểm</th></tr>${rows.map(r=>`<tr><td>${new Date(r.timestamp).toLocaleString("vi-VN")}</td><td>${esc(r.studentName)}</td><td>${esc(r.className)}</td><td>${esc(r.lessonTitle)}</td><td><b>${r.score}/10</b></td></tr>`).join("")}</table></div>`}
function render(){let h=location.hash.slice(1)||"home";if(h==="home")home();else if(h==="theory")listing("theory");else if(h==="practice")listing("practice");else if(h==="mine")mine();else if(h==="teacher")teacher();else if(h.startsWith("lesson/")){let [,id,m]=h.split("/");lesson(id,m)}else home()}
render();
