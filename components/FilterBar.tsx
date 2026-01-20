
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


    // Chips logic removed as per user request

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

            <style>{dropdownCss}</style>
        </div>
    );
}

/** --- styles --- */
const dropdownCss = `
.bar-wrap{position:sticky;top:0;z-index:90;background:rgba(255,255,255,.97);backdrop-filter:saturate(180%) blur(12px);border-bottom:1px solid rgba(0,0,0,.04);}
.bar{display:flex;gap:8px;padding:10px 12px;overflow-x:auto;position:relative;z-index:102;background:inherit;scrollbar-width:none;-ms-overflow-style:none;}
.bar::-webkit-scrollbar{display:none;}

/* Mask */
.dropdown-mask{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:91;animation:fadein .2s ease-out;}

/* Panel */
.dropdown-panel{position:absolute;top:100%;left:0;right:0;background:#fff;z-index:101;padding:12px 16px 16px;box-shadow:0 10px 30px rgba(0,0,0,.1);border-bottom-left-radius:20px;border-bottom-right-radius:20px;animation:slidedown .2s ease-out;max-height:60vh;overflow-y:auto;display:flex;flex-direction:column;}

/* Animation */
@keyframes fadein{from{opacity:0}to{opacity:1}}
@keyframes slidedown{from{transform:translateY(-10px);opacity:0}to{transform:translateY(0);opacity:1}}

/* Components - 京东红主题 */
.pill{flex:0 0 auto;display:flex;align-items:center;gap:5px;border:1px solid rgba(0,0,0,.06);background:#fff;border-radius:999px;padding:8px 14px;box-shadow:0 1px 3px rgba(0,0,0,.04);transition:all .2s;line-height:1.4;font-size:13px;}
.pill:active{transform:scale(0.97);}
.pill.active{border-color:rgba(225,37,27,.4);color:#e1251b;background:linear-gradient(135deg,#fef2f2 0%,#fee2e2 100%);}
.pill-label{opacity:.55;font-weight:400;margin-right:2px;}
.pill-value{font-weight:500;white-space:nowrap;display:flex;align-items:center;}
.pill-caret{margin-left:3px;opacity:.5;transition:transform .2s;font-size:10px;}
.pill-caret.rotate{transform:rotate(180deg);}

.search{padding:0 0 12px;}
.search-input{width:100%;height:40px;border-radius:10px;background:#f5f5f5;border:1px solid transparent;padding:0 14px;font-size:14px;outline:none;transition:all .2s;}
.search-input:focus{border-color:rgba(225,37,27,.3);background:#fff;}
.list{display:flex;flex-direction:column;gap:2px;}
.row{display:flex;justify-content:space-between;align-items:center;background:transparent;border-radius:10px;padding:12px 14px;font-size:14px;transition:all .2s;}
.row:active{background:#f5f5f5;transform:scale(0.99);}
.row.active{color:#e1251b;font-weight:500;background:linear-gradient(135deg,rgba(225,37,27,0.06) 0%,rgba(250,46,30,0.04) 100%);}
.row-left{display:flex;align-items:center;gap:10px;}
.row-ic{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;}
.row-txt{line-height:1.4;}
.row-right{font-size:14px;font-weight:bold;color:#e1251b;}
`;
