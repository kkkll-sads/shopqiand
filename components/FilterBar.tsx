
import React, { useState, useMemo } from "react";

type Option = { label: string; value: string; icon?: React.ReactNode };

/**
 * FilterButton Component - The pill button in the bar
 */
function FilterButton({
    label,
    value,
    placeholder = "请选择",
    active,
    onClick,
    options
}: {
    label: string;
    value: string;
    placeholder?: string;
    active: boolean;
    onClick: () => void;
    options: Option[];
}) {
    const selected = options.find((o) => o.value === value);
    return (
        <button className={`pill ${active ? 'active' : ''}`} onClick={onClick}>
            <span className="pill-label">{label}</span>
            <span className="pill-value">
                {selected?.label ?? placeholder}
                <span className={`pill-caret ${active ? 'rotate' : ''}`}>▾</span>
            </span>
        </button>
    );
}

/**
 * FilterBar Component - Managing the dropdowns
 */
export function FilterBar({
    category,
    setCategory,
    flow,
    setFlow,
    range,
    setRange,
    categoryOptions,
}: {
    category: string;
    setCategory: (v: string) => void;
    flow: string;
    setFlow: (v: string) => void;
    range: string;
    setRange: (v: string) => void;
    categoryOptions: Option[];
}) {
    // Active dropdown state: 'category' | 'flow' | 'range' | null
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [kw, setKw] = useState("");

    const flowOptions: Option[] = [
        { label: "全部说明", value: "all" },
        { label: "收入", value: "in" },
        { label: "支出", value: "out" },
    ];
    const rangeOptions: Option[] = [
        { label: "全部时间", value: "all" },
        { label: "今天", value: "today" },
        { label: "近7天", value: "7days" },
        { label: "近30天", value: "30days" },
    ];

    const toggle = (key: string) => {
        if (activeDropdown === key) {
            setActiveDropdown(null);
        } else {
            setActiveDropdown(key);
            setKw(""); // Reset search when opening new
        }
    };

    const chips = [
        category !== "all" ? { k: "分类", v: categoryOptions.find(o => o.value === category)?.label || category, onClear: () => setCategory("all") } : null,
        flow !== "all" ? { k: "收支", v: flowOptions.find(o => o.value === flow)?.label || flow, onClear: () => setFlow("all") } : null,
        range !== "all" ? { k: "时间", v: rangeOptions.find(o => o.value === range)?.label || range, onClear: () => setRange("all") } : null,
    ].filter(Boolean) as Array<{ k: string; v: string; onClear: () => void }>;

    // Get current options based on active dropdown
    const currentOptions = useMemo(() => {
        if (activeDropdown === 'category') return categoryOptions;
        if (activeDropdown === 'flow') return flowOptions;
        if (activeDropdown === 'range') return rangeOptions;
        return [];
    }, [activeDropdown, categoryOptions]);

    // Filter options based on search (only for category usually, but generic here)
    const filteredOptions = useMemo(() => {
        if (!kw.trim()) return currentOptions;
        return currentOptions.filter(o => o.label.toLowerCase().includes(kw.trim().toLowerCase()));
    }, [currentOptions, kw]);

    const handleSelect = (val: string) => {
        if (activeDropdown === 'category') setCategory(val);
        else if (activeDropdown === 'flow') setFlow(val);
        else if (activeDropdown === 'range') setRange(val);
        setActiveDropdown(null);
    };

    const getCurrentValue = () => {
        if (activeDropdown === 'category') return category;
        if (activeDropdown === 'flow') return flow;
        if (activeDropdown === 'range') return range;
        return '';
    };

    return (
        <div className="bar-wrap">
            {/* Mask layer - Fixed to cover screen below/behind the dropdown */}
            {activeDropdown && <div className="dropdown-mask" onClick={() => setActiveDropdown(null)} />}

            <div className="bar">
                <FilterButton
                    label="分类"
                    value={category}
                    options={categoryOptions}
                    active={activeDropdown === 'category'}
                    onClick={() => toggle('category')}
                />
                <FilterButton
                    label="收支"
                    value={flow}
                    options={flowOptions}
                    active={activeDropdown === 'flow'}
                    onClick={() => toggle('flow')}
                />
                <FilterButton
                    label="时间"
                    value={range}
                    options={rangeOptions}
                    active={activeDropdown === 'range'}
                    onClick={() => toggle('range')}
                />
            </div>

            {/* Dropdown Panel - Absolute positioned below the bar */}
            {activeDropdown && (
                <div className="dropdown-panel">
                    {/* Search bar only if more than 8 options or explicitly needed (Category has many options) */}
                    {activeDropdown === 'category' && (
                        <div className="search">
                            <input
                                className="search-input"
                                value={kw}
                                onChange={(e) => setKw(e.target.value)}
                                placeholder="搜索…"
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="list">
                        {filteredOptions.length === 0 ? (
                            <div className="py-4 text-center text-gray-400 text-sm">无匹配项</div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = opt.value === getCurrentValue();
                                return (
                                    <button
                                        key={opt.value}
                                        className={`row ${isSelected ? "active" : ""}`}
                                        onClick={() => handleSelect(opt.value)}
                                    >
                                        <div className="row-left">
                                            {opt.icon ? <span className="row-ic">{opt.icon}</span> : null}
                                            <span className="row-txt">{opt.label}</span>
                                        </div>
                                        {isSelected && <span className="row-right">✓</span>}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {chips.length > 0 && !activeDropdown && (
                <div className="chips">
                    {chips.map((c) => (
                        <button key={c.k} className="chip" onClick={c.onClear}>
                            {c.k}：{c.v} <span className="chip-x">×</span>
                        </button>
                    ))}
                </div>
            )}

            <style>{dropdownCss}</style>
        </div>
    );
}

/** --- styles --- */
const dropdownCss = `
.bar-wrap{position:sticky;top:0;z-index:90;background:rgba(255,255,255,.95);backdrop-filter:saturate(180%) blur(12px);border-bottom:1px solid rgba(0,0,0,.06);}
.bar{display:flex;gap:10px;padding:10px 12px;overflow-x:auto;position:relative;z-index:102;background:inherit;} /* Keep bar above mask and panel */

/* Mask */
.dropdown-mask{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:91;animation:fadein .2s ease-out;}

/* Panel */
.dropdown-panel{position:absolute;top:100%;left:0;right:0;background:#fff;z-index:101;padding:10px 12px 14px;box-shadow:0 10px 20px rgba(0,0,0,.08);border-bottom-left-radius:18px;border-bottom-right-radius:18px;animation:slidedown .2s ease-out;max-height:60vh;overflow-y:auto;display:flex;flex-direction:column;}

/* Animation */
@keyframes fadein{from{opacity:0}to{opacity:1}}
@keyframes slidedown{from{transform:translateY(-10px);opacity:0}to{transform:translateY(0);opacity:1}}

/* Components */
.chips{display:flex;gap:8px;flex-wrap:wrap;padding:0 12px 10px;}
.chip{border:1px solid rgba(0,0,0,.08);background:#fff;border-radius:999px;padding:6px 10px;font-size:12px;color:#333; display: flex; align-items: center;}
.chip-x{margin-left:4px;opacity:.6}

.pill{flex:0 0 auto;display:flex;align-items:center;gap:8px;border:1px solid rgba(0,0,0,.08);background:#fff;border-radius:999px;padding:8px 12px;box-shadow:0 1px 2px rgba(0,0,0,.03);transition:all .2s;}
.pill.active{border-color:rgba(255,122,0,.5);color:#FF6B00;background:#FFF0E0;}
.pill-label{font-size:12px;opacity:.6}
.pill-value{font-size:13px;font-weight:500;white-space:nowrap}
.pill-caret{margin-left:6px;opacity:.6;transition:transform .2s;}
.pill-caret.rotate{transform:rotate(180deg);}

.search{padding:0 0 10px;}
.search-input{width:100%;height:38px;border-radius:8px;background:#f5f5f5;border:none;padding:0 12px;font-size:14px;outline:none;}
.list{display:flex;flex-direction:column;gap:4px;}
.row{display:flex;justify-content:space-between;align-items:center;background:transparent;border-radius:8px;padding:12px 12px;font-size:14px;transition:background .2s;}
.row:active{background:#f5f5f5;}
.row.active{color:#FF6B00;font-weight:500;background:rgba(255,107,0,0.04);}
.row-left{display:flex;align-items:center;gap:10px;}
.row-ic{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;}
.row-txt{line-height:1.4;}
.row-right{font-size:14px;font-weight:bold;}
`;
