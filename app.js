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

const r32Template = [
    { matchId: 73, homeSrc: { group: "A", pos: 2 }, awaySrc: { group: "B", pos: 2 }, date: "June 29" },
    { matchId: 75, homeSrc: { group: "F", pos: 1 }, awaySrc: { group: "C", pos: 2 }, date: "June 30" },
    { matchId: 76, homeSrc: { group: "D", pos: 2 }, awaySrc: { group: "E", pos: 2 }, date: "June 30" },
    { matchId: 77, homeSrc: { group: "I", pos: 1 }, awaySrc: { group: "D", pos: 1 }, date: "July 1" },
    { matchId: 79, homeSrc: { group: "C", pos: 1 }, awaySrc: { group: "F", pos: 2 }, date: "July 2" },
    { matchId: 80, homeSrc: { group: "G", pos: 2 }, awaySrc: { group: "H", pos: 2 }, date: "July 2" },
    { matchId: 83, homeSrc: { group: "J", pos: 2 }, awaySrc: { group: "K", pos: 2 }, date: "July 3" },
    { matchId: 84, homeSrc: { group: "L", pos: 2 }, awaySrc: { group: "I", pos: 2 }, date: "July 3" },
    { matchId: 74, homeSrc: { group: "A", pos: 1 }, awaySrc: "3rd Place (C/E/F)", date: "June 29" },
    { matchId: 78, homeSrc: { group: "B", pos: 1 }, awaySrc: "3rd Place (A/C/I)", date: "July 1" },
    { matchId: 81, homeSrc: { group: "E", pos: 1 }, awaySrc: "3rd Place (A/B/C/D/F)", date: "July 2" },
    { matchId: 82, homeSrc: { group: "G", pos: 1 }, awaySrc: "3rd Place (A/E/H/I/J)", date: "July 3" },
    { matchId: 85, homeSrc: { group: "H", pos: 1 }, awaySrc: { group: "J", pos: 1 }, date: "July 4" },
    { matchId: 86, homeSrc: { group: "K", pos: 1 }, awaySrc: "3rd Place (D/E/I/J/L)", date: "July 4" },
    { matchId: 87, homeSrc: { group: "L", pos: 1 }, awaySrc: "3rd Place (E/H/I/J/K)", date: "July 4" }
];

let groupWinnersState = {};

