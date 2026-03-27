const topics = [
    { 
        title: "שמחה", 
        color: ["#FDE047", "#FACC15"],
        opening: "ספרו על רגע השבוע שבו הרגשתם שמחה אמיתית בלב.",
        encouraging: "שמחה היא מדבקת, תודה ששיתפתם!",
        questions: ["מה הדבר הקטן שגורם לכם לחייך?", "איך אתם משמחים מישהו אחר שמרגיש עצוב?", "מה היה הרגע הכי מצחיק שלכם השבוע?"]
    },
    { 
        title: "גאווה", 
        color: ["#FB923C", "#F97316"],
        opening: "במה אתם גאים בעצמכם היום? פעולה קטנה או גדולה.",
        encouraging: "כל הכבוד! היכולת להעריך את עצמכם היא כוח.",
        questions: ["מישהו מהמשפחה עשה משהו שגרם לכם גאווה?", "איך זה מרגיש בגוף כשגאים?", "איפה הכי הייתם רוצים להרגיש גאווה אתמול?"]
    },
    { 
        title: "רוגע", 
        color: ["#60A5FA", "#3B82F6"],
        opening: "בואו נחשוב על מקום או רגע שבו הרגשתם הכי רגועים בעולם.",
        encouraging: "נשימה עמוקה... הרוגע שלכם חשוב לנו.",
        questions: ["מה עוזר לכם להירגע כשאתם לחוצים?", "איך נראה 'מקום שקט' בדמיון שלכם?", "איזה צבע הייתם נותנים לתחושת הרוגע?"]
    },
    { 
        title: "חברות", 
        color: ["#4ADE80", "#22C55E"],
        opening: "מה הופך מישהו לחבר טוב באמת לדעתכם?",
        encouraging: "חברות היא המתנה הכי יפה שאפשר לתת.",
        questions: ["מה הדבר הכי נחמד שחבר עשה עבורכם?", "איך אתם מראים לחברים שאתם אוהבים אותם?", "מה הייתם רוצים לעשות ביחד ביום אחרי?"]
    },
    { 
        title: "חלומות", 
        color: ["#A78BFA", "#8B5CF6"],
        opening: "אם הכל היה אפשרי, מה הייתם רוצים שיקרה מחר?",
        encouraging: "החלומות שלכם הם המצפן שלכם. תמשיכו לחלום!",
        questions: ["מה החלום הכי מצחיק שחלמתם?", "איזה כוח על הייתם רוצים שיהיה לכם?", "אם יכולתם לישון היום שוב, על מה הייתם חולמים?"]
    },
    { 
        title: "תודה", 
        color: ["#F472B6", "#EC4899"],
        opening: "על מה אתם רוצים להגיד 'תודה' היום?",
        encouraging: "הכרת תודה פותחת את הלב.",
        questions: ["למי מהנוכחים תרצו להגיד תודה מיוחדת?", "מה הדבר הכי טוב שקרה לכם היום?", "מה הדבר הקטן שאתם יכולים לעשות מחר כדי להמשיך להיות מכירים תודה?"]
    },
    { 
        title: "אומץ", 
        color: ["#2DD4BF", "#0D9488"],
        opening: "ספרו על פעם שהתגברתם על פחד או עשיתם משהו קצת מפחיד.",
        encouraging: "אומץ הוא לא חוסר פחד, אלא עשייה למרות הפחד.",
        questions: ["ממי אתם שואבים השראה להיות אמיצים?", "מה עוזר לכם להרגיש בטוחים?", "מה הכי מפחיד לעשות, אבל הייתם רוצים לנסות?"]
    },
    { 
        title: "אהבה", 
        color: ["#F87171", "#EF4444"],
        opening: "איך אתם מרגישים אהבה מהמשפחה שלכם?",
        encouraging: "האהבה היא הדבק שמחבר אותנו.",
        questions: ["מהי הדרך האהובה עליכם לקבל חיבוק?", "מה אתם הכי אוהבים לעשות יחד?", "מה הדבר המשפחה הכי אוהבת לעשות בסוף שבוע?"]
    },
    { 
        title: "סקרנות", 
        color: ["#818CF8", "#6366F1"],
        opening: "מה הדבר החדש שגיליתם או שלמדתם השבוע?",
        encouraging: "הסקרנות שומרת עלינו צעירים בלב!",
        questions: ["איזו שאלה הייתם רוצים לשאול את העולם?", "איך דברים עובדים? מה הכי מעניין אתכם?", "מה נושא שלכם לגלגל הבא?"
        ]
    },
    { 
        title: "הצלחה", 
        color: ["#FB7185", "#E11D48"],
        opening: "שתפו במשהו שהצלחתם לעשות והרגשתם עם זה מעולה.",
        encouraging: "כל הצלחה מתחילה בצעד אחד קטן.",
        questions: ["איך חוגגים הצלחה בבית שלנו?", "מה למדתם מהדרך שעברתם?", "מהו צעד קטן הבא שלכם להצלחה?"
        ]
    }
];

