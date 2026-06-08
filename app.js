// နိုင်ငံအလံများ Mapping
const teamFlags = {
    "Mexico": "🇲🇽", "South Africa": "🇿🇦", "Korea Republic": "🇰🇷", "Czechia": "🇨🇿",
    "Canada": "🇨🇦", "Bosnia and Herzegovina": "🇧🇦", "Qatar": "🇶🇦", "Switzerland": "🇨🇭",
    "Brazil": "🇧🇷", "Morocco": "🇲🇦", "Haiti": "🇭🇹", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "USA": "🇺🇸", "Paraguay": "🇵🇾", "Australia": "🇦🇺", "Türkiye": "🇹🇷",
    "Germany": "🇩🇪", "Curaçao": "🇨🇼", "Côte d'Ivoire": "🇨🇮", "Ecuador": "🇪🇨",
    "Netherlands": "🇳🇱", "Japan": "🇯🇵", "Sweden": "🇸🇪", "Tunisia": "🇹🇳",
    "Belgium": "🇧🇪", "Egypt": "🇪🇬", "IR Iran": "🇮🇷", "New Zealand": "🇳🇿",
    "Spain": "🇪🇸", "Cabo Verde": "🇨🇻", "Saudi Arabia": "🇸🇦", "Uruguay": "🇺🇾",
    "France": "🇫🇷", "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
    "Argentina": "🇦🇷", "Algeria": "🇩🇿", "Austria": "🇦🇹", "Jordan": "🇯🇴",
    "Portugal": "🇵🇹", "Congo DR": "🇨🇩", "Uzbekistan": "🇺🇿", "Colombia": "🇨🇴",
    "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croatia": "🇭🇷", "Ghana": "🇬🇭", "Panama": "🇵🇦"
};

// Global App States
let groupMatches = [];
let squads = [];
let currentStage = "GS";

// Knockout Bracket State Structure
let knockoutBracket = {
    R32: Array.from({length: 16}, (_, i) => ({ id: 73 + i, home: `Winner Pack ${i*2+1}`, away: `Runner-up Pack ${i*2+2}`, homeScore: "", awayScore: "", date: "" })),
    R16: Array.from({length: 8}, (_, i) => ({ id: 89 + i, home: `TBD (M${73+i*2})`, away: `TBD (M${74+i*2})`, homeScore: "", awayScore: "" })),
    QF: Array.from({length: 4}, (_, i) => ({ id: 97 + i, home: `TBD (M${89+i*2})`, away: `TBD (M${90+i*2})`, homeScore: "", awayScore: "" })),
    SF: Array.from({length: 2}, (_, i) => ({ id: 101 + i, home: `TBD (M${97+i*2})`, away: `TBD (M${98+i*2})`, homeScore: "", awayScore: "" })),
    F: [{ id: 103, home: "TBD (M101)", away: "TBD (M102)", homeScore: "", awayScore: "" }]
};

