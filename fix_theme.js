const fs = require('fs');
let c = fs.readFileSync('src/pages/Dashboard.js', 'utf8');

const dsaS = c.indexOf("activeSection === 'dsa'");
const dsaE = c.indexOf('})()', dsaS) + 4;
let d = c.slice(dsaS, dsaE);

// ── Outer wrapper ──────────────────────────────────────────────
d = d.replace(
  /<div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"/,
  '<div className={`${themeClasses.cardBackground} rounded-2xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden`}'
);

// ── Left nav sidebar ───────────────────────────────────────────
d = d.replace(
  'className="w-52 flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50"',
  'className={`w-52 flex-shrink-0 border-r ${themeClasses.cardBorder} flex flex-col ${themeClasses.sectionBackground}`}'
);
d = d.replace(
  '<div className="px-3 pt-4 pb-2 border-b border-gray-200">',
  '<div className={`px-3 pt-4 pb-2 border-b ${themeClasses.cardBorder}`}>'
);
d = d.replace(
  '<p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">Topics</p>',
  '<p className={`text-xs font-bold uppercase tracking-widest ${themeClasses.textSecondary} px-1`}>Topics</p>'
);

// ── NavBtn ─────────────────────────────────────────────────────
d = d.replace(
  ": 'bg-gray-50 text-gray-600 hover:bg-white'}`}",
  `: \`\${themeClasses.sectionBackground} \${themeClasses.textSecondary} hover:\${themeClasses.cardBackground}\`}`
);
d = d.replace(
  "isActive ? 'text-white' : 'text-gray-700'",
  "isActive ? 'text-white' : themeClasses.textPrimary"
);
d = d.replace(
  "${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}",
  "${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}"
);

// ── More button ────────────────────────────────────────────────
d = d.replace(
  "!dsaMoreOpen ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-white'",
  "!dsaMoreOpen ? 'bg-blue-600 text-white shadow-md' : `${themeClasses.sectionBackground} ${themeClasses.textSecondary} hover:${themeClasses.cardBackground}`"
);
d = d.replace(
  "!dsaMoreOpen ? 'text-white' : 'text-gray-700'",
  "!dsaMoreOpen ? 'text-white' : themeClasses.textPrimary"
);
d = d.replace(
  '? \'text-white\' : \'text-gray-500\'}`}\n                            fill="none"',
  "? 'text-white' : themeClasses.textSecondary}`}\n                            fill=\"none\""
);
// More dropdown bg
d = d.replace(
  '<div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-20">',
  '<div className={`absolute bottom-full left-0 right-0 mb-1 ${themeClasses.cardBackground} border ${themeClasses.cardBorder} rounded-xl shadow-xl overflow-hidden z-20`}>'
);

// ── Practice On ────────────────────────────────────────────────
d = d.replace(
  '<div className="px-3 py-3 border-t border-gray-200">',
  '<div className={`px-3 py-3 border-t ${themeClasses.cardBorder}`}>'
);
d = d.replace(
  '<p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1 mb-2">Practice On</p>',
  '<p className={`text-xs font-bold uppercase tracking-widest ${themeClasses.textSecondary} px-1 mb-2`}>Practice On</p>'
);
d = d.replace(
  'className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors group">',
  'className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${themeClasses.textSecondary} hover:${themeClasses.sectionBackground} transition-colors group`}>'
);

// ── Overview – section headers ─────────────────────────────────
d = d.replace(/<h3 className="text-lg font-bold text-gray-800 mb-3">/g,
  '<h3 className={`text-lg font-bold ${themeClasses.textPrimary} mb-3`}>');

