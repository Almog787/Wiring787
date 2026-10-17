/**
 * HarnessMap Pro - Technical Knowledge Base & Electrical Standards Guide
 * 100% Client-Side authoritative reference for relays, fuses, terminals, and crimping
 */

import React, { useState } from 'react';
import { X, BookOpen, Zap, Shield, Wrench, Layers } from 'lucide-react';

interface KnowledgeBaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeBaseDrawer: React.FC<KnowledgeBaseDrawerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'relays' | 'fuses' | 'terminals' | 'crimp_standards'>('relays');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Electrical Standards & Wiring Handbook</h3>
              <p className="text-xs text-slate-400">
                DIN 72551 · SAE J1128 · ISO 7588-1 Engineering Reference
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 px-6 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('relays')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'relays'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>ISO Relays</span>
          </button>
          <button
            onClick={() => setActiveTab('fuses')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'fuses'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Fuses & Blocks</span>
          </button>
          <button
            onClick={() => setActiveTab('terminals')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'terminals'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Faston & Studs</span>
          </button>
          <button
            onClick={() => setActiveTab('crimp_standards')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'crimp_standards'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Crimp Quality Guide</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 leading-relaxed">
          {activeTab === 'relays' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>ממסרי רכב תקניים (ISO 4/5-Pin Automotive Relays)</span>
              </h4>
              <p>
                ממסר רכב הוא מתג אלקטרו-מגנטי המאפשר לזרם פיקוד זעיר (בדרך כלל 0.15A עד 0.25A דרך מתג בלוח המחוונים) 
                למתג עומס חשמלי כבד (עד 30A/40A עבור תאורת לד, מאווררי רדיאטור, משאבות דלק וצופרים).
              </p>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3 font-mono">
                <div className="text-amber-400 font-bold text-xs uppercase">סימוני פינים תקניים (DIN / ISO Standard):</div>
                <div className="grid grid-cols-1 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-red-400 font-bold">פין 30 (Common Feed):</span> הזנת מתח ראשית ישירות מהמצבר דרך פיוז הגנה. דורש חוט עבה (10-12-14 AWG) ונעל כבל Faston 6.3 מ"מ מחוזקת.
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-amber-400 font-bold">פין 87 (Normally Open NO):</span> יציאת הכוח הפתוחה כברירת מחדל. מתחברת לצרכן (פנסי לד/מאוורר) ונסגרת ברגע שהסליל מופעל.
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-sky-400 font-bold">פין 86 (Coil Positive):</span> הזנת מתח חיובי להפעלת סליל הממסר ממתג הפיקוד (12V/24V, זרם נמוך ~0.2A). חוט 18-20 AWG מספיק.
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400 font-bold">פין 85 (Coil Ground):</span> הארקת סליל הממסר אל גוף הרכב או פיקוד ממתג מינוס.
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-purple-400 font-bold">פין 87a (Normally Closed NC):</span> קיים רק בממסרי 5 פינים (SPDT). מחובר לפין 30 כאשר הסליל אינו מופעל, ומתנתק בעת הפעלה.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fuses' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">
                משפחת הפיוזים ובתי הפיוזים (Blade Fuses & Blocks)
              </h4>
              <p>
                פיוז נועד להגן על חיווט הצמה מפני התחממות, המסת בידוד ושריפה בעת קצר חשמלי או עומס יתר. 
                כלל הברזל: ערך הפיוז (בזרם) חייב להיות תמיד נמוך או שווה לכושר ההולכה הרציף של החוט!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="font-bold text-amber-400 mb-1">ATO / ATC Blade Fuse</div>
                  <div className="text-slate-400 text-[11px] mb-2">1A עד 40A · רוחב להב 5.2 מ"מ (חיבור Faston 6.3mm)</div>
                  <p className="text-slate-300">התקן המרכזי בעולם הרכב והצמ"ה. בית פלסטיק חסין חום עם גוף אבץ פנימי.</p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="font-bold text-amber-400 mb-1">MINI Blade Fuse</div>
                  <div className="text-slate-400 text-[11px] mb-2">2A עד 30A · גוף קומפקטי</div>
                  <p className="text-slate-300">נפוץ בתיבות פיוזים מודרניות בצפיפות גבוהה ואלקטרוניקה צבאית.</p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="font-bold text-amber-400 mb-1">MAXI Fuse</div>
                  <div className="text-slate-400 text-[11px] mb-2">20A עד 100A · קווי הזנה ראשיים</div>
                  <p className="text-slate-300">פיוז ענק להגנה ראשית ביציאה מהמצבר ומאלטרנטור (דורש חוט 8-10 AWG).</p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="font-bold text-amber-400 mb-1">AGC / MDL Glass Tube</div>
                  <div className="text-slate-400 text-[11px] mb-2">5x20 מ"מ או 6.3x32 מ"מ</div>
                  <p className="text-slate-300">צילינדר זכוכית/קרמיקה הנפוץ בציוד תעשייתי ובקרים ישנים.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'terminals' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">
                נעלי כבל וטרמינלים (Faston & Stud Terminals)
              </h4>
              <p>
                נעלי כבל מסוג Faston הן התקן הבלעדי לחיבורי ממסרים ובתי פיוזים בעולם הרכב.
              </p>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-amber-400 font-bold">Faston 6.3 מ"מ (0.250 אינץ' / 1/4"):</span>
                  <div className="text-slate-300 mt-1">
                    התקן המרכזי לממסרי ISO רכב ולבתי פיוזים ATO. מתאים לזרמים עד 40A עם חוט 10-14 AWG.
                  </div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-sky-400 font-bold">Faston 4.8 מ"מ (0.187 אינץ'):</span>
                  <div className="text-slate-300 mt-1">
                    משמש למתגי לוח מחוונים, ממסרים מוקטנים ורמקולים. זרמים עד 15A.
                  </div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-emerald-400 font-bold">Faston 2.8 מ"מ (0.110 אינץ'):</span>
                  <div className="text-slate-300 mt-1">
                    משמש בממסרי Micro-ISO, מחברי חיישנים ואותות בקרה. זרמים עד 8A.
                  </div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-red-400 font-bold">נעלי כבל טבעתיות (Ring Terminals M4, M5, M6, M8):</span>
                  <div className="text-slate-300 mt-1">
                    לחיבורי הארקה (Ground) ומתח ראשי לברגי מצבר, גוף רכב ותיבות פיוזים מרכזיות.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crimp_standards' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">
                תקן לחיצה ואיכות כבילה (SAE / USCAR-21 Crimp Quality)
              </h4>
              <p>
                לחיצה תקנית (Crimp) יוצרת חיבור קר אטום לגזים (Cold Weld / Gas-Tight), שאינו מושפע מחמצון, קורוזיה או רעידות מנוע.
              </p>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 font-mono text-[11px]">
                <div className="text-amber-400 font-bold uppercase">מאפייני לחיצת B-Crimp / F-Crimp תקנית:</div>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                  <li><span className="text-white font-bold">כנפי מוליך (Conductor Wings):</span> קיפול כפול סימטרי הדוחס את כל סיבי הנחושת ללא שום מרווחי אוויר.</li>
                  <li><span className="text-white font-bold">פעמון כניסה (Bellmouth):</span> התרחבות קלה של 0.2-0.5 מ"מ בכניסת החוט למניעת גזירת גידים ברעידות.</li>
                  <li><span className="text-white font-bold">מברשת גידים (Conductor Brush):</span> קצות הנחושת חייבים לבלוט 0.5 עד 1.0 מ"מ מעבר לכנף הלחיצה הקדמית.</li>
                  <li><span className="text-white font-bold">כנפי בידוד (Insulation Crimp):</span> עטיפה הדוקה סביב מעטה הבידוד להגנה מפני משיכה (Strain Relief) מבלי לנקב אותו.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