// ISO Date အား မြန်မာစံတော်ချိန် (MMT) သို့ ပြောင်းလဲပေးသည့် Function
function toMyanmarTime(isoString) {
    const date = new Date(isoString);
    // Myanmar Standard Time is UTC + 6:30
    const mmtOffset = 6.5 * 60 * 60 * 1000;
    const myanmarDate = new Date(date.getTime() + mmtOffset);
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    let hours = myanmarDate.getUTCHours();
    const minutes = String(myanmarDate.getUTCMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${months[myanmarDate.getUTCMonth()]} ${myanmarDate.getUTCDate()} (${days[myanmarDate.getUTCDay()]}) ${hours}:${minutes} ${ampm}`;
}

// Initial Data Fetching
async function startApp() {
    try {
        const [resMatches, resSquads] = await Promise.all([fetch('rounds.json'), fetch('squads.json')]);
        const dataMatches = await resMatches.json();
        squads = await resSquads.json();
        
        groupMatches = dataMatches.find(s => s.stage === "GROUP").tournaments;
        
        // Setup Knockout Dates via JSON base configuration
        setupKnockoutDates(dataMatches);
        
        renderGroupStage();
    } catch (err) {
        console.error("App Config Loading Error:", err);
    }
}

function setupKnockoutDates(data) {
    // Round of 32 မှ Final အထိ ရက်စွဲများကို JSON မှ လှမ်းယူပြီး Format ပြောင်းခြင်း
    const keys = ["R32", "R16", "QF", "SF", "F"];
    keys.forEach(k => {
        const stageObj = data.find(s => s.stage === k);
        if(stageObj && stageObj.startDate) {
            knockoutBracket[k].forEach(m => m.date = toMyanmarTime(stageObj.startDate));
        }
    });
}

// Slider Handler
function switchStage(stage) {
    currentStage = stage;
    document.querySelectorAll('nav button').forEach(b => {
        b.classList.remove('bg-amber-500', 'text-black');
        b.classList.add('bg-gray-800', 'text-gray-400');
    });
    document.getElementById(`tab-${stage}`).classList.remove('bg-gray-800', 'text-gray-400');
    document.getElementById(`tab-${stage}`).classList.add('bg-amber-500', 'text-black');

    if (stage === "GS") {
        document.getElementById("view-GS").classList.remove("hidden");
        document.getElementById("view-KO").classList.add("hidden");
    } else {
        document.getElementById("view-GS").classList.add("hidden");
        document.getElementById("view-KO").classList.remove("hidden");
        renderKnockoutView(stage);
    }
}

// UI Rendering for Group Stages
function renderGroupStage() {
    const container = document.getElementById("groups-container");
    container.innerHTML = "";
    
    const letters = ["A","B","C","D","E","F","G","H","I","J","K","L"];
    
    letters.forEach(l => {
        const groupTeams = squads.filter(s => s.group.toUpperCase() === l).map(s => s.name);
        const filteredMatches = groupMatches.filter(m => groupTeams.includes(m.homeSquadName));
        
        let html = `
            <div class="bg-[#161b26]/60 p-4 rounded-2xl border border-gray-800">
                <h3 class="text-sm font-black text-amber-500 mb-3 tracking-wider">GROUP ${l}</h3>
                <div class="space-y-2">
                    ${filteredMatches.map(m => `
                        <div class="bg-[#161b26] border border-gray-800/80 p-3 rounded-xl">
                            <div class="text-[9px] text-gray-500 font-bold mb-2 text-center">${toMyanmarTime(m.date)}</div>
                            <div class="flex justify-between items-center text-xs">
                                <span class="w-1/3 truncate text-left font-semibold">${teamFlags[m.homeSquadName] || "🏳️"} ${m.homeSquadName}</span>
                                <div class="flex items-center gap-1">
                                    <input type="number" oninput="calculateLiveLogic()" id="m-${m.id}-h" class="w-8 h-7 text-center bg-[#0d1117] border border-gray-700 rounded font-bold text-amber-400 focus:outline-none">
                                    <span class="text-[10px] text-gray-600 font-bold mx-0.5">VS</span>
                                    <input type="number" oninput="calculateLiveLogic()" id="m-${m.id}-a" class="w-8 h-7 text-center bg-[#0d1117] border border-gray-700 rounded font-bold text-amber-400 focus:outline-none">
                                </div>
                                <span class="w-1/3 truncate text-right font-semibold">${m.awaySquadName} ${teamFlags[m.awaySquadName] || "🏳️"}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

// Live Result Advance Logic Simulator
function calculateLiveLogic() {
    // ဤနေရာတွင် နောက်ဆက်တွဲ ပွဲစဉ်ရလဒ်များ တွက်ချက်မှုနှင့် Bracket ဆင့်ကဲတက်လှမ်းမှု တွက်ချက်ပုံများကို ရေးနိုင်သည်
    // ရမှတ်ဂိုးများကို ဖတ်ယူပြီး Knockout Stage များသို့ Auto-promote ပေးမည့် အစိတ်အပိုင်း ဖြစ်သည်
}

// Knockout UI View Renderer
function renderKnockoutView(stage) {
    const titles = { R32: "Round of 32 (16 Matches)", R16: "Round of 16 (8 Matches)", QF: "Quarter-Finals (4 Matches)", SF: "Semi-Finals (2 Matches)", F: "World Cup Final Match" };
    document.getElementById("ko-title").innerText = titles[stage];
    
    const container = document.getElementById("ko-matches-container");
    container.innerHTML = knockoutBracket[stage].map(m => `
        <div class="bg-[#161b26] border border-gray-800 p-4 rounded-xl">
            <div class="text-[9px] text-gray-500 font-bold mb-2 text-center tracking-wide">MATCH ${m.id} • ${m.date}</div>
            <div class="flex justify-between items-center text-xs">
                <span class="font-medium text-gray-300 w-1/3 text-left truncate">${teamFlags[m.home] || ""} ${m.home}</span>
                <div class="flex items-center gap-1">
                    <input type="number" class="w-8 h-7 text-center bg-[#0d1117] border border-gray-700 rounded font-bold text-amber-500 focus:outline-none">
                    <span class="text-xs text-gray-600 font-black">:</span>
                    <input type="number" class="w-8 h-7 text-center bg-[#0d1117] border border-gray-700 rounded font-bold text-amber-500 focus:outline-none">
                </div>
                <span class="font-medium text-gray-300 w-1/3 text-right truncate">${m.away} ${teamFlags[m.away] || ""}</span>
            </div>
        </div>
    `).join('');
}

startApp();