// Roadmap cards
d = d.replace(
  /\{ level:'Beginner', badge:'Easy', bc:'[^']*', color:'border-emerald-400', icon:'[^']*', weeks:'[^']*',/,
  "{ level:'Beginner', badge:'Easy', bc:'bg-emerald-100 text-emerald-700', color:'border-emerald-400', dot:'bg-emerald-500', weeks:'2-4 weeks',"
);
d = d.replace(
  /\{ level:'Intermediate', badge:'Medium', bc:'[^']*', color:'border-yellow-400', icon:'[^']*', weeks:'[^']*',/,
  "{ level:'Intermediate', badge:'Medium', bc:'bg-yellow-100 text-yellow-700', color:'border-yellow-400', dot:'bg-yellow-500', weeks:'6-8 weeks',"
);
d = d.replace(
  /\{ level:'Advanced', badge:'Hard', bc:'[^']*', color:'border-red-400', icon:'[^']*', weeks:'[^']*',/,
  "{ level:'Advanced', badge:'Hard', bc:'bg-red-100 text-red-700', color:'border-red-400', dot:'bg-red-500', weeks:'8-12 weeks',"
);
d = d.replace(
  '<div key={i} className={`bg-gray-50 rounded-xl p-5 border-l-4 ${s.color}`}>',
  '<div key={i} className={`${themeClasses.sectionBackground} rounded-xl p-5 border-l-4 ${s.color}`}>'
);
// Roadmap icon – use dot badge instead of broken emoji
d = d.replace(
  '<span className="text-2xl">{s.icon}</span>',
  '<span className={`w-8 h-8 rounded-lg ${s.dot} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>{s.level[0]}</span>'
);
d = d.replace(
  '<h4 className={`font-bold text-gray-800`}>{s.level}</h4>',
  '<h4 className={`font-bold ${themeClasses.textPrimary}`}>{s.level}</h4>'
);
d = d.replace(
  '<span className={`text-xs ${themeClasses.textSecondary}`}>{s.weeks}</span>',
  '<span className={`text-xs ${themeClasses.textSecondary}`}>{s.weeks}</span>'
);
d = d.replace(
  '<span className={`text-xs text-gray-500`}>{s.weeks}</span>',
  '<span className={`text-xs ${themeClasses.textSecondary}`}>{s.weeks}</span>'
);
d = d.replace(
  /<li key=\{j\} className="flex items-center gap-2 text-sm text-gray-600">/,
  '<li key={j} className={`flex items-center gap-2 text-sm ${themeClasses.textSecondary}`}>'
);
d = d.replace(
  /<li key=\{j\} className=\{`flex items-center gap-2 text-sm text-gray-500`\}>/,
  '<li key={j} className={`flex items-center gap-2 text-sm ${themeClasses.textSecondary}`}>'
);

// Complexity table
d = d.replace(
  '<div className={`overflow-x-auto rounded-xl border border-gray-200`}>',
  '<div className={`overflow-x-auto rounded-xl border ${themeClasses.cardBorder}`}>'
);
d = d.replace(
  '<tr className={`bg-gray-50 border-b border-gray-200`}>',
  '<tr className={`${themeClasses.sectionBackground} border-b ${themeClasses.cardBorder}`}>'
);
d = d.replace(
  '<th key={h} className={`text-left px-4 py-3 font-semibold text-gray-800`}>{h}</th>',
  '<th key={h} className={`text-left px-4 py-3 font-semibold ${themeClasses.textPrimary}`}>{h}</th>'
);
d = d.replace(
  '<tr key={i} className="hover:bg-gray-50 transition-colors">',
  '<tr key={i} className={`hover:${themeClasses.sectionBackground} transition-colors`}>'
);
d = d.replace(
  '<td key={j} className="px-4 py-2.5 text-gray-500 font-mono text-xs">{v}</td>',
  '<td key={j} className={`px-4 py-2.5 ${themeClasses.textSecondary} font-mono text-xs`}>{v}</td>'
);
d = d.replace(
  'className="divide-y divide-gray-200">',
  'className={`divide-y ${themeClasses.cardBorder}`}>'
);

