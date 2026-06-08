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

const letters = ["A","B","C","D","E","F","G","H","I","J","K","L"];
let groupMatches = [];
let squads = [];
let activeMatchday = 1;

// FIFA Round of 32 ရဲ့ တရားဝင် အုပ်စုအလိုက် တက်လှမ်းမည့် လမ်းကြောင်းသတ်မှတ်ချက် (Bracket Plan)
const r32Template = [
    { matchId: 73, homeSrc: { group: "A", pos: 2 }, awaySrc: { group: "B", pos: 2 }, date: "June 29" },
    { matchId: 75, homeSrc: { group: "F", pos: 1 }, awaySrc: { group: "C", pos: 2 }, date: "June 30" },
    { matchId: 76, homeSrc: { group: "D", pos: 2 }, awaySrc: { group: "E", pos: 2 }, date: "June 30" },
    { matchId: 77, homeSrc: { group: "I", pos: 1 }, awaySrc: { group: "D", pos: 1 }, date: "July 1" },
    { matchId: 79, homeSrc: { group: "C", pos: 1 }, awaySrc: { group: "F", pos: 2 }, date: "July 2" },
    { matchId: 80, homeSrc: { group: "G", pos: 2 }, awaySrc: { group: "H", pos: 2 }, date: "July 2" },
    { matchId: 83, homeSrc: { group: "J", pos: 2 }, awaySrc: { group: "K", pos: 2 }, date: "July 3" },
    { matchId: 84, homeSrc: { group: "L", pos: 2 }, awaySrc: { group: "I", pos: 2 }, date: "July 3" },
    // အောက်ပါပွဲစဉ်များသည် အုပ်စုပထမနှင့် အကောင်းဆုံးအုပ်စုတတိယ (3rd) တွဲဆိုင်းများဖြစ်သည် (Simulator တွင် လောလောဆယ် Placeholder ပြထားမည်)
    { matchId: 74, homeSrc: { group: "A", pos: 1 }, awaySrc: "3rd Place (C/E/F)", date: "June 29" },
    { matchId: 78, homeSrc: { group: "B", pos: 1 }, awaySrc: "3rd Place (A/C/I)", date: "July 1" },
    { matchId: 81, homeSrc: { group: "E", pos: 1 }, awaySrc: "3rd Place (A/B/C/D/F)", date: "July 2" },
    { matchId: 82, homeSrc: { group: "G", pos: 1 }, awaySrc: "3rd Place (A/E/H/I/J)", date: "July 3" },
    { matchId: 85, homeSrc: { group: "H", pos: 1 }, awaySrc: { group: "J", pos: 1 }, date: "July 4" }, // H1 vs J1
    { matchId: 86, homeSrc: { group: "K", pos: 1 }, awaySrc: "3rd Place (D/E/I/J/L)", date: "July 4" },
    { matchId: 87, homeSrc: { group: "L", pos: 1 }, awaySrc: "3rd Place (E/H/I/J/K)", date: "July 4" }
];

let groupWinnersState = {}; // အုပ်စုတစ်ခုစီ၏ နောက်ဆုံးအဆင့်အခြေအနေများကို သိမ်းရန်

