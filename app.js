// ===================================================
// FIFA WORLD CUP 2026 SIMULATOR — app.js
// Score data: rounds.json ထဲ homeScore/awayScore ထည့်ပါ
// Penalty: homePenaltyScore/awayPenaltyScore ထည့်ပါ
// ===================================================

const teamFlags = {
    "Mexico":"🇲🇽","South Africa":"🇿🇦","Korea Republic":"🇰🇷","Czechia":"🇨🇿",
    "Canada":"🇨🇦","Bosnia and Herzegovina":"🇧🇦","Qatar":"🇶🇦","Switzerland":"🇨🇭",
    "Brazil":"🇧🇷","Morocco":"🇲🇦","Haiti":"🇭🇹","Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "USA":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Türkiye":"🇹🇷",
    "Germany":"🇩🇪","Curaçao":"🇨🇼","Côte d'Ivoire":"🇨🇮","Ecuador":"🇪🇨",
    "Netherlands":"🇳🇱","Japan":"🇯🇵","Sweden":"🇸🇪","Tunisia":"🇹🇳",
    "Belgium":"🇧🇪","Egypt":"🇪🇬","IR Iran":"🇮🇷","New Zealand":"🇳🇿",
    "Spain":"🇪🇸","Cabo Verde":"🇨🇻","Saudi Arabia":"🇸🇦","Uruguay":"🇺🇾",
    "France":"🇫🇷","Senegal":"🇸🇳","Iraq":"🇮🇶","Norway":"🇳🇴",
    "Argentina":"🇦🇷","Algeria":"🇩🇿","Austria":"🇦🇹","Jordan":"🇯🇴",
    "Portugal":"🇵🇹","Congo DR":"🇨🇩","Uzbekistan":"🇺🇿","Colombia":"🇨🇴",
    "England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croatia":"🇭🇷","Ghana":"🇬🇭","Panama":"🇵🇦"
};

const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];
let groupMatches = [];
let koMatches = {}; // { R32: [], R16: [], QF: [], SF: [], F: [] }
let squads = [];
let activeMatchday = 1;

// groupWinnersState[G] = { first, second, third, pts:{}, gd:{} }
let groupWinnersState = {};
// koWinners[matchId] = teamName
let koWinners = {};

// ===================================================
// UTILITY
// ===================================================
function flag(name) { return teamFlags[name] || "🏳️"; }