// Interview tips – fix broken icon data and card styling
d = d.replace(
  /\{ tip:'Think Out Loud',\s+detail:'[^']*',\s+icon:'[^']*', c:/,
  "{ tip:'Think Out Loud',    detail:'Verbalize your approach. Interviewers evaluate thinking, not just the answer.', abbr:'TL', c:"
);
d = d.replace(
  /\{ tip:'Clarify First',\s+detail:'[^']*',\s+icon:'[^']*', c:/,
  "{ tip:'Clarify First',     detail:'Ask about edge cases and constraints before writing any code.', abbr:'CF', c:"
);
d = d.replace(
  /\{ tip:'Brute Force First',\s+detail:'[^']*',\s+icon:'[^'²']*', c:/,
  "{ tip:'Brute Force First', detail:'Propose a naive solution first, then optimize. Shows structured thinking.', abbr:'BF', c:"
);
d = d.replace(
  /\{ tip:'Test with Examples',\s+detail:'[^']*',\s+icon:'[^']*', c:/,
  "{ tip:'Test with Examples',detail:'Walk through 2-3 examples including edge cases before finalizing.', abbr:'TE', c:"
);
d = d.replace(
  /\{ tip:'State Complexity',\s+detail:'[^']*',\s+icon:'[^']*', c:/,
  "{ tip:'State Complexity',  detail:'Always mention time and space complexity - expected in every interview.', abbr:'SC', c:"
);
d = d.replace(
  /\{ tip:'Practice Daily',\s+detail:'[^']*',\s+icon:'[^']*', c:/,
  "{ tip:'Practice Daily',    detail:'1-2 problems/day consistently beats cramming before interviews.', abbr:'PD', c:"
);
d = d.replace(
  '<div key={i} className={`bg-gray-50 rounded-xl p-4 flex gap-3 items-start border border-gray-200`}>',
  '<div key={i} className={`${themeClasses.sectionBackground} rounded-xl p-4 flex gap-3 items-start border ${themeClasses.cardBorder}`}>'
);
// tip icon span – replace broken emoji render with abbr badge
d = d.replace(
  '<div className={`w-9 h-9 bg-gradient-to-br ${item.c} rounded-xl flex items-center justify-center text-base flex-shrink-0 shadow-sm`}>{item.icon}</div>',
  '<div className={`w-9 h-9 bg-gradient-to-br ${item.c} rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm`}>{item.abbr}</div>'
);
d = d.replace(
  '<h4 className={`font-semibold text-gray-800 text-sm mb-0.5`}>{item.tip}</h4>',
  '<h4 className={`font-semibold ${themeClasses.textPrimary} text-sm mb-0.5`}>{item.tip}</h4>'
);
d = d.replace(
  '<p className={`text-xs text-gray-500 leading-relaxed`}>{item.detail}</p>',
  '<p className={`text-xs ${themeClasses.textSecondary} leading-relaxed`}>{item.detail}</p>'
);

// ── Topic panel header ─────────────────────────────────────────
d = d.replace(
  '<div className="flex items-center justify-between pb-4 border-b border-gray-200">',
  '<div className={`flex items-center justify-between pb-4 border-b ${themeClasses.cardBorder}`}>'
);
d = d.replace(
  '<h3 className="text-xl font-bold text-gray-800">{topicMeta?.label}</h3>',
  '<h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>{topicMeta?.label}</h3>'
);
d = d.replace(
  '<span className="text-sm font-bold text-gray-500">{probs.length} problems</span>',
  '<span className={`text-sm font-bold ${themeClasses.textSecondary}`}>{probs.length} problems</span>'
);

// Problem cards
d = d.replace(
  'className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-400 transition-all duration-200 group flex flex-col gap-2">',
  'className={`${themeClasses.sectionBackground} border ${themeClasses.cardBorder} rounded-xl p-4 hover:shadow-md hover:border-blue-400 transition-all duration-200 group flex flex-col gap-2`}>'
);
d = d.replace(
  '<span className="text-xs font-bold text-gray-400">#{pi + 1}</span>',
  '<span className={`text-xs font-bold ${themeClasses.textSecondary}`}>#{pi + 1}</span>'
);
d = d.replace(
  '<p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors leading-snug">{p.title}</p>',
  '<p className={`text-sm font-semibold ${themeClasses.textPrimary} group-hover:text-blue-600 transition-colors leading-snug`}>{p.title}</p>'
);

// ── Math section – fix remaining hardcoded + broken emoji ──────
d = d.replace(
  '<span className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">Ma</span>',
  '<span className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">Ma</span>'
);
d = d.replace(
  `<h3 className={\`text-xl font-bold \${themeClasses.textPrimary}\`}>Mathematics</h3>`,
  `<h3 className={\`text-xl font-bold \${themeClasses.textPrimary}\`}>Mathematics</h3>`
);
// Fix math problem cards (still have themeClasses so already correct, just ensure no hardcoded ones crept in)
d = d.replace(
  '<span className={`text-xs font-bold ` + themeClasses.textSecondary}>',
  '<span className={`text-xs font-bold ${themeClasses.textSecondary}`}>'
);
// Math cat header text
d = d.replace(
  /<h4 className=\{`text-sm font-bold \$\{themeClasses\.textPrimary\}`\}>\{section\.cat\}<\/h4>/g,
  '<h4 className={`text-sm font-bold ${themeClasses.textPrimary}`}>{section.cat}</h4>'
);
d = d.replace(
  /<span className=\{`text-xs \$\{themeClasses\.textSecondary\}`\}>\{section\.problems\.length\} problems<\/span>/g,
  '<span className={`text-xs ${themeClasses.textSecondary}`}>{section.problems.length} problems</span>'
);

// Fix broken ⋮ in More button
d = d.replace(/â‹®/g, '...');

// Fix broken em-dash in subtitle
d = d.replace(/â€"/g, '-');

c = c.slice(0, dsaS) + d + c.slice(dsaE);
fs.writeFileSync('src/pages/Dashboard.js', c, 'utf8');
console.log('Done');