let currentRotation = 0;
let isSpinning = false;
const canvas = document.getElementById('wheel-canvas');
const ctx = canvas.getContext('2d');
let selectedCharacterName = "";

function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;
    const sliceAngle = (2 * Math.PI) / topics.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    topics.forEach((topic, i) => {
        const angle = i * sliceAngle + currentRotation;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
        ctx.closePath();

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, topic.color[0]);
        gradient.addColorStop(1, topic.color[1]);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Assistant';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.fillText(topic.title, radius - 40, 10);
        ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.stroke();
}

function selectCharacter(name) {
    selectedCharacterName = name;
    const prefix = (name === 'שלו' || name === 'אושרי') ? 'תורו של:' : 'תורה של:';
    document.getElementById('current-character-name').innerText = `${prefix} ${name}`;
    showView('view-wheel');
    drawWheel();
}

function showView(viewId) {
    const views = ['view-selection', 'view-wheel', 'view-card'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (id === viewId) {
            el.classList.remove('view-hidden');
        } else {
            el.classList.add('view-hidden');
        }
    });
}

function resetToSelection() {
    showView('view-selection');
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTick() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;

    const spinBtn = document.getElementById('spin-button');
    spinBtn.disabled = true;
    spinBtn.classList.add('opacity-50', 'cursor-not-allowed');

    const totalSlices = topics.length;
    const extraSpins = 5 + Math.random() * 5;
    const stopAngle = Math.random() * (2 * Math.PI);
    const totalRotation = extraSpins * 2 * Math.PI + stopAngle;
    const startTime = performance.now();
    const duration = 9000; // 9 שניות

    const wheelCanvas = document.getElementById('wheel-canvas');
    wheelCanvas.classList.add('spin');

    let lastTickAngle = 0;
    const sliceAngle = (2 * Math.PI) / totalSlices;

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentMove = totalRotation * easeOut;

        currentRotation = currentMove;
        drawWheel();

        if (Math.floor(currentRotation / sliceAngle) > Math.floor(lastTickAngle / sliceAngle)) {
            playTick();
        }
        lastTickAngle = currentRotation;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            spinBtn.disabled = false;
            spinBtn.classList.remove('opacity-50', 'cursor-not-allowed');

            const topPointerAngle = 1.5 * Math.PI;
            const normalizedAngle = (topPointerAngle - currentRotation + 2 * Math.PI) % (2 * Math.PI);
            let winningIndex = Math.floor(normalizedAngle / sliceAngle);
            winningIndex = (winningIndex + topics.length) % topics.length;

            setTimeout(() => {
                if (window.navigator.vibrate) window.navigator.vibrate(200);
                showConversationCard(winningIndex);
            }, 500);
            wheelCanvas.classList.remove('spin');
        }
    }
    requestAnimationFrame(animate);
}

function showConversationCard(index) {
    const topic = topics[index];
    document.getElementById('topic-title').innerText = topic.title;
    document.getElementById('opening-phrase').innerText = topic.opening;
    document.getElementById('encouraging-phrase').innerText = topic.encouraging;

    const qList = document.getElementById('follow-up-questions');
    qList.innerHTML = '';
    topic.questions.forEach(q => {
        const li = document.createElement('li');
        li.className = "flex items-start gap-3 p-4 bg-white/50 rounded-xl shadow-sm border border-white";
        li.innerHTML = `
            <span class="text-indigo-500 mt-1">✨</span>
            <span class="text-gray-800">${q}</span>
        `;
        qList.appendChild(li);
    });

    showView('view-card');
}

window.onload = () => {
    drawWheel();
};