function toMyanmarTime(isoString) {
    const date = new Date(isoString);
    const mmtOffset = 6.5 * 60 * 60 * 1000;
    const myanmarDate = new Date(date.getTime() + mmtOffset);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let hours = myanmarDate.getUTCHours();
    const minutes = String(myanmarDate.getUTCMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12; hours = hours ? hours : 12;
    return `${months[myanmarDate.getUTCMonth()]} ${myanmarDate.getUTCDate()} (${days[myanmarDate.getUTCDay()]}) ${hours}:${minutes} ${ampm}`;
}

async function startApp() {
    try {
        const [resMatches, resSquads] = await Promise.all([fetch('rounds.json'), fetch('squads.json')]);
        const dataMatches = await resMatches.json();
        squads = await resSquads.json();
        
        const stages = dataMatches.filter(s => s.stage === "GROUP");
        groupMatches = [];
        stages.forEach((stg, index) => {
            stg.tournaments.forEach(t => {
                t.matchday = index + 1;
                groupMatches.push(t);
            });
        });

        calculateLiveLogic(); 
    } catch (err) {
        console.error("Error configuration:", err);
    }
}

function switchStage(stage) {
    document.querySelectorAll('nav button').forEach(b => {
        b.classList.remove('bg-amber-500', 'text-black');
        b.classList.add('bg-gray-800', 'text-gray-400');
    });
    document.getElementById(`tab-${stage}`).classList.remove('bg-gray-800', 'text-gray-400');
    document.getElementById(`tab-${stage}`).classList.add('bg-amber-500', 'text-black');

    document.querySelectorAll('.stage-view').forEach(v => v.classList.add('hidden'));

    if (stage === "TABLE") {
        document.getElementById("view-TABLE").classList.remove("hidden");
        calculateLiveLogic();
    } else if (stage === "FIX") {
        document.getElementById("view-FIX").classList.remove("hidden");
        renderFixtures();
    } else {
        document.getElementById("view-KO").classList.remove("hidden");
        renderKnockoutView(stage);
    }
}

function switchMatchday(md) {
    activeMatchday = md;
    document.querySelectorAll('#view-FIX button').forEach(b => {
        b.classList.remove('bg-amber-500', 'text-black');
        b.classList.add('bg-transparent', 'text-gray-400');
    });
    document.getElementById(`md-btn-${md}`).classList.remove('bg-transparent', 'text-gray-400');
    document.getElementById(`md-btn-${md}`).classList.add('bg-amber-500', 'text-black');
    renderFixtures();
}

// core Logic: ဂိုးရလဒ်များကို ဖတ်ယူပြီး Table တွက်ချက်ကာ R32 သို့ အသင်းများ ပို့ဆောင်ခြင်း
function calculateLiveLogic() {
    let standings = {};
    squads.forEach(s => {
        standings[s.name] = { name: s.name, group: s.group.toUpperCase(), p: 0, gd: 0, pts: 0 };
    });

    groupMatches.forEach(m => {
        const hInput = document.getElementById(`m-${m.id}-h`);
        const aInput = document.getElementById(`m-${m.id}-a`);
        
        if (hInput && aInput && hInput.value !== "") {
            const h = parseInt(hInput.value);
            const a = parseInt(aInput.value);
            
            standings[m.homeSquadName].p++; standings[m.awaySquadName].p++;
            standings[m.homeSquadName].gd += (h - a); standings[m.awaySquadName].gd += (a - h);

            if (h > a) standings[m.homeSquadName].pts += 3;
            else if (h < a) standings[m.awaySquadName].pts += 3;
            else { standings[m.homeSquadName].pts += 1; standings[m.awaySquadName].pts += 1; }
        }
    });

    const container = document.getElementById("tables-container");
    if(container) container.innerHTML = "";

    letters.forEach(l => {
        const groupTeams = Object.values(standings).filter(t => t.group === l)
                                 .sort((a,b) => b.pts - a.pts || b.gd - a.gd);
        
        // အုပ်စုတစ်ခုစီ၏ ပထမနှင့် ဒုတိယအသင်းများကို Bracket ဆီ ပို့ရန် သိမ်းဆည်းခြင်း
        groupWinnersState[l] = {
            first: groupTeams[0].p > 0 ? groupTeams[0].name : `Group ${l} 1st`,
            second: groupTeams[1].p > 0 ? groupTeams[1].name : `Group ${l} 2nd`
        };

        if (container) {
            let html = `
                <div class="bg-[#161b26]/50 p-3 rounded-2xl border border-gray-800">
                    <h3 class="text-xs font-black text-amber-500 mb-2 tracking-wider">GROUP ${l} STANDINGS</h3>
                    <div class="bg-[#1a202c] rounded-xl overflow-hidden border border-gray-800">
                        <table class="w-full text-xs text-center">
                            <tbody id="group-rows-${l}">
                                ${groupTeams.map((t, idx) => `
                                    <tr class="border-b border-gray-800/40">
                                        <td class="p-2 text-left font-bold text-gray-200">
                                            <span class="inline-block w-4 text-gray-500 text-[10px]">${idx+1}</span>
                                            ${teamFlags[t.name] || "🏳️"} ${t.name}
                                        </td>
                                        <td class="p-2 text-gray-400">${t.p}</td>
                                        <td class="p-2 ${t.gd > 0 ? 'text-blue-400' : t.gd < 0 ? 'text-red-400' : 'text-gray-400'}">${t.gd}</td>
                                        <td class="p-2 font-black text-amber-400">${t.pts}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        }
    });
}

function renderFixtures() {
    const container = document.getElementById("fixtures-container");
    if (!container) return;
    container.innerHTML = "";

    const filtered = groupMatches.filter(m => m.matchday === activeMatchday);

    letters.forEach(l => {
        const groupTeams = squads.filter(s => s.group.toUpperCase() === l).map(s => s.name);
        const matchesInGroup = filtered.filter(m => groupTeams.includes(m.homeSquadName));

        if(matchesInGroup.length > 0) {
            let html = `
                <div class="bg-[#161b26]/60 p-3 rounded-xl border border-gray-800/60">
                    <div class="text-[10px] font-bold text-gray-400 mb-2 px-1">GROUP ${l} - MATCHDAY ${activeMatchday}</div>
                    <div class="space-y-2">
                        ${matchesInGroup.map(m => `
                            <div class="bg-[#161b26] border border-gray-800 p-3 rounded-xl">
                                <div class="text-[9px] text-gray-500 font-bold mb-1.5 text-center">${toMyanmarTime(m.date)}</div>
                                <div class="flex justify-between items-center text-xs">
                                    <span class="w-1/3 truncate text-left font-semibold">${teamFlags[m.homeSquadName] || "🏳️"} ${m.homeSquadName}</span>
                                    <div class="flex items-center gap-1">
                                        <input type="number" oninput="calculateLiveLogic()" id="m-${m.id}-h" class="w-8 h-7 text-center bg-[#0d1117] border border-gray-700 rounded font-bold text-amber-400 focus:outline-none">
                                        <span class="text-[9px] text-gray-600 font-bold mx-0.5">VS</span>
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
        }
    });
}

// ၃၂ သင်းအဆင့် ကွက်လပ်များတွင် အုပ်စုမှ တက်လာသော အသင်းနာမည်များကို Dynamic ထည့်သွင်းပြသခြင်း
function renderKnockoutView(stage) {
    const container = document.getElementById("ko-matches-container");
    if (!container) return;
    
    if (stage !== "R32") {
        document.getElementById("ko-title").innerText = `${stage} Stage`;
        container.innerHTML = `<div class="text-center text-xs text-gray-500 py-8">Round of 16 to Final logic expands from R32 results.</div>`;
        return;
    }

    document.getElementById("ko-title").innerText = "Round of 32 (16 Matches)";
    container.innerHTML = "";

    r32Template.forEach(m => {
        let homeTeamName = "";
        let awayTeamName = "";

        // Home Team နာမည် သတ်မှတ်ခြင်း
        if (typeof m.homeSrc === 'object' && groupWinnersState[m.homeSrc.group]) {
            homeTeamName = m.homeSrc.pos === 1 ? groupWinnersState[m.homeSrc.group].first : groupWinnersState[m.homeSrc.group].second;
        } else {
            homeTeamName = m.homeSrc;
        }

        // Away Team နာမည် သတ်မှတ်ခြင်း
        if (typeof m.awaySrc === 'object' && groupWinnersState[m.awaySrc.group]) {
            awayTeamName = m.awaySrc.pos === 1 ? groupWinnersState[m.awaySrc.group].first : groupWinnersState[m.awaySrc.group].second;
        } else {
            awayTeamName = m.awaySrc;
        }

        let html = `
            <div class="bg-[#161b26] border border-gray-800 p-4 rounded-xl">
                <div class="text-[9px] text-gray-500 font-bold mb-2 text-center tracking-wide">MATCH ${m.matchId} • MMT: ${m.date}</div>
                <div class="flex justify-between items-center text-xs">
                    <span class="font-bold text-gray-200 w-1/3 text-left truncate">${teamFlags[homeTeamName] || "⚽"} ${homeTeamName}</span>
                    <div class="flex items-center gap-1">
                        <input type="number" placeholder="-" class="w-8 h-7 text-center bg-[#0d1117] border border-gray-700 rounded font-bold text-amber-500 focus:outline-none">
                        <span class="text-xs text-gray-600 font-black">:</span>
                        <input type="number" placeholder="-" class="w-8 h-7 text-center bg-[#0d1117] border border-gray-700 rounded font-bold text-amber-500 focus:outline-none">
                    </div>
                    <span class="font-bold text-gray-200 w-1/3 text-right truncate">${awayTeamName} ${teamFlags[awayTeamName] || "⚽"}</span>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

startApp();