function toMyanmarTime(isoString) {
    const date = new Date(isoString);
    const mmtOffset = 6.5 * 60 * 60 * 1000;
    const myanmarDate = new Date(date.getTime() + mmtOffset);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
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

        calculateStandings();
        renderFixtures();
    } catch (err) {
        console.error("Error:", err);
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
        calculateStandings();
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

// rounds.json ထဲက homeScore/awayScore ကိုသာ ဖတ်ပြီး standings တွက်ချက်သည်
function calculateStandings() {
    let standings = {};
    squads.forEach(s => {
        standings[s.name] = { name: s.name, group: s.group.toUpperCase(), p: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    });

    groupMatches.forEach(m => {
        const h = m.homeScore;
        const a = m.awayScore;

        if (h !== null && a !== null && h !== undefined && a !== undefined) {
            standings[m.homeSquadName].p++;
            standings[m.awaySquadName].p++;
            standings[m.homeSquadName].gf += h;
            standings[m.homeSquadName].ga += a;
            standings[m.awaySquadName].gf += a;
            standings[m.awaySquadName].ga += h;
            standings[m.homeSquadName].gd += (h - a);
            standings[m.awaySquadName].gd += (a - h);

            if (h > a) standings[m.homeSquadName].pts += 3;
            else if (h < a) standings[m.awaySquadName].pts += 3;
            else { standings[m.homeSquadName].pts += 1; standings[m.awaySquadName].pts += 1; }
        }
    });

    const container = document.getElementById("tables-container");
    if (container) container.innerHTML = "";

    letters.forEach(l => {
        const groupTeams = Object.values(standings)
            .filter(t => t.group === l)
            .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

        groupWinnersState[l] = {
            first:  groupTeams[0]?.name || `Group ${l} 1st`,
            second: groupTeams[1]?.name || `Group ${l} 2nd`,
            third:  groupTeams[2]?.name || `Group ${l} 3rd`
        };

        if (container) {
            let html = `
                <div class="bg-[#161b26]/50 p-3 rounded-2xl border border-gray-800">
                    <h3 class="text-xs font-black text-amber-500 mb-2 tracking-wider">GROUP ${l} STANDINGS</h3>
                    <div class="bg-[#1a202c] rounded-xl overflow-hidden border border-gray-800">
                        <table class="w-full text-xs text-center">
                            <thead>
                                <tr class="border-b border-gray-700 text-[9px] text-gray-500 font-bold uppercase">
                                    <th class="p-2 text-left pl-3">Club</th>
                                    <th class="p-1.5">P</th>
                                    <th class="p-1.5">GF</th>
                                    <th class="p-1.5">GA</th>
                                    <th class="p-1.5">GD</th>
                                    <th class="p-1.5">PTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${groupTeams.map((t, idx) => `
                                    <tr class="border-b border-gray-800/40 ${idx < 2 ? 'bg-amber-500/5' : ''}">
                                        <td class="p-2 text-left font-bold text-gray-200 pl-3">
                                            <span class="inline-block w-4 text-gray-500 text-[10px]">${idx + 1}</span>
                                            ${teamFlags[t.name] || "🏳️"} ${t.name}
                                        </td>
                                        <td class="p-1.5 text-gray-400">${t.p}</td>
                                        <td class="p-1.5 text-green-400">${t.gf}</td>
                                        <td class="p-1.5 text-red-400">${t.ga}</td>
                                        <td class="p-1.5 ${t.gd > 0 ? 'text-blue-400' : t.gd < 0 ? 'text-red-400' : 'text-gray-400'}">${t.gd > 0 ? '+' : ''}${t.gd}</td>
                                        <td class="p-1.5 font-black text-amber-400">${t.pts}</td>
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

// Fixtures: score ကို rounds.json ကနေ ဖတ်ပြီး read-only ပြသသည်
function renderFixtures() {
    const container = document.getElementById("fixtures-container");
    if (!container) return;
    container.innerHTML = "";

    const filtered = groupMatches.filter(m => m.matchday === activeMatchday);

    letters.forEach(l => {
        const groupTeams = squads.filter(s => s.group.toUpperCase() === l).map(s => s.name);
        const matchesInGroup = filtered.filter(m => groupTeams.includes(m.homeSquadName));

        if (matchesInGroup.length > 0) {
            let html = `
                <div class="bg-[#161b26]/60 p-3 rounded-xl border border-gray-800/60">
                    <div class="text-[10px] font-bold text-gray-400 mb-2 px-1">GROUP ${l} - MATCHDAY ${activeMatchday}</div>
                    <div class="space-y-2">
                        ${matchesInGroup.map(m => {
                            const played = m.homeScore !== null && m.awayScore !== null;
                            const hScore = played ? m.homeScore : '-';
                            const aScore = played ? m.awayScore : '-';
                            const scoreColor = played ? 'text-amber-400 font-black' : 'text-gray-600 font-bold';
                            const winner = played ? (m.homeScore > m.awayScore ? 'home' : m.homeScore < m.awayScore ? 'away' : 'draw') : '';
                            return `
                            <div class="bg-[#161b26] border border-gray-800 p-3 rounded-xl">
                                <div class="text-[9px] text-gray-500 font-bold mb-1.5 text-center">${toMyanmarTime(m.date)}</div>
                                <div class="flex justify-between items-center text-xs">
                                    <span class="w-5/12 truncate text-left font-semibold ${winner === 'home' ? 'text-white' : 'text-gray-400'}">
                                        ${teamFlags[m.homeSquadName] || "🏳️"} ${m.homeSquadName}
                                    </span>
                                    <div class="flex items-center gap-1 w-2/12 justify-center">
                                        <span class="${scoreColor} text-sm">${hScore}</span>
                                        <span class="text-[9px] text-gray-700 font-bold">:</span>
                                        <span class="${scoreColor} text-sm">${aScore}</span>
                                    </div>
                                    <span class="w-5/12 truncate text-right font-semibold ${winner === 'away' ? 'text-white' : 'text-gray-400'}">
                                        ${m.awaySquadName} ${teamFlags[m.awaySquadName] || "🏳️"}
                                    </span>
                                </div>
                                ${played ? `<div class="text-center mt-1"><span class="text-[8px] text-green-500 font-bold tracking-widest">FINAL</span></div>` : `<div class="text-center mt-1"><span class="text-[8px] text-gray-600 font-bold tracking-widest">SCHEDULED</span></div>`}
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        }
    });
}

function renderKnockoutView(stage) {
    const container = document.getElementById("ko-matches-container");
    if (!container) return;

    if (stage !== "R32") {
        document.getElementById("ko-title").innerText = `${stage} Stage`;
        container.innerHTML = `<div class="text-center text-xs text-gray-500 py-8">Coming soon — expands from R32 results.</div>`;
        return;
    }

    document.getElementById("ko-title").innerText = "Round of 32 (16 Matches)";
    container.innerHTML = "";

    r32Template.sort((a, b) => a.matchId - b.matchId).forEach(m => {
        let homeTeamName = "";
        let awayTeamName = "";

        if (typeof m.homeSrc === 'object' && groupWinnersState[m.homeSrc.group]) {
            homeTeamName = m.homeSrc.pos === 1 ? groupWinnersState[m.homeSrc.group].first : groupWinnersState[m.homeSrc.group].second;
        } else {
            homeTeamName = m.homeSrc;
        }

        if (typeof m.awaySrc === 'object' && groupWinnersState[m.awaySrc.group]) {
            awayTeamName = m.awaySrc.pos === 1 ? groupWinnersState[m.awaySrc.group].first : groupWinnersState[m.awaySrc.group].second;
        } else {
            awayTeamName = m.awaySrc;
        }

        let html = `
            <div class="bg-[#161b26] border border-gray-800 p-4 rounded-xl">
                <div class="text-[9px] text-gray-500 font-bold mb-2 text-center tracking-wide">MATCH ${m.matchId} • ${m.date}</div>
                <div class="flex justify-between items-center text-xs">
                    <span class="font-bold text-gray-200 w-5/12 text-left truncate">${teamFlags[homeTeamName] || "⚽"} ${homeTeamName}</span>
                    <div class="flex items-center gap-1 w-2/12 justify-center">
                        <span class="text-gray-600 font-black text-sm">- : -</span>
                    </div>
                    <span class="font-bold text-gray-200 w-5/12 text-right truncate">${awayTeamName} ${teamFlags[awayTeamName] || "⚽"}</span>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

startApp();