function toMMT(isoString) {
    const d = new Date(isoString);
    const mmt = new Date(d.getTime() + 6.5 * 3600000);
    const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dy = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    let h = mmt.getUTCHours(), m = String(mmt.getUTCMinutes()).padStart(2,"0");
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${mo[mmt.getUTCMonth()]} ${mmt.getUTCDate()} (${dy[mmt.getUTCDay()]}) ${h}:${m} ${ap}`;
}

// ===================================================
// DATA LOADING
// ===================================================
async function startApp() {
    try {
        const [rM, rS] = await Promise.all([fetch("rounds.json"), fetch("squads.json")]);
        const allRounds = await rM.json();
        squads = await rS.json();

        groupMatches = [];
        koMatches = { R32:[], R16:[], QF:[], SF:[], F:[] };

        allRounds.forEach((round, idx) => {
            if (round.stage === "GROUP") {
                round.tournaments.forEach(t => {
                    t.matchday = idx + 1;
                    groupMatches.push(t);
                });
            } else if (koMatches[round.stage]) {
                koMatches[round.stage] = round.tournaments;
            }
        });

        buildStandings();
        buildKOWinners();
        renderFixtures();
    } catch (e) {
        console.error("Load error:", e);
    }
}

// ===================================================
// STANDINGS (Group stage — reads from JSON scores)
// ===================================================
function buildStandings() {
    let st = {};
    squads.forEach(s => {
        st[s.name] = { name: s.name, group: s.group.toUpperCase(), p:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 };
    });

    groupMatches.forEach(m => {
        const h = m.homeScore, a = m.awayScore;
        if (h === null || h === undefined || a === null || a === undefined) return;
        const H = st[m.homeSquadName], A = st[m.awaySquadName];
        if (!H || !A) return;
        H.p++; A.p++;
        H.gf += h; H.ga += a; H.gd += (h-a);
        A.gf += a; A.ga += h; A.gd += (a-h);
        if (h > a)      { H.pts += 3; H.w++; A.l++; }
        else if (h < a) { A.pts += 3; A.w++; H.l++; }
        else            { H.pts += 1; A.pts += 1; H.d++; A.d++; }
    });

    groupWinnersState = {};
    GROUPS.forEach(g => {
        const teams = Object.values(st)
            .filter(t => t.group === g)
            .sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
        groupWinnersState[g] = {
            ranked: teams,
            first:  teams[0]?.name || `${g}1`,
            second: teams[1]?.name || `${g}2`,
            third:  teams[2]?.name || `${g}3`,
            fourth: teams[3]?.name || `${g}4`,
        };
    });
}

// ===================================================
// BEST 3rd PLACE SELECTION
// Pick best 4 from 12 group 3rd-place teams by pts → gd → gf
// ===================================================
function getBest3rds(groupFilter) {
    // groupFilter = array of group letters e.g. ["C","E","F"]
    const thirds = groupFilter.map(g => {
        const t = groupWinnersState[g]?.ranked[2];
        return t ? { ...t, fromGroup: g } : null;
    }).filter(Boolean);
    thirds.sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
    return thirds;
}

function resolve3rd(srcKey) {
    // srcKey like "3RD_CEF" → pick best 3rd from groups C,E,F
    const groups = srcKey.replace("3RD_","").split("").filter(c => GROUPS.includes(c));
    const best = getBest3rds(groups);
    return best[0]?.name || `Best 3rd (${groups.join("/")})`;
}

// ===================================================
// KO WINNER RESOLUTION
// Given a match, determine winner (from JSON scores)
// ===================================================
function buildKOWinners() {
    koWinners = {};
    ["R32","R16","QF","SF","F"].forEach(stage => {
        (koMatches[stage] || []).forEach(m => {
            const winner = resolveWinner(m);
            if (winner) koWinners[m.id] = winner;
        });
    });
}

function resolveWinner(m) {
    const h = m.homeScore, a = m.awayScore;
    if (h === null || h === undefined || a === null || a === undefined) return null;
    // Validate: scores must be non-negative integers
    if (h < 0 || a < 0) return null;
    if (h > a) return resolveTeamName(m.homeSrc, m);
    if (a > h) return resolveTeamName(m.awaySrc, m);
    // Draw → check penalty
    const hp = m.homePenaltyScore, ap = m.awayPenaltyScore;
    if (hp !== null && hp !== undefined && ap !== null && ap !== undefined) {
        if (hp > ap) return resolveTeamName(m.homeSrc, m);
        if (ap > hp) return resolveTeamName(m.awaySrc, m);
    }
    return null; // unresolved draw (no penalty yet)
}

// ===================================================
// TEAM NAME RESOLVER
// Src formats: "A1","B2","3RD_CEF","W73","TBD"
// ===================================================
function resolveTeamName(src, matchObj) {
    if (!src) return "TBD";
    // Already resolved (stored name from JSON — for display override)
    if (matchObj && matchObj.homeSquadName && matchObj.awaySquadName) {
        // Only use stored names if src matches home/away pattern
    }
    if (src.startsWith("3RD_")) return resolve3rd(src);
    if (src.startsWith("W")) {
        const refId = parseInt(src.slice(1));
        return koWinners[refId] || `W${refId}`;
    }
    // "A1","B2" etc → group position
    const g = src[0], pos = parseInt(src[1]);
    if (GROUPS.includes(g) && groupWinnersState[g]) {
        const keys = ["first","second","third","fourth"];
        return groupWinnersState[g][keys[pos-1]] || src;
    }
    return src;
}

// ===================================================
// NAV SWITCHING
// ===================================================
function switchStage(stage) {
    document.querySelectorAll("nav button").forEach(b => {
        b.classList.remove("bg-amber-500","text-black");
        b.classList.add("bg-gray-800","text-gray-400");
    });
    const tab = document.getElementById(`tab-${stage}`);
    if (tab) { tab.classList.remove("bg-gray-800","text-gray-400"); tab.classList.add("bg-amber-500","text-black"); }

    document.querySelectorAll(".stage-view").forEach(v => v.classList.add("hidden"));

    if (stage === "TABLE") {
        document.getElementById("view-TABLE").classList.remove("hidden");
        renderTables();
    } else if (stage === "FIX") {
        document.getElementById("view-FIX").classList.remove("hidden");
        renderFixtures();
    } else {
        document.getElementById("view-KO").classList.remove("hidden");
        renderKO(stage);
    }
}

function switchMatchday(md) {
    activeMatchday = md;
    document.querySelectorAll("#view-FIX button").forEach(b => {
        b.classList.remove("bg-amber-500","text-black");
        b.classList.add("bg-transparent","text-gray-400");
    });
    const btn = document.getElementById(`md-btn-${md}`);
    if (btn) { btn.classList.remove("bg-transparent","text-gray-400"); btn.classList.add("bg-amber-500","text-black"); }
    renderFixtures();
}

// ===================================================
// RENDER: GROUP TABLES
// ===================================================
function renderTables() {
    const c = document.getElementById("tables-container");
    if (!c) return;
    c.innerHTML = "";
    GROUPS.forEach(g => {
        const teams = groupWinnersState[g]?.ranked || [];
        c.insertAdjacentHTML("beforeend", `
        <div class="bg-[#161b26]/50 p-3 rounded-2xl border border-gray-800">
            <h3 class="text-xs font-black text-amber-500 mb-2 tracking-wider">GROUP ${g} STANDINGS</h3>
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
                        ${teams.map((t,i) => `
                        <tr class="border-b border-gray-800/40 ${i<2?"bg-amber-500/5":""}">
                            <td class="p-2 text-left font-bold text-gray-200 pl-3">
                                <span class="inline-block w-4 text-gray-500 text-[10px]">${i+1}</span>
                                ${flag(t.name)} ${t.name}
                            </td>
                            <td class="p-1.5 text-gray-400">${t.p}</td>
                            <td class="p-1.5 text-green-400">${t.gf}</td>
                            <td class="p-1.5 text-red-400">${t.ga}</td>
                            <td class="p-1.5 ${t.gd>0?"text-blue-400":t.gd<0?"text-red-400":"text-gray-400"}">${t.gd>0?"+":""}${t.gd}</td>
                            <td class="p-1.5 font-black text-amber-400">${t.pts}</td>
                        </tr>`).join("")}
                    </tbody>
                </table>
            </div>
        </div>`);
    });
}

// ===================================================
// RENDER: GROUP FIXTURES (read-only scores from JSON)
// ===================================================
function renderFixtures() {
    const c = document.getElementById("fixtures-container");
    if (!c) return;
    c.innerHTML = "";
    const filtered = groupMatches.filter(m => m.matchday === activeMatchday);
    GROUPS.forEach(g => {
        const gTeams = squads.filter(s => s.group.toUpperCase()===g).map(s=>s.name);
        const matches = filtered.filter(m => gTeams.includes(m.homeSquadName));
        if (!matches.length) return;
        c.insertAdjacentHTML("beforeend", `
        <div class="bg-[#161b26]/60 p-3 rounded-xl border border-gray-800/60">
            <div class="text-[10px] font-bold text-gray-400 mb-2 px-1">GROUP ${g} — MATCHDAY ${activeMatchday}</div>
            <div class="space-y-2">
                ${matches.map(m => matchCardHTML(m)).join("")}
            </div>
        </div>`);
    });
}

function matchCardHTML(m) {
    const played = m.homeScore !== null && m.homeScore !== undefined && m.awayScore !== null && m.awayScore !== undefined;
    const hS = played ? m.homeScore : "–";
    const aS = played ? m.awayScore : "–";
    const hasPen = played && m.homePenaltyScore !== null && m.homePenaltyScore !== undefined;
    const penLine = hasPen ? `<div class="text-[8px] text-gray-500 text-center mt-0.5">(${m.homePenaltyScore} pen ${m.awayPenaltyScore})</div>` : "";
    const draw = played && m.homeScore === m.awayScore;
    const hWin = played && m.homeScore > m.awayScore;
    const aWin = played && m.awayScore > m.homeScore;
    return `
    <div class="bg-[#161b26] border border-gray-800 p-3 rounded-xl">
        <div class="text-[9px] text-gray-500 font-bold mb-1.5 text-center">${toMMT(m.date)}</div>
        <div class="flex justify-between items-center text-xs">
            <span class="w-5/12 truncate text-left font-semibold ${hWin?"text-white":"text-gray-400"}">${flag(m.homeSquadName)} ${m.homeSquadName}</span>
            <div class="w-2/12 text-center">
                <span class="text-sm font-black ${played?"text-amber-400":"text-gray-600"}">${hS} : ${aS}</span>
            </div>
            <span class="w-5/12 truncate text-right font-semibold ${aWin?"text-white":"text-gray-400"}">${m.awaySquadName} ${flag(m.awaySquadName)}</span>
        </div>
        ${penLine}
        <div class="text-center mt-1">
            <span class="text-[8px] font-bold tracking-widest ${played?"text-green-500":"text-gray-600"}">${played?"FINAL":"SCHEDULED"}</span>
        </div>
    </div>`;
}

// ===================================================
// RENDER: KNOCKOUT STAGES (R32 / R16 / QF / SF / F)
// ===================================================
const stageLabels = { R32:"Round of 32 — 16 Matches", R16:"Round of 16 — 8 Matches", QF:"Quarter-Finals — 4 Matches", SF:"Semi-Finals — 2 Matches", F:"⚽ FINAL" };

function renderKO(stage) {
    const titleEl = document.getElementById("ko-title");
    const c = document.getElementById("ko-matches-container");
    if (!c) return;
    titleEl.innerText = stageLabels[stage] || stage;
    c.innerHTML = "";

    const matches = koMatches[stage] || [];
    if (!matches.length) {
        c.innerHTML = `<div class="text-center text-xs text-gray-500 py-8">ပွဲစဉ်များ မရောက်သေးပါ</div>`;
        return;
    }

    matches.sort((a,b)=>a.id-b.id).forEach(m => {
        const homeName = resolveTeamName(m.homeSrc, m);
        const awayName = resolveTeamName(m.awaySrc, m);
        const played = m.homeScore !== null && m.homeScore !== undefined && m.awayScore !== null && m.awayScore !== undefined;
        // Validate scores (non-negative integers only)
        const validScore = played && Number.isInteger(m.homeScore) && Number.isInteger(m.awayScore) && m.homeScore >= 0 && m.awayScore >= 0;
        const hS = validScore ? m.homeScore : "–";
        const aS = validScore ? m.awayScore : "–";
        const hasPen = validScore && m.homePenaltyScore !== null && m.homePenaltyScore !== undefined;
        const penValid = hasPen && Number.isInteger(m.homePenaltyScore) && m.homePenaltyScore >= 0;
        const penLine = penValid ? `<div class="text-[8px] text-gray-500 text-center mt-0.5">(${m.homePenaltyScore} pen ${m.awayPenaltyScore})</div>` : "";
        const hWin = validScore && (m.homeScore > m.awayScore || (m.homeScore===m.awayScore && penValid && m.homePenaltyScore > m.awayPenaltyScore));
        const aWin = validScore && (m.awayScore > m.homeScore || (m.homeScore===m.awayScore && penValid && m.awayPenaltyScore > m.homePenaltyScore));

        c.insertAdjacentHTML("beforeend", `
        <div class="bg-[#161b26] border ${hWin||aWin?"border-amber-500/30":"border-gray-800"} p-4 rounded-xl">
            <div class="text-[9px] text-gray-500 font-bold mb-2 text-center tracking-wide">MATCH ${m.id} • ${toMMT(m.date)}</div>
            <div class="flex justify-between items-center text-xs">
                <span class="w-5/12 truncate text-left font-bold ${hWin?"text-amber-400":validScore?"text-gray-400":"text-gray-200"}">${flag(homeName)} ${homeName}</span>
                <div class="w-2/12 text-center">
                    <span class="text-sm font-black ${validScore?"text-white":"text-gray-600"}">${hS} : ${aS}</span>
                </div>
                <span class="w-5/12 truncate text-right font-bold ${aWin?"text-amber-400":validScore?"text-gray-400":"text-gray-200"}">${awayName} ${flag(awayName)}</span>
            </div>
            ${penLine}
            <div class="text-center mt-1.5">
                <span class="text-[8px] font-bold tracking-widest ${validScore?"text-green-500":"text-gray-600"}">${validScore?"FINAL":"TBD"}</span>
            </div>
        </div>`);
    });
}

// ===================================================
// INIT
// ===================================================
startApp();
