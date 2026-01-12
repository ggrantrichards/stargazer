import './style.css';

// --- 1. STAR BACKGROUND ---
const canvas = document.getElementById('star-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let stars = [];

function initStars() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    stars = [];
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2,
            opacity: Math.random(),
            speed: Math.random() * 0.05
        });
    }
}

function animateStars() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "white";
    stars.forEach(star => {
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.opacity += (Math.random() - 0.5) * 0.05;
        if (star.opacity < 0) star.opacity = 0;
        if (star.opacity > 1) star.opacity = 1;
    });
    requestAnimationFrame(animateStars);
}

window.addEventListener('resize', initStars);
initStars();
animateStars();

// --- 2. CONFIG & STATE ---
let userLat = null;
let userLon = null;
let currentDate = new Date(); // Defaults to current date (Jan 2026 per your context)
let allEventsCache = [];
let locationDenied = false;

// --- 3. DATA ENGINE ---
const celestialData = {
    meteorShowers: [
        { name: "Quadrantids", month: 0, day: 3, intensity: "High", visibility: "global" },
        { name: "Lyrids", month: 3, day: 22, intensity: "Medium", visibility: "global" },
        { name: "Perseids", month: 7, day: 12, intensity: "Very High", visibility: "global" },
        { name: "Geminids", month: 11, day: 14, intensity: "Very High", visibility: "global" },
    ],
    majorEvents: [
        // --- DATA FIX: Added events specifically for Jan/Feb 2026 so you see them immediately ---
        { date: "2026-01-15", name: "Wolf Moon (Blood Moon)", type: "blood-moon", visual: "blood-moon", visibility: "global" },
        { date: "2026-01-20", name: "Saturn Visibility", type: "planet", visual: "planet", visibility: "global" },
        { date: "2026-01-25", name: "Winter Aurora Peak", type: "aurora", visual: "aurora", visibility: "global" },
        { date: "2026-02-05", name: "Green Comet C/2026", type: "comet", visual: "comet", visibility: "global" },
        { date: "2026-02-14", name: "Partial Lunar Eclipse", type: "lunar-eclipse", visual: "lunar-eclipse", visibility: "global" },

        // --- Existing Future Data ---
        { date: "2026-02-17", name: "Annular Solar Eclipse", type: "solar-eclipse", visual: "solar-eclipse", visibility: "global" },
        { date: "2026-08-12", name: "Total Solar Eclipse", type: "solar-eclipse", visual: "solar-eclipse", visibility: "global" },
    ]
};

// --- 4. LOCATION LOGIC ---
function requestLocation() {
    document.getElementById('location-display').innerText = "Requesting permission...";

    if (!navigator.geolocation) {
        handleLocationError("Geolocation not supported.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLat = position.coords.latitude;
            userLon = position.coords.longitude;
            locationDenied = false;
            document.getElementById('location-display').innerText = `Lat: ${userLat.toFixed(1)}°, Lon: ${userLon.toFixed(1)}°`;
            document.getElementById('force-location-btn').style.display = 'none';
            generateEvents();
        },
        (error) => {
            console.error(error);
            handleLocationError("Location Access Denied.");
        }
    );
}

function handleLocationError(msg) {
    locationDenied = true;
    userLat = null;
    document.getElementById('location-display').innerText = msg;
    document.getElementById('force-location-btn').style.display = 'block';
    generateEvents();
}

function isEventVisible(visibilityType) {
    // Show all for demo
    if (locationDenied || userLat === null) return true;
    if (visibilityType === 'global') return true;
    if (visibilityType === 'north' && userLat > 0) return true;
    if (visibilityType === 'south' && userLat < 0) return true;
    if (visibilityType === 'high-lat' && Math.abs(userLat) > 50) return true;
    return false;
}

// --- 5. EVENT GENERATION ---
function generateEvents() {
    allEventsCache = [];
    // Expanded range to ensure 2026 data is captured
    const startYear = 2025;
    const endYear = 2027;

    for (let y = startYear; y <= endYear; y++) {
        celestialData.meteorShowers.forEach(shower => {
            if (isEventVisible(shower.visibility)) {
                let dateStr = `${y}-${String(shower.month + 1).padStart(2, '0')}-${String(shower.day).padStart(2, '0')}`;
                allEventsCache.push({
                    date: new Date(dateStr),
                    name: `${shower.name} Meteor Shower`,
                    type: "meteor",
                    visual: "meteor",
                    desc: `Intensity: ${shower.intensity}. Best viewed after midnight.`
                });
            }
        });
    }

    celestialData.majorEvents.forEach(e => {
        if (isEventVisible(e.visibility)) {
            allEventsCache.push({
                date: new Date(e.date + "T00:00:00"),
                name: e.name,
                type: e.type,
                visual: e.visual,
                desc: `A significant celestial event.`
            });
        }
    });

    allEventsCache.sort((a, b) => a.date - b.date);
    updateNextEvent();
    renderCalendar();
}

// --- 6. HERO SECTION & ANIMATION ---
function updateNextEvent() {
    const filterVal = document.getElementById('event-filter').value;
    if (filterVal !== 'all') return;

    document.getElementById('hero-label').innerText = "Upcoming Event";
    document.getElementById('countdown-timer').style.display = 'block';

    const now = new Date();
    const nextEvent = allEventsCache.find(e => {
        let eventTime = new Date(e.date);
        eventTime.setHours(23, 59, 59);
        return eventTime > now;
    });

    if (nextEvent) {
        document.getElementById('next-event-name').innerText = nextEvent.name;
        document.getElementById('next-event-desc').innerText = nextEvent.desc;
        updateVisuals(nextEvent.visual);
        startCountdown(nextEvent.date);
    } else {
        document.getElementById('next-event-name').innerText = "No Upcoming Events";
        document.getElementById('next-event-desc').innerText = "";
    }
}

// VISUALS RENDERER
function updateVisuals(visualType) {
    const container = document.getElementById('hero-visual');
    container.innerHTML = '';
    container.className = 'hero-visual';
    container.classList.add(`visual-${visualType}`);

    // Standard floating circle (Eclipses, Moon)
    if (['solar-eclipse', 'lunar-eclipse', 'blood-moon'].includes(visualType)) {
        const circle = document.createElement('div');
        circle.className = 'visual-circle';
        container.appendChild(circle);
    }

    // CUSTOM EFFECTS

    // Meteor Shower
    if (visualType === 'meteor') {
        for (let i = 0; i < 8; i++) {
            let s = document.createElement('div');
            s.className = 'shooting-star';
            s.style.animationDelay = `${Math.random() * 2}s`;
            s.style.top = `${Math.random() * 100}%`;
            s.style.left = `${Math.random() * 100}%`;
            container.appendChild(s);
        }
    }

    // Aurora
    if (visualType === 'aurora') {
        const circle = document.createElement('div');
        circle.className = 'visual-circle';
        let s = document.createElement('div');
        s.className = 'aurora-curtain';
        circle.appendChild(s);
        container.appendChild(circle);
    }

    // Planet
    if (visualType === 'planet') {
        const circle = document.createElement('div');
        circle.className = 'visual-circle';
        let ring = document.createElement('div');
        ring.className = 'planet-ring';
        circle.appendChild(ring);
        container.appendChild(circle);
    }

    // Comet (Updated)
    if (visualType === 'comet') {
        // Fast Background stars (Parallax Right-to-Left)
        for (let i = 0; i < 15; i++) {
            let star = document.createElement('div');
            star.className = 'bg-star';
            star.style.width = Math.random() * 3 + 'px';
            star.style.height = star.style.width;
            star.style.top = Math.random() * 100 + '%';
            // Start off screen right
            star.style.left = '100%';
            star.style.animation = `stars-rush-left ${(Math.random() * 1 + 0.5)}s linear infinite`;
            container.appendChild(star);
        }

        // Comet Body (Centered)
        const cometContainer = document.createElement('div');
        cometContainer.className = 'comet-container';

        const tailDust = document.createElement('div');
        tailDust.className = 'comet-tail-dust';

        const tailMain = document.createElement('div');
        tailMain.className = 'comet-tail-main';

        const head = document.createElement('div');
        head.className = 'comet-head';

        cometContainer.appendChild(tailDust);
        cometContainer.appendChild(tailMain);
        cometContainer.appendChild(head);
        container.appendChild(cometContainer);
    }
}

let timerInterval;
function startCountdown(targetDate) {
    if (timerInterval) clearInterval(timerInterval);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    function update() {
        const now = new Date();
        const diff = target - now;
        if (diff <= 0) {
            document.getElementById('countdown-timer').innerText = "TODAY";
            return;
        }
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        document.getElementById('countdown-timer').innerText = `${d}d ${h}h ${m}m ${s}s`;
    }
    update();
    timerInterval = setInterval(update, 1000);
}

// --- 7. UI INTERACTION ---
document.getElementById('event-filter').addEventListener('change', (e) => {
    const selected = e.target.value;
    if (selected === 'all') {
        renderCalendar();
        updateNextEvent();
    } else {
        renderCalendar();
        // Preview Mode
        document.getElementById('hero-label').innerText = "Visual Preview";
        document.getElementById('next-event-name').innerText = selected.replace('-', ' ').toUpperCase();
        document.getElementById('next-event-desc').innerText = "Previewing animation...";
        document.getElementById('countdown-timer').style.display = 'none';
        updateVisuals(selected);
    }
});

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(d => {
        const div = document.createElement('div');
        div.className = 'weekday';
        div.innerText = d;
        grid.appendChild(div);
    });

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('current-month-label').innerText = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const filterType = document.getElementById('event-filter').value;

    for (let i = 0; i < firstDay; i++) {
        grid.appendChild(document.createElement('div'));
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'day';
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            cell.classList.add('current-day');
        }

        const num = document.createElement('div');
        num.className = 'day-num';
        num.innerText = day;
        cell.appendChild(num);

        const daysEvents = allEventsCache.filter(e =>
            e.date.getDate() === day &&
            e.date.getMonth() === month &&
            e.date.getFullYear() === year
        );

        daysEvents.forEach(e => {
            if (filterType === 'all' || e.type === filterType) {
                const eventBadge = document.createElement('div');
                eventBadge.className = `day-event`;
                eventBadge.innerText = e.name;
                cell.appendChild(eventBadge);
            }
        });
        grid.appendChild(cell);
    }
}

document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
document.getElementById('force-location-btn').addEventListener('click', requestLocation);

requestLocation();